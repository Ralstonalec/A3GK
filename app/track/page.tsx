import type { Metadata } from 'next';
import Link from 'next/link';
import { Fact } from '@/components/Tbc';
import { TrackForm } from '@/components/TrackForm';
import { POLICIES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Follow your A3GK parcel with the tracking number from your shipping email.',
};

export default function Track() {
  return (
    <div className="section max-w-2xl space-y-8">
      <header>
        <p className="eyebrow">Track your order</p>
        <h1 className="h2 text-4xl md:text-6xl">Where is my parcel?</h1>
        <p className="mt-4 text-lg text-white/80">Enter the tracking number from your shipping email to see where your parcel is.</p>
      </header>

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
