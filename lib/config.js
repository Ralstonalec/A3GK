import { FEATURES } from './features';

/**
 * Isomorphic configuration.  Only NEXT_PUBLIC_* values (inlined at build time)
 * and non-secret constants live here — server-only secrets are read in
 * lib/server-config.js so they can never leak into a client bundle.
 */

/** Optional https URL from env; anything else is treated as unset (so no link is rendered). */
const httpsUrl = (value) => (/^https:\/\//i.test(value || '') ? value : '');

/**
 * Site identity. Only facts supplied by the company live here. Contact details and
 * social profiles come from env vars and are simply omitted until they are set —
 * the site never links to an account or address that has not been confirmed.
 */
export const SITE = {
  name: 'A3GK',
  tagline: 'Advanced Athletic Gear for Goalkeepers',
  description: 'Padded base layers, goalkeeper jerseys, pants and shorts, athletic tape and grip socks.',
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.NEXT_PUBLIC_CONTACT_EMAIL || '') ? process.env.NEXT_PUBLIC_CONTACT_EMAIL : '',
  locale: 'en-US',
  currency: 'USD',
  social: {
    instagram: httpsUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
    youtube: httpsUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL),
    tiktok: httpsUrl(process.env.NEXT_PUBLIC_TIKTOK_URL),
  },
};

export const publicConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  shopifyDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '',
  shopifyStorefrontToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID || '',
  heroVideoUrl: process.env.NEXT_PUBLIC_HERO_VIDEO_URL || '',
  heroVideoPoster: process.env.NEXT_PUBLIC_HERO_VIDEO_POSTER || '',
};

/** Placeholder values from .env.example must not switch features on. */
function isRealValue(value) {
  return Boolean(value) && !/your-store|xxx|^\*+$/i.test(value);
}

export function isShopifyConfigured() {
  return isRealValue(publicConfig.shopifyDomain) && isRealValue(publicConfig.shopifyStorefrontToken);
}

/** True while the site runs on the built-in mock catalogue (no Shopify store connected). */
export function isDemoCatalogue() {
  return !isShopifyConfigured();
}

/** Card payments are configured (publishable key present) — gates every payment-related message. */
export function isPaymentsEnabled() {
  return isRealValue(publicConfig.stripePublishableKey);
}

export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07';

/** Base for client → API calls. Empty => same-origin `/api` (correct on previews). */
export function apiUrl(path = '') {
  const base = (publicConfig.apiUrl || '/api').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Optional site-wide banner above the header. null = none (no promo/terms copy until decided). */
export const ANNOUNCEMENT = null;

export const NAV_LINKS = [
  { href: '/products', label: 'Shop' },
  { href: '/products?category=base-layers', label: 'Base layers' },
  { href: '/products?category=jerseys', label: 'Jerseys' },
  { href: '/products?category=bottoms', label: 'Pants & shorts' },
  { href: '/products?category=accessories', label: 'Tape & socks' },
  ...(FEATURES.gloves ? [{ href: '/products?category=gloves', label: 'Gloves' }] : []),
  ...(FEATURES.customKit ? [{ href: '/customizer', label: 'Design Studio' }] : []),
];

/**
 * Catalogue categories → Shopify `product_type` groups. Filtering uses
 * `product_type:` (a real Storefront search field) so it behaves the same in
 * demo mode and against a live store. Launch range only; gloves and custom kit
 * join when their feature flags are on (lib/features.js).
 */
export const CATEGORIES = [
  { id: 'all', label: 'All gear', productTypes: [] },
  { id: 'base-layers', label: 'Base layers', productTypes: ['Base Layers'] },
  { id: 'jerseys', label: 'Jerseys', productTypes: ['Jerseys', ...(FEATURES.customKit ? ['Custom Kit'] : [])] },
  { id: 'bottoms', label: 'Pants & shorts', productTypes: ['Pants', 'Shorts'] },
  { id: 'accessories', label: 'Tape & socks', productTypes: ['Tape', 'Socks'] },
  ...(FEATURES.gloves ? [{ id: 'gloves', label: 'Gloves', productTypes: ['Gloves'] }] : []),
];

export const PRICE_RANGES = [
  { id: 'any', label: 'Any price' },
  { id: 'under-60', label: 'Under $60', max: 60 },
  { id: '60-100', label: '$60 – $100', min: 60, max: 100 },
  { id: 'over-100', label: 'Over $100', min: 100 },
];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'title', label: 'Name A–Z' },
];
