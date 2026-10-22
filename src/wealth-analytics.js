// The Google tag is never requested before an explicit opt-in.
const consentKey = 'wealth_analytics_consent_v1';
let measurementId = '';
let enabled = false;
let loaded = false;

function storedChoice() {
  try { return localStorage.getItem(consentKey); } catch { return null; }
}

function storeChoice(choice) {
  try { localStorage.setItem(consentKey, choice); } catch { /* Choice applies to this page only. */ }
}

function clearGoogleCookies() {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.trim().split('=')[0];
    if (!/^_ga(?:_|$)/.test(name)) continue;
    for (const domain of ['', ';domain=tobewealthy.site', ';domain=.tobewealthy.site']) {
      document.cookie = `${name}=;Max-Age=0;path=/${domain};SameSite=Lax`;
    }
  }
}

function loadTag() {
  if (!measurementId || !enabled) return;
  window[`ga-disable-${measurementId}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (!loaded) {
    loaded = true;
    window.gtag('js', new Date());
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
  }
  window.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  // Exclude query parameters: a campaign link must never send personal values.
  window.gtag('event', 'page_view', {
    page_location: location.origin + location.pathname,
    page_title: document.title,
  });
}

export function initAnalytics(config) {
  if (!config.analyticsEnabled || !/^G-[A-Z0-9]+$/.test(config.analyticsMeasurementId || '')) return;
  measurementId = config.analyticsMeasurementId;
  const banner = document.querySelector('#analytics-banner');
  const showChoice = () => { banner.hidden = false; document.querySelector('#analytics-accept').focus(); };
  document.querySelector('#analytics-accept').addEventListener('click', () => {
    storeChoice('accepted');
    enabled = true;
    banner.hidden = true;
    loadTag();
  });
  document.querySelector('#analytics-decline').addEventListener('click', () => {
    storeChoice('declined');
    enabled = false;
    window[`ga-disable-${measurementId}`] = true;
    clearGoogleCookies();
    banner.hidden = true;
  });
  document.querySelector('#analytics-preferences').addEventListener('click', showChoice);
  if (storedChoice() === 'accepted') { enabled = true; loadTag(); }
  else if (storedChoice() !== 'declined') banner.hidden = false;
}

export function trackAnalytics(name, detail = {}) {
  if (!enabled || !window.gtag) return;
  if (name === 'view_offer' && /^(book|journey|complete)$/.test(detail.offer_id)) {
    window.gtag('event', `view_${detail.offer_id}_offer`);
  }
}

export function trackCheckoutClick(key, offer, url) {
  if (!enabled || !window.gtag || !/^(book|journey|complete)$/.test(key)) {
    location.assign(url);
    return;
  }
  let navigated = false;
  const go = () => { if (!navigated) { navigated = true; location.assign(url); } };
  window.setTimeout(go, 700);
  window.gtag('event', `checkout_${key}_click`, {
    currency: 'USD',
    value: offer.price,
    event_callback: go,
    event_timeout: 650,
    transport_type: 'beacon',
  });
}
