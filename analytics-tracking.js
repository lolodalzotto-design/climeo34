/* Climeo34 — GA4 behavioural + lead tracking
 * No form values or personal data are sent to analytics.
 */
(function () {
  'use strict';

  var VERSION = '2026-09-06';
  var sentOnce = new Set();
  var leadSentAt = 0;
  var diagnosticStep = 0;
  var lastLeadFormId = '';

  function pageType() {
    var p = location.pathname.toLowerCase();
    if (p === '/' || p === '/index.html') return 'homepage';
    if (p.indexOf('/blog/') === 0) return 'blog';
    if (p.indexOf('depannage-clim') !== -1) return 'depannage';
    if (p.indexOf('nettoyage-clim') !== -1) return 'local_service';
    return 'other';
  }

  function baseParams(extra) {
    return Object.assign({
      tracking_version: VERSION,
      page_path: location.pathname,
      page_type: pageType()
    }, extra || {});
  }

  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, baseParams(params));
  }

  function once(key, name, params) {
    if (sentOnce.has(key)) return;
    sentOnce.add(key);
    track(name, params);
  }

  function safeText(el) {
    if (!el) return '';
    var text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.slice(0, 80);
  }

  function locationLabel(el) {
    if (!el) return 'unknown';
    if (el.closest('nav')) return 'navigation';
    if (el.closest('footer')) return 'footer';
    var cls = String(el.className || '').toLowerCase();
    if (/fab|float|sticky/.test(cls)) return 'floating';
    var hero = el.closest('[class*="hero"], header');
    if (hero) return 'hero';
    var section = el.closest('section');
    if (section) {
      if (section.id) return section.id.slice(0, 60);
      var h = section.querySelector('h2,h3');
      if (h) return safeText(h).toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi, '_').slice(0, 60);
    }
    return 'page';
  }

  function ctaType(el) {
    var href = (el.getAttribute('href') || '').toLowerCase();
    var text = safeText(el).toLowerCase();
    var cls = String(el.className || '').toLowerCase();
    if (href.indexOf('tel:') === 0) return 'phone';
    if (/wa\.me|whatsapp/.test(href)) return 'whatsapp';
    if (/maps\.google|google\.com\/maps|maps\.app\.goo\.gl/.test(href)) return 'maps';
    if (/instagram\.com/.test(href)) return 'instagram';
    if (/avis|review/.test(text) && /google|maps/.test(href)) return 'reviews';
    if (/devis|estimation|diagnostic|calculateur|rendez-vous|rdv|quote/.test(text + ' ' + href + ' ' + cls)) return 'quote';
    return '';
  }

  function trackLead(source, formId) {
    var now = Date.now();
    if (now - leadSentAt < 10000) return;
    leadSentAt = now;
    track('generate_lead', {
      lead_source: source || 'website',
      form_id: formId || lastLeadFormId || 'unknown'
    });
  }

  /* Intercept the site's existing diagnostic success event and turn it into
     the standard GA4 generate_lead event. */
  if (typeof window.gtag === 'function' && !window.gtag.__climeoWrapped) {
    var originalGtag = window.gtag;
    var wrappedGtag = function () {
      var args = Array.prototype.slice.call(arguments);
      originalGtag.apply(window, args);
      if (args[0] === 'event' && args[1] === 'diag_submit') {
        trackLead('diagnostic', 'diagnostic');
      }
    };
    wrappedGtag.__climeoWrapped = true;
    window.gtag = wrappedGtag;
  }

  /* Web3Forms success = a genuine submitted lead. This lets us measure other
     forms too, without reading or sending their field values. */
  if (typeof window.fetch === 'function' && !window.fetch.__climeoWrapped) {
    var originalFetch = window.fetch;
    var wrappedFetch = function () {
      var args = arguments;
      var input = args[0];
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      return originalFetch.apply(window, args).then(function (response) {
        if (String(url).indexOf('api.web3forms.com/submit') !== -1 && response && response.ok) {
          setTimeout(function () { trackLead('web3forms', lastLeadFormId || 'web3forms'); }, 0);
        }
        return response;
      });
    };
    wrappedFetch.__climeoWrapped = true;
    window.fetch = wrappedFetch;
  }

  function initScrollTracking() {
    var thresholds = [25, 50, 75, 90];
    var ticking = false;
    function check() {
      ticking = false;
      var doc = document.documentElement;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      var pct = Math.min(100, Math.round((window.scrollY / max) * 100));
      thresholds.forEach(function (t) {
        if (pct >= t) once('scroll_' + t, 'scroll_' + t, { percent_scrolled: t });
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(check);
      }
    }, { passive: true });
    check();
  }

  function initSectionTracking() {
    if (!('IntersectionObserver' in window)) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll('section'));
    if (!sections.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
        var section = entry.target;
        var heading = section.querySelector('h2,h3');
        var id = section.id || '';
        var name = safeText(heading) || id || 'section';
        var key = 'section:' + (id || name);
        once(key, 'section_view', {
          section_id: id.slice(0, 60),
          section_name: name.slice(0, 80)
        });
        observer.unobserve(section);
      });
    }, { threshold: [0.35] });
    sections.forEach(function (s) { observer.observe(s); });
  }

  function isLeadForm(form) {
    if (!form) return false;
    var id = (form.id || '').toLowerCase();
    var action = (form.getAttribute('action') || '').toLowerCase();
    var cls = String(form.className || '').toLowerCase();
    return /web3forms|hero|contact|devis|quote|diag/.test(action + ' ' + id + ' ' + cls);
  }

  function formId(form) {
    return (form && (form.id || form.getAttribute('name'))) || 'lead_form';
  }

  function initInteractionTracking() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest && event.target.closest('a,button');
      if (!el) return;

      if (el.matches('.diag-opt')) {
        diagnosticStep += 1;
        track('diagnostic_step', { step_number: diagnosticStep });
      }

      var type = ctaType(el);
      if (!type) return;
      var params = {
        cta_type: type,
        cta_location: locationLabel(el),
        cta_text: safeText(el)
      };
      track('cta_click', params);

      if (type === 'phone') track('phone_click', params);
      else if (type === 'whatsapp') track('whatsapp_click', params);
      else if (type === 'maps') track('maps_click', params);
      else if (type === 'reviews') track('reviews_click', params);
      else if (type === 'instagram') track('instagram_click', params);
      else if (type === 'quote') track('quote_start', params);
    }, true);

    document.addEventListener('focusin', function (event) {
      var form = event.target && event.target.form;
      if (!isLeadForm(form)) return;
      var id = formId(form);
      lastLeadFormId = id;
      once('lead_form_start:' + id, 'lead_form_start', { form_id: id });
    }, true);

    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!isLeadForm(form)) return;
      var id = formId(form);
      lastLeadFormId = id;
      track('lead_form_submit_attempt', { form_id: id });
    }, true);

    document.addEventListener('invalid', function (event) {
      var field = event.target;
      var form = field && field.form;
      if (!isLeadForm(form)) return;
      track('form_error', {
        form_id: formId(form),
        field_type: (field.type || field.tagName || 'field').toLowerCase()
      });
    }, true);
  }

  function init() {
    initScrollTracking();
    initSectionTracking();
    initInteractionTracking();
    once('tracking_ready', 'tracking_ready', { tracking_version: VERSION });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
