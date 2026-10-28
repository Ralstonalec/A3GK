import type { Metadata } from 'next';
import { adminClient, adminConfigured } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Link target for the unsubscribe line in every marketing email. The token is an unguessable id on the member's profile. */
export default async function Unsubscribe({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? '';
  let done = false;
  if (adminConfigured && UUID.test(token)) {
    const { data } = await adminClient().from('profiles').update({ marketing_opt_in: false }).eq('unsubscribe_token', token).select('id');
    done = Boolean(data && data.length);
  }
  return (
    <div className="section max-w-xl">
      <h1 className="h2">Email preferences</h1>
      <p className="mt-4 text-lg text-white/80">
        {done
          ? 'You are unsubscribed from A3GK marketing emails. Order and account emails are not affected.'
          : 'That unsubscribe link is not valid or has expired. Sign in to your account to change your email preferences.'}
      </p>
    </div>
  );
}
