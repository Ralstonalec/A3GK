/**
 * Security headers + Content-Security-Policy generation.
 *
 * Written as CommonJS on purpose: it is required by next.config.js (which runs
 * in plain Node) AND imported by proxy.js / tests (bundled by Next).
 *
 * Why no nonce?  With the WEBPACK build (`next build --webpack`, see package.json)
 * the Pages Router emits no executable inline <script> — only `application/json`
 * data blocks — so `script-src 'self'` is enough and pages stay statically
 * cacheable on the CDN.  (Turbopack injects an inline chunk-list bootstrap whose
 * content differs per route, which a static CSP cannot allow.)  `style-src 'unsafe-inline'` is
 * required because React renders `style=""` attributes during SSR; script
 * execution — the dangerous part — stays locked down.
 */

/** @param {string|undefined} value */
function originOf(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** @param {string|undefined} list space/comma separated origins */
function parseOrigins(list) {
  return (list || '')
    .split(/[\s,]+/)
    .map((v) => originOf(v.trim()))
    .filter(Boolean);
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

/**
 * @param {{ isDev?: boolean, env?: Record<string, string|undefined> }} [options]
 * @returns {string}
 */
function buildCsp({ isDev = false, env = process.env } = {}) {
  const apiOrigin = originOf(env.NEXT_PUBLIC_API_URL);
  const heroVideo = originOf(env.NEXT_PUBLIC_HERO_VIDEO_URL);
  const mediaHosts = parseOrigins(env.CSP_MEDIA_HOSTS);

  const directives = {
    'default-src': ["'self'"],
    // Dev only: React Refresh / HMR need eval + inline bootstrap scripts.
    'script-src': unique(["'self'", 'https://js.stripe.com', isDev && "'unsafe-eval'", isDev && "'unsafe-inline'"]),
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://cdn.shopify.com'],
    'font-src': ["'self'", 'data:'],
    'media-src': unique(["'self'", 'blob:', 'https://cdn.shopify.com', heroVideo, ...mediaHosts]),
    'connect-src': unique([
      "'self'",
      'blob:',
      'data:',
      'https://api.stripe.com',
      'https://m.stripe.network',
      apiOrigin,
      isDev && 'ws:',
      isDev && 'wss:',
    ]),
    'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com'],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://checkout.stripe.com'],
    'frame-ancestors': ["'none'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  if (!isDev) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

/**
 * @param {{ isDev?: boolean, env?: Record<string, string|undefined> }} [options]
 * @returns {{ key: string, value: string }[]}
 */
function securityHeaders(options = {}) {
  const { isDev = false } = options;
  const headers = [
    { key: 'Content-Security-Policy', value: buildCsp(options) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value:
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=(), browsing-topics=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ];
  if (!isDev) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }
  return headers;
}

module.exports = { buildCsp, securityHeaders, originOf, parseOrigins };
