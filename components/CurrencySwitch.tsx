'use client';

import { MARKETS } from '@/lib/markets';
import { useCurrency } from '@/lib/currency-context';

/** Pick the region prices are shown for. Shopify prices and checks out in that market's currency. */
export function CurrencySwitch() {
  const { market, setMarket } = useCurrency();
  return (
    <label className="chrome flex h-12 items-center rounded-full pl-4 pr-2 text-sm font-bold">
      <span className="sr-only">Region and currency</span>
      <select
        value={market.id}
        onChange={(e) => setMarket(e.target.value)}
        className="h-full cursor-pointer appearance-none bg-transparent pr-5 text-sm font-bold text-white focus:outline-none"
        aria-label="Region and currency"
      >
        {MARKETS.map((m) => <option key={m.id} value={m.id} className="bg-[#10131a] text-white">{m.label} ({m.currency})</option>)}
      </select>
      <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className="-ml-4 mr-2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3.5l3 3 3-3" /></svg>
    </label>
  );
}
