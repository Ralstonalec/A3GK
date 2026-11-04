-- Tracking numbers for a member's orders, filled by the Shopify order webhook (service role only).
-- Existing row-level security already limits purchases to the signed-in member with the matching confirmed email.
alter table public.purchases add column if not exists fulfillments jsonb not null default '[]'::jsonb;
