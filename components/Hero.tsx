import Image from 'next/image';
import Link from 'next/link';
import { HANDLES } from '@/lib/content';
import { RENDER } from '@/lib/photos';
import { HeroViews } from './HeroViews';

export function Hero() {
  return (
    <section data-stage="hero" className="relative flex min-h-[100svh] flex-col justify-between px-4 pb-10 pt-28 md:px-[4%]">
      {/* static fallback: the real photographs (JS off, reduced motion, no WebGL) */}
      <div className="hero-poster pointer-events-none absolute inset-0 flex items-end justify-center gap-4 pb-4 md:items-center md:justify-end md:pb-0 md:pr-[8%]">
        <Image src={RENDER.src} alt={RENDER.alt} width={RENDER.w} height={RENDER.h} priority sizes="(min-width:768px) 60vw, 100vw" className="h-auto w-full max-w-[900px] self-center" />
      </div>

      <div className="relative z-10 grid flex-1 items-stretch gap-8 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-6 md:py-6">
          <h1 className="font-display text-[clamp(3.4rem,8.4vw,9rem)] font-extrabold uppercase leading-[0.82] tracking-tight">
            <span className="outline-text">Goalkeeper</span>
            <br />
            kit starts
            <br />
            underneath.
          </h1>
          <p className="max-w-md text-lg text-white/75">
            Meet the A3GK padded base layer. Explore the design, see the padding details, and find your size.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href={`/products/${HANDLES.base}`} className="group flex items-center gap-5 rounded-full bg-black/50 py-1.5 pl-6 pr-1.5 text-sm font-bold uppercase tracking-wider backdrop-blur transition hover:-translate-y-0.5 hover:bg-black/70">
              Shop the Base Layer
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-2xl font-black text-ink">+</span>
            </Link>
            <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">View Size Guide</Link>
          </div>
          <div className="stage-only h-[46svh] md:hidden" aria-hidden />
        </div>

        <div className="flex flex-col items-end justify-between gap-8 md:py-6 md:text-right">
          <div><HeroViews /></div>
          <p className="hidden font-display text-[clamp(3rem,6vw,6.5rem)] font-extrabold uppercase leading-[0.85] md:block">
            <span className="outline-text">See the</span>
            <br />
            padding
          </p>
        </div>
      </div>

      <p className="relative z-10 mt-6 flex flex-wrap items-center gap-x-4 text-xs text-white/55">
        <span className="stage-only inline-flex items-center gap-2"><span className="inline-block h-6 w-px animate-pulse bg-white/40" /> Scroll to look closer</span>
        <span className="stage-only">Rendering based on the real garments. Real photographs are further down the page.</span>
        <span className="stage-off">Rendering based on the real garments.</span>
      </p>
    </section>
  );
}
