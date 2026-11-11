'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { HANDLES } from '@/lib/content';
import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/format';
import { salesOpen } from '@/lib/flags';
import { ShippingCalculator } from './ShippingCalculator';

export function CartDrawer() {
  const { cart, open, setOpen, setQuantity, busy, error } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    // Remember what opened the cart (the Add to cart button is disabled while it adds, so it may not hold focus; the header cart button is the fallback), keep Tab inside it while it is open, and hand focus back on close.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (!inside || document.activeElement === last)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; (opener && opener !== document.body && opener.isConnected && !(opener as HTMLButtonElement).disabled ? opener : document.querySelector<HTMLElement>('[data-cart-button]'))?.focus(); };
  }, [open, setOpen]);
  if (!open) return null;
  const empty = !cart || cart.lines.length === 0;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your cart">
      <button aria-label="Close cart" tabIndex={-1} className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <aside ref={panelRef} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-charcoal-900 text-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase">Cart</h2>
          <button ref={closeRef} className="btn min-w-[48px]" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          {empty ? <p className="text-white/75">Your cart is empty. <Link href={`/products/${HANDLES.base}`} onClick={() => setOpen(false)} className="font-semibold text-white underline underline-offset-4">Shop the padded base layer</Link></p> : (
            <ul className="space-y-4">
              {cart!.lines.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
                  <div>
                    <p className="font-semibold">{l.merchandise.product.title}</p>
                    {l.merchandise.title !== 'Default Title' && <p className="text-sm text-white/55">{l.merchandise.title}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <button className="h-11 w-11 rounded-lg border border-white/25 disabled:opacity-50" disabled={busy} onClick={() => setQuantity(l.id, l.quantity - 1)} aria-label={`Decrease quantity of ${l.merchandise.product.title}`}>−</button>
                      <span className="w-6 text-center" aria-live="polite">{l.quantity}</span>
                      <button className="h-11 w-11 rounded-lg border border-white/25 disabled:opacity-50" disabled={busy || l.quantity >= 20} onClick={() => setQuantity(l.id, l.quantity + 1)} aria-label={`Increase quantity of ${l.merchandise.product.title}`}>+</button>
                      <button className="ml-2 min-h-[44px] px-2 text-sm text-white/70 underline underline-offset-4 disabled:opacity-50" disabled={busy} onClick={() => setQuantity(l.id, 0)} aria-label={`Remove ${l.merchandise.product.title} from cart`}>Remove</button>
                    </div>
                  </div>
                  <p className="font-semibold">{formatMoney(l.cost.totalAmount.amount, l.cost.totalAmount.currencyCode)}</p>
                </li>
              ))}
            </ul>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        </div>
        {!empty && (
          <div className="border-t pt-4">
            <div className="mb-1 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{formatMoney(cart!.cost.subtotalAmount.amount, cart!.cost.subtotalAmount.currencyCode)} <span className="text-sm font-normal text-white/55">{cart!.cost.subtotalAmount.currencyCode}</span></span>
            </div>
            <div className="my-3"><ShippingCalculator fromCart /></div>
            {salesOpen ? <a href={cart!.checkoutUrl} className="btn-primary w-full">Checkout</a> : <button className="btn-primary w-full" disabled>Checkout coming soon</button>}
          </div>
        )}
      </aside>
    </div>
  );
}
