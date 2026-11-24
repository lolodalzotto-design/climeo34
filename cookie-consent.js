/* Climeo34 — bandeau de consentement RGPD / ePrivacy + Google Consent Mode v2.
   Le défaut « denied » (url_passthrough, ads_data_redaction) reste dans le <head>,
   avant le chargement de gtag. Ce fichier n'affiche que le choix et met à jour le consentement. */
(function () {
  'use strict';

  if (window.__climeoConsentInit) return;
  window.__climeoConsentInit = true;

  var STORAGE_KEY = 'cookies';
  var GRANTED = {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted'
  };
  var DENIED = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  };

  function readChoice() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeChoice(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function updateConsent(state) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', state);
  }

  function injectStyles() {
    if (document.getElementById('climeo-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'climeo-consent-styles';
    style.textContent = [
      '#cookie-banner.climeo-consent{',
      'position:fixed!important;left:0!important;right:0!important;top:auto!important;',
      'bottom:env(safe-area-inset-bottom)!important;',
      'transform:none!important;width:100%!important;max-width:none!important;margin:0!important;',
      'z-index:80!important;display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;',
      'align-items:center!important;gap:8px!important;box-sizing:border-box!important;',
      'min-height:0!important;max-height:70px!important;height:auto!important;',
      'padding:6px 10px!important;',
      'background:#f3f5f7!important;color:#1f2937!important;',
      'border:0!important;border-top:1px solid #d5dbe3!important;border-radius:0!important;',
      'box-shadow:none!important;animation:none!important;overflow:hidden!important;',
      'font-family:inherit!important;pointer-events:auto!important;',
      '}',
      '#cookie-banner.climeo-consent[hidden]{display:none!important;}',
      '#cookie-banner.climeo-consent p{',
      'flex:1 1 auto!important;min-width:0!important;margin:0!important;padding:0!important;',
      'display:flex!important;align-items:center!important;gap:6px!important;',
      'font-size:12.5px!important;line-height:1.25!important;font-weight:400!important;color:#1f2937!important;',
      'white-space:nowrap!important;',
      '}',
      '#cookie-banner.climeo-consent .cookie-line{',
      'min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;',
      '}',
      '#cookie-banner.climeo-consent a{',
      'flex:0 0 auto!important;color:#1e3a8a!important;font-size:12.5px!important;font-weight:600!important;',
      'text-decoration:underline!important;text-underline-offset:2px!important;',
      '}',
      '#cookie-banner.climeo-consent .cookie-btns{',
      'display:flex!important;flex:0 0 auto!important;flex-wrap:nowrap!important;gap:6px!important;margin:0!important;',
      '}',
      '#cookie-banner.climeo-consent .btn-cookie-ok,',
      '#cookie-banner.climeo-consent .btn-cookie-no{',
      'appearance:none!important;-webkit-appearance:none!important;box-sizing:border-box!important;',
      'height:44px!important;min-height:44px!important;width:92px!important;min-width:92px!important;padding:0 8px!important;margin:0!important;',
      'border-radius:6px!important;border:1px solid #1f2937!important;',
      'font-family:inherit!important;font-size:13px!important;font-weight:600!important;line-height:1!important;',
      'letter-spacing:0!important;cursor:pointer!important;white-space:nowrap!important;',
      '}',
      '#cookie-banner.climeo-consent .btn-cookie-ok{background:#1f2937!important;color:#fff!important;}',
      '#cookie-banner.climeo-consent .btn-cookie-no{background:#fff!important;color:#1f2937!important;}',
      '#cookie-banner.climeo-consent .btn-cookie-ok:hover,',
      '#cookie-banner.climeo-consent .btn-cookie-no:hover{filter:brightness(1.05);}',
      '#cookie-banner.climeo-consent .btn-cookie-ok:focus-visible,',
      '#cookie-banner.climeo-consent .btn-cookie-no:focus-visible,',
      '#cookie-banner.climeo-consent a:focus-visible,',
      'a.cookie-settings-link:focus-visible{outline:2px solid #1d4ed8!important;outline-offset:2px!important;}',
      'html.consent-open{scroll-padding-bottom:var(--consent-h,56px);}',
      'html.consent-open body{padding-bottom:calc(var(--consent-h,56px) + env(safe-area-inset-bottom))!important;}',
      'html.consent-open #mobile-cta-bar{',
      'bottom:calc(18px + var(--consent-h,56px) + env(safe-area-inset-bottom))!important;',
      '}',
      'html.consent-open .ig-profile-fab{',
      'bottom:calc(18px + var(--consent-h,56px) + env(safe-area-inset-bottom))!important;',
      '}',
      'a.cookie-settings-link{cursor:pointer;}',
      '@media (max-width:480px){',
      '#cookie-banner.climeo-consent{',
      'flex-wrap:wrap!important;align-content:center!important;gap:4px 8px!important;padding:5px 8px!important;',
      '}',
      '#cookie-banner.climeo-consent p{flex:1 1 100%!important;font-size:12.5px!important;}',
      '#cookie-banner.climeo-consent a{font-size:12.5px!important;}',
      '#cookie-banner.climeo-consent .cookie-btns{flex:1 1 100%!important;}',
      '#cookie-banner.climeo-consent .btn-cookie-ok,#cookie-banner.climeo-consent .btn-cookie-no{',
      'flex:1 1 0!important;width:auto!important;min-width:0!important;height:40px!important;min-height:40px!important;',
      'padding:0 8px!important;font-size:14px!important;}',
      '}',
      '@media (prefers-reduced-motion:reduce){#cookie-banner.climeo-consent{animation:none!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function privacyHref() {
    if (document.getElementById('confidentialite')) return '#confidentialite';
    return '/#confidentialite';
  }

  function onPrivacyClick(event) {
    var block = document.getElementById('confidentialite');
    if (!block || typeof window.openMentions !== 'function') return;
    event.preventDefault();
    window.openMentions();
    window.setTimeout(function () {
      try { block.scrollIntoView({ block: 'center' }); } catch (e) {}
    }, 40);
  }

  function syncOffset() {
    var banner = document.getElementById('cookie-banner');
    var root = document.documentElement;
    if (!banner || banner.hasAttribute('hidden')) {
      root.classList.remove('consent-open');
      root.style.removeProperty('--consent-h');
      return;
    }
    var height = Math.ceil(banner.getBoundingClientRect().height);
    root.style.setProperty('--consent-h', height + 'px');
    root.classList.add('consent-open');
  }

  function hideBanner() {
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.setAttribute('hidden', '');
    syncOffset();
  }

  function showBanner() {
    var banner = ensureBanner();
    banner.removeAttribute('hidden');
    syncOffset();
  }

  function choose(value) {
    writeChoice(value);
    updateConsent(value === 'accepted' ? GRANTED : DENIED);
    hideBanner();
  }

  function ensureBanner() {
    var existing = document.getElementById('cookie-banner');
    if (existing && existing.classList.contains('climeo-consent')) return existing;
    if (existing) existing.parentNode.removeChild(existing);

    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'climeo-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Choix des cookies');
    banner.innerHTML = [
      '<p><span class="cookie-line">Mesure d’audience et publicité.</span> ',
      '<a class="cookie-policy" href="', privacyHref(), '">Confidentialité</a></p>',
      '<div class="cookie-btns">',
      '<button type="button" class="btn-cookie-no" id="cookie-refuse">Refuser</button>',
      '<button type="button" class="btn-cookie-ok" id="cookie-accept">Accepter</button>',
      '</div>'
    ].join('');
    document.body.appendChild(banner);

    var policy = banner.querySelector('.cookie-policy');
    if (policy) policy.addEventListener('click', onPrivacyClick);
    banner.querySelector('#cookie-accept').addEventListener('click', function () { choose('accepted'); });
    banner.querySelector('#cookie-refuse').addEventListener('click', function () { choose('refused'); });
    return banner;
  }

  function addReopenLink() {
    if (document.getElementById('cookie-settings')) return;
    var link = document.createElement('a');
    link.id = 'cookie-settings';
    link.className = 'cookie-settings-link';
    link.href = '#cookies';
    link.textContent = 'Cookies';
    link.addEventListener('click', function (event) {
      event.preventDefault();
      showBanner();
    });

    var nav = document.querySelector('footer .footer-nav, footer nav');
    if (nav) {
      nav.appendChild(link);
      return;
    }
    var footer = document.querySelector('footer');
    if (footer) {
      var slot = footer.querySelector('.footer-copy, .footerline p, .footer-link, p');
      if (slot) {
        slot.appendChild(document.createTextNode(' · '));
        slot.appendChild(link);
      } else {
        footer.appendChild(link);
      }
      return;
    }
    var fallback = document.createElement('p');
    fallback.style.cssText = 'margin:12px;font-size:13px;';
    fallback.appendChild(link);
    document.body.appendChild(fallback);
  }

  function openPrivacyFromHash() {
    if (location.hash !== '#confidentialite') return;
    if (typeof window.openMentions !== 'function') return;
    window.openMentions();
    var block = document.getElementById('confidentialite');
    if (!block) return;
    window.setTimeout(function () {
      try { block.scrollIntoView({ block: 'center' }); } catch (e) {}
    }, 40);
  }

  function init() {
    injectStyles();
    document.querySelectorAll('#cookie-banner').forEach(function (node) {
      if (!node.classList.contains('climeo-consent') && node.parentNode) node.parentNode.removeChild(node);
    });
    addReopenLink();
    var choice = readChoice();
    if (choice === 'accepted' || choice === 'refused') {
      hideBanner();
    } else {
      showBanner();
    }
    openPrivacyFromHash();
    window.addEventListener('resize', syncOffset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
