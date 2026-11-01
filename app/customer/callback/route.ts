import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, exchange, jwtClaims, redirectUri, safeNext, sessionCookie } from '@/lib/customer-account';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const fail = (msg: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, origin));
    res.cookies.delete(COOKIE.oauth);
    return res;
  };
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  let saved: { state: string; nonce: string; verifier: string; next: string } | null = null;
  try { saved = JSON.parse(request.cookies.get(COOKIE.oauth)?.value ?? 'null'); } catch { saved = null; }
  if (!code || !state || !saved || saved.state !== state) return fail('Sign-in could not be verified. Please try again.');
  try {
    const t = await exchange({ grant_type: 'authorization_code', redirect_uri: redirectUri(origin), code, code_verifier: saved.verifier }, origin);
    if (t.id_token && jwtClaims(t.id_token).nonce !== saved.nonce) return fail('Sign-in could not be verified. Please try again.');
    const res = NextResponse.redirect(new URL(safeNext(saved.next), origin));
    res.cookies.set(COOKIE.access, t.access_token, sessionCookie(Math.max(60, t.expires_in - 30)));
    if (t.refresh_token) res.cookies.set(COOKIE.refresh, t.refresh_token, sessionCookie(60 * 60 * 24 * 30));
    if (t.id_token) res.cookies.set(COOKIE.idToken, t.id_token, sessionCookie(60 * 60 * 24 * 30));
    res.cookies.delete(COOKIE.oauth);
    return res;
  } catch (e) {
    console.error('[customer-account] callback failed', e);
    return fail('Store sign-in failed. Please try again.');
  }
}
