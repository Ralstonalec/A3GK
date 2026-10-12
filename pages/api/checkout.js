import { createHandler, parseBody, parseCookies, sendJson } from '@/lib/api';
import { createCheckout, getRequestOrigin, retrieveCheckoutStatus } from '@/lib/checkout-service';
import { isStripeConfigured } from '@/lib/server-config';
import { isShopifyConfigured } from '@/lib/config';
import { hasPublishedTerms } from '@/lib/store-terms';
import { checkoutSchema } from '@/lib/validation';
import { ApiError } from '@/lib/api';

/**
 * POST /api/checkout
 * Re-prices the cart on the server and returns `{ provider, url }`:
 *   stripe  → hosted Stripe Checkout Session URL
 *   shopify → cart.checkoutUrl (Shopify-hosted checkout)
 *   demo    → local success page (no payment is taken)
 */
async function post(req, res) {
  const input = parseBody(checkoutSchema, req.body);

  if (hasPublishedTerms() && !input.acceptTerms) {
    throw new ApiError(400, 'validation_error', 'You must accept the Terms & Conditions to continue', { acceptTerms: 'You must accept the Terms & Conditions to continue' });
  }

  // Honeypot tripped: pretend success so bots learn nothing.
  if (input.company) {
    return sendJson(res, 200, { provider: 'demo', url: '/cart' }, { 'Cache-Control': 'no-store' });
  }

  const shopifyCartId = parseCookies(req.headers.cookie)['a3gk_cart'] || null;
  const result = await createCheckout(input, {
    origin: getRequestOrigin(req),
    shopifyCartId,
    shopifyConfigured: isShopifyConfigured(),
  }).catch((error) => {
    if (error instanceof ApiError) throw error;
    if (error?.type?.startsWith?.('Stripe')) {
      console.error('[checkout] stripe error', error.type, error.code, error.message);
      throw new ApiError(502, 'payment_unavailable', 'We could not start the payment session. Please try again.');
    }
    throw error;
  });

  return sendJson(res, 200, result, { 'Cache-Control': 'no-store' });
}

/** GET /api/checkout?session_id=cs_… → { paid } (Stripe only); used by the success page. */
async function get(req, res) {
  const id = String(req.query.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(id)) throw new ApiError(400, 'validation_error', 'Invalid session id');
  if (!isStripeConfigured()) throw new ApiError(404, 'not_found', 'Payments are not configured');
  const status = await retrieveCheckoutStatus(id).catch((error) => {
    console.error('[checkout] status lookup failed', error.message);
    throw new ApiError(502, 'payment_unavailable', 'Could not confirm the payment status.');
  });
  return sendJson(res, 200, status, { 'Cache-Control': 'private, no-store' });
}

export default createHandler({ GET: get, POST: post });
