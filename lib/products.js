import { isShopifyConfigured } from './config';
import { cached, getCatalogVersion } from './kv';
import { getMockProduct, getMockProducts, getMockVariant, queryMockProducts } from './mock-catalog';
import { sanitizeHtml } from './sanitize';
import { fetchProductByHandle, fetchProductHandles, fetchProducts, fetchVariants } from './shopify';

/**
 * Catalogue facade — the ONLY thing pages and API routes call.
 * Shopify when configured (cached in Redis), the mock catalogue otherwise.
 */

const PRODUCT_TTL = 60; // seconds fresh; stale copy served if Shopify errors

export const catalogSource = () => (isShopifyConfigured() ? 'shopify' : 'mock');

function clean(product) {
  return product ? { ...product, descriptionHtml: sanitizeHtml(product.descriptionHtml) } : product;
}

/** JSON-safe copy (Next.js props forbid `undefined`). */
function plain(value) {
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

export async function getProducts({ query = '', first = 24, sort = 'featured' } = {}) {
  if (!isShopifyConfigured()) return plain(queryMockProducts({ query, first, sort }).map(clean));
  const version = await getCatalogVersion();
  const key = `products:v${version}:${sort}:${first}:${query}`;
  const list = await cached(key, PRODUCT_TTL, () => fetchProducts({ query, first, sort }));
  return plain(list.map(clean));
}

export async function getProduct(handle) {
  if (!isShopifyConfigured()) return plain(clean(getMockProduct(handle)));
  const version = await getCatalogVersion();
  const product = await cached(`product:v${version}:${handle}`, PRODUCT_TTL, () => fetchProductByHandle(handle));
  return plain(clean(product));
}

export async function getProductHandles() {
  if (!isShopifyConfigured()) return getMockProducts().map((p) => p.handle);
  return fetchProductHandles(100);
}

/**
 * Authoritative variant + product lookup for server-side re-pricing.
 * @param {string[]} ids
 * @returns {Promise<Map<string, { variant: object, product: object }>>}
 */
export async function resolveVariants(ids) {
  const unique = [...new Set(ids)];
  if (!isShopifyConfigured()) {
    const map = new Map();
    for (const id of unique) {
      const hit = getMockVariant(id);
      if (hit) {
        const { product, variant } = hit;
        map.set(id, {
          variant,
          product: {
            id: product.id,
            handle: product.handle,
            title: product.title,
            productType: product.productType,
            featuredImage: product.featuredImage,
            customizable: product.customizable,
            leadTimeDays: product.leadTimeDays,
          },
        });
      }
    }
    return map;
  }
  return fetchVariants(unique);
}
