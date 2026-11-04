import type { Metadata } from 'next';
import Link from 'next/link';
import { Fact } from '@/components/Tbc';
import { TrackForm } from '@/components/TrackForm';
import { POLICIES } from '@/lib/content';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { readTracking, statusLabel, trackUrl, type Tracking } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Follow your A3GK parcel with the tracking number from your shipping email.',
};

/** The signed-in member's parcels, if any. Quietly empty when signed out or when tracking is not set up yet. */
async function myParcels(): Promise<{ signedIn: boolean; parcels: { order: string; t: Tracking }[] }> {
  if (!supabaseConfigured) return { signedIn: false, parcels: [] };
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { signedIn: false, parcels: [] };
  const { data } = await sb.from('purchases').select('order_number, fulfillments, placed_at').order('placed_at', { ascending: false }).limit(25);
  const rows = (data ?? []) as { order_number: string | null; fulfillments: unknown }[];
  return { signedIn: true, parcels: rows.flatMap((r) => readTracking(r.fulfillments).map((t) => ({ order: r.order_number ?? 'Order', t }))) };
}

export default async function Track() {
  const { signedIn, parcels } = await myParcels();
  return (
    <div className="section max-w-2xl space-y-8">
      <header>
        <p className="eyebrow">Track your order</p>
        <h1 className="h2 text-4xl md:text-6xl">Where is my parcel?</h1>
        <p className="mt-4 text-lg text-white/80">Enter the tracking number from your shipping email to see where your parcel is.</p>
      </header>

      {supabaseConfigured && (
        <section className="glass rounded-[2rem] p-6 md:p-8" aria-labelledby="mine">
          <h2 id="mine" className="font-display text-2xl font-extrabold uppercase">Your parcels</h2>
          {signedIn ? (
            parcels.length ? (
              <ul className="mt-4 divide-y divide-white/10">
                {parcels.map(({ order, t }) => (
                  <li key={`${order}-${t.number}`} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                    <div>
                      <p className="font-semibold">{order}</p>
                      <p className="text-sm text-white/65">{t.company ? `${t.company}: ` : ''}{t.number}{statusLabel(t.status) ? ` · ${statusLabel(t.status)}` : ''}</p>
                    </div>
                    <a href={trackUrl(t)} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-4">Track parcel</a>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-white/70">No tracking numbers yet. They appear here once an order has shipped. See <Link href="/account" className="underline underline-offset-4">your account</Link> for your orders.</p>
          ) : (
            <p className="mt-3 text-white/70"><Link href="/login" className="font-semibold underline underline-offset-4">Sign in</Link> with the email you ordered with to see your tracking numbers here.</p>
          )}
        </section>
      )}

      <section className="glass rounded-[2rem] p-6 md:p-8" aria-labelledby="lookup"><h2 id="lookup" className="sr-only">Look up a tracking number</h2><TrackForm /></section>

      <section className="space-y-3 text-white/80">
        <h2 className="font-display text-2xl font-extrabold uppercase text-white">Good to know</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your tracking number is in the shipping email we send when your order is dispatched. Check your spam folder if it is missing.</li>
          <li>A new number can take a few days to show movement after dispatch.</li>
          <li>Transit time: <Fact value={POLICIES.transitTime} label="Shipping transit time" /></li>
          <li>Have an account? Your order status is also on <Link href="/customer/orders" className="underline underline-offset-4">your orders page</Link>.</li>
        </ul>
        <p>Still stuck? <Link href="/help#contact" className="font-semibold underline underline-offset-4">Contact us</Link> with your order number.</p>
      </section>
    </div>
  );
}
