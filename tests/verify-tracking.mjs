/**
 * Local Playwright check for the Climeo34 conversion fixes.
 * Serves nothing by itself: BASE_URL must already point at the static site.
 * Tracking collect calls are intercepted and answered locally so the test
 * sees the exact request the page tried to send.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765';
const PHONE = 'AW-18153085489/_jEBCKeo7q0cELG0iNBD';
const FORM = 'AW-18153085489/tsRgCPyp7q0cELG0iNBD';
const WA = 'AW-18153085489/CAnFCL70vr4dELG0iNBD';
const IG = 'AW-18153085489/K5T1CMH0vr4dELG0iNBD';

const PAGES = [
  { path: '/', tel: 9, diag: true, exit: true },
  { path: '/depannage-climatisation-montpellier/', tel: 9, diag: true, exit: true },
  { path: '/installation-climatisation-montpellier/', tel: 7, diag: false, exit: false, quote: true },
];

function blobOf(hit) {
  let raw = hit.url + '\n' + (hit.post || '');
  try { raw = decodeURIComponent(raw); } catch (e) { /* keep raw */ }
  return raw;
}

function isCollect(url) {
  return /google-analytics\.com|analytics\.google\.com|\/g\/collect|\/ccm\/collect|googleadservices\.com|doubleclick\.net|\/pagead\/|\/rmkt\/|\/measurement\/|umami\.is\/api\/send/i.test(url);
}

function armRecorder(hits) {
  return async (route) => {
    const req = route.request();
    const url = req.url();
    const type = req.resourceType();
    if (type === 'image' || type === 'media' || type === 'font') return route.abort();
    if (/fonts\.googleapis|fonts\.gstatic|maps\.googleapis|places\.googleapis|maps\.gstatic/.test(url)) return route.abort();
    if (/web3forms\.com/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }
    if (/script\.google\.com/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
    }
    if (isCollect(url)) {
      hits.push({ url, post: req.postData() || '' });
      return route.fulfill({ status: 204, body: '' });
    }
    return route.continue();
  };
}

async function armDataLayer(page) {
  await page.evaluate(() => {
    window.__events = window.__events || [];
    const dl = window.dataLayer;
    if (!dl || dl.push.__climeo) return;
    const orig = dl.push.bind(dl);
    function wrapped() {
      for (let i = 0; i < arguments.length; i++) {
        const item = arguments[i];
        if (item && typeof item === 'object' && typeof item.length === 'number') {
          const snap = [];
          for (let j = 0; j < item.length; j++) {
            const v = item[j];
            if (v && typeof v === 'object') {
              try { snap.push(JSON.parse(JSON.stringify(v))); } catch (e) { snap.push(String(v)); }
            } else snap.push(v);
          }
          window.__events.push(snap);
        }
      }
      return orig.apply(dl, arguments);
    }
    wrapped.__climeo = true;
    dl.push = wrapped;
  });
}

async function readEvents(page) {
  return page.evaluate(() => (window.__events || []).slice());
}

function since(events, mark) {
  return events.slice(mark);
}

function conversions(events, label) {
  return events.filter((ev) => ev[0] === 'event' && ev[1] === 'conversion' && ev[2] && ev[2].send_to === label);
}

function ga(events, name) {
  return events.filter((ev) => ev[0] === 'event' && ev[1] === name);
}

function netHas(hits, needle) {
  return hits.filter((hit) => blobOf(hit).includes(needle));
}

async function waitUntil(page, pred, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await pred()) return true;
    await page.waitForTimeout(40);
  }
  return pred();
}

async function acceptCookies(page) {
  await page.waitForSelector('#cookie-accept', { timeout: 15000 });
  await page.click('#cookie-accept');
  await page.waitForFunction(() => window.google_tag_manager, { timeout: 20000 });
  await armDataLayer(page);
  await page.waitForTimeout(200);
}

async function openPage(browser, path) {
  const hits = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const popups = [];
  context.on('page', (popup) => {
    popups.push(popup.url());
    popup.close().catch(() => {});
  });
  await page.addInitScript(() => {
    window.__events = [];
    document.addEventListener('click', (event) => {
      const el = event.target && event.target.closest && event.target.closest('a[href]');
      if (!el) return;
      const href = el.getAttribute('href') || '';
      if (/^(tel:|mailto:)/i.test(href)) event.preventDefault();
    }, true);
  });
  await page.route('**/*', armRecorder(hits));
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err).slice(0, 300)));
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await acceptCookies(page);
  return { page, context, hits, popups, errors };
}

async function clickAnchor(page, selector, index) {
  await page.locator(selector).nth(index).evaluate((el) => el.click());
}

function summarize(hits) {
  return hits.slice(0, 8).map((hit) => blobOf(hit).replace(/\s+/g, ' ').slice(0, 280));
}

