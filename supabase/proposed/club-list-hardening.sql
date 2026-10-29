-- PROPOSED, NOT APPLIED. Review, then apply in the Supabase SQL editor (or ask Claude to apply it).
-- Makes the email_signups list safe to send from: no duplicate rows, consent time recorded, an unsubscribe token per row.
alter table public.email_signups
  add column if not exists consented_at timestamptz not null default now(),
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- One row per address (case-insensitive). The site lowercases emails before inserting.
create unique index if not exists email_signups_email_key on public.email_signups (lower(email));

-- Length caps so the public insert cannot be used to store junk.
alter table public.email_signups
  add constraint email_signups_email_len check (char_length(email) between 3 and 254),
  add constraint email_signups_source_len check (char_length(source) <= 40);
