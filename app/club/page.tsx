import type { Metadata } from 'next';
import Link from 'next/link';
import { ClubForm } from '@/components/ClubForm';
import { SCENE } from '@/lib/photos';
import { DrawRow } from '@/components/motion/DrawRow';
import { PageHero } from '@/components/motion/PageHero';
import { supabaseConfigured } from '@/lib/supabase/env';
import { Fact, Tbc } from '@/components/Tbc';
import { BUSINESS } from '@/lib/content';

export const metadata: Metadata = {
  title: 'A3 Goalkeepers Club',
  description: 'Join the A3 Goalkeepers Club to hear first when new A3GK products drop.',
};

const PERKS = [
  { t: 'First to know', d: 'An email the moment something new drops, so you are not finding out after it sells through.' },
  { t: 'Early access', d: 'Where we run early access on future products, club members are first in line.' },
  { t: 'Straight from A3GK', d: 'New pieces and product updates. Only when there is something worth sending.' },
];

export default function Club() {
  return (
    <div className="relative">
      <PageHero
        lines={['A3 Goalkeepers', 'Club']}
        band="First to know"
        scene={SCENE.pitchNight}
        scenePosition="50% 60%"
        intro="Be first to hear when new A3GK gear drops, and first in line for early access to future products."
        aside={<div className="rounded-[2rem] bg-[#0c0f14]/80 p-6 md:p-8">{supabaseConfigured ? <ClubForm /> : <Tbc label="Club sign-up is not connected yet" />}</div>}
      />

      <section className="mx-auto max-w-6xl px-4 pb-6 pt-6" aria-label="What members get">
        <ul>
          {PERKS.map((p, i) => <DrawRow key={p.t} i={i} title={p.t}>{p.d}</DrawRow>)}
        </ul>
      </section>

      <section className="section relative !py-10" aria-label="Member sign in">
        <div className="glass flex flex-col items-start justify-between gap-5 rounded-[2rem] p-6 md:flex-row md:items-center md:p-10">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-extrabold uppercase">Already a member?</h2>
            <p className="mt-2 text-white/75">Sign in to see your orders, tracking numbers, saved sizes and saved items.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">Member sign in</Link>
            <Link href="/track" className="min-h-[44px] self-center font-semibold underline underline-offset-4">Track a parcel</Link>
          </div>
        </div>
      </section>

      <section className="section relative !py-10">
        <div className="glass flex flex-col items-start justify-between gap-5 rounded-[2rem] p-6 md:flex-row md:items-center md:p-10">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-extrabold uppercase">Want an account too?</h2>
            <p className="mt-2 text-white/75">A free account keeps your orders, saved sizes and saved items in one place. Tick the email box when you sign up and you will get the same drop emails.</p>
          </div>
          <Link href="/membership" className="btn-primary">About accounts</Link>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-white/55">We only use your email to tell you about A3GK products. No spam, and every email will have an unsubscribe link.</p>
        <p className="mt-2 max-w-2xl text-sm text-white/55">Emails are sent by <Fact value={BUSINESS.legalName} label="Legal business name" />, <Fact value={BUSINESS.mailingAddress} label="Mailing address" />. See our <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.</p>
      </section>
    </div>
  );
}
