/* Climeo34 — GA4 behavioural + lead tracking
 * No form values or personal data are sent to analytics.
 */
(function () {
  'use strict';

  var VERSION = '2026-09-13';
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
    return Object.assign({ tracking_version: VERSION, page_path: location.pathname, page_type: pageType() }, extra || {});
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
    track('generate_lead', { lead_source: source || 'website', form_id: formId || lastLeadFormId || 'unknown' });
  }

  if (typeof window.gtag === 'function' && !window.gtag.__climeoWrapped) {
    var originalGtag = window.gtag;
    var wrappedGtag = function () {
      var args = Array.prototype.slice.call(arguments);
      originalGtag.apply(window, args);
      if (args[0] === 'event' && args[1] === 'diag_submit') trackLead('diagnostic', 'diagnostic');
    };
    wrappedGtag.__climeoWrapped = true;
    window.gtag = wrappedGtag;
  }

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
      if (!ticking) { ticking = true; window.requestAnimationFrame(check); }
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
        once(key, 'section_view', { section_id: id.slice(0, 60), section_name: name.slice(0, 80) });
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

  function formId(form) { return (form && (form.id || form.getAttribute('name'))) || 'lead_form'; }

  function initInteractionTracking() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest && event.target.closest('a,button');
      if (!el) return;
      if (el.matches('.diag-opt')) { diagnosticStep += 1; track('diagnostic_step', { step_number: diagnosticStep }); }
      var type = ctaType(el);
      if (!type) return;
      var params = { cta_type: type, cta_location: locationLabel(el), cta_text: safeText(el) };
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
      track('form_error', { form_id: formId(form), field_type: (field.type || field.tagName || 'field').toLowerCase() });
    }, true);
  }

  function initCookieBannerUX() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    if (!document.getElementById('climeo-cookie-mobile-style')) {
      var style = document.createElement('style');
      style.id = 'climeo-cookie-mobile-style';
      style.textContent = '@media(max-width:768px){#cookie-banner{position:fixed!important;left:12px!important;right:12px!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;top:auto!important;transform:none!important;width:auto!important;max-width:none!important;min-height:0!important;height:auto!important;padding:12px 12px 11px!important;margin:0!important;border-radius:16px!important;display:grid!important;grid-template-columns:1fr!important;gap:9px!important;align-items:center!important;overflow:visible!important;z-index:10000!important;box-sizing:border-box!important}#cookie-banner p{margin:0!important;font-size:12px!important;line-height:1.35!important;text-align:left!important}#cookie-banner .cookie-btns{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;width:100%!important;margin:0!important;flex-shrink:1!important}#cookie-banner .btn-cookie-ok,#cookie-banner .btn-cookie-no{width:100%!important;min-width:0!important;min-height:44px!important;height:44px!important;margin:0!important;padding:8px 10px!important;border-radius:11px!important;font-size:14px!important;font-weight:700!important;line-height:1!important;opacity:1!important;box-sizing:border-box!important}#cookie-banner .btn-cookie-no{color:#fff!important;border:1px solid rgba(255,255,255,.65)!important}html.climeo-cookie-open .climeo-contact-dock{opacity:0!important;pointer-events:none!important;transform:translateY(12px)!important}}';
      document.head.appendChild(style);
    }
    function syncCookieState() {
      var visible = !banner.hidden && window.getComputedStyle(banner).display !== 'none';
      document.documentElement.classList.toggle('climeo-cookie-open', visible);
    }
    syncCookieState();
    if ('MutationObserver' in window) new MutationObserver(syncCookieState).observe(banner, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  }

  function initContactDock() {
    var dock = document.getElementById('mobile-cta-bar');
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'climeo-contact-dock';
      dock.setAttribute('role', 'complementary');
      dock.setAttribute('aria-label', 'Appel ou WhatsApp rapide');
      dock.innerHTML = '<a class="mob-cta-call" href="tel:0603257679" aria-label="Appeler Climeo34 au 06 03 25 76 79"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.36 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a><a class="mob-cta-wa" href="https://wa.me/33603257679" aria-label="Contacter Climeo34 sur WhatsApp" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.914 2C6.441 2 2 6.441 2 11.914c0 1.892.523 3.661 1.432 5.178L2 22l5.087-1.404C8.536 21.46 10.194 22 11.914 22 17.387 22 22 17.387 22 11.914 22 6.441 17.387 2 11.914 2z"/></svg></a>';
      document.body.appendChild(dock);
    }
    dock.classList.add('climeo-contact-dock');
    if (!document.getElementById('climeo-contact-dock-style')) {
      var style = document.createElement('style');
      style.id = 'climeo-contact-dock-style';
      style.textContent = '.climeo-contact-dock{display:none!important}@media(max-width:768px){.climeo-contact-dock{display:flex!important;position:fixed!important;left:auto!important;right:16px!important;bottom:calc(16px + env(safe-area-inset-bottom))!important;z-index:9990!important;flex-direction:column!important;align-items:flex-end!important;justify-content:flex-start!important;gap:11px!important;width:auto!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important;transition:opacity .25s ease,transform .25s ease!important}.climeo-contact-dock.climeo-near-footer{opacity:0!important;transform:translateY(12px)!important;pointer-events:none!important}.climeo-contact-dock .mob-cta-call,.climeo-contact-dock .mob-cta-wa{display:flex!important;align-items:center!important;justify-content:center!important;width:54px!important;height:54px!important;min-width:54px!important;padding:0!important;border:0!important;border-radius:50%!important;color:#fff!important;text-decoration:none!important;transition:transform .15s ease!important}.climeo-contact-dock .mob-cta-call{background:#001e5a!important;box-shadow:0 4px 14px rgba(0,30,90,.35),0 0 16px 2px rgba(61,174,233,.45)!important}.climeo-contact-dock .mob-cta-wa{background:#25d366!important;box-shadow:0 4px 14px rgba(0,0,0,.2),0 0 16px 2px rgba(37,211,102,.45)!important}.climeo-contact-dock .mob-cta-call:active,.climeo-contact-dock .mob-cta-wa:active{transform:scale(.91)!important}.climeo-contact-dock svg{width:24px!important;height:24px!important}}@media(prefers-reduced-motion:reduce){.climeo-contact-dock,.climeo-contact-dock a{transition:none!important;animation:none!important}}';
      document.head.appendChild(style);
    }
    var footer = document.querySelector('footer');
    if (footer && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { dock.classList.toggle('climeo-near-footer', entries[0].isIntersecting); }, { threshold: 0.05 }).observe(footer);
    }
  }

  function init() {
    initCookieBannerUX();
    initContactDock();
    initScrollTracking();
    initSectionTracking();
    initInteractionTracking();
    once('tracking_ready', 'tracking_ready', { tracking_version: VERSION });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
