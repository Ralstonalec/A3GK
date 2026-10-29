import Link from 'next/link';
import { HANDLES, PRICING } from '@/lib/content';
import { SCENE } from '@/lib/photos';
import { SceneBackdrop } from './SceneBackdrop';

const save = PRICING.piece * 2 - PRICING.bundle;

/** Price graphic: one piece, or a top and a bottom. Numbers come from PRICING so they match Shopify. */
export function PricingBand() {
  return (
    <section className="section relative isolate !py-12" aria-labelledby="pricing">
      <SceneBackdrop scene={SCENE.stadiumNight} position="60% 40%" />
      <p className="eyebrow">Pricing</p>
      <h2 id="pricing" className="h2">Pick a piece. Or pair it.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="glass relative flex flex-col justify-between gap-8 overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/55">One piece</p>
            <p className="mt-3 font-display text-7xl font-extrabold leading-none md:text-8xl">${PRICING.piece}<span className="ml-2 text-2xl font-bold text-white/55">{PRICING.currency}</span></p>
            <p className="mt-4 max-w-xs text-white/75">Any top or any bottom, on its own: long-sleeve top, short-sleeve top, leggings or shorts.</p>
          </div>
          <Link href={`/products/${HANDLES.base}`} className="btn-primary self-start">Build your kit</Link>
        </div>
        <div className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-[2rem] border border-accent/60 bg-accent/[0.08] p-6 shadow-[0_0_60px_-20px_rgb(var(--accent)/0.6)] md:p-8">
          <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink">Save ${save}</span>
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Top + bottom</p>
            <p className="mt-3 font-display text-7xl font-extrabold leading-none md:text-8xl">${PRICING.bundle}<span className="ml-2 text-2xl font-bold text-white/55">{PRICING.currency}</span></p>
            <p className="mt-4 max-w-xs text-white/80">Any top with any bottom, in any combination. Each in its own size.</p>
          </div>
          <Link href={`/products/${HANDLES.base}`} className="btn-primary relative z-10 self-start">Build a kit</Link>
        </div>
      </div>
      <p className="mt-3 text-sm text-white/55">The bundle price applies automatically at checkout when a top and a bottom are in the cart. Shipping and taxes are calculated at checkout.</p>
    </section>
  );
}
