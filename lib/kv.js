import { isKvConfigured, serverConfig } from './server-config';

/**
 * Tiny key-value layer.
 *
 *  • Upstash Redis REST (what "Vercel KV" now is, via the Marketplace) when
 *    KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN are set.
 *  • An in-memory Map otherwise — fine for local dev and demos, but NOT shared
 *    between serverless instances, so configure Redis for real traffic.
 *
 * No SDK dependency: the REST API is a single POST of a command array.
 */

const memory = (globalThis.__a3gkMemoryKv ??= new Map());

function memGet(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expires && entry.expires < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

async function redis(command) {
  const res = await fetch(serverConfig.kvUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serverConfig.kvToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`KV ${command[0]} failed: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`KV ${command[0]} error: ${json.error}`);
  return json.result;
}

async function redisPipeline(commands) {
  const res = await fetch(`${serverConfig.kvUrl.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serverConfig.kvToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`KV pipeline failed: ${res.status}`);
  const json = await res.json();
  return json.map((r) => {
    if (r.error) throw new Error(`KV pipeline error: ${r.error}`);
    return r.result;
  });
}

export const kvBackend = () => (isKvConfigured() ? 'redis' : 'memory');

/** @returns {Promise<any|null>} parsed JSON value or null */
export async function kvGet(key) {
  if (!isKvConfigured()) return memGet(key);
  try {
    const raw = await redis(['GET', key]);
    return raw == null ? null : JSON.parse(raw);
  } catch (error) {
    console.warn('[kv] get failed, treating as miss:', error.message);
    return null;
  }
}

export async function kvSet(key, value, { ex } = {}) {
  if (!isKvConfigured()) {
    memory.set(key, { value, expires: ex ? Date.now() + ex * 1000 : 0 });
    return true;
  }
  try {
    const command = ['SET', key, JSON.stringify(value)];
    if (ex) command.push('EX', String(ex));
    await redis(command);
    return true;
  } catch (error) {
    console.warn('[kv] set failed:', error.message);
    return false;
  }
}

export async function kvDel(key) {
  if (!isKvConfigured()) return memory.delete(key);
  try {
    await redis(['DEL', key]);
    return true;
  } catch (error) {
    console.warn('[kv] del failed:', error.message);
    return false;
  }
}

/**
 * Atomic increment with a TTL set on first write (fixed-window counters).
 * @returns {Promise<{ count: number, ttl: number }>}
 */
export async function kvIncrWindow(key, windowSeconds) {
  if (!isKvConfigured()) {
    const now = Date.now();
    const entry = memory.get(key);
    if (!entry || entry.expires < now) {
      memory.set(key, { value: 1, expires: now + windowSeconds * 1000 });
      return { count: 1, ttl: windowSeconds };
    }
    entry.value += 1;
    return { count: entry.value, ttl: Math.max(1, Math.ceil((entry.expires - now) / 1000)) };
  }
  const [count, , ttl] = await redisPipeline([
    ['INCR', key],
    ['EXPIRE', key, String(windowSeconds), 'NX'],
    ['TTL', key],
  ]);
  return { count, ttl: ttl > 0 ? ttl : windowSeconds };
}

/** Periodically drop expired in-memory entries (no-op for Redis). */
export function kvSweepMemory() {
  const now = Date.now();
  for (const [key, entry] of memory) {
    if (entry.expires && entry.expires < now) memory.delete(key);
  }
}

/**
 * Cache-aside helper: read → miss → compute → store. If the compute step
 * throws and a stale value exists, the stale value is served instead.
 */
export async function cached(key, ttlSeconds, compute) {
  const hit = await kvGet(key);
  if (hit && hit.fresh > Date.now()) return hit.value;
  try {
    const value = await compute();
    // Keep a stale copy 10× longer than the fresh window for error fallback.
    await kvSet(key, { value, fresh: Date.now() + ttlSeconds * 1000 }, { ex: ttlSeconds * 10 });
    return value;
  } catch (error) {
    if (hit) return hit.value;
    throw error;
  }
}

/** Bumping the version string invalidates every `cached()` entry that includes it. */
export async function getCatalogVersion() {
  return (await kvGet('catalog:version')) || 1;
}

export async function bumpCatalogVersion() {
  const next = ((await kvGet('catalog:version')) || 1) + 1;
  await kvSet('catalog:version', next);
  return next;
}
