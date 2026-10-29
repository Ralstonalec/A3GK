# Membership, email list and purchase tracking

## What exists
- **Accounts** (Supabase Auth): free sign-up at `/login`. Page about it: `/membership`.
- **Email list**: opt-in only. An unticked checkbox at sign-up, and a checkbox in `/account`. Stored on `profiles.marketing_opt_in`, with the time consent was given in `marketing_opted_in_at`. Each profile has an `unsubscribe_token`; the link `https://<site>/unsubscribe?token=<token>` turns marketing off. Include it in every marketing email.
- **Purchases**: Shopify sends `orders/paid` and `orders/cancelled` webhooks to `/api/webhooks/shopify`. The signature is verified, then email, order number, items and total go into `purchases`. A member sees only purchases whose email matches their **confirmed** account email (row rule).
- **Rewards**: not built. Orders are recorded so they can count once rules exist (earn rate, tiers, redemptions are still to decide).

## A3 Goalkeepers Club (`/club`)
- Email-only sign-up (no account needed) with a consent checkbox. Rows go into `email_signups` with `source = 'club'`. The same form sits on the homepage. Server action: `app/club/actions.ts` (honeypot, shape check, 5 attempts per 10 min per address).
- Read the list in Supabase: `select email, created_at from public.email_signups where source = 'club' order by created_at desc;`
- **Not yet applied:** `supabase/proposed/club-list-hardening.sql` adds a unique email index, consent time and a per-row unsubscribe token. Apply it before the first send. Until then duplicates can appear, and club-only sign-ups have no unsubscribe link, so send nothing to them yet.
- "Early access" is only a promise to run it where you choose to; nothing in the code gates products.

## Setup you must do (secrets are yours to add)
1. Vercel → Settings → Environment Variables (Production + Preview), then redeploy:
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API; server-only, keep it secret)
   - `SHOPIFY_WEBHOOK_SECRET` (see step 2)
2. Shopify admin → Settings → Notifications → Webhooks → Create webhook, once per topic: **Order payment** (`orders/paid`) and **Order cancellation** (`orders/cancelled`). Format JSON, URL `https://<your site>/api/webhooks/shopify`. The signing secret is shown at the top of that Webhooks section; that is `SHOPIFY_WEBHOOK_SECRET`.
3. Supabase → Authentication → Providers → Email: keep **Confirm email** on. Order matching relies on it.

## Email list export / sending
No email provider is connected. To send, export opted-in members from the Supabase SQL editor:
```sql
select u.email, p.full_name, p.unsubscribe_token
from public.profiles p join auth.users u on u.id = p.id
where p.marketing_opt_in;
```
Import into your email tool (Mailchimp, Klaviyo, Shopify Email) and add the unsubscribe link. Canada's anti-spam law (CASL) needs express consent, a clear sender identity and a working unsubscribe: the sign-up checkbox and token link cover consent and unsubscribe; add your business name and mailing address to each email.

## Limits
- Guest orders made before an account exists appear once the member signs up with the same (confirmed) email.
- Refunds are not tracked yet (cancellations are).
- Checkout email must match the account email.
