import { ApiError, createHandler, sendJson } from '@/lib/api';
import { bearerToken, SessionTokenError, verifySessionToken } from '@/lib/shopify-admin';

/**
 * GET /api/shopify/session – App Bridge authentication check.
 * An embedded admin page sends `Authorization: Bearer <session token>` (from
 * `shopify.idToken()`); we validate signature, audience, expiry and shop.
 */
async function get(req, res) {
  try {
    const { shop, userId } = verifySessionToken(bearerToken(req));
    return sendJson(res, 200, { authenticated: true, shop, userId }, { 'Cache-Control': 'no-store' });
  } catch (error) {
    if (error instanceof SessionTokenError) throw new ApiError(401, 'invalid_session_token', error.message);
    throw error;
  }
}

export default createHandler({ GET: get }, { skipOriginCheck: true });
