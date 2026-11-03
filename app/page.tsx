import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { PaddingTour } from '@/components/PaddingTour';
import { StageHost } from '@/components/StageHost';
import { PickPieces } from '@/components/PickPieces';
import { Reveal } from '@/components/Reveal';
import { TurfProblem } from '@/components/TurfProblem';
import { SceneBackdrop } from '@/components/SceneBackdrop';
import { SCENE } from '@/lib/photos';

export default function Home() {
  return (
    <>
      <StageHost />
      <div className="relative z-10">
      <Hero />

      <TurfProblem />

            {/* Scroll tour of the padded areas (the 3D stage moves across the garments). Only takes space when the stage is live. */}
      <div id="tour" />
      <section data-stage="padding" className="stage-only relative h-[300svh]" aria-labelledby="padding">
        <div className="sticky top-0 flex h-[100svh] items-start px-4 pt-20 md:px-[4%] md:pt-28">
          <div className="max-w-sm">
            <p className="eyebrow">The solution</p>
            <h2 id="padding" className="h2 text-4xl md:text-6xl">Built into the layer</h2>
            <p className="mt-4 text-white/75">Hexagonal panels designed to spread the impact and still flex with you. Padding on the front only, smooth fabric on the back. Scroll to move across each padded area.</p>
            <PaddingTour />
          </div>
        </div>
      </section>

      {/* Pick pieces, then the two other ways in */}
      <section id="pieces" className="section relative isolate scroll-mt-24 !py-14 md:!py-20" aria-label="Choose your pieces">
        <SceneBackdrop scene={SCENE.stadiumNight} position="60% 40%" />
        <Reveal><PickPieces /></Reveal>
        <Reveal className="mt-10 grid gap-3 md:grid-cols-2">
          <Link href="/team" className="glass group rounded-3xl p-6 transition hover:border-accent/60">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Team orders</p>
            <p className="mt-1 font-display text-2xl font-extrabold uppercase">Kitting out a team?</p>
            <p className="mt-1 text-sm text-white/70">Tell us what you need and we will get back to you. <span className="font-semibold text-white underline-offset-4 group-hover:underline">Ask about a team order →</span></p>
          </Link>
          <Link href="/club" className="glass group rounded-3xl p-6 transition hover:border-accent/60">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">A3 Goalkeepers Club</p>
            <p className="mt-1 font-display text-2xl font-extrabold uppercase">Hear it first</p>
            <p className="mt-1 text-sm text-white/70">An email when new gear drops, and early access to future products. <span className="font-semibold text-white underline-offset-4 group-hover:underline">Join the club →</span></p>
          </Link>
        </Reveal>
      </section>
      </div>
    </>
  );
}
