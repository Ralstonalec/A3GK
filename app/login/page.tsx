import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { Reveal } from '@/components/Reveal';
import { Tbc } from '@/components/Tbc';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { customerAccountConfigured } from '@/lib/customer-account';

const StoreSignIn = () => (
  <div className="mx-auto mt-6 max-w-md rounded-3xl border border-white/15 p-5 text-center">
    <p className="text-sm text-white/70">Already ordered? View your orders with your store account.</p>
    <a href="/customer/login" className="btn-primary mt-3 inline-flex">Sign in to view orders</a>
  </div>
);

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Login({ searchParams }: { searchParams: { error?: string } }) {
  if (!supabaseConfigured) {
    if (customerAccountConfigured) return <div className="section max-w-xl"><h1 className="h2">Sign in</h1>{searchParams.error && <p role="alert" className="mt-4 text-red-300">{searchParams.error}</p>}<StoreSignIn /></div>;
    return <div className="section max-w-xl"><h1 className="h2">Accounts</h1><p className="mt-4"><Tbc label="Customer accounts are not connected yet" /></p></div>;
  }
  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect('/account');
  return (
    <div className="relative isolate overflow-hidden">
      <p aria-hidden className="pointer-events-none absolute left-0 top-[12%] -z-10 whitespace-nowrap font-display text-[26vw] font-extrabold uppercase leading-none text-white/[0.035]">Members</p>
      <Reveal className="section"><AuthForm initialError={searchParams.error} />{customerAccountConfigured && <StoreSignIn />}</Reveal>
    </div>
  );
}
