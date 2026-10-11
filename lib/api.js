import { publicConfig } from './config';
import { isProduction } from './server-config';
import { validate } from './validation';

/**
 * Shared plumbing for Pages-Router API routes:
 *   • method allow-list (405 + Allow header)
 *   • same-origin enforcement for state-changing requests (CSRF defence)
 *   • typed errors → consistent JSON `{ error, message, details? }`
 *   • cookie helpers (httpOnly, SameSite, Secure)
 */

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendJson(res, status, body, headers = {}) {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.status(status).json(body);
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function hostOf(value) {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/** Throws unless a state-changing request originates from this site. */
export function assertSameOrigin(req) {
  if (SAFE_METHODS.has(req.method)) return;
  const fetchSite = req.headers['sec-fetch-site'];
  if (fetchSite === 'cross-site') throw new ApiError(403, 'forbidden_origin', 'Cross-site requests are not allowed');

  const origin = req.headers.origin;
  if (!origin) return; // non-browser client (curl, server-to-server); browsers always send Origin on POST

  const allowed = new Set(
    [req.headers.host, hostOf(publicConfig.siteUrl), process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
      .filter(Boolean),
  );
  const originHost = hostOf(origin);
  if (!originHost || !allowed.has(originHost)) {
    throw new ApiError(403, 'forbidden_origin', 'Cross-origin requests are not allowed');
  }
}

/**
 * @param {Record<string, (req: any, res: any) => Promise<void>|void>} methods
 * @param {{ skipOriginCheck?: boolean }} [options]
 */
export function createHandler(methods, { skipOriginCheck = false } = {}) {
  const allow = Object.keys(methods).join(', ');
  return async function handler(req, res) {
    try {
      const fn = methods[req.method];
      if (!fn) {
        res.setHeader('Allow', allow);
        throw new ApiError(405, 'method_not_allowed', `Method ${req.method} not allowed`);
      }
      if (!skipOriginCheck) assertSameOrigin(req);
      await fn(req, res);
    } catch (error) {
      if (error instanceof ApiError) {
        return sendJson(res, error.status, { error: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) });
      }
      console.error('[api] unhandled error', req.method, req.url, error);
      return sendJson(res, 500, {
        error: 'internal_error',
        message: 'Something went wrong. Please try again.',
        ...(isProduction() ? {} : { debug: String(error?.message || error) }),
      });
    }
  };
}

/** Validate `req.body` against a zod schema or throw a 400 ApiError. */
export function parseBody(schema, body) {
  const result = validate(schema, body ?? {});
  if (!result.ok) throw new ApiError(400, 'validation_error', 'Invalid request', result.errors);
  return result.data;
}

export function parseQuery(schema, query) {
  const result = validate(schema, query ?? {});
  if (!result.ok) throw new ApiError(400, 'validation_error', 'Invalid query', result.errors);
  return result.data;
}

/* ── Cookies ───────────────────────────────────────────────────────────── */

export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      out[name] = part.slice(idx + 1).trim();
    }
  }
  return out;
}

export function serializeCookie(name, value, { maxAge, httpOnly = true, sameSite = 'Lax', secure = isProduction(), path = '/' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`];
  if (typeof maxAge === 'number') parts.push(`Max-Age=${Math.floor(maxAge)}`);
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function appendSetCookie(res, cookie) {
  const existing = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', existing ? [].concat(existing, cookie) : cookie);
}

/** Read the raw request body (for webhook HMAC verification). Requires `bodyParser: false`. */
export async function readRawBody(req, limitBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new ApiError(413, 'payload_too_large', 'Payload too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
