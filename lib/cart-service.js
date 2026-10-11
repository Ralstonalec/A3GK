import { isShopifyConfigured } from './config';
import { CART_LIMITS } from './store-terms';
import { addLine, emptyCart, lineKey, removeLine, setLineQuantity, summarize, withLines } from './cart-core';
import { calculateCustomPrice } from './pricing';
import { resolveVariants } from './products';
import * as shopify from './shopify';

/**
 * Server-side cart logic.
 *
 *  mock provider    – STATELESS. The browser sends its current lines as a
 *                     `snapshot`; we re-price + validate them against the
 *                     catalogue and return the authoritative cart. Works on
 *                     any number of serverless instances with zero storage.
 *  shopify provider – Shopify's Cart API is the source of truth; the cart id
 *                     lives in an httpOnly cookie.
 */

export const cartProvider = () => (isShopifyConfigured() ? 'shopify' : 'mock');

function displayVariantTitle(variant) {
  return variant.title === 'Default Title' ? '' : variant.title;
}

/**
 * Validate + price raw line inputs against the authoritative catalogue.
 * @param {{ variantId: string, quantity: number, customization?: object, designId?: string }[]} inputs
 */
export async function priceLines(inputs) {
  const notices = [];
  const resolved = await resolveVariants(inputs.map((i) => i.variantId));
  const merged = new Map();

  for (const input of inputs) {
    const hit = resolved.get(input.variantId);
    if (!hit) {
      notices.push('An item is no longer available and was removed from your cart.');
      continue;
    }
    const { variant, product } = hit;
    const label = `${product.title}${displayVariantTitle(variant) ? ` (${displayVariantTitle(variant)})` : ''}`;
    if (!variant.availableForSale) {
      notices.push(`${label} is sold out and was removed from your cart.`);
      continue;
    }

    const customization = product.customizable ? input.customization : undefined;
    if (input.customization && !product.customizable) {
      notices.push(`${product.title} cannot be customised; the design was ignored.`);
    }

    const id = lineKey(input.variantId, customization);
    const previous = merged.get(id);
    const requested = (previous?.requested ?? 0) + input.quantity;
    merged.set(id, { id, input, variant, product, customization, requested, label });
  }

  const lines = [];
  for (const entry of merged.values()) {
    const { variant, product, customization, requested, label } = entry;
    const cap = Math.min(CART_LIMITS.maxLineQuantity, variant.quantityAvailable ?? Infinity);
    const quantity = Math.min(requested, cap);
    if (quantity < requested) {
      notices.push(
        cap === CART_LIMITS.maxLineQuantity
          ? `${label}: maximum ${cap} per order.`
          : `Only ${cap} of ${label} in stock — quantity adjusted.`,
      );
    }
    const unitCents = customization
      ? calculateCustomPrice({ basePriceCents: variant.priceCents, config: customization, quantity }).discountedUnitCents
      : variant.priceCents;

    lines.push({
      id: entry.id,
      variantId: variant.id,
      handle: product.handle,
      title: product.title,
      variantTitle: displayVariantTitle(variant),
      productType: product.productType,
      image: product.featuredImage ? { url: product.featuredImage.url, altText: product.featuredImage.altText || product.title } : null,
      unitCents,
      quantity,
      availableForSale: true,
      maxQuantity: Number.isFinite(cap) ? cap : null,
      selectedOptions: variant.selectedOptions,
      customization,
      designId: entry.input.designId,
      leadTimeDays: product.leadTimeDays || 0,
    });
  }
  return { lines, notices };
}

function toInputs(lines) {
  return lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, customization: l.customization, designId: l.designId }));
}

/** Apply one cart operation (stateless). */
export async function applyMockOp(request) {
  const { lines: current, notices: staleNotices } = await priceLines(request.snapshot || []);
  let cart = withLines({ ...emptyCart(), source: 'mock' }, current);

  switch (request.op) {
    case 'add': {
      const inputs = [...toInputs(cart.lines), request.line];
      const priced = await priceLines(inputs);
      return { cart: { ...withLines(cart, priced.lines), notices: [...staleNotices, ...priced.notices] } };
    }
    case 'set': {
      cart = setLineQuantity(cart, request.lineId, request.quantity, CART_LIMITS.maxLineQuantity);
      const priced = await priceLines(toInputs(cart.lines)); // re-price: quantity discounts change unit price
      return { cart: { ...withLines(cart, priced.lines), notices: [...staleNotices, ...priced.notices] } };
    }
    case 'remove':
      cart = removeLine(cart, request.lineId);
      return { cart: { ...cart, notices: staleNotices } };
    case 'clear':
      return { cart: { ...withLines(cart, []), notices: [] } };
    case 'sync':
    default:
      return { cart: { ...cart, notices: staleNotices } };
  }
}

/** Apply one cart operation against Shopify's Cart API. */
export async function applyShopifyOp(request, cartId) {
  const snapshotLines = request.snapshot || [];
  const recreate = async (extra = []) => shopify.cartCreate([...snapshotLines, ...extra]);

  let cart = cartId ? await shopify.cartGet(cartId).catch(() => null) : null;
  if (!cart) {
    // Missing/expired cart: rebuild it from the browser's snapshot. `set`/`remove`
    // reference line ids from the dead cart, so the rebuilt snapshot is returned as-is.
    if (request.op === 'add') cart = await recreate([request.line]);
    else if (request.op === 'clear') cart = await shopify.cartCreate([]);
    else cart = await recreate();
    return { cart: { ...cart, notices: [] }, cartId: cart.id };
  }

  switch (request.op) {
    case 'add':
      cart = await shopify.cartLinesAdd(cart.id, [request.line]);
      break;
    case 'set':
      cart = request.quantity <= 0
        ? await shopify.cartLinesRemove(cart.id, [request.lineId])
        : await shopify.cartLinesUpdate(cart.id, [{ id: request.lineId, quantity: request.quantity }]);
      break;
    case 'remove':
      cart = await shopify.cartLinesRemove(cart.id, [request.lineId]);
      break;
    case 'clear':
      if (cart.lines.length) cart = await shopify.cartLinesRemove(cart.id, cart.lines.map((l) => l.id));
      break;
    default:
      break;
  }
  return { cart: { ...cart, notices: [] }, cartId: cart.id };
}

export { summarize };
