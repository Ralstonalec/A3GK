import { NextResponse } from 'next/server';
import { marketForCountry } from '@/lib/markets';

export const dynamic = 'force-dynamic';

/** The visitor's market, from the country their host reports (Vercel sets x-vercel-ip-country). */
export async function GET(req: Request) {
  const country = req.headers.get('x-vercel-ip-country');
  const m = marketForCountry(country);
  return NextResponse.json({ country: country ?? null, market: m.id });
}
