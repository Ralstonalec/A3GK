import { PLACEHOLDER_PRODUCTS } from './content';
import type { Cart, Product } from './types';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const version = process.env.SHOPIFY_API_VERSION ?? '2025-01';

export const shopifyConfigured = Boolean(domain && token);

async function storefront<T>(query: string, variables: Record<string, unknown> = {}, revalidate = 60): Promise<T> {
  if (!domain || !token) throw new Error('Shopify is not configured');
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Shopify ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '));
  return json.data as T;
}

const PRODUCT_FIELDS = `
  handle title descriptionHtml
  options { name values }
  images(first: 12) { nodes { url altText } }
  variants(first: 100) { nodes {
    id title availableForSale
    selectedOptions { name value }
    price { amount currencyCode }
  } }
`;

type RawProduct = {
  handle: string; title: string; descriptionHtml: string;
  options: Product['options'];
  images: { nodes: Product['images'] };
  variants: { nodes: Product['variants'] };
};

const normalise = (p: RawProduct): Product => ({
  handle: p.handle, title: p.title, descriptionHtml: p.descriptionHtml,
  options: p.options.filter((o) => o.name !== 'Title'),
  images: p.images.nodes, variants: p.variants.nodes, connected: true,
});

/** A piece that is not (yet) available from Shopify, e.g. still a draft. Shown as unconnected, never as a 404. */
export const unavailable = (handle: string): Product => placeholder(handle) ?? { handle, title: handle, descriptionHtml: '', options: [], variants: [], images: [], connected: false };

function placeholder(handle: string): Product | null {
  const p = PLACEHOLDER_PRODUCTS[handle];
  if (!p) return null;
  return { handle, title: p.title, descriptionHtml: '', options: [], variants: [], images: [], connected: false };
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (!shopifyConfigured) return placeholder(handle);
  try {
    const data = await storefront<{ product: RawProduct | null }>(
      `query($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`, { handle });
    return data.product ? normalise(data.product) : null;
  } catch (e) {
    console.error('[shopify] getProduct failed', e);
    return placeholder(handle);
  }
}

// ---- Cart (called from /api/cart so the token never leaves the server) ----

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 50) { nodes {
    id quantity
    cost { totalAmount { amount currencyCode } }
    merchandise { ... on ProductVariant { id title product { title handle } } }
  } }
`;

type RawCart = Omit<Cart, 'lines'> & { lines: { nodes: Cart['lines'] } };
const toCart = (c: RawCart): Cart => ({ ...c, lines: c.lines.nodes });

export async function getCart(id: string): Promise<Cart | null> {
  const d = await storefront<{ cart: RawCart | null }>(`query($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id }, 0);
  return d.cart ? toCart(d.cart) : null;
}

export async function addLines(cartId: string | null, lines: { merchandiseId: string; quantity: number }[]): Promise<Cart> {
  if (!cartId) {
    const d = await storefront<{ cartCreate: { cart: RawCart } }>(
      `mutation($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ${CART_FIELDS} } } }`,
      { lines }, 0);
    return toCart(d.cartCreate.cart);
  }
  const d = await storefront<{ cartLinesAdd: { cart: RawCart } }>(
    `mutation($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } } }`,
    { cartId, lines }, 0);
  return toCart(d.cartLinesAdd.cart);
}

export const addToCart = (cartId: string | null, merchandiseId: string, quantity: number) => addLines(cartId, [{ merchandiseId, quantity }]);

export async function updateLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  if (quantity <= 0) {
    const d = await storefront<{ cartLinesRemove: { cart: RawCart } }>(
      `mutation($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } } }`,
      { cartId, lineIds: [lineId] }, 0);
    return toCart(d.cartLinesRemove.cart);
  }
  const d = await storefront<{ cartLinesUpdate: { cart: RawCart } }>(
    `mutation($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } } }`,
    { cartId, lines: [{ id: lineId, quantity }] }, 0);
  return toCart(d.cartLinesUpdate.cart);
}
