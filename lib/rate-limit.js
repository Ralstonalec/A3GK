import { kvIncrWindow, kvSweepMemory } from './kv';

/**
 * Fixed-window rate limiter backed by lib/kv (Redis when configured).
 * Fails OPEN if the store is unreachable — availability beats strictness.
 *
 * @param {string} identifier  usually client IP
 * @param {{ name: string, limit: number, windowSeconds: number }} rule
 */
export async function rateLimit(identifier, { name, limit, windowSeconds }) {
  if (Math.random() < 0.01) kvSweepMemory();
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rl:${name}:${identifier}:${bucket}`;
  try {
    const { count, ttl } = await kvIncrWindow(key, windowSeconds);
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfter: ttl,
    };
  } catch (error) {
    console.warn('[rate-limit] store unavailable, failing open:', error.message);
    return { allowed: true, limit, remaining: limit, retryAfter: 0 };
  }
}

/** Route-prefix → rule. First match wins; webhooks are authenticated by signature instead. */
export const RATE_RULES = [
  { prefix: '/api/webhooks/', skip: true },
  { prefix: '/api/checkout', name: 'checkout', limit: 10, windowSeconds: 60 },
  { prefix: '/api/customizer', name: 'customizer', limit: 30, windowSeconds: 60 },
  { prefix: '/api/analytics', name: 'analytics', limit: 120, windowSeconds: 60 },
  { prefix: '/api/cart', name: 'cart', limit: 90, windowSeconds: 60 },
  { prefix: '/api/', name: 'api', limit: 120, windowSeconds: 60 },
];

export function ruleFor(pathname) {
  return RATE_RULES.find((r) => pathname.startsWith(r.prefix)) || null;
}

/** Best-effort client IP on Vercel and behind generic proxies. */
export function clientIp(headers) {
  const get = (name) => (typeof headers.get === 'function' ? headers.get(name) : headers[name]);
  const forwarded = get('x-forwarded-for');
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return String(get('x-real-ip') || 'unknown');
}
