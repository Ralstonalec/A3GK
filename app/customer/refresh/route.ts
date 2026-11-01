import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, exchange, safeNext, sessionCookie } from '@/lib/customer-account';

export const dynamic = 'force-dynamic';

/** Swaps the refresh token for a new access token (cookies can only be set from a route), then returns to the page. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const refresh = request.cookies.get(COOKIE.refresh)?.value;
  const toLogin = () => {
    const res = NextResponse.redirect(new URL(`/customer/login?next=${encodeURIComponent(next)}`, origin));
    res.cookies.delete(COOKIE.access); res.cookies.delete(COOKIE.refresh);
    return res;
  };
  if (!refresh) return toLogin();
  try {
    const t = await exchange({ grant_type: 'refresh_token', refresh_token: refresh }, origin);
    const res = NextResponse.redirect(new URL(next, origin));
    res.cookies.set(COOKIE.access, t.access_token, sessionCookie(Math.max(60, t.expires_in - 30)));
    if (t.refresh_token) res.cookies.set(COOKIE.refresh, t.refresh_token, sessionCookie(60 * 60 * 24 * 30));
    return res;
  } catch {
    return toLogin();
  }
}
