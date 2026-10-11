import { createHandler, parseBody, sendJson } from '@/lib/api';
import { forwardAnalytics, serverHasAnalyticsConsent } from '@/lib/analytics-server';
import { analyticsBatchSchema } from '@/lib/validation';
import { safeJsonParse } from '@/lib/utils';

/**
 * POST /api/analytics  { clientId, page?, events: [{ name, params }] }
 * Accepts batches from the consent-gated browser client and streams them to
 * GA4 (Measurement Protocol) and/or ANALYTICS_WEBHOOK_URL.
 */
async function post(req, res) {
  // sendBeacon posts a Blob typed application/json, which Next parses; guard anyway.
  const body = typeof req.body === 'string' ? safeJsonParse(req.body, {}) : req.body;
  const batch = parseBody(analyticsBatchSchema, body);

  if (!serverHasAnalyticsConsent(req)) {
    return res.status(204).end(); // no consent recorded → drop silently
  }

  const result = await forwardAnalytics(batch);
  return sendJson(res, 202, { accepted: batch.events.length, ...result }, { 'Cache-Control': 'no-store' });
}

export default createHandler({ POST: post });
