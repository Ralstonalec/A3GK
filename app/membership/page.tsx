import type { Metadata } from 'next';
import Link from 'next/link';
import { DrawRow } from '@/components/motion/DrawRow';
import { PageHero } from '@/components/motion/PageHero';
import { Tbc } from '@/components/Tbc';
import { supabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: 'Membership', description: 'A free A3GK account keeps your orders, tracking, saved sizes and saved items in one place.' };

export default function Membership() {
  return (
    <>
      <PageHero lines={['A3GK', 'Membership']} band="Members" intro="A free account keeps your orders, saved sizes and saved items in one place, and counts your purchases toward member rewards when they launch.">
        {supabaseConfigured ? <Link href="/login" className="btn-primary">Create a free account</Link> : <Tbc label="Accounts are not connected yet" />}
        <Link href="/club" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">Just want the emails? Join the Club</Link>
      </PageHero>
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-6" aria-label="What an account gives you">
        <ul>
          <DrawRow i={0} title="Order history">Orders paid with your account email appear in your account, with tracking numbers once they ship.</DrawRow>
          <DrawRow i={1} title="Saved sizes and items">Keep your measurements and the products you want to come back to.</DrawRow>
          <DrawRow i={2} title="Emails, only if you ask">Tick the box at sign-up (or in your account) to hear about new products and rewards. Every email has an unsubscribe link.</DrawRow>
          <DrawRow i={3} title="Rewards"><Tbc label="What rewards members earn and how" /></DrawRow>
        </ul>
        <p className="mt-8 max-w-2xl text-sm text-white/60">Use the same email address at checkout as on your account so your orders are matched. We store the order number, items and total, not your payment details.</p>
      </section>
    </>
  );
}
