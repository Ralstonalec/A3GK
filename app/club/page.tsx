import type { Metadata } from 'next';
import Link from 'next/link';
import { ClubForm } from '@/components/ClubForm';
import Image from 'next/image';
import { RenderFigure } from '@/components/RenderFigure';
import { SCENE } from '@/lib/photos';
import { Reveal } from '@/components/Reveal';
import { supabaseConfigured } from '@/lib/supabase/env';
import { Tbc } from '@/components/Tbc';

export const metadata: Metadata = {
  title: 'A3 Goalkeepers Club',
  description: 'Join the A3 Goalkeepers Club to hear first when new A3GK products drop.',
};

const PERKS = [
  { n: '01', t: 'First to know', d: 'An email the moment something new drops, so you are not finding out after it sells through.' },
  { n: '02', t: 'Early access', d: 'Where we run early access on future products, club members are first in line.' },
  { n: '03', t: 'Straight from A3GK', d: 'New pieces and product updates. Only when there is something worth sending.' },
];

export default function Club() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px] md:h-[1000px]">
        <Image src={SCENE.pitchNight.src} alt="" width={SCENE.pitchNight.w} height={SCENE.pitchNight.h} priority sizes="100vw" className="h-full w-full object-cover object-[50%_60%] opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080a0e]/35 via-transparent to-[#080a0e]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0e]/75 via-[#080a0e]/15 to-transparent" />
      </div>
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <section className="section relative grid items-center gap-10 !pb-10 pt-36 md:grid-cols-[1.15fr_1fr] md:pt-44">
        <div>
        <p className="eyebrow">A3 Goalkeeping</p>
        <h1 className="font-display text-[clamp(3.2rem,10vw,9.5rem)] font-extrabold uppercase leading-[0.84] tracking-tight">
          <span className="outline-text">A3</span> Goalkeepers
          <br />
          Club
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/80">Be first to hear when new A3GK gear drops, and first in line for early access to future products.</p>
        <div className="glass mt-10 max-w-2xl rounded-[2rem] p-6 md:p-8">
          {supabaseConfigured ? <ClubForm /> : <Tbc label="Club sign-up is not connected yet" />}
        </div>
        </div>
        <div className="glass hidden rounded-3xl bg-black/40 p-4 md:block"><RenderFigure sizes="40vw" /></div>
      </section>

      <section className="section relative !py-10" aria-label="What members get">
        <ul className="grid gap-4 md:grid-cols-3">
          {PERKS.map((p, i) => (
            <li key={p.n}>
              <Reveal delay={i * 0.08} className="glass h-full rounded-3xl p-6">
                <p className="font-display text-5xl font-extrabold text-accent">{p.n}</p>
                <h2 className="mt-4 font-display text-2xl font-extrabold uppercase">{p.t}</h2>
                <p className="mt-2 text-white/75">{p.d}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="section relative !py-10">
        <div className="glass flex flex-col items-start justify-between gap-5 rounded-[2rem] p-6 md:flex-row md:items-center md:p-10">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-extrabold uppercase">Want an account too?</h2>
            <p className="mt-2 text-white/75">A free account keeps your orders, saved sizes and saved items in one place. Tick the email box when you sign up and you will get the same drop emails.</p>
          </div>
          <Link href="/membership" className="btn-primary">About accounts</Link>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-white/55">Background image is a rendering. We only use your email to tell you about A3GK products. No spam, and every email will have an unsubscribe link.</p>
      </section>
    </div>
  );
}
