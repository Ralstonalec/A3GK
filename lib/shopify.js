import crypto from 'node:crypto';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';
import { isShopifyConfigured, publicConfig, SHOPIFY_API_VERSION } from './config';
import { toCents } from './utils';

/**
 * Shopify Storefront API integration (server-side).
 *
 *   ├─ Client initialisation (Apollo Client, per-process singleton)
 *   ├─ Product queries            → normalised product objects
 *   ├─ Cart mutations             → normalised cart + error handling
 *   ├─ Checkout generation        → cart.checkoutUrl
 *   └─ Webhook validation         → verifyShopifyWebhook()
 *
 * Responses are normalised to the exact shape lib/mock-catalog.js produces, so
 * the rest of the app never knows which source it is talking to.
 */

export class ShopifyError extends Error {
  constructor(message, { userErrors = [], cause } = {}) {
    super(message, { cause });
    this.name = 'ShopifyError';
    this.userErrors = userErrors;
  }
}

/* ── Client ────────────────────────────────────────────────────────────── */

let client;

export function storefrontEndpoint() {
  return `https://${publicConfig.shopifyDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

/**
 * @param {{ fetch?: typeof fetch }} [overrides] inject fetch in tests
 */
export function getShopifyClient(overrides = {}) {
  if (!isShopifyConfigured()) throw new ShopifyError('Shopify is not configured');
  if (client && !overrides.fetch) return client;
  const instance = new ApolloClient({
    // Server-side only: never cache in-process, Redis (lib/kv) is the cache layer.
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: storefrontEndpoint(),
      fetch: overrides.fetch,
      headers: {
        'X-Shopify-Storefront-Access-Token': publicConfig.shopifyStorefrontToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }),
    defaultOptions: {
      query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
      mutate: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
    },
  });
  if (!overrides.fetch) client = instance;
  return instance;
}

export function resetShopifyClient() {
  client = undefined;
}

function throwIfErrors(result, label) {
  const errors = result.error?.errors || result.errors || (result.error ? [result.error] : null);
  if (errors && errors.length) {
    throw new ShopifyError(`${label}: ${errors.map((e) => e.message).join('; ')}`, { cause: result.error });
  }
}

export async function storefrontQuery(query, variables = {}, overrides = {}) {
  const result = await getShopifyClient(overrides).query({ query, variables });
  throwIfErrors(result, 'Storefront query failed');
  return result.data;
}

export async function storefrontMutate(mutation, variables = {}, overrides = {}) {
  const result = await getShopifyClient(overrides).mutate({ mutation, variables });
  throwIfErrors(result, 'Storefront mutation failed');
  return result.data;
}

/* ── Fragments + queries ───────────────────────────────────────────────── */

const MONEY = 'amount currencyCode';
const IMAGE = 'url altText width height';

export const PRODUCT_FIELDS = `
  id handle title description descriptionHtml vendor productType tags availableForSale
  priceRange { minVariantPrice { ${MONEY} } maxVariantPrice { ${MONEY} } }
  compareAtPriceRange { minVariantPrice { amount } }
  featuredImage { ${IMAGE} }
  images(first: 10) { nodes { ${IMAGE} } }
  options { name values }
  variants(first: 100) {
    nodes {
      id title sku availableForSale quantityAvailable
      price { ${MONEY} } compareAtPrice { amount }
      selectedOptions { name value }
    }
  }
  media(first: 10) {
    nodes {
      __typename
      ... on Model3d { sources { url mimeType format } }
    }
  }
  seo { title description }
  featuresMeta: metafield(namespace: "a3gk", key: "features") { value }
  specsMeta: metafield(namespace: "a3gk", key: "specs") { value }
  customizableMeta: metafield(namespace: "a3gk", key: "customizable") { value }
  leadTimeMeta: metafield(namespace: "a3gk", key: "lead_time_days") { value }
`;

export const PRODUCTS_QUERY = gql`
  query Products($first: Int!, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
      nodes { ${PRODUCT_FIELDS} }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = gql`
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

export const HANDLES_QUERY = gql`
  query Handles($first: Int!) {
    products(first: $first) { nodes { handle } }
  }
`;

export const VARIANTS_QUERY = gql`
  query Variants($ids: [ID!]!) {
    nodes(ids: $ids) {
      __typename
      ... on ProductVariant {
        id title sku availableForSale quantityAvailable
        price { ${MONEY} } compareAtPrice { amount }
        selectedOptions { name value }
        product {
          id handle title productType tags
          featuredImage { ${IMAGE} }
          leadTimeMeta: metafield(namespace: "a3gk", key: "lead_time_days") { value }
          customizableMeta: metafield(namespace: "a3gk", key: "customizable") { value }
        }
      }
    }
  }
`;

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } }
  lines(first: 100) {
    nodes {
      id quantity
      attributes { key value }
      cost { totalAmount { amount } amountPerQuantity { amount } }
      merchandise {
        ... on ProductVariant {
          id title availableForSale quantityAvailable
          selectedOptions { name value }
          image { ${IMAGE} }
          product { handle title productType }
        }
      }
    }
  }
`;

const USER_ERRORS = 'userErrors { field message code }';

export const CART_QUERY = gql`query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`;
export const CART_CREATE = gql`mutation CartCreate($input: CartInput!) { cartCreate(input: $input) { cart { ${CART_FIELDS} } ${USER_ERRORS} } }`;
export const CART_LINES_ADD = gql`mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } ${USER_ERRORS} } }`;
export const CART_LINES_UPDATE = gql`mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } ${USER_ERRORS} } }`;
export const CART_LINES_REMOVE = gql`mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } ${USER_ERRORS} } }`;

/* ── Normalisers ───────────────────────────────────────────────────────── */

function parseJsonMeta(meta, fallback) {
  if (!meta || !meta.value) return fallback;
  try {
    return JSON.parse(meta.value);
  } catch {
    return fallback;
  }
}

export function categoryFor(productType = '', tags = []) {
  const tagged = tags.find((t) => t.toLowerCase().startsWith('category:'));
  if (tagged) return tagged.split(':')[1].trim().toLowerCase();
  const type = productType.toLowerCase();
  if (type.includes('care')) return 'accessories';
  if (type.includes('glove')) return 'gloves';
  if (/jersey|pant|short|kit|apparel|shirt|layer|top/.test(type)) return 'apparel';
  return 'accessories';
}

export function normalizeVariant(v) {
  return {
    id: v.id,
    title: v.title,
    sku: v.sku || '',
    priceCents: toCents(v.price?.amount),
    compareAtPriceCents: v.compareAtPrice?.amount ? toCents(v.compareAtPrice.amount) : null,
    availableForSale: Boolean(v.availableForSale),
    quantityAvailable: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null,
    selectedOptions: v.selectedOptions || [],
  };
}

export function normalizeProduct(node) {
  if (!node) return null;
  const images = (node.images?.nodes || []).map((i) => ({
    url: i.url, altText: i.altText || node.title, width: i.width || 1200, height: i.height || 1200,
  }));
  const featured = node.featuredImage
    ? { url: node.featuredImage.url, altText: node.featuredImage.altText || node.title, width: node.featuredImage.width || 1200, height: node.featuredImage.height || 1200 }
    : images[0] || null;
  const model3d = (node.media?.nodes || []).find((m) => m.__typename === 'Model3d');
  const glb = model3d?.sources?.find((s) => /glb|gltf/i.test(`${s.format} ${s.mimeType}`));
  const variants = (node.variants?.nodes || []).map(normalizeVariant);
  const cents = variants.map((v) => v.priceCents);
  const category = categoryFor(node.productType, node.tags);

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description || '',
    descriptionHtml: node.descriptionHtml || '',
    vendor: node.vendor || '',
    productType: node.productType || '',
    category,
    tags: node.tags || [],
    badges: [],
    availableForSale: Boolean(node.availableForSale),
    currencyCode: node.priceRange?.minVariantPrice?.currencyCode || 'USD',
    priceRange: {
      minCents: toCents(node.priceRange?.minVariantPrice?.amount) || Math.min(...cents, 0),
      maxCents: toCents(node.priceRange?.maxVariantPrice?.amount) || Math.max(...cents, 0),
    },
    compareAtMinCents: node.compareAtPriceRange?.minVariantPrice?.amount
      ? toCents(node.compareAtPriceRange.minVariantPrice.amount) || null
      : null,
    featuredImage: featured,
    images: images.length ? images : featured ? [featured] : [],
    options: (node.options || []).map((o) => ({ name: o.name, values: o.values })),
    variants,
    model: glb ? { url: glb.url } : null,
    viewer360: null,
    customizable: node.customizableMeta?.value === 'true',
    leadTimeDays: Number.parseInt(node.leadTimeMeta?.value || '0', 10) || 0,
    features: parseJsonMeta(node.featuresMeta, []),
    specs: parseJsonMeta(node.specsMeta, []),
    seo: { title: node.seo?.title || node.title, description: node.seo?.description || node.description || '' },
    createdOrder: 0,
  };
}

export function normalizeCart(cart) {
  if (!cart) return null;
  const lines = (cart.lines?.nodes || []).map((line) => {
    const m = line.merchandise || {};
    const attrs = Object.fromEntries((line.attributes || []).map((a) => [a.key, a.value]));
    return {
      id: line.id,
      variantId: m.id,
      handle: m.product?.handle,
      title: m.product?.title,
      variantTitle: m.title === 'Default Title' ? '' : m.title,
      image: m.image ? { url: m.image.url, altText: m.image.altText || m.product?.title } : null,
      unitCents: toCents(line.cost?.amountPerQuantity?.amount),
      quantity: line.quantity,
      availableForSale: m.availableForSale !== false,
      maxQuantity: typeof m.quantityAvailable === 'number' ? m.quantityAvailable : null,
      selectedOptions: m.selectedOptions || [],
      customization: attrs._customization ? safeParse(attrs._customization) : undefined,
      designId: attrs._design_id || undefined,
    };
  });
  return {
    id: cart.id,
    source: 'shopify',
    currencyCode: cart.cost?.totalAmount?.currencyCode || 'USD',
    lines,
    totalQuantity: cart.totalQuantity ?? lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: toCents(cart.cost?.subtotalAmount?.amount),
    checkoutUrl: cart.checkoutUrl || null,
  };
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/* ── Product API ───────────────────────────────────────────────────────── */

const SORT_KEYS = {
  featured: { sortKey: 'RELEVANCE', reverse: false },
  'price-asc': { sortKey: 'PRICE', reverse: false },
  'price-desc': { sortKey: 'PRICE', reverse: true },
  newest: { sortKey: 'CREATED_AT', reverse: true },
  title: { sortKey: 'TITLE', reverse: false },
};

export async function fetchProducts({ query = '', first = 24, sort = 'featured' } = {}, overrides) {
  const { sortKey, reverse } = SORT_KEYS[sort] || SORT_KEYS.featured;
  const data = await storefrontQuery(PRODUCTS_QUERY, { first, query: query || null, sortKey, reverse }, overrides);
  return data.products.nodes.map(normalizeProduct);
}

export async function fetchProductByHandle(handle, overrides) {
  const data = await storefrontQuery(PRODUCT_BY_HANDLE_QUERY, { handle }, overrides);
  return normalizeProduct(data.product);
}

export async function fetchProductHandles(first = 100, overrides) {
  const data = await storefrontQuery(HANDLES_QUERY, { first }, overrides);
  return data.products.nodes.map((n) => n.handle);
}

/** @returns {Promise<Map<string, { variant: object, product: object }>>} */
export async function fetchVariants(ids, overrides) {
  const data = await storefrontQuery(VARIANTS_QUERY, { ids }, overrides);
  const map = new Map();
  for (const node of data.nodes) {
    if (!node || node.__typename !== 'ProductVariant') continue;
    map.set(node.id, {
      variant: normalizeVariant(node),
      product: {
        id: node.product.id,
        handle: node.product.handle,
        title: node.product.title,
        productType: node.product.productType,
        featuredImage: node.product.featuredImage,
        customizable: node.product.customizableMeta?.value === 'true',
        leadTimeDays: Number.parseInt(node.product.leadTimeMeta?.value || '0', 10) || 0,
      },
    });
  }
  return map;
}

/* ── Cart API ──────────────────────────────────────────────────────────── */

function lineInput(line) {
  const attributes = [];
  if (line.customization) attributes.push({ key: '_customization', value: JSON.stringify(line.customization) });
  if (line.designId) attributes.push({ key: '_design_id', value: line.designId });
  return { merchandiseId: line.variantId, quantity: line.quantity, ...(attributes.length ? { attributes } : {}) };
}

function unwrapCart(payload, label) {
  if (payload.userErrors?.length) {
    throw new ShopifyError(`${label}: ${payload.userErrors.map((e) => e.message).join('; ')}`, {
      userErrors: payload.userErrors,
    });
  }
  return normalizeCart(payload.cart);
}

export async function cartCreate(lines = [], overrides) {
  const data = await storefrontMutate(CART_CREATE, { input: { lines: lines.map(lineInput) } }, overrides);
  return unwrapCart(data.cartCreate, 'cartCreate');
}

export async function cartGet(cartId, overrides) {
  const data = await storefrontQuery(CART_QUERY, { id: cartId }, overrides);
  return normalizeCart(data.cart);
}

export async function cartLinesAdd(cartId, lines, overrides) {
  const data = await storefrontMutate(CART_LINES_ADD, { cartId, lines: lines.map(lineInput) }, overrides);
  return unwrapCart(data.cartLinesAdd, 'cartLinesAdd');
}

export async function cartLinesUpdate(cartId, updates, overrides) {
  const data = await storefrontMutate(CART_LINES_UPDATE, { cartId, lines: updates }, overrides);
  return unwrapCart(data.cartLinesUpdate, 'cartLinesUpdate');
}

export async function cartLinesRemove(cartId, lineIds, overrides) {
  const data = await storefrontMutate(CART_LINES_REMOVE, { cartId, lineIds }, overrides);
  return unwrapCart(data.cartLinesRemove, 'cartLinesRemove');
}

/** Checkout generation: Shopify hosts the checkout; we just hand over the URL. */
export async function getCheckoutUrl(cartId, overrides) {
  const cart = await cartGet(cartId, overrides);
  if (!cart?.checkoutUrl) throw new ShopifyError('Cart has no checkout URL');
  return cart.checkoutUrl;
}

/* ── Webhook validation ────────────────────────────────────────────────── */

/**
 * Verify `X-Shopify-Hmac-Sha256`: base64(HMAC-SHA256(rawBody, appSecret)).
 * Must be computed over the RAW request bytes — not re-serialised JSON.
 *
 * @param {Buffer|string} rawBody
 * @param {string|undefined} hmacHeader
 * @param {string} secret
 */
export function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!rawBody || !hmacHeader || !secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest();
  let provided;
  try {
    provided = Buffer.from(String(hmacHeader), 'base64');
  } catch {
    return false;
  }
  return provided.length === digest.length && crypto.timingSafeEqual(provided, digest);
}
