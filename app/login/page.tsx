import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { Tbc } from '@/components/Tbc';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function Login({ searchParams }: { searchParams: { error?: string } }) {
  if (!supabaseConfigured) {
    return <div className="section max-w-xl"><h1 className="h2">Accounts</h1><p className="mt-4"><Tbc label="Customer accounts are not connected yet" /></p></div>;
  }
  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect('/account');
  return <div className="section"><AuthForm initialError={searchParams.error} /></div>;
}
