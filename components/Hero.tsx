import Link from 'next/link';
import { HANDLES } from '@/lib/content';
import { LazyScene } from './LazyScene';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal-900 text-white">
      <LazyScene poster="/hero-poster.svg" label="Illustrative render of knit fabric over a matte foam layer" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/70 to-transparent" />
      <div className="relative mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-center px-4 py-20">
        <p className="eyebrow !text-white/60">A3GK · Padded base layer</p>
        <h1 className="max-w-2xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
          Goalkeeper kit starts underneath.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-white/80">
          Meet the A3GK padded base layer. Explore the design, see the padding details, and find your size.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={`/products/${HANDLES.base}`} className="btn-primary">Shop the Base Layer</Link>
          <Link href="/size-guide" className="font-semibold underline underline-offset-4">View Size Guide</Link>
        </div>
        <p className="mt-10 text-xs text-white/50">Illustrative render. Product photography to be added.</p>
      </div>
    </section>
  );
}
