import Link from 'next/link';
import { ProductFilm } from '@/components/ProductFilm';
import { PickPieces } from '@/components/PickPieces';
import { Reveal } from '@/components/Reveal';
import { TurfProblem } from '@/components/TurfProblem';
import { SceneBackdrop } from '@/components/SceneBackdrop';
import { SCENE } from '@/lib/photos';

export default function Home() {
  return (
    <>
      <div className="relative">
      <ProductFilm />

      <TurfProblem />

      {/* Pick pieces, then the two other ways in */}
      <section id="pieces" className="section relative isolate scroll-mt-24 !py-14 md:!py-20" aria-label="Choose your pieces">
        <SceneBackdrop scene={SCENE.stadiumNight} position="60% 40%" />
        <Reveal><PickPieces /></Reveal>
        <Reveal className="mt-10 grid gap-3 md:grid-cols-2">
          <Link href="/team" className="glass group rounded-3xl p-6 transition hover:bg-white/10">
            <p className="font-display text-2xl font-extrabold uppercase">Kitting out a team?</p>
            <p className="mt-1 text-sm text-white/70">Tell us what you need and we will get back to you. <span className="font-semibold text-white underline-offset-4 group-hover:underline">Ask about a team order →</span></p>
          </Link>
          <Link href="/club" className="glass group rounded-3xl p-6 transition hover:bg-white/10">
            <p className="font-display text-2xl font-extrabold uppercase">Hear it first</p>
            <p className="mt-1 text-sm text-white/70">An email when new gear drops, and early access to future products. <span className="font-semibold text-white underline-offset-4 group-hover:underline">Join the club →</span></p>
          </Link>
        </Reveal>
      </section>
      </div>
    </>
  );
}
