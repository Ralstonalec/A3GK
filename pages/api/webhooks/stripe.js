import Stripe from 'stripe';
import { ApiError, createHandler, readRawBody, sendJson } from '@/lib/api';
import { kvGet, kvSet } from '@/lib/kv';
import { serverConfig } from '@/lib/server-config';

export const config = { api: { bodyParser: false } };

/**
 * POST /api/webhooks/stripe – signature-verified payment events.
 *
 * This is the integration point for fulfilment: on `checkout.session.completed`
 * create the order in your OMS / Shopify Admin (see lib/shopify-admin.js).
 */
async function post(req, res) {
  const secret = serverConfig.stripeWebhookSecret;
  if (!secret || !serverConfig.stripeSecretKey) throw new ApiError(503, 'not_configured', 'Stripe webhook is not configured');

  const raw = await readRawBody(req);
  let event;
  try {
    event = Stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], secret);
  } catch {
    throw new ApiError(400, 'invalid_signature', 'Invalid webhook signature');
  }

  if (await kvGet(`webhook:stripe:${event.id}`)) return sendJson(res, 200, { received: true, duplicate: true });
  await kvSet(`webhook:stripe:${event.id}`, 1, { ex: 60 * 60 * 24 * 3 });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.info('[stripe] order paid', { session: session.id, designs: session.metadata?.design_ids || null });
      break;
    }
    case 'checkout.session.expired':
      console.info('[stripe] checkout expired', event.data.object.id);
      break;
    default:
      break;
  }
  return sendJson(res, 200, { received: true });
}

export default createHandler({ POST: post }, { skipOriginCheck: true });
