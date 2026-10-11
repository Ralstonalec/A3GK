const { securityHeaders } = require('./lib/security');

const isDev = process.env.NODE_ENV !== 'production';

// Canonical origin, inlined at build time so server and browser agree.
// Vercel exposes the production domain as VERCEL_PROJECT_PRODUCTION_URL.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

// Preview deployments must never be indexed.
const isPreview = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== 'production';

const ONE_DAY = 60 * 60 * 24;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  env: { NEXT_PUBLIC_SITE_URL: siteUrl },

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
        headers: [...securityHeaders({ isDev }), ...(isPreview ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : [])],
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
