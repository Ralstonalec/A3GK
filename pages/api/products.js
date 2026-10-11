import { createHandler, parseQuery, sendJson } from '@/lib/api';
import { catalogSource, getProduct, getProducts } from '@/lib/products';
import { productsQuerySchema } from '@/lib/validation';

/**
 * GET /api/products?query=product_type:Jerseys AND available_for_sale:true&sort=price-asc&first=12
 * GET /api/products?handle=goalkeeper-jersey
 *
 * `query` uses Shopify's search syntax (see lib/search-syntax.js). Served from
 * the CDN for 60 s with a 5 min stale-while-revalidate window; Redis (when
 * configured) sits behind it.
 */
async function get(req, res) {
  const { query, first, sort, handle } = parseQuery(productsQuerySchema, req.query);
  const cache = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };

  if (handle) {
    const product = await getProduct(handle);
    if (!product) return sendJson(res, 404, { error: 'not_found', message: 'Product not found' }, { 'Cache-Control': 'public, s-maxage=30' });
    return sendJson(res, 200, { source: catalogSource(), product }, cache);
  }

  const products = await getProducts({ query, first, sort });
  return sendJson(res, 200, { source: catalogSource(), count: products.length, products }, cache);
}

export default createHandler({ GET: get });
