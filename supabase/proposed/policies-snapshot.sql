-- Snapshot of the row-level security policies live in the database on 2026-11-04 (documentation only; do not run on the live project).
-- Kept here so the rules are in version control and can be rebuilt on a fresh project.
alter table public.contact_messages enable row level security;
alter table public.email_signups enable row level security;
alter table public.profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.saved_items enable row level security;
alter table public.size_profiles enable row level security;

create policy "contact insert anon" on public.contact_messages for insert to anon with check (user_id is null);
create policy "contact insert member" on public.contact_messages for insert to authenticated with check (user_id is null or user_id = (select auth.uid()));
create policy "signup insert" on public.email_signups for insert to anon, authenticated with check (true);
create policy "profiles select own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "purchases select own confirmed email" on public.purchases for select to authenticated using (email_confirmed() and lower(email) = lower((select auth.jwt() ->> 'email')));
create policy "saved delete own" on public.saved_items for delete to authenticated using ((select auth.uid()) = user_id);
create policy "saved insert own" on public.saved_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saved select own" on public.saved_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "size delete own" on public.size_profiles for delete to authenticated using ((select auth.uid()) = user_id);
create policy "size insert own" on public.size_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "size select own" on public.size_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "size update own" on public.size_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
