'use client';

import { formatIn } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';

/**
 * A CAD price. In CAD it reads as before; in another currency it shows an approximate conversion first, then the CAD charge.
 * `showCode` adds the "CAD" label after the amount.
 */
export function Money({ cad, showCode = false, className }: { cad: number; showCode?: boolean; className?: string }) {
  const { convert, currency } = useCurrency();
  const other = convert(cad);
  const base = formatIn(cad, 'CAD');
  if (!other) return <span className={className}>{base}{showCode && <span className="text-white/55"> CAD</span>}</span>;
  return (
    <span className={className}>
      <span aria-label={`about ${other} ${currency}`}>≈ {other}</span>
      <span className="text-white/55"> ({base} CAD)</span>
    </span>
  );
}

/** One line under prices: says the conversion is a guide and checkout is in CAD. Renders nothing in CAD. */
export function CurrencyNote({ className = '' }: { className?: string }) {
  const { currency, live } = useCurrency();
  if (currency === 'CAD') return null;
  return <p className={`text-xs text-white/60 ${className}`}>Prices in {currency} are approximate{live ? '' : ' (estimated rates)'}. You are charged in CAD at checkout.</p>;
}
