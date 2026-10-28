import type { Metadata } from 'next';
import Link from 'next/link';
import { Tbc } from '@/components/Tbc';
import { supabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: 'Membership' };

export default function Membership() {
  return (
    <div className="section max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">A3GK members</p>
        <h1 className="h2">Membership</h1>
        <p className="mt-4 text-lg text-white/80">A free account keeps your orders, saved sizes and saved items in one place, and counts your purchases toward member rewards when they launch.</p>
      </div>
      <ul className="glass space-y-3 rounded-3xl p-6 text-white/85">
        <li><strong className="text-white">Order history.</strong> Orders paid with your account email appear in your account.</li>
        <li><strong className="text-white">Saved sizes and items.</strong> Keep your measurements and the products you want to come back to.</li>
        <li><strong className="text-white">Emails, only if you ask.</strong> Tick the box at sign-up (or in your account) to hear about new products and rewards. Every email has an unsubscribe link.</li>
        <li><strong className="text-white">Rewards.</strong> <Tbc label="What rewards members earn and how" /></li>
      </ul>
      <p className="text-sm text-white/60">Use the same email address at checkout as on your account so your orders are matched. We store the order number, items and total, not your payment details.</p>
      {supabaseConfigured ? <Link href="/login" className="btn-primary">Create a free account</Link> : <Tbc label="Accounts are not connected yet" />}
    </div>
  );
}
