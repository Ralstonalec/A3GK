'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { PIECES, PRICING } from '@/lib/content';
import { formatMoney } from '@/lib/format';
import type { Product, Variant } from '@/lib/types';

type Slot = 'top' | 'bottom';

const chip = (on: boolean, none = false) => `relative flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-accent ${on ? (none ? 'border-white/60 bg-white/15' : 'border-accent bg-accent text-ink') : 'border-white/20 bg-white/[0.05] hover:border-white/45'}`;

/** Pick the variant of one piece matching its chosen options (a piece with no options has one variant). */
function pickVariant(p: Product, sel: Record<string, string>): Variant | undefined {
  if (!p.options.length) return p.variants[0];
  if (p.options.some((o) => !sel[o.name])) return undefined;
  return p.variants.find((v) => v.selectedOptions.every((o) => sel[o.name] === o.value));
}

/**
 * Every piece is its own Shopify product, so any combination works: one top, one bottom, both, or either.
 * Each chosen piece goes to the cart as its own line, with its own size.
 */
export function KitBuilder({ products, h1 = false }: { products: Product[]; h1?: boolean }) {
  const Heading = h1 ? 'h1' : 'h2';
  const { addMany, busy, error } = useCart();
  const byHandle = useMemo(() => Object.fromEntries(products.map((p) => [p.handle, p])), [products]);
  const [choice, setChoice] = useState<Record<Slot, string | null>>({ top: null, bottom: null });
  const [sizes, setSizes] = useState<Record<string, Record<string, string>>>({});
  const [qty, setQty] = useState(1);
  const [tried, setTried] = useState(false);

  const chosen = (['top', 'bottom'] as Slot[]).map((s) => choice[s]).filter((h): h is string => Boolean(h)).map((h) => byHandle[h]).filter(Boolean);
  const picked = chosen.map((p) => ({ product: p, variant: pickVariant(p, sizes[p.handle] ?? {}) }));
  const allChosen = chosen.length > 0 && picked.every((x) => x.variant);
  const connected = picked.length > 0 && picked.every((x) => x.product.connected);
  const isBundle = chosen.length === 2;
  const bundleSaving = isBundle ? Math.max(0, PRICING.piece * 2 - PRICING.bundle) * qty : 0;
  const subtotal = picked.every((x) => x.variant) && picked.length ? picked.reduce((n, x) => n + Number(x.variant!.price.amount), 0) * qty : null;
  const total = subtotal === null ? null : subtotal - bundleSaving;
  const currency = picked[0]?.variant?.price.currencyCode;
  const soldOut = picked.some((x) => x.variant && !x.variant.availableForSale);

  async function onAdd() {
    setTried(true);
    if (!allChosen || soldOut) return;
    await addMany(picked.map((x) => ({ merchandiseId: x.variant!.id, quantity: qty })));
  }

  const group = (slot: Slot, title: string, items: readonly { handle: string; label: string; padding: string }[]) => (
    <fieldset>
      <legend className="mb-2 text-sm font-bold uppercase tracking-wider">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className={chip(choice[slot] === null, true)}>
          <input type="radio" name={slot} className="sr-only" checked={choice[slot] === null} onChange={() => setChoice((c) => ({ ...c, [slot]: null }))} />
          None
        </label>
        {items.map((it) => (
          <label key={it.handle} className={chip(choice[slot] === it.handle)}>
            <input type="radio" name={slot} className="sr-only" checked={choice[slot] === it.handle} onChange={() => setChoice((c) => ({ ...c, [slot]: it.handle }))} />
            {it.label}
          </label>
        ))}
      </div>
      {items.filter((it) => choice[slot] === it.handle).map((it) => {
        const p = byHandle[it.handle];
        return (
          <div key={it.handle} className="mt-3 space-y-3 border-l-2 border-white/20 pl-4">
            <p className="text-sm text-white/70"><strong className="text-white">Padding.</strong> {it.padding}</p>
            {p?.options.map((o) => (
              <label key={o.name} className="block text-sm font-semibold">{o.name}
                <select
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-white/20 bg-[#10131a] px-3 text-base text-white"
                  value={sizes[p.handle]?.[o.name] ?? ''}
                  onChange={(e) => setSizes((s) => ({ ...s, [p.handle]: { ...(s[p.handle] ?? {}), [o.name]: e.target.value } }))}
                >
                  <option value="">Choose {o.name.toLowerCase()}</option>
                  {o.values.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            ))}
            <p className="text-sm"><Link href={`/products/${it.handle}`} className="underline underline-offset-4">Details for the {it.label.toLowerCase()}</Link></p>
          </div>
        );
      })}
    </fieldset>
  );

  return (
    <div className="space-y-6" id="purchase">
      <div>
        <Heading className="font-display text-3xl font-bold uppercase">Build your kit</Heading>
        <p className="mt-2 text-white/75">Every piece is sold on its own. Choose a top, a bottom, or both, in any combination, each in its own size.</p>
        <p className="mt-2 text-sm font-semibold">${PRICING.piece} {PRICING.currency} per piece · top + bottom ${PRICING.bundle} {PRICING.currency}</p>
      </div>
      {group('top', 'Top', PIECES.tops)}
      {group('bottom', 'Bottom', PIECES.bottoms)}
      <Link href="/size-guide" className="inline-block text-sm font-semibold underline underline-offset-4">Size guide</Link>

      <div className="flex items-center gap-3">
        <label htmlFor="kit-qty" className="text-sm font-bold uppercase tracking-wider">Quantity</label>
        <div className="flex items-center border border-white/25 bg-white/[0.06]">
          <button type="button" className="h-12 w-12" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <input id="kit-qty" inputMode="numeric" className="h-12 w-12 bg-transparent text-center text-white" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value.replace(/\D/g, '')) || 1)))} />
          <button type="button" className="h-12 w-12" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
        </div>
      </div>

      <div className="space-y-1 text-sm" aria-live="polite">
        {picked.length === 0 && <p className="text-white/60">Choose at least one piece.</p>}
        {picked.map((x) => (
          <p key={x.product.handle} className="flex justify-between gap-4">
            <span>{x.product.title}{x.variant && x.variant.title !== 'Default Title' && x.variant.title !== 'Default' ? ` (${x.variant.title})` : ''}</span>
            <span>{x.variant ? formatMoney(x.variant.price.amount, x.variant.price.currencyCode) : '…'}</span>
          </p>
        ))}
        {bundleSaving > 0 && total !== null && currency && <p className="flex justify-between gap-4 text-accent"><span>Top + bottom bundle</span><span>−{formatMoney(String(bundleSaving), currency)}</span></p>}
        {total !== null && currency && <p className="flex justify-between gap-4 border-t border-white/15 pt-2 text-base font-semibold"><span>Total</span><span>{formatMoney(String(total), currency)} <span className="text-sm font-normal text-white/55">{currency}</span></span></p>}
        {picked.length > 0 && !connected && <p className="text-white/70">{isBundle ? `Top + bottom: $${PRICING.bundle} ${PRICING.currency} per kit${qty > 1 ? ` ($${PRICING.bundle * qty} for ${qty})` : ''}.` : `$${PRICING.piece} ${PRICING.currency} per piece.`}</p>}
        {soldOut && <p className="text-red-300">One of these pieces is sold out in that size.</p>}
      </div>

      <div>
        <button className="btn-primary w-full" disabled={busy || picked.length === 0 || !connected || soldOut} onClick={onAdd}>
          {picked.length > 0 && !connected ? 'Store not connected yet' : busy ? 'Adding…' : picked.length > 1 ? 'Add both pieces to cart' : 'Add to cart'}
        </button>
        {tried && picked.length > 0 && !allChosen && <p role="alert" className="mt-2 text-sm text-red-300">Please choose a size for each piece.</p>}
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
