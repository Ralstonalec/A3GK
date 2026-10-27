import Link from 'next/link';
import { HANDLES } from '@/lib/content';
import { LazyScene } from './LazyScene';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-charcoal-800 to-ink text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-16">
        <div>
          <p className="eyebrow !text-white/60">A3GK · Padded base layer</p>
          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
            Goalkeeper kit starts underneath.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-white/80">
            Meet the A3GK padded base layer. Explore the design, see the padding details, and find your size.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={`/products/${HANDLES.base}`} className="btn-primary">Shop the Base Layer</Link>
            <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">View Size Guide</Link>
          </div>
        </div>
        <div className="mx-auto w-full" style={{ maxWidth: "min(420px, calc((100svh - 140px) * 0.5625))" }}>
          <LazyScene
            src="/images/base-layer-hero.webp"
            width={1125}
            height={2000}
            alt="A3GK padded base layer: a black long-sleeve top and leggings with hexagon-textured padded panels"
          />
        </div>
      </div>
    </section>
  );
}
