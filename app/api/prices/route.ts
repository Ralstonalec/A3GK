import { NextResponse } from 'next/server';
import { HANDLES } from '@/lib/content';
import { MARKETS } from '@/lib/markets';
import { getLocalPrice } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

/** What one piece costs in a market, straight from Shopify (so it matches checkout). `piece` is null when Shopify has no local price. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('market');
  const m = MARKETS.find((x) => x.id === id);
  if (!m) return NextResponse.json({ error: 'Unknown market' }, { status: 400 });
  const p = await getLocalPrice(HANDLES.longTop, m.country);
  const ok = p && p.currency === m.currency;
  return NextResponse.json({ currency: m.currency, piece: ok ? p.amount : null }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } });
}
