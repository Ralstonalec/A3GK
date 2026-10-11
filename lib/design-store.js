import { kvGet, kvSet } from './kv';
import { shortId } from './utils';

/** Persisted Design Studio configurations (shareable via /customizer?design=<id>). */

const TTL_SECONDS = 60 * 60 * 24 * 180;

export async function saveDesign({ config, size, logoDataUrl }) {
  const id = shortId(12);
  const record = { id, config, size, createdAt: new Date().toISOString(), ...(logoDataUrl ? { logoDataUrl } : {}) };
  const ok = await kvSet(`design:${id}`, record, { ex: TTL_SECONDS });
  if (!ok) throw new Error('Could not persist design');
  return record;
}

export async function loadDesign(id) {
  return kvGet(`design:${id}`);
}
