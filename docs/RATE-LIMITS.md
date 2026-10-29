# Rate limits and request flooding

## In the code (best effort)
`lib/ratelimit.ts` is an in-memory limiter. Serverless instances do not share memory, so it only slows a flood hitting one instance. It is a backstop, not the main defence.

| Route | Limit | Key |
|---|---|---|
| `/api/cart` | 60 / minute | IP |
| `/auth/callback` | 20 / minute | IP |
| `/unsubscribe` | 20 / minute | IP |
| Account actions (save, edit) | 60 / minute | signed-in user |

Not limited in code: `/api/webhooks/shopify` (only requests with a valid Shopify signature do any work).

## Host firewall (the real protection)
Vercel project → Firewall → Rules. A rule "Rate limit cart API" (30 requests / minute / IP on `/api/cart`, deny for 1 minute) was added through the API. Rules for login/account/auth/unsubscribe (20 / minute) and the whole site (300 / minute, excluding `/api/webhooks/shopify`) were rejected because rate limiting is not available on this plan. Check that the cart rule is actually enforced (it may only work on a higher plan), and add the other two when available.

## Supabase (set in the dashboard)
- Authentication → Rate limits (sign-ups, sign-ins, password resets, emails).
- Authentication → Attack protection: turn on CAPTCHA (needs a Turnstile or hCaptcha key).
- Contact form and `email_signups` accept public inserts: add a database cap or move them behind a server route when a shared rate-limit store is available.