async function checkLinks(page, context, hits, expected) {
  const failures = [];
  const counts = await page.evaluate(() => ({
    tel: document.querySelectorAll('a[href^="tel:"]').length,
    wa: document.querySelectorAll('a[href*="wa.me"]').length,
    mail: document.querySelectorAll('a[href^="mailto:"]').length,
    ig: document.querySelectorAll('a[href*="instagram.com"]').length,
    igUmami: document.querySelectorAll('a[href*="instagram.com"][data-umami-event="click_instagram"]').length,
    mailUmami: document.querySelectorAll('a[href^="mailto:"][data-umami-event="click_email"]').length,
    waPhone: document.querySelectorAll('a[href*="wa.me"][onclick*="_jEBCKeo7q0cELG0iNBD"]').length,
    labels: { wa: window.CLIMEO_WA_CONV, ig: window.CLIMEO_IG_CONV },
  }));
  if (counts.tel !== expected.tel) failures.push('tel count ' + counts.tel + ' != ' + expected.tel);
  if (counts.wa !== 4) failures.push('wa count ' + counts.wa);
  if (counts.mail !== 4) failures.push('mailto count ' + counts.mail);
  if (counts.ig !== 14) failures.push('instagram count ' + counts.ig + ' (static + carousel hits)');
  if (counts.igUmami !== 14) failures.push('instagram umami attrs ' + counts.igUmami);
  if (counts.mailUmami !== 4) failures.push('email umami attrs ' + counts.mailUmami);
  if (counts.waPhone !== 0) failures.push('whatsapp links still use the phone label');
  if (counts.labels.wa !== WA) failures.push('WA constant ' + counts.labels.wa);
  if (counts.labels.ig !== IG) failures.push('IG constant ' + counts.labels.ig);

  async function each(selector, name, assert) {
    const n = await page.locator(selector).count();
    for (let i = 0; i < n; i++) {
      const mark = (await readEvents(page)).length;
      const hitMark = hits.length;
      const urlBefore = page.url();
      await clickAnchor(page, selector, i);
      const ok = await waitUntil(page, async () => {
        const ev = since(await readEvents(page), mark);
        return assert(ev, hits.slice(hitMark), true) === true;
      });
      const ev = since(await readEvents(page), mark);
      const fresh = hits.slice(hitMark);
      const problem = assert(ev, fresh, false);
      if (!ok || problem) {
        failures.push(name + '[' + i + '] ' + (problem || 'timed out') + ' events=' + JSON.stringify(ev).slice(0, 500) + ' net=' + JSON.stringify(summarize(fresh)));
      }
      if (page.url() !== urlBefore) failures.push(name + '[' + i + '] navigated to ' + page.url());
    }
  }

  await each('a[href^="tel:"]', 'tel', (ev, fresh, probing) => {
    const phoneConv = conversions(ev, PHONE);
    const bad = conversions(ev, WA).length + conversions(ev, IG).length + conversions(ev, FORM).length;
    if (ga(ev, 'phone_click').length !== 1) return probing ? false : 'phone_click ' + ga(ev, 'phone_click').length;
    if (phoneConv.length !== 1) return probing ? false : 'phone conversion ' + phoneConv.length;
    if (bad) return probing ? false : 'unexpected ads label';
    if (!netHas(fresh, '_jEBCKeo7q0cELG0iNBD').length) return probing ? false : 'no phone network request';
    if (!netHas(fresh, 'phone_click').length) return probing ? false : 'no phone_click request';
    if (netHas(fresh, 'CAnFCL70vr4dELG0iNBD').length || netHas(fresh, 'K5T1CMH0vr4dELG0iNBD').length) return 'wa/ig label on tel';
    return probing ? true : null;
  });

  await each('a[href*="wa.me"]', 'wa', (ev, fresh, probing) => {
    const conv = conversions(ev, WA);
    if (ga(ev, 'whatsapp_click').length !== 1) return probing ? false : 'whatsapp_click ' + ga(ev, 'whatsapp_click').length;
    if (conv.length !== 1) return probing ? false : 'wa conversion ' + conv.length;
    if (conv[0] && (Number(conv[0][2].value) !== 1 || conv[0][2].currency !== 'EUR')) return probing ? false : 'wa value/currency ' + JSON.stringify(conv[0][2]);
    if (conversions(ev, PHONE).length || conversions(ev, IG).length) return 'phone or ig label on whatsapp';
    const nets = netHas(fresh, 'CAnFCL70vr4dELG0iNBD');
    if (!nets.length) return probing ? false : 'no wa network request';
    const body = nets.map(blobOf).join('\n');
    if (!/value(?:=|%3D|":)1(\.0)?\b/.test(body) && !/value%22?%3A1/.test(body)) return probing ? false : 'wa request missing value 1.0 :: ' + body.slice(0, 400);
    if (!/EUR/.test(body)) return probing ? false : 'wa request missing EUR';
    if (netHas(fresh, '_jEBCKeo7q0cELG0iNBD').length) return 'phone label request on whatsapp';
    if (!netHas(fresh, 'whatsapp_click').length) return probing ? false : 'no whatsapp_click request';
    return probing ? true : null;
  });

  await each('a[href^="mailto:"]', 'mail', (ev, fresh, probing) => {
    if (ga(ev, 'email_click').length !== 1) return probing ? false : 'email_click ' + ga(ev, 'email_click').length;
    if (ev.filter((e) => e[1] === 'conversion').length) return 'mailto fired an ads conversion';
    if (!netHas(fresh, 'email_click').length) return probing ? false : 'no email_click request';
    const umami = fresh.filter((hit) => /umami/i.test(hit.url) && blobOf(hit).includes('click_email'));
    if (!umami.length) return probing ? false : 'no umami click_email';
    return probing ? true : null;
  });

  await each('a[href*="instagram.com"]', 'ig', (ev, fresh, probing) => {
    const conv = conversions(ev, IG);
    if (ga(ev, 'instagram_click').length !== 1) return probing ? false : 'instagram_click ' + ga(ev, 'instagram_click').length;
    if (conv.length !== 1) return probing ? false : 'ig conversion ' + conv.length;
    if (conv[0] && (conv[0][2].value != null || conv[0][2].currency != null)) return 'ig conversion should not send value';
    if (conversions(ev, PHONE).length || conversions(ev, WA).length) return 'phone or wa label on instagram';
    const nets = netHas(fresh, 'K5T1CMH0vr4dELG0iNBD');
    if (!nets.length) return probing ? false : 'no ig network request';
    const body = nets.map(blobOf).join('\n');
    if (/currency(?:=|%3D|":)EUR/.test(body) || /value(?:=|%3D|":)1(\.0)?\b/.test(body)) return 'ig request included value or currency';
    if (!netHas(fresh, 'instagram_click').length) return probing ? false : 'no instagram_click request';
    const umami = fresh.filter((hit) => /umami/i.test(hit.url) && blobOf(hit).includes('click_instagram'));
    if (!umami.length) return probing ? false : 'no umami click_instagram';
    return probing ? true : null;
  });

  const stayed = page.url();
  const popupPromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  await page.locator('a.ig-profile-link').click();
  const popup = await popupPromise;
  if (!popup) failures.push('instagram click did not open a new tab');
  else await popup.close().catch(() => {});
  if (page.url() !== stayed) failures.push('instagram click navigated the current page to ' + page.url());
  const targets = await page.evaluate(() => ({
    ig: document.querySelector('a.ig-profile-link').getAttribute('target'),
    wa: document.querySelector('a[href*="wa.me"]').getAttribute('target'),
  }));
  if (targets.ig !== '_blank' || targets.wa !== '_blank') failures.push('target=_blank missing ' + JSON.stringify(targets));

  return { failures, counts };
}

async function runDiag(page, hits) {
  const failures = [];
  await page.locator('#diag-fab').evaluate((el) => el.click());
  await page.locator('#diag-body .diag-opt', { hasText: 'Autre' }).click();
  await page.locator('#diag-body input').fill('Fuite inhabituelle');
  await page.locator('#diag-body .diag-submit-btn').click();
  await page.locator('#diag-body input[placeholder="Téléphone *"]').fill('0603257679');
  await page.locator('#diag-body input[placeholder="Nom *"]').fill('Test');
  await page.locator('#diag-body input[placeholder*="Ville"]').fill('Montpellier');
  const mark = (await readEvents(page)).length;
  const hitMark = hits.length;
  await page.locator('#diag-body .diag-submit-btn').click();
  await page.locator('.diag-success').waitFor({ timeout: 8000 });
  const ok = await waitUntil(page, async () => conversions(since(await readEvents(page), mark), FORM).length === 1);
  const ev = since(await readEvents(page), mark);
  const fresh = hits.slice(hitMark);
  if (!ok || conversions(ev, FORM).length !== 1) failures.push('diag form conversion ' + conversions(ev, FORM).length + ' ' + JSON.stringify(ev).slice(0, 600));
  if (!ga(ev, 'diag_submit').length) failures.push('diag_submit missing');
  if (!ga(ev, 'generate_lead').length) failures.push('generate_lead missing');
  if (conversions(ev, PHONE).length) failures.push('diag used the phone label');
  if (!netHas(fresh, 'tsRgCPyp7q0cELG0iNBD').length) failures.push('diag network missing form label ' + JSON.stringify(summarize(fresh)));
  if (!netHas(fresh, 'diag_submit').length) failures.push('diag network missing diag_submit');
  return failures;
}

async function runExit(page, hits) {
  const failures = [];
  await page.evaluate(() => {
    document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 0, bubbles: true }));
  });
  await page.locator('#exit-popup-overlay.open').waitFor({ timeout: 5000 });
  await page.locator('#exit-popup-form input[name="nom"]').fill('Test');
  await page.locator('#exit-popup-form input[name="telephone"]').fill('0603257679');
  await page.locator('#exit-popup-form input[name="ville"]').fill('Montpellier');
  const mark = (await readEvents(page)).length;
  const hitMark = hits.length;
  await page.locator('#exit-popup-form button[type="submit"]').click();
  await page.locator('#exit-popup-success').waitFor({ state: 'visible', timeout: 5000 });
  const ok = await waitUntil(page, async () => conversions(since(await readEvents(page), mark), FORM).length === 1);
  const ev = since(await readEvents(page), mark);
  const fresh = hits.slice(hitMark);
  if (!ok || conversions(ev, FORM).length !== 1) failures.push('exit conversion ' + JSON.stringify(ev).slice(0, 600));
  if (conversions(ev, PHONE).length) failures.push('exit still uses the phone label');
  if (!netHas(fresh, 'tsRgCPyp7q0cELG0iNBD').length) failures.push('exit network missing form label ' + JSON.stringify(summarize(fresh)));
  if (netHas(fresh, '_jEBCKeo7q0cELG0iNBD').length) failures.push('exit network used the phone label');
  return failures;
}

