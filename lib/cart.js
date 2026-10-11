import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { track, toItem } from './analytics';
import { apiUrl } from './config';
import { CART_LIMITS } from './store-terms';
import { addLine, emptyCart, lineKey, removeLine, setLineQuantity } from './cart-core';
import { calculateCustomPrice } from './pricing';
import { safeStorage } from './utils';

/**
 * Client cart state — optimistic UI with server reconciliation.
 *
 *  1. A user action updates the visible cart IMMEDIATELY (optimistic).
 *  2. The matching request is queued and sent to /api/cart, one at a time and
 *     in order, so the server never sees operations out of sequence.
 *  3. Each response is the authoritative, re-priced cart. While more
 *     operations are in flight the UI keeps its optimistic state; when the
 *     queue drains, the server cart replaces it (prices, stock, notices).
 *  4. If a request fails, the queue is dropped and the cart REVERTS to the
 *     last server-confirmed state with an error message.
 */

export const CART_STORAGE_KEY = 'a3gk.cart.v1';

/* ── Reducer (pure, exported for tests) ────────────────────────────────── */

export const initialState = {
  cart: emptyCart(),
  confirmed: emptyCart(),
  pending: 0,
  hydrated: false,
  drawerOpen: false,
  error: null,
  lastAddedId: null,
};

export function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, cart: action.cart, confirmed: action.cart, hydrated: true };
    case 'OPTIMISTIC':
      return { ...state, cart: action.cart, pending: state.pending + 1, error: null, lastAddedId: action.lastAddedId ?? state.lastAddedId };
    case 'CONFIRM': {
      const pending = Math.max(0, state.pending - 1);
      // Only adopt the server cart once nothing else is in flight, otherwise the UI would flicker backwards.
      return { ...state, confirmed: action.cart, cart: pending === 0 ? action.cart : state.cart, pending, hydrated: true };
    }
    case 'REVERT':
      return { ...state, cart: state.confirmed, pending: 0, error: action.error };
    case 'DRAWER':
      return { ...state, drawerOpen: action.open };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

/* ── Transport ─────────────────────────────────────────────────────────── */

export function toSnapshot(cart) {
  return cart.lines.map((l) => ({
    variantId: l.variantId,
    quantity: l.quantity,
    ...(l.customization ? { customization: l.customization } : {}),
    ...(l.designId ? { designId: l.designId } : {}),
  }));
}

export async function postCart(body, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetchImpl(apiUrl('/cart'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || 'Could not update your cart.');
    return json.cart;
  } finally {
    clearTimeout(timer);
  }
}

/* ── Optimistic line construction ──────────────────────────────────────── */

export function buildOptimisticLine({ product, variant, quantity = 1, customization, designId }) {
  const unitCents = customization
    ? calculateCustomPrice({ basePriceCents: variant.priceCents, config: customization, quantity }).discountedUnitCents
    : variant.priceCents;
  const image = product.featuredImage || product.images?.[0] || null;
  return {
    id: lineKey(variant.id, customization),
    variantId: variant.id,
    handle: product.handle,
    title: product.title,
    variantTitle: variant.title === 'Default Title' ? '' : variant.title,
    productType: product.productType,
    image: image ? { url: image.url, altText: image.altText || product.title } : null,
    unitCents,
    quantity,
    availableForSale: variant.availableForSale,
    maxQuantity: variant.quantityAvailable ?? null,
    selectedOptions: variant.selectedOptions,
    customization,
    designId,
    leadTimeDays: product.leadTimeDays || 0,
  };
}

/* ── Provider ──────────────────────────────────────────────────────────── */

const CartContext = createContext(null);

