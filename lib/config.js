/**
 * Isomorphic configuration.  Only NEXT_PUBLIC_* values (inlined at build time)
 * and non-secret constants live here — server-only secrets are read in
 * lib/server-config.js so they can never leak into a client bundle.
 */

export const SITE = {
  name: 'A3GK',
  legalName: 'A3GK Goalkeeper Gear',
  tagline: 'Advanced Athletic Gear for Goalkeepers',
  description:
    'Pro-grade goalkeeper gloves, padded kit and fully custom jerseys — engineered for the last line of defence.',
  email: 'support@a3gk.example',
  locale: 'en-US',
  currency: 'USD',
  social: {
    instagram: 'https://www.instagram.com/',
    youtube: 'https://www.youtube.com/',
    tiktok: 'https://www.tiktok.com/',
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
  { href: '/products?category=gloves', label: 'Gloves' },
  { href: '/products?category=apparel', label: 'Apparel' },
  { href: '/customizer', label: 'Design Studio' },
  { href: '/#technology', label: 'Technology' },
  { href: '/#faq', label: 'FAQ' },
];

/**
 * Catalogue categories → Shopify `product_type` groups. Filtering uses
 * `product_type:` (a real Storefront search field) so it behaves the same in
 * demo mode and against a live store.
 */
export const CATEGORIES = [
  { id: 'all', label: 'All gear', productTypes: [] },
  { id: 'gloves', label: 'Gloves', productTypes: ['Gloves'] },
  { id: 'apparel', label: 'Apparel', productTypes: ['Jerseys', 'Pants', 'Custom Kit'] },
  { id: 'accessories', label: 'Bags & care', productTypes: ['Bags', 'Glove Care'] },
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
