'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/types';
import { Tbc } from './Tbc';

export function PurchasePanel({ product, sizeGuide = true, preorderNote }: { product: Product; sizeGuide?: boolean; preorderNote?: string | null }) {
  const { add, busy, error } = useCart();
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [tried, setTried] = useState(false);

  const variant = useMemo(() => {
    if (!product.options.length) return product.variants[0];
    if (product.options.some((o) => !sel[o.name])) return undefined;
    return product.variants.find((v) => v.selectedOptions.every((o) => sel[o.name] === o.value));
  }, [product, sel]);

  const valueAvailable = (name: string, value: string) =>
    product.variants.some((v) => v.availableForSale && v.selectedOptions.some((o) => o.name === name && o.value === value)
      && v.selectedOptions.every((o) => o.name === name || !sel[o.name] || sel[o.name] === o.value));

  const missing = product.options.filter((o) => !sel[o.name]).map((o) => o.name.toLowerCase());
  const price = variant?.price ?? product.variants[0]?.price;
  const ready = product.connected && variant?.availableForSale;

  async function onAdd() {
    setTried(true);
    if (!variant || !variant.availableForSale) return;
    await add(variant.id, qty);
  }

  return (
    <div className="space-y-5" id="purchase">
      <h1 className="font-display text-3xl font-bold uppercase">{product.title}</h1>
      <p className="text-2xl font-semibold" aria-live="polite">
        {price ? <>{formatMoney(price.amount, price.currencyCode)} <span className="text-sm font-normal text-white/55">{price.currencyCode}</span></> : <Tbc label="Retail price and currency" />}
      </p>

      {product.options.map((o) => (
        <fieldset key={o.name}>
          <legend className="mb-2 text-sm font-bold uppercase tracking-wider">
            {o.name}{sel[o.name] && <span className="ml-2 font-normal normal-case text-white/55">{sel[o.name]}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {o.values.map((val) => {
              const ok = valueAvailable(o.name, val);
              const checked = sel[o.name] === val;
              return (
                <label key={val} className={`relative flex min-h-[48px] min-w-[56px] cursor-pointer items-center justify-center border px-4 text-sm font-semibold ${checked ? 'border-accent bg-accent text-ink' : 'border-white/25 bg-white/[0.06]'} ${ok ? '' : 'opacity-50'}`}>
                  <input type="radio" name={o.name} value={val} checked={checked} onChange={() => setSel((s) => ({ ...s, [o.name]: val }))} className="sr-only" />
                  <span className={ok ? '' : 'line-through'}>{val}</span>
                  {!ok && <span className="sr-only"> (sold out)</span>}
                </label>
              );
            })}
          </div>
          {o.values.some((v) => !valueAvailable(o.name, v)) && <p className="mt-1 text-xs text-white/55">Struck-through options are sold out.</p>}
        </fieldset>
      ))}

      {sizeGuide && <Link href="/size-guide" className="inline-block text-sm font-semibold underline underline-offset-4">Size guide</Link>}

      <div className="flex items-center gap-3">
        <label htmlFor={`qty-${product.handle}`} className="text-sm font-bold uppercase tracking-wider">Quantity</label>
        <div className="flex items-center border border-white/25 bg-white/[0.06]">
          <button type="button" className="h-12 w-12" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <input id={`qty-${product.handle}`} inputMode="numeric" className="h-12 w-12 bg-transparent text-center text-white" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value.replace(/\D/g, '')) || 1)))} />
          <button type="button" className="h-12 w-12" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
        </div>
      </div>

      <div className="text-sm">
        {product.connected
          ? variant ? <p>{variant.availableForSale ? 'In stock' : 'Sold out'}</p> : <p className="text-white/55">Choose {missing.join(' and ')} to see availability.</p>
          : <Tbc label="Stock, preorder or made-to-order status" />}
        {preorderNote && <p className="mt-1 font-semibold">{preorderNote}</p>}
      </div>

      <div>
        <button className="btn-primary w-full" disabled={busy || (product.connected && variant ? !variant.availableForSale : false) || !product.connected} onClick={onAdd}>
          {!product.connected ? 'Store not connected yet' : busy ? 'Adding…' : 'Add to cart'}
        </button>
        {tried && !variant && missing.length > 0 && <p role="alert" className="mt-2 text-sm text-red-300">Please choose {missing.join(' and ')} first.</p>}
        {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      </div>

      <p className="text-sm text-white/75">
        <Link className="underline underline-offset-4" href="/help#shipping">Shipping information</Link>
        {' · '}
        <Link className="underline underline-offset-4" href="/help#returns">Returns information</Link>
      </p>
    </div>
  );
}