export function CartProvider({ children, onError }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const confirmedRef = useRef(state.confirmed);
  const cartRef = useRef(state.cart);
  const queueRef = useRef(Promise.resolve());
  const generationRef = useRef(0);
  const pendingRef = useRef(0);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  /*
   * The refs below are updated SYNCHRONOUSLY at every transition (not just on
   * render) so two quick clicks, or two queued requests, never read stale state.
   */
  const optimistic = useCallback((next, extra = {}) => {
    pendingRef.current += 1;
    cartRef.current = next;
    dispatch({ type: 'OPTIMISTIC', cart: next, ...extra });
  }, []);

  /** Send one operation; resolves after the server answered (or failed). */
  const enqueue = useCallback((request) => {
    const generation = generationRef.current;
    queueRef.current = queueRef.current.then(async () => {
      if (generation !== generationRef.current) return; // a prior failure dropped this op
      try {
        const cart = await postCart({ ...request, snapshot: toSnapshot(confirmedRef.current) });
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        confirmedRef.current = cart;
        if (pendingRef.current === 0) cartRef.current = cart;
        dispatch({ type: 'CONFIRM', cart });
      } catch (error) {
        generationRef.current += 1;
        pendingRef.current = 0;
        cartRef.current = confirmedRef.current;
        const message = error.name === 'AbortError' ? 'The request timed out. Please try again.' : error.message;
        dispatch({ type: 'REVERT', error: message });
        onErrorRef.current?.(message);
      }
    });
    return queueRef.current;
  }, []);

  /* Hydrate from localStorage immediately, then validate with the server. */
  useEffect(() => {
    const stored = safeStorage.get(CART_STORAGE_KEY);
    const local = stored && Array.isArray(stored.lines) ? { ...emptyCart(), ...stored } : emptyCart();
    confirmedRef.current = local;
    cartRef.current = local;
    dispatch({ type: 'HYDRATE', cart: local });
    // `sync` re-prices + validates (mock) or adopts the Shopify cart (cookie).
    optimistic(local);
    enqueue({ op: 'sync' });
  }, [enqueue, optimistic]);

  /* Persist the confirmed cart. */
  useEffect(() => {
    if (!state.hydrated) return;
    safeStorage.set(CART_STORAGE_KEY, state.confirmed);
  }, [state.confirmed, state.hydrated]);

  const addItem = useCallback(
    ({ product, variant, quantity = 1, customization, designId, openDrawer = true }) => {
      const line = buildOptimisticLine({ product, variant, quantity, customization, designId });
      const next = addLine(cartRef.current, line, CART_LIMITS.maxLineQuantity);
      optimistic(next, { lastAddedId: line.id });
      if (openDrawer) dispatch({ type: 'DRAWER', open: true });
      track('add_to_cart', { currency: 'USD', value: (line.unitCents * quantity) / 100, items: [toItem(product, variant, quantity)] });
      return enqueue({ op: 'add', line: { variantId: variant.id, quantity, ...(customization ? { customization } : {}), ...(designId ? { designId } : {}) } });
    },
    [enqueue, optimistic],
  );

  const setQuantity = useCallback(
    (lineId, quantity) => {
      optimistic(setLineQuantity(cartRef.current, lineId, quantity, CART_LIMITS.maxLineQuantity));
      return enqueue({ op: 'set', lineId, quantity });
    },
    [enqueue, optimistic],
  );

  const removeItem = useCallback(
    (lineId) => {
      const line = cartRef.current.lines.find((l) => l.id === lineId);
      optimistic(removeLine(cartRef.current, lineId));
      if (line) track('remove_from_cart', { currency: 'USD', value: (line.unitCents * line.quantity) / 100, items: [{ item_id: line.variantId, item_name: line.title, quantity: line.quantity }] });
      return enqueue({ op: 'remove', lineId });
    },
    [enqueue, optimistic],
  );

  const clear = useCallback(() => {
    optimistic(emptyCart());
    return enqueue({ op: 'clear' });
  }, [enqueue, optimistic]);

  /** Adopt a server-supplied cart (e.g. after a 409 `cart_changed` from checkout). */
  const adoptCart = useCallback((cart) => {
    confirmedRef.current = cart;
    cartRef.current = cart;
    pendingRef.current = 0;
    dispatch({ type: 'HYDRATE', cart });
  }, []);

  const openDrawer = useCallback(() => dispatch({ type: 'DRAWER', open: true }), []);
  const closeDrawer = useCallback(() => dispatch({ type: 'DRAWER', open: false }), []);

  const value = useMemo(
    () => ({
      cart: state.cart,
      lines: state.cart.lines,
      totalQuantity: state.cart.totalQuantity,
      subtotalCents: state.cart.subtotalCents,
      notices: state.confirmed.notices || [],
      isPending: state.pending > 0,
      hydrated: state.hydrated,
      error: state.error,
      lastAddedId: state.lastAddedId,
      drawerOpen: state.drawerOpen,
      addItem,
      setQuantity,
      removeItem,
      clear,
      adoptCart,
      openDrawer,
      closeDrawer,
    }),
    [state, addItem, setQuantity, removeItem, clear, adoptCart, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
