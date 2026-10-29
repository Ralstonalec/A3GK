import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { removeSaved, signOut } from './actions';
import { PasswordForm, ProfileForm, SizeForm } from '@/components/AccountForms';

export const metadata: Metadata = { title: 'Your account' };
export const dynamic = 'force-dynamic';

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass rounded-[2rem] p-6 md:p-8"><h2 className="font-display text-2xl font-extrabold uppercase">{title}</h2><div className="mt-5">{children}</div></section>
);

export default async function Account() {
  if (!supabaseConfigured) redirect('/login');
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: profile }, { data: sizes }, { data: saved }, { data: purchases }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, marketing_opt_in').eq('id', user.id).maybeSingle(),
    supabase.from('size_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('saved_items').select('id, product_handle, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('purchases').select('id, order_number, total, currency, line_items, status, placed_at').order('placed_at', { ascending: false }).limit(25),
  ]);
  const paid = (purchases ?? []).filter((p) => p.status === 'paid');
  const spend = new Map<string, number>();
  for (const p of paid) spend.set(p.currency, (spend.get(p.currency) ?? 0) + Number(p.total));
  const money = (n: number, c: string) => new Intl.NumberFormat('en', { style: 'currency', currency: c }).format(n);
  return (
    <div className="section max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h2">Your account</h1>
        <form action={signOut}><button className="min-h-[44px] font-semibold underline underline-offset-4">Sign out</button></form>
      </div>
      <Card title="Membership">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div><dt className="text-xs font-bold uppercase tracking-widest text-white/55">Member since</dt><dd className="mt-1 text-lg font-semibold">{new Date(user.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long' })}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-widest text-white/55">Orders</dt><dd className="mt-1 text-lg font-semibold">{paid.length}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-widest text-white/55">Total spent</dt><dd className="mt-1 text-lg font-semibold">{spend.size ? Array.from(spend, ([c, n]) => money(n, c)).join(' + ') : '—'}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-white/70">Member rewards are coming. Your orders are being recorded so they count when rewards launch. <Link href="/membership" className="underline underline-offset-4">How membership works</Link></p>
      </Card>
      <Card title="Your details"><ProfileForm email={user.email ?? ''} profile={profile ?? { full_name: null, phone: null, marketing_opt_in: false }} /></Card>
      <Card title="Saved sizes"><SizeForm sizes={sizes} /></Card>
      <Card title="Saved items">
        {saved && saved.length ? (
          <ul className="divide-y divide-white/10">
            {saved.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/products/${s.product_handle}`} className="font-semibold underline underline-offset-4">{s.product_handle.replace(/-/g, ' ')}</Link>
                <form action={removeSaved}><input type="hidden" name="id" value={s.id} /><button className="min-h-[44px] px-2 text-sm text-white/70 underline underline-offset-4">Remove</button></form>
              </li>
            ))}
          </ul>
        ) : <p className="text-white/70">Nothing saved yet. Use “Save for later” on a product page.</p>}
      </Card>
      <Card title="Password"><PasswordForm /></Card>
      <Card title="Orders">
        {purchases && purchases.length ? (
          <ul className="divide-y divide-white/10">
            {purchases.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                <div>
                  <p className="font-semibold">{p.order_number ?? 'Order'} <span className="font-normal text-white/60">· {new Date(p.placed_at).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}</span>{p.status === 'cancelled' && <span className="ml-2 text-sm text-white/60">(cancelled)</span>}</p>
                  <p className="text-sm text-white/65">{(p.line_items as { title: string; quantity: number }[]).map((l) => `${l.quantity} × ${l.title}`).join(', ')}</p>
                </div>
                <p className="font-semibold">{money(Number(p.total), p.currency)}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-white/70">No orders yet. Orders placed with the email address on this account appear here after payment. Use the same email at checkout.</p>}
      </Card>
    </div>
  );
}
