'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { SHIPPING } from '@/lib/content';
import { formatMoney } from '@/lib/format';
import { Tbc } from './Tbc';

/** Estimates shipping for a destination and order total. Rates come from SHIPPING in lib/content.ts; unset rates show "To confirm". Final shipping is shown at checkout. */
export function ShippingCalculator({ fromCart = false }: { fromCart?: boolean }) {
  const { cart } = useCart();
  const [region, setRegion] = useState(SHIPPING.regions[0].id);
  const [typed, setTyped] = useState('');
  const r = SHIPPING.regions.find((x) => x.id === region) ?? SHIPPING.regions[0];
  const cartTotal = cart ? Number(cart.cost.subtotalAmount.amount) : 0;
  const total = !fromCart && typed !== '' ? Number(typed) || 0 : cartTotal;
  const free = r.freeOver !== null && total >= r.freeOver;
  const cost = r.rate === null ? null : free ? 0 : r.rate;

  return (
    <div className="glass rounded-2xl p-4">
      <p className="font-semibold">Shipping calculator</p>
      <div className={`mt-3 grid gap-3 ${fromCart ? '' : 'sm:grid-cols-2'}`}>
        <label className="block text-sm font-semibold">Ship to
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-[#10131a] px-3 text-base text-white">
            {SHIPPING.regions.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
        {!fromCart && <label className="block text-sm font-semibold">Order total ({SHIPPING.currency})
          <input inputMode="decimal" value={typed} onChange={(e) => setTyped(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={cartTotal ? cartTotal.toFixed(2) : 'e.g. 80'} className="mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-[#10131a] px-3 text-base text-white" />
        </label>}
      </div>
      <div className="mt-4 space-y-1 text-sm" aria-live="polite">
        <p>Shipping to {r.label}: {cost === null ? <Tbc label={`Shipping rate for ${r.label}`} /> : <strong>{cost === 0 ? 'Free' : formatMoney(String(cost), SHIPPING.currency)}</strong>}</p>
        {r.freeOver !== null && <p className="text-white/70">Free shipping on orders of {formatMoney(String(r.freeOver), SHIPPING.currency)} or more.</p>}
        <p>Delivery estimate: {r.eta ?? <Tbc label={`Delivery estimate for ${r.label}`} />}</p>
        <p className="text-white/60">Taxes and the final shipping amount are shown at checkout.</p>
      </div>
    </div>
  );
}
