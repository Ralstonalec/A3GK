import { ApiError, createHandler, sendJson } from '@/lib/api';
import { STORE_TERMS } from '@/lib/store-terms';
import { deliveryEstimateFor } from '@/lib/shipping';
import { bearerToken, SessionTokenError, verifySessionToken } from '@/lib/shopify-admin';

const CORS = {
  // Checkout UI extensions run in a sandbox on Shopify's CDN; auth is the bearer token, not cookies.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

/**
 * GET /api/shopify/checkout-extension – data endpoint for a Shopify Checkout UI
 * extension (delivery estimate + trust messaging). Requires a valid session token.
 */
async function get(req, res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v); // also on 401s so the extension can read the error
  try {
    const { shop } = verifySessionToken(bearerToken(req));
    const lead = Number.parseInt(String(req.query.leadTimeDays || '0'), 10) || 0;
    const method = String(req.query.method || '');
    // Delivery + returns are only returned once those terms exist (lib/store-terms.js); null otherwise.
    const estimate = deliveryEstimateFor(method, [{ leadTimeDays: lead }]);
    return sendJson(res, 200, {
      shop,
      delivery: estimate ? { method, label: estimate.label, earliest: estimate.earliest.toISOString(), latest: estimate.latest.toISOString() } : null,
      returnWindowDays: STORE_TERMS.returnWindowDays,
    }, CORS);
  } catch (error) {
    if (error instanceof SessionTokenError) {
      throw new ApiError(401, 'invalid_session_token', error.message);
    }
    throw error;
  }
}

function options(req, res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  res.status(204).end();
}

export default createHandler({ GET: get, OPTIONS: options }, { skipOriginCheck: true });
