'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Cart } from './types';

type Ctx = {
  cart: Cart | null;
  open: boolean;
  busy: boolean;
  error: string | null;
  setOpen: (v: boolean) => void;
  add: (merchandiseId: string, quantity: number) => Promise<void>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = 'a3gk.cartId';

const safeGet = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const safeSet = (v: string | null) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* storage unavailable */ } };

async function call(body: object): Promise<{ cart: Cart | null; error?: string }> {
  const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { cart: null, error: json.error ?? 'Something went wrong.' };
  return json;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = safeGet();
    if (!id) return;
    call({ action: 'get', cartId: id }).then(({ cart }) => {
      if (cart) setCart(cart); else safeSet(null);
    });
  }, []);

  const run = useCallback(async (body: object) => {
    setBusy(true); setError(null);
    const { cart: next, error } = await call(body);
    setBusy(false);
    if (error || !next) { setError(error ?? 'Could not update your cart.'); return false; }
    setCart(next); safeSet(next.id);
    return true;
  }, []);

  const add = useCallback(async (merchandiseId: string, quantity: number) => {
    if (await run({ action: 'add', cartId: cart?.id ?? null, merchandiseId, quantity })) setOpen(true);
  }, [cart, run]);

  const setQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (cart) await run({ action: 'update', cartId: cart.id, lineId, quantity });
  }, [cart, run]);

  const value = useMemo(() => ({ cart, open, busy, error, setOpen, add, setQuantity }), [cart, open, busy, error, add, setQuantity]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error('useCart must be used within CartProvider');
  return c;
}
