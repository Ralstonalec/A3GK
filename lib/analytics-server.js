import { publicConfig } from './config';
import { parseCookies } from './api';
import { CONSENT_COOKIE } from './consent';
import { serverConfig } from './server-config';
import { safeJsonParse } from './utils';

/**
 * Server-side forwarding of analytics batches.
 *
 *  • GA4 Measurement Protocol  – NEXT_PUBLIC_ANALYTICS_ID + GA_API_SECRET
 *  • Generic webhook           – ANALYTICS_WEBHOOK_URL (Segment, PostHog, n8n…)
 *
 * With neither configured the batch is accepted and dropped (202).
 */

export function analyticsTargets() {
  const targets = [];
  if (/^G-[A-Z0-9]+$/.test(publicConfig.analyticsId) && serverConfig.gaApiSecret) targets.push('ga4');
  if (serverConfig.analyticsWebhookUrl) targets.push('webhook');
  return targets;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
}

export async function forwardAnalytics({ clientId, page, events }) {
  const targets = analyticsTargets();
  const results = await Promise.allSettled(
    targets.map((target) => {
      if (target === 'ga4') {
        const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(publicConfig.analyticsId)}&api_secret=${encodeURIComponent(serverConfig.gaApiSecret)}`;
        return postJson(url, {
          client_id: clientId,
          events: events.map((e) => ({ name: e.name, params: { ...e.params, page_location: page, engagement_time_msec: 100 } })),
        });
      }
      return postJson(serverConfig.analyticsWebhookUrl, { clientId, page, events, receivedAt: new Date().toISOString() });
    }),
  );
  const failures = results.filter((r) => r.status === 'rejected');
  failures.forEach((f) => console.warn('[analytics] forward failed:', f.reason?.message));
  return { targets, delivered: targets.length - failures.length, failed: failures.length };
}

/** Server-side check of the consent cookie: defence in depth behind the client gate. */
export function serverHasAnalyticsConsent(req) {
  const raw = parseCookies(req.headers.cookie)[CONSENT_COOKIE];
  const record = raw ? safeJsonParse(raw, null) : null;
  return Boolean(record?.categories?.analytics);
}
