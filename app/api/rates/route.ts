import { NextResponse } from 'next/server';
import { CURRENCIES } from '@/lib/markets';
import { FALLBACK_RATES, type Rates } from '@/lib/currency';

export const dynamic = 'force-dynamic'; // the fetch below is cached for twelve hours

/** European Central Bank reference rates via Frankfurter (free, no key). Only a fallback for markets Shopify cannot price yet. */
export async function GET() {
  const symbols = CURRENCIES.filter((c) => c !== 'CAD');
  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=CAD&symbols=${symbols.join(',')}`, { next: { revalidate: 43200 } });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const j = (await res.json()) as { date?: string; rates?: Record<string, number> };
    const rates: Rates = { CAD: 1 };
    for (const s of symbols) {
      const n = j.rates?.[s];
      if (typeof n !== 'number' || !(n > 0 && n < 20)) throw new Error('bad rates');
      rates[s] = n;
    }
    return NextResponse.json({ rates, date: j.date ?? null, live: true });
  } catch (e) {
    console.error('[rates]', e);
    return NextResponse.json({ rates: FALLBACK_RATES, date: null, live: false });
  }
}
