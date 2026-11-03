import { NextResponse } from 'next/server';
import { FALLBACK_RATES, type Rates } from '@/lib/currency';

export const dynamic = 'force-dynamic'; // the fetch below is cached for twelve hours

/** European Central Bank reference rates via Frankfurter (free, no key). Falls back to rough placeholders if unreachable. */
export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=CAD&symbols=USD,EUR,GBP', { next: { revalidate: 43200 } });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const j = (await res.json()) as { date?: string; rates?: Partial<Record<'USD' | 'EUR' | 'GBP', number>> };
    const r = j.rates ?? {};
    if (![r.USD, r.EUR, r.GBP].every((n) => typeof n === 'number' && n > 0 && n < 10)) throw new Error('bad rates');
    const rates: Rates = { CAD: 1, USD: r.USD!, EUR: r.EUR!, GBP: r.GBP! };
    return NextResponse.json({ rates, date: j.date ?? null, live: true });
  } catch (e) {
    console.error('[rates]', e);
    return NextResponse.json({ rates: FALLBACK_RATES, date: null, live: false });
  }
}
