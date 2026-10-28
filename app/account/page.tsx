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
  const [{ data: profile }, { data: sizes }, { data: saved }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, marketing_opt_in').eq('id', user.id).maybeSingle(),
    supabase.from('size_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('saved_items').select('id, product_handle, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);
  return (
    <div className="section max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h2">Your account</h1>
        <form action={signOut}><button className="min-h-[44px] font-semibold underline underline-offset-4">Sign out</button></form>
      </div>
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
      <Card title="Orders"><p className="text-white/70">Orders are handled by Shopify at checkout. Order history in this account is not connected yet.</p></Card>
    </div>
  );
}
