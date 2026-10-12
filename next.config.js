const { securityHeaders } = require('./lib/security');

const isDev = process.env.NODE_ENV !== 'production';

// Canonical origin, inlined at build time so server and browser agree.
// Vercel exposes the production domain as VERCEL_PROJECT_PRODUCTION_URL.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

// Preview deployments must never be indexed.
const isPreview = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== 'production';

// Public, derived BOOLEAN-ish facts about server configuration, so the browser bundle can say only what is true
// (never a secret: just which checkout provider is wired up and whether analytics has a destination).
const realValue = (v) => Boolean(v) && !/xxx|^\*+$|your-/i.test(v);
const shopifyConnected = realValue(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) && realValue(process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN);
const checkoutProvider = realValue(process.env.STRIPE_SECRET_KEY) ? 'stripe' : shopifyConnected ? 'shopify' : 'demo';
const analyticsEnabled = (realValue(process.env.NEXT_PUBLIC_ANALYTICS_ID) && realValue(process.env.GA_API_SECRET)) || realValue(process.env.ANALYTICS_WEBHOOK_URL);
// While the placeholder catalogue is live (no Shopify store) nothing should be indexed, on any route.
const noindex = isPreview || !shopifyConnected;

if (!process.env.NEXT_PUBLIC_SITE_URL && !process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.NODE_ENV === 'production') {
  console.warn('[a3gk] NEXT_PUBLIC_SITE_URL is not set: canonical URLs, Open Graph URLs and the sitemap will point at http://localhost:3000.');
}

const ONE_DAY = 60 * 60 * 24;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  env: { NEXT_PUBLIC_SITE_URL: siteUrl, NEXT_PUBLIC_CHECKOUT_PROVIDER: checkoutProvider, NEXT_PUBLIC_ANALYTICS_ENABLED: analyticsEnabled ? 'true' : '' },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 4,
    qualities: [60, 75, 85],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },

  experimental: {
    optimizePackageImports: ['framer-motion', '@react-three/drei', 'swr'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders({ isDev }), ...(noindex ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : [])],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_DAY * 7}` }],
      },
      {
        source: '/3d-models/:path*',
        headers: [{ key: 'Cache-Control', value: `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_DAY * 7}` }],
      },
      {
        source: '/draco/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // The service-less PWA manifest / icons change rarely
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: `public, max-age=${ONE_DAY * 7}` }],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/shop', destination: '/products', permanent: true },
      { source: '/collections/all', destination: '/products', permanent: true },
      { source: '/collections/:handle', destination: '/products?category=:handle', permanent: false },
      { source: '/checkout', destination: '/cart/checkout', permanent: false },
    ];
  },
};

module.exports = nextConfig;
