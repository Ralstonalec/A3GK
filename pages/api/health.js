import { createHandler, sendJson } from '@/lib/api';
import { analyticsTargets } from '@/lib/analytics-server';
import { catalogSource } from '@/lib/products';
import { kvBackend } from '@/lib/kv';
import { isStripeConfigured } from '@/lib/server-config';

/** GET /api/health – deployment smoke test. Reports modes only, never secrets. */
async function get(req, res) {
  return sendJson(
    res,
    200,
    {
      status: 'ok',
      catalog: catalogSource(),
      checkout: isStripeConfigured() ? 'stripe' : catalogSource() === 'shopify' ? 'shopify' : 'demo',
      store: kvBackend(),
      analytics: analyticsTargets(),
      time: new Date().toISOString(),
    },
    { 'Cache-Control': 'no-store' },
  );
}

export default createHandler({ GET: get });
