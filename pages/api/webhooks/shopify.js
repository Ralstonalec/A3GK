import { ApiError, createHandler, readRawBody, sendJson } from '@/lib/api';
import { kvGet, kvSet, bumpCatalogVersion } from '@/lib/kv';
import { serverConfig } from '@/lib/server-config';
import { verifyShopifyWebhook } from '@/lib/shopify';

// Raw body is required: the HMAC is computed over the exact bytes Shopify sent.
export const config = { api: { bodyParser: false } };

const CATALOG_TOPICS = new Set(['products/create', 'products/update', 'products/delete', 'inventory_levels/update', 'collections/update']);
const PRIVACY_TOPICS = new Set(['customers/data_request', 'customers/redact', 'shop/redact']);

/**
 * POST /api/webhooks/shopify
 *  1. verify X-Shopify-Hmac-Sha256 (timing-safe)
 *  2. de-duplicate on X-Shopify-Webhook-Id (Shopify retries and may double-send)
 *  3. catalogue topics → bump cache version + on-demand ISR revalidation
 *  4. mandatory privacy topics → acknowledged (this app stores no Shopify customer data)
 */
async function post(req, res) {
  const raw = await readRawBody(req);
  const secret = serverConfig.shopifyWebhookSecret;
  if (!secret) throw new ApiError(503, 'not_configured', 'Webhook secret is not configured');

  if (!verifyShopifyWebhook(raw, req.headers['x-shopify-hmac-sha256'], secret)) {
    throw new ApiError(401, 'invalid_signature', 'Invalid webhook signature');
  }

  const topic = String(req.headers['x-shopify-topic'] || '');
  const webhookId = String(req.headers['x-shopify-webhook-id'] || '');
  if (webhookId) {
    if (await kvGet(`webhook:shopify:${webhookId}`)) return sendJson(res, 200, { ok: true, duplicate: true });
    await kvSet(`webhook:shopify:${webhookId}`, 1, { ex: 60 * 60 * 24 });
  }

  let payload = {};
  try {
    payload = JSON.parse(raw.toString('utf8') || '{}');
  } catch {
    throw new ApiError(400, 'invalid_json', 'Body is not valid JSON');
  }

  if (CATALOG_TOPICS.has(topic)) {
    await bumpCatalogVersion();
    const paths = ['/', '/products'];
    if (payload.handle && /^[a-z0-9-]+$/.test(payload.handle)) paths.push(`/products/${payload.handle}`);
    const results = await Promise.allSettled(paths.map((p) => res.revalidate(p)));
    const revalidated = results.filter((r) => r.status === 'fulfilled').length;
    return sendJson(res, 200, { ok: true, topic, revalidated });
  }

  if (PRIVACY_TOPICS.has(topic)) return sendJson(res, 200, { ok: true, topic });

  // Unknown topics are acknowledged so Shopify does not keep retrying them.
  return sendJson(res, 200, { ok: true, topic, ignored: true });
}

export default createHandler({ POST: post }, { skipOriginCheck: true });