async function runQuote(page, hits) {
  const failures = [];
  const form = page.locator('#installation-quote-form');
  await form.locator('input[name="nom"]').fill('Test');
  await form.locator('input[name="telephone"]').fill('0603257679');
  await form.locator('input[name="ville"]').fill('Montpellier');
  await form.locator('select[name="projet"]').selectOption({ index: 1 });
  const mark = (await readEvents(page)).length;
  const hitMark = hits.length;
  await form.locator('button[type="submit"]').click();
  await page.locator('#form-status.success').waitFor({ timeout: 8000 });
  const ok = await waitUntil(page, async () => conversions(since(await readEvents(page), mark), FORM).length === 1);
  let ev = since(await readEvents(page), mark);
  let fresh = hits.slice(hitMark);
  if (!ok || conversions(ev, FORM).length !== 1) failures.push('quote conversion ' + conversions(ev, FORM).length + ' ' + JSON.stringify(ev).slice(0, 700));
  if (!ga(ev, 'installation_quote_success').length) failures.push('installation_quote_success missing');
  if (!netHas(fresh, 'tsRgCPyp7q0cELG0iNBD').length) failures.push('quote network missing form label ' + JSON.stringify(summarize(fresh)));
  const afterFirst = conversions(ev, FORM).length;
  await page.evaluate(() => document.getElementById('installation-quote-form').requestSubmit());
  await page.waitForTimeout(600);
  ev = since(await readEvents(page), mark);
  if (conversions(ev, FORM).length !== afterFirst) failures.push('quote conversion fired more than once: ' + conversions(ev, FORM).length);
  return failures;
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const report = [];
let failed = false;
try {
  for (const spec of PAGES) {
    const session = await openPage(browser, spec.path);
    const linkResult = await checkLinks(session.page, session.context, session.hits, spec);
    const entry = { path: spec.path, links: linkResult.counts, linkFailures: linkResult.failures, forms: {} };
    if (linkResult.failures.length) failed = true;
    await session.context.close();

    if (spec.diag) {
      const diag = await openPage(browser, spec.path);
      try {
        entry.forms.diag = await runDiag(diag.page, diag.hits);
      } catch (err) {
        entry.forms.diag = ['threw ' + err.message];
      }
      if (entry.forms.diag.length) failed = true;
      if (diag.errors.length) entry.forms.diagErrors = diag.errors.slice(0, 3);
      await diag.context.close();
    }
    if (spec.exit) {
      const exit = await openPage(browser, spec.path);
      try {
        entry.forms.exit = await runExit(exit.page, exit.hits);
      } catch (err) {
        entry.forms.exit = ['threw ' + err.message];
      }
      if (entry.forms.exit.length) failed = true;
      await exit.context.close();
    }
    if (spec.quote) {
      const quote = await openPage(browser, spec.path);
      try {
        entry.forms.quote = await runQuote(quote.page, quote.hits);
      } catch (err) {
        entry.forms.quote = ['threw ' + err.message];
      }
      if (entry.forms.quote.length) failed = true;
      await quote.context.close();
    }
    report.push(entry);
    console.log(JSON.stringify(entry, null, 2));
  }
} finally {
  await browser.close();
}

if (failed) {
  console.error('TRACKING CHECK FAILED');
  process.exit(1);
}
console.log('TRACKING CHECK PASSED');
