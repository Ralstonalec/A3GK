'use client';

import { CURRENCIES, isCurrency } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';

/** Pick the currency prices are shown in. Display only: orders are charged in CAD. */
export function CurrencySwitch() {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="glass flex h-12 items-center rounded-full pl-4 pr-2 text-sm font-bold">
      <span className="sr-only">Show prices in</span>
      <select
        value={currency}
        onChange={(e) => { if (isCurrency(e.target.value)) setCurrency(e.target.value); }}
        className="h-full cursor-pointer appearance-none bg-transparent pr-5 text-sm font-bold text-white focus:outline-none"
        aria-label="Show prices in"
      >
        {CURRENCIES.map((c) => <option key={c} value={c} className="bg-[#10131a] text-white">{c}</option>)}
      </select>
      <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className="-ml-4 mr-2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3.5l3 3 3-3" /></svg>
    </label>
  );
}
