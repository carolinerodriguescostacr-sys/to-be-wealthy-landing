// Public commercial configuration. Never put secrets here.
export const wealthConfig = Object.freeze({
  checkouts: {
    book: 'https://pay.hotmart.com/J106747367T?off=aw7l28fk',
    journey: 'https://pay.hotmart.com/D107972742K?off=f7x5l6q8',
    complete: 'https://pay.hotmart.com/D107972742K?off=ystk34v8',
  },
  // Open each offer only when its content and delivery are ready.
  enabledOffers: { book: false, journey: false, complete: false },
  contactEmail: '',
  privacyUrl: '',
  termsUrl: '',
  platformUrl: 'https://app.tobewealthy.site/',
  canonicalUrl: 'https://tobewealthy.site/',
  // Reserved for a future consent-aware analytics integration.
  analyticsEnabled: false,
});

export const offers = Object.freeze({
  book: { name: 'The Code Of Wealth', price: 14.99 },
  journey: { name: 'To Be Wealthy — The Guided Journey', price: 49 },
  complete: { name: 'The Complete Code', price: 59 },
});

export function checkoutUrl(offer, search = '', config = wealthConfig) {
  if (config.enabledOffers && config.enabledOffers[offer] !== true) return null;
  const raw = config.checkouts[offer];
  if (!raw) return null;
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' || !(url.hostname === 'hotmart.com' || url.hostname.endsWith('.hotmart.com'))) return null;
  for (const [key, value] of new URLSearchParams(search)) {
    if (/^utm_(source|medium|campaign|term|content|id)$/i.test(key)) url.searchParams.set(key, value);
  }
  return url.href;
}
