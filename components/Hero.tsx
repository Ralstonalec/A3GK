import Image from 'next/image';
import Link from 'next/link';
import { HANDLES, PRICING } from '@/lib/content';
import { CUT, SCENE } from '@/lib/photos';

/** The real set render, cut out of its studio background, floating over night-pitch scenery. */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-12 pt-28 md:px-[4%] md:pb-16 md:pt-32">
      <Image src={SCENE.grassLine.src} alt="" width={SCENE.grassLine.w} height={SCENE.grassLine.h} priority sizes="100vw" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080a0e]/90 via-[#080a0e]/40 to-[#080a0e]/10" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#080a0e] to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[0.9fr_1.4fr]">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-[clamp(3.2rem,7.6vw,8rem)] font-extrabold uppercase leading-[0.84] tracking-tight">
            <span className="outline-text">Goalkeeper</span>
            <br />
            kit starts
            <br />
            underneath.
          </h1>
          <p className="max-w-md text-lg text-white/80">The A3GK padded base layer. Front panels where you take the impact, smooth fabric everywhere else.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href={`/products/${HANDLES.base}`} className="group flex items-center gap-5 rounded-full bg-black/50 py-1.5 pl-6 pr-1.5 text-sm font-bold uppercase tracking-wider backdrop-blur transition hover:-translate-y-0.5 hover:bg-black/70">
              Build your kit
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-2xl font-black text-ink">+</span>
            </Link>
            <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">Size guide</Link>
          </div>
          <p className="text-sm font-semibold text-white/80">From ${PRICING.piece} {PRICING.currency} a piece · top + bottom ${PRICING.bundle} {PRICING.currency}</p>
        </div>
        <div className="relative">
          <span className="absolute bottom-2 right-0 z-10 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 backdrop-blur">Rendering</span>
          <div aria-hidden className="float-shadow absolute inset-x-[12%] bottom-0 h-8 rounded-[50%] bg-black/70 blur-xl" />
          <Image src={CUT.longSet.src} alt={CUT.longSet.alt} width={CUT.longSet.w} height={CUT.longSet.h} priority sizes="(min-width:768px) 58vw, 100vw" className="float-product relative mx-auto h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
        </div>
      </div>
    </section>
  );
}
