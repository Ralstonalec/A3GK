import crypto from 'node:crypto';
import { publicConfig, SHOPIFY_API_VERSION } from './config';
import { kvGet, kvSet } from './kv';
import { serverConfig } from './server-config';

/**
 * Shopify Admin-side integration points (server only).
 *
 *  • getAdminAccessToken()  – client-credentials grant for Dev-Dashboard apps
 *                             (SHOPIFY_ADMIN_API_KEY / SECRET), cached in KV.
 *  • adminGraphql()         – authenticated Admin API call.
 *  • verifySessionToken()   – validates the App Bridge session JWT sent by an
 *                             embedded admin page or a checkout UI extension.
 *
 * SCAFFOLDING: unit-tested with locally signed tokens, not yet exercised
 * against a live Shopify store. See SHOPIFY_INTEGRATION.md.
 */

const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export class SessionTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionTokenError';
  }
}

/**
 * Verify an App Bridge / checkout-extension session token (HS256 JWT).
 * https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
 */
export function verifySessionToken(token, { apiKey = serverConfig.shopifyAdminKey, secret = serverConfig.shopifyAdminSecret, now = Date.now() } = {}) {
  if (!apiKey || !secret) throw new SessionTokenError('Shopify app credentials are not configured');
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new SessionTokenError('Malformed token');
  const [h, p, s] = parts;

  let header;
  let payload;
  try {
    header = JSON.parse(b64urlDecode(h).toString('utf8'));
    payload = JSON.parse(b64urlDecode(p).toString('utf8'));
  } catch {
    throw new SessionTokenError('Malformed token');
  }
  if (header.alg !== 'HS256') throw new SessionTokenError('Unsupported algorithm');

  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest();
  const given = b64urlDecode(s);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw new SessionTokenError('Invalid signature');
  }

  const nowSec = Math.floor(now / 1000);
  const leeway = 10;
  if (typeof payload.exp !== 'number' || payload.exp + leeway < nowSec) throw new SessionTokenError('Token expired');
  if (typeof payload.nbf === 'number' && payload.nbf - leeway > nowSec) throw new SessionTokenError('Token not yet valid');
  if (payload.aud !== apiKey) throw new SessionTokenError('Audience mismatch');

  let dest;
  let iss;
  try {
    dest = new URL(payload.dest);
    iss = new URL(payload.iss);
  } catch {
    throw new SessionTokenError('Invalid dest/iss');
  }
  if (!/\.myshopify\.com$/.test(dest.hostname) && dest.hostname !== publicConfig.shopifyDomain) {
    throw new SessionTokenError('Unexpected shop domain');
  }
  if (iss.hostname !== dest.hostname) throw new SessionTokenError('Issuer does not match destination');

  return { shop: dest.hostname, userId: payload.sub || null, sessionId: payload.sid || null, payload };
}

export function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

/* ── Admin API ─────────────────────────────────────────────────────────── */

const TOKEN_CACHE_KEY = 'shopify:admin-token';

export async function getAdminAccessToken(fetchImpl = fetch) {
  const hit = await kvGet(TOKEN_CACHE_KEY);
  if (hit && hit.expiresAt > Date.now() + 60_000) return hit.token;

  const res = await fetchImpl(`https://${publicConfig.shopifyDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: serverConfig.shopifyAdminKey,
      client_secret: serverConfig.shopifyAdminSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) throw new Error(`Admin token request failed: ${res.status}`);
  const json = await res.json();
  const ttl = Number(json.expires_in) || 86_399;
  await kvSet(TOKEN_CACHE_KEY, { token: json.access_token, expiresAt: Date.now() + ttl * 1000 }, { ex: ttl });
  return json.access_token;
}

export async function adminGraphql(query, variables = {}, fetchImpl = fetch) {
  const token = await getAdminAccessToken(fetchImpl);
  const res = await fetchImpl(`https://${publicConfig.shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Admin API request failed: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Admin API: ${json.errors.map((e) => e.message).join('; ')}`);
  return json.data;
}
