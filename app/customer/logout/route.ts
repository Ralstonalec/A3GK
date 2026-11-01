import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, customerAccountConfigured, endpoints, siteOrigin } from '@/lib/customer-account';

export const dynamic = 'force-dynamic';

/** Clears the local session, then ends the Shopify session so the next sign-in asks again. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const idToken = request.cookies.get(COOKIE.idToken)?.value;
  let to = new URL('/', origin);
  if (customerAccountConfigured && idToken) {
    try {
      const { logout } = await endpoints();
      if (logout) {
        to = new URL(logout);
        to.searchParams.set('id_token_hint', idToken);
        to.searchParams.set('post_logout_redirect_uri', siteOrigin(origin));
      }
    } catch { /* fall back to the home page */ }
  }
  const res = NextResponse.redirect(to);
  for (const name of [COOKIE.access, COOKIE.refresh, COOKIE.idToken, COOKIE.oauth]) res.cookies.delete(name);
  return res;
}
