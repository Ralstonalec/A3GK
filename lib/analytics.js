import { apiUrl } from './config';
import { hasConsent } from './consent';

/**
 * Consent-gated analytics client.
 *
 * Nothing is stored or sent unless the visitor has granted the "analytics"
 * category.  Events are batched and delivered with sendBeacon to our own
 * /api/analytics endpoint, which forwards them server-side (GA4 Measurement
 * Protocol and/or a webhook) — so there is no third-party script in the page.
 */

const CLIENT_ID_KEY = 'a3gk_cid';
const FLUSH_MS = 2000;
const MAX_BATCH = 20;

let queue = [];
let timer = null;
let listening = false;

function getClientId() {
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `${crypto.randomUUID()}`;
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function clearAnalyticsIdentity() {
  try {
    window.localStorage.removeItem(CLIENT_ID_KEY);
  } catch {
    /* ignore */
  }
  queue = [];
}

function cleanParams(params) {
  const out = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,39}$/.test(key)) continue;
    if (typeof value === 'string') out[key] = value.slice(0, 200);
    else if (typeof value === 'number' || typeof value === 'boolean') out[key] = value;
    else if (Array.isArray(value)) out[key] = value.slice(0, 10);
  }
  return out;
}

export function flush() {
  clearTimeout(timer);
  timer = null;
  if (typeof window === 'undefined' || queue.length === 0) return;
  if (!hasConsent('analytics')) {
    queue = [];
    return;
  }
  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({ clientId: getClientId(), page: window.location.pathname, events });
  const url = apiUrl('/analytics');
  const sent = navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
  if (!sent) {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }
  if (queue.length) timer = setTimeout(flush, FLUSH_MS);
}

function ensureListeners() {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}

/** Queue an analytics event (GA4-style name + flat params). */
export function track(name, params = {}) {
  if (typeof window === 'undefined' || !hasConsent('analytics')) return;
  ensureListeners();
  queue.push({ name, params: cleanParams(params) });
  if (queue.length >= MAX_BATCH) flush();
  else if (!timer) timer = setTimeout(flush, FLUSH_MS);
}

export function pageView(path) {
  track('page_view', { page_path: path, page_title: typeof document !== 'undefined' ? document.title : '' });
}

/** GA4 ecommerce item from a normalised product. */
export function toItem(product, variant, quantity = 1) {
  return {
    item_id: variant?.sku || product.handle,
    item_name: product.title,
    item_category: product.productType,
    item_variant: variant && variant.title !== 'Default Title' ? variant.title : '',
    price: ((variant?.priceCents ?? product.priceRange?.minCents ?? 0) / 100),
    quantity,
  };
}
