import { appendSetCookie, createHandler, parseBody, parseCookies, sendJson, serializeCookie } from '@/lib/api';
import { applyMockOp, applyShopifyOp, cartProvider } from '@/lib/cart-service';
import { emptyCart } from '@/lib/cart-core';
import { cartRequestSchema } from '@/lib/validation';
import * as shopify from '@/lib/shopify';

export const CART_COOKIE = 'a3gk_cart';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

const noStore = { 'Cache-Control': 'private, no-store' };

/** GET /api/cart – current Shopify cart (cookie) or an empty one in demo mode. */
async function get(req, res) {
  if (cartProvider() === 'shopify') {
    const cartId = parseCookies(req.headers.cookie)[CART_COOKIE];
    const cart = cartId ? await shopify.cartGet(cartId).catch(() => null) : null;
    return sendJson(res, 200, { cart: cart ? { ...cart, notices: [] } : emptyCart() }, noStore);
  }
  return sendJson(res, 200, { cart: emptyCart() }, noStore);
}

/**
 * POST /api/cart  { op: 'add'|'set'|'remove'|'clear'|'sync', ..., snapshot: [...] }
 * Returns the authoritative, re-priced cart. The browser applies the change
 * optimistically first and reconciles with this response.
 */
async function post(req, res) {
  const request = parseBody(cartRequestSchema, req.body);

  if (cartProvider() === 'shopify') {
    const cartId = parseCookies(req.headers.cookie)[CART_COOKIE];
    const { cart, cartId: nextId } = await applyShopifyOp(request, cartId);
    if (nextId && nextId !== cartId) {
      appendSetCookie(res, serializeCookie(CART_COOKIE, nextId, { maxAge: THIRTY_DAYS, httpOnly: true, sameSite: 'Lax' }));
    }
    return sendJson(res, 200, { cart }, noStore);
  }

  const { cart } = await applyMockOp(request);
  return sendJson(res, 200, { cart }, noStore);
}

export default createHandler({ GET: get, POST: post });
