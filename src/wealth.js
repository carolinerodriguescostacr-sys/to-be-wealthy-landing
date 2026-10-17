import { wealthConfig, offers, checkoutUrl } from './wealth-config.js?v=20261016-legal';

// A consent-aware tag manager can subscribe to this event. No network calls,
// personal data, or persistent tracking are introduced by the landing page.
export function track(name, detail = {}) {
  if (!wealthConfig.analyticsEnabled) return;
  window.dispatchEvent(new CustomEvent('wealth:analytics', { detail: { event: name, ...detail } }));
}

const menu = document.querySelector('#site-menu');
const toggle = document.querySelector('#menu-toggle');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
});
function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); }
menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); toggle.focus(); } });

for (const button of document.querySelectorAll('[data-offer]')) {
  const key = button.dataset.offer;
  const url = checkoutUrl(key, location.search);
  if (!url) { button.disabled = true; button.setAttribute('aria-describedby', 'checkout-availability'); continue; }
  button.addEventListener('click', () => {
    track('checkout_click', { offer_id: key, item_name: offers[key].name, value: offers[key].price, currency: 'USD' });
    location.assign(url);
  });
}
if (Object.keys(offers).every(key => checkoutUrl(key))) {
  document.querySelector('#checkout-availability').hidden = true;
}

const safeHttps = raw => { try { const url = new URL(raw); return url.protocol === 'https:' ? url.href : null; } catch { return null; } };
for (const [id, raw] of [['privacy-link', wealthConfig.privacyUrl], ['terms-link', wealthConfig.termsUrl], ['member-link', wealthConfig.platformUrl]]) {
  const url = safeHttps(raw);
  if (url) { const element = document.querySelector('#' + id); element.href = url; element.removeAttribute('aria-disabled'); }
}
if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wealthConfig.contactEmail)) {
  const contact = document.querySelector('#contact-link');
  contact.href = 'mailto:' + wealthConfig.contactEmail;
  contact.removeAttribute('aria-disabled');
  document.querySelector('#contact-status').hidden = true;
}
document.querySelector('#year').textContent = new Date().getFullYear();
if (safeHttps(wealthConfig.canonicalUrl)) {
  const link = document.createElement('link'); link.rel = 'canonical'; link.href = wealthConfig.canonicalUrl; document.head.append(link);
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      const key = entry.target.dataset.offerCard;
      track('view_offer', { offer_id: key, value: offers[key].price, currency: 'USD' });
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.35 });
  document.querySelectorAll('[data-offer-card]').forEach(card => observer.observe(card));
}

// purchase_confirmed must be emitted by a trusted server-side analytics adapter
// after validating the approved Hotmart webhook. Never infer it from this page,
// a checkout click, a return URL, or a client-supplied query parameter.
