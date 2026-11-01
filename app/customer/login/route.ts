import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, challengeFor, customerAccountConfigured, endpoints, randomString, redirectUri, safeNext, sessionCookie } from '@/lib/customer-account';

export const dynamic = 'force-dynamic';

/** Starts the Shopify sign-in: builds the PKCE challenge, remembers it in a short-lived cookie, and sends the customer to Shopify. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!customerAccountConfigured) return NextResponse.redirect(new URL('/login', origin));
  try {
    const { authorization } = await endpoints();
    const verifier = randomString(48);
    const state = randomString(16);
    const nonce = randomString(16);
    const url = new URL(authorization);
    url.searchParams.set('client_id', process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ?? '');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri(origin));
    url.searchParams.set('scope', 'openid email customer-account-api:full');
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('code_challenge', await challengeFor(verifier));
    url.searchParams.set('code_challenge_method', 'S256');
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE.oauth, JSON.stringify({ state, nonce, verifier, next: safeNext(request.nextUrl.searchParams.get('next')) }), sessionCookie(600));
    return res;
  } catch (e) {
    console.error('[customer-account] login failed', e);
    return NextResponse.redirect(new URL('/login?error=Store%20sign-in%20is%20unavailable%20right%20now', origin));
  }
}
