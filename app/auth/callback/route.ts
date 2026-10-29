import { NextResponse, type NextRequest } from 'next/server';
import { allow, clientIp } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';

const ALLOWED_NEXT = new Set(['/account']);

/** Base for redirects: the configured site URL when set, otherwise the request's own origin. */
function baseUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try { return new URL(configured).origin; } catch { /* fall through */ }
  }
  return new URL(request.url).origin;
}

/** Email confirmation, magic-link and password-reset links land here. */
export async function GET(request: NextRequest) {
  const base = baseUrl(request);
  if (!allow(`callback:${clientIp(request.headers)}`, 20, 60_000).ok) return new NextResponse('Too many requests', { status: 429, headers: { 'Retry-After': '60' } });
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const requested = searchParams.get('next') ?? '/account';
  const next = ALLOWED_NEXT.has(requested) ? requested : '/account';
  if (supabaseConfigured && code) {
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${next}`);
  }
  return NextResponse.redirect(`${base}/login?error=link`);
}
