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
        <Image src={RENDER.src} alt={RENDER.alt} width={RENDER.w} height={RENDER.h} priority sizes="(min-width:768px) 60vw, 100vw" className="h-auto w-full max-w-[900px] self-end md:self-center" />
      </div>

      <div className="relative z-10 grid flex-1 items-stretch gap-8 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-5 md:py-2">
          <Image src="/brand/a3gk-logo-white.png" alt="A3GK, A3 Goalkeeping" width={738} height={757} priority sizes="(min-width:768px) 360px, 200px" className="h-auto w-[clamp(90px,24vw,120px)] md:w-[clamp(110px,9vw,150px)]" />
          <h1 className="font-display text-[clamp(3rem,14vw,5rem)] font-extrabold uppercase leading-[0.84] md:text-[clamp(4rem,6.4vw,7rem)]">
            Goalkeeper{' '}
            <br />
            kit starts{' '}
            <br />
            <span className="text-accent">underneath</span>
          </h1>
          <p className="max-w-md text-lg text-white/75">
            Hexagonal padding designed to spread the impact of a dive, and still flex with you. Meet the A3GK padded base layer.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href={`/products/${HANDLES.base}`} className="btn-primary">Shop the base layer</Link>
            <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">View size guide</Link>
          </div>
          {/* Phone: room for the garments under the text. Reserved from the first paint, so nothing jumps when the 3D view takes over from the still image. */}
          <div className="h-[46svh] md:hidden" aria-hidden />
        </div>

        <div className="flex flex-col items-end justify-between gap-8 md:py-6 md:text-right">
          <div><HeroViews /></div>
        </div>
      </div>

      <p className="relative z-10 mt-6 flex min-h-[2.5rem] flex-wrap items-center gap-x-4 text-xs text-white/55 md:min-h-0">
        <span className="stage-only inline-flex items-center gap-2"><span className="inline-block h-6 w-px animate-pulse bg-white/40" /> Scroll to look closer</span>
        <span className="stage-only">Rendering based on the real garments. Real photographs are further down the page.</span>
        <span className="stage-off">Rendering based on the real garments.</span>
      </p>
    </section>
  );
}
