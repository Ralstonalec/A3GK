import { NextResponse } from 'next/server';
import { clientIp, rateLimit, ruleFor } from '@/lib/rate-limit';

/**
 * Next.js 16 "proxy" (formerly middleware): rate-limits every /api request.
 * Security headers are applied statically by next.config.js (CDN-cheap).
 */
export async function proxy(request) {
  const rule = ruleFor(request.nextUrl.pathname);
  if (!rule || rule.skip) return NextResponse.next();

  const result = await rateLimit(clientIp(request.headers), rule);
  const headers = {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
  };

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests. Please slow down.' },
      { status: 429, headers: { ...headers, 'Retry-After': String(result.retryAfter) } },
    );
  }

  const response = NextResponse.next();
  for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
