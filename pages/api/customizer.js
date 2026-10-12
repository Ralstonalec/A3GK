import { ApiError, createHandler, parseBody, sendJson } from '@/lib/api';
import { loadDesign, saveDesign } from '@/lib/design-store';
import { FEATURES } from '@/lib/features';
import { kvBackend } from '@/lib/kv';
import { designIdSchema, designSaveSchema, validate } from '@/lib/validation';

/**
 * POST /api/customizer  { config, size, logoDataUrl? }  → { id, url }
 * GET  /api/customizer?id=abc123xyz   → { design }
 *
 * Designs live in Redis (Upstash) for 180 days. Without Redis they sit in
 * process memory, which serverless instances do not share — see README.
 */
async function post(req, res) {
  const body = parseBody(designSaveSchema, req.body);
  const record = await saveDesign(body).catch((error) => {
    console.error('[customizer] save failed', error);
    throw new ApiError(503, 'storage_unavailable', 'Could not save your design right now.');
  });
  return sendJson(res, 201, { id: record.id, url: `/customizer?design=${record.id}`, storage: kvBackend() }, { 'Cache-Control': 'no-store' });
}

async function get(req, res) {
  const parsed = validate(designIdSchema, req.query.id);
  if (!parsed.ok) throw new ApiError(400, 'validation_error', 'Invalid design id');
  const design = await loadDesign(parsed.data);
  if (!design) throw new ApiError(404, 'not_found', 'Design not found or expired');
  return sendJson(res, 200, { design }, { 'Cache-Control': 'private, max-age=60' });
}

/** Custom kit is a work in progress; the API is closed until the feature flag is on (lib/features.js). */
const guard = (fn) => async (req, res) => {
  if (!FEATURES.customKit) throw new ApiError(404, 'feature_disabled', 'Custom kit is not available yet.');
  return fn(req, res);
};

export default createHandler({ GET: guard(get), POST: guard(post) });
