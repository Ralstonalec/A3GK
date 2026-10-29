import Image from 'next/image';
import Link from 'next/link';
import { HANDLES } from '@/lib/content';
import { CUT, SCENE } from '@/lib/photos';

/** The real set render, cut out of its studio background, floating over night-pitch scenery. */
export function FloatBanner() {
  return (
    <section className="relative mx-auto w-full max-w-[1600px] px-4 md:px-[4%]" aria-label="A3GK padded base layer">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10">
        <Image src={SCENE.grassLine.src} alt="" width={SCENE.grassLine.w} height={SCENE.grassLine.h} sizes="100vw" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080a0e]/85 via-[#080a0e]/35 to-transparent" />
        <span className="absolute left-3 top-3 z-10 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 backdrop-blur">Rendering</span>
        <div className="grid items-center gap-6 p-6 pt-14 md:grid-cols-[0.8fr_1.5fr] md:p-10 md:pt-10">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.9] md:text-6xl"><span className="outline-text">Padded where</span><br />it counts.</h2>
            <p className="max-w-sm text-white/80">Front panels on the chest, ribs, arms, hips, thighs and knees. Smooth fabric everywhere else.</p>
            <Link href={`/products/${HANDLES.base}`} className="btn-primary self-start">Shop the Base Layer</Link>
          </div>
          <div className="relative">
            <div aria-hidden className="float-shadow absolute inset-x-[12%] bottom-0 h-8 rounded-[50%] bg-black/70 blur-xl" />
            <Image src={CUT.longSet.src} alt={CUT.longSet.alt} width={CUT.longSet.w} height={CUT.longSet.h} sizes="(min-width:768px) 55vw, 100vw" className="float-product relative mx-auto h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
