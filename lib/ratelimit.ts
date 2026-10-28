/**
 * Best-effort in-memory rate limiter. Serverless instances do not share memory, so this only slows a flood
 * aimed at one instance; real protection is the host firewall (see docs/RATE-LIMITS.md). No external service.
 */
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function allow(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return { ok: b.count <= max, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

/** Client address as set by the host's proxy (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
