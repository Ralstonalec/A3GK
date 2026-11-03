import { PLACEHOLDER_PRODUCTS, PRODUCT_METAFIELDS } from './content';
import type { Cart, Product } from './types';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const version = process.env.SHOPIFY_API_VERSION ?? '2025-01';

export const shopifyConfigured = Boolean(domain && token);

/** Prices and carts in a visitor's market: adds Shopify's @inContext(country) to an operation that takes parameters. */
const inCountry = (q: string) => q.replace(/^(query|mutation)\s*\(([^)]*)\)\s*\{/, '$1($2, $country: CountryCode) @inContext(country: $country) {');

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

const metafieldIds = PRODUCT_METAFIELDS.map((m) => `{ namespace: "${m.namespace}", key: "${m.key}" }`).join(', ');

const PRODUCT_FIELDS = `
  handle title descriptionHtml${metafieldIds ? `
  metafields(identifiers: [${metafieldIds}]) { namespace key value }` : ''}
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
  metafields?: ({ namespace: string; key: string; value: string } | null)[];
};

const normalise = (p: RawProduct): Product => ({
  handle: p.handle, title: p.title, descriptionHtml: p.descriptionHtml,
  options: p.options.filter((o) => o.name !== 'Title'),
  images: p.images.nodes, variants: p.variants.nodes, connected: true,
  metafields: Object.fromEntries((p.metafields ?? []).filter((m): m is NonNullable<typeof m> => Boolean(m)).map((m) => [`${m.namespace}.${m.key}`, m.value])),
});

/** A piece that is not (yet) available from Shopify, e.g. still a draft. Shown as unconnected, never as a 404. */
export const unavailable = (handle: string): Product => placeholder(handle) ?? { handle, title: handle, descriptionHtml: '', options: [], variants: [], images: [], connected: false };

function placeholder(handle: string): Product | null {
  const p = PLACEHOLDER_PRODUCTS[handle];
  if (!p) return null;
  return { handle, title: p.title, descriptionHtml: '', options: [], variants: [], images: [], connected: false };
}

export async function getProduct(handle: string, country?: string): Promise<Product | null> {
  if (!shopifyConfigured) return placeholder(handle);
  try {
    const data = await storefront<{ product: RawProduct | null }>(
      inCountry(`query($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`), { handle, country });
    return data.product ? normalise(data.product) : null;
  } catch (e) {
    console.error('[shopify] getProduct failed', e);
    return placeholder(handle);
  }
}

/** The first variant's price of a product in a market, as Shopify prices it there. Null when Shopify is not connected or has no price. */
export async function getLocalPrice(handle: string, country: string): Promise<{ amount: number; currency: string } | null> {
  if (!shopifyConfigured) return null;
  try {
    const d = await storefront<{ product: { variants: { nodes: { price: { amount: string; currencyCode: string } }[] } } | null }>(
      inCountry('query($handle: String!) { product(handle: $handle) { variants(first: 1) { nodes { price { amount currencyCode } } } } }'), { handle, country }, 600);
    const v = d.product?.variants.nodes[0]?.price;
    return v ? { amount: Number(v.amount), currency: v.currencyCode } : null;
  } catch (e) {
    console.error('[shopify] getLocalPrice failed', e);
    return null;
  }
}

/** A collection and its products (Storefront API). Returns null when Shopify is not connected or the collection does not exist. */
export async function getCollection(handle: string, first = 24): Promise<{ handle: string; title: string; description: string; products: Product[] } | null> {
  if (!shopifyConfigured) return null;
  try {
    const d = await storefront<{ collection: { handle: string; title: string; description: string; products: { nodes: RawProduct[] } } | null }>(
      `query($handle: String!, $first: Int!) { collection(handle: $handle) { handle title description products(first: $first) { nodes { ${PRODUCT_FIELDS} } } } }`,
      { handle, first });
    return d.collection ? { handle: d.collection.handle, title: d.collection.title, description: d.collection.description, products: d.collection.products.nodes.map(normalise) } : null;
  } catch (e) {
    console.error('[shopify] getCollection failed', e);
    return null;
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

export async function getCart(id: string, country?: string): Promise<Cart | null> {
  const d = await storefront<{ cart: RawCart | null }>(inCountry(`query($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`), { id, country }, 0);
  return d.cart ? toCart(d.cart) : null;
}

export async function addLines(cartId: string | null, lines: { merchandiseId: string; quantity: number }[], country?: string): Promise<Cart> {
  if (!cartId) {
    const d = await storefront<{ cartCreate: { cart: RawCart } }>(
      inCountry(`mutation($lines: [CartLineInput!], $buyer: CartBuyerIdentityInput) { cartCreate(input: { lines: $lines, buyerIdentity: $buyer }) { cart { ${CART_FIELDS} } } }`),
      { lines, buyer: country ? { countryCode: country } : undefined, country }, 0);
    return toCart(d.cartCreate.cart);
  }
  const d = await storefront<{ cartLinesAdd: { cart: RawCart } }>(
    inCountry(`mutation($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } } }`),
    { cartId, lines, country }, 0);
  return toCart(d.cartLinesAdd.cart);
}

export const addToCart = (cartId: string | null, merchandiseId: string, quantity: number, country?: string) => addLines(cartId, [{ merchandiseId, quantity }], country);

/** Moves an existing cart to another market, so its prices and checkout switch currency. */
export async function setCartCountry(cartId: string, country: string): Promise<Cart> {
  const d = await storefront<{ cartBuyerIdentityUpdate: { cart: RawCart } }>(
    inCountry(`mutation($cartId: ID!, $buyer: CartBuyerIdentityInput!) { cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyer) { cart { ${CART_FIELDS} } } }`),
    { cartId, buyer: { countryCode: country }, country }, 0);
  return toCart(d.cartBuyerIdentityUpdate.cart);
}

export async function updateLine(cartId: string, lineId: string, quantity: number, country?: string): Promise<Cart> {
  if (quantity <= 0) {
    const d = await storefront<{ cartLinesRemove: { cart: RawCart } }>(
      inCountry(`mutation($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } } }`),
      { cartId, lineIds: [lineId], country }, 0);
    return toCart(d.cartLinesRemove.cart);
  }
  const d = await storefront<{ cartLinesUpdate: { cart: RawCart } }>(
    inCountry(`mutation($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } } }`),
    { cartId, lines: [{ id: lineId, quantity }], country }, 0);
  return toCart(d.cartLinesUpdate.cart);
}
