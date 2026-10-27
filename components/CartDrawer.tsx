'use client';

import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/format';

export function CartDrawer() {
  const { cart, open, setOpen, setQuantity, busy, error } = useCart();
  if (!open) return null;
  const empty = !cart || cart.lines.length === 0;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your cart">
      <button aria-label="Close cart" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-charcoal-900 text-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase">Cart</h2>
          <button className="btn min-w-[48px]" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          {empty ? <p className="text-white/75">Your cart is empty.</p> : (
            <ul className="space-y-4">
              {cart!.lines.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
                  <div>
                    <p className="font-semibold">{l.merchandise.product.title}</p>
                    {l.merchandise.title !== 'Default Title' && <p className="text-sm text-white/55">{l.merchandise.title}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <button className="h-10 w-10 border" disabled={busy} onClick={() => setQuantity(l.id, l.quantity - 1)} aria-label="Decrease quantity">−</button>
                      <span className="w-6 text-center" aria-live="polite">{l.quantity}</span>
                      <button className="h-10 w-10 border" disabled={busy} onClick={() => setQuantity(l.id, l.quantity + 1)} aria-label="Increase quantity">+</button>
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
              <span>{formatMoney(cart!.cost.subtotalAmount.amount, cart!.cost.subtotalAmount.currencyCode)}</span>
            </div>
            <p className="mb-3 text-xs text-white/55">Shipping and taxes are calculated at checkout.</p>
            <a href={cart!.checkoutUrl} className="btn-primary w-full">Checkout</a>
          </div>
        )}
      </aside>
    </div>
  );
}
