import Image from 'next/image';
import Link from 'next/link';
import { Accordion } from '@/components/Accordion';
import { Hero } from '@/components/Hero';
import { PhotoSlot } from '@/components/PhotoSlot';
import { ProductCard } from '@/components/ProductCard';
import { PurchasePanel } from '@/components/PurchasePanel';
import { Reveal } from '@/components/Reveal';
import { StageHost } from '@/components/StageHost';
import { Fact, Tbc } from '@/components/Tbc';
import { BASE_LAYER, BRAND_INTRO, FAQ, HANDLES, POLICIES, SIZE_GUIDE } from '@/lib/content';
import { getProduct } from '@/lib/shopify';

export default async function Home() {
  const [base, socks, bandages] = await Promise.all([getProduct(HANDLES.base), getProduct(HANDLES.socks), getProduct(HANDLES.bandages)]);

  return (
    <>
      <StageHost />
      <div className="relative z-10">
        <Hero />

        {/* 3 — Quick overview (3D garment slides to the right) */}
        <section data-stage="overview" className="flex min-h-[100svh] items-center" aria-labelledby="overview">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-[4%]">
            <Reveal className="glass max-w-xl rounded-[2rem] p-6 md:p-10">
              <p className="eyebrow">Overview</p>
              <h2 id="overview" className="h2">What it is</h2>
              <p className="mt-5 text-lg text-white/85">
                The A3GK padded base layer is a <strong className="text-white"><Fact value={BASE_LAYER.garmentType} label="Garment type: top, bottom or set" /></strong>, made to be worn underneath goalkeeper kit.
              </p>
              <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {[
                  ['What you receive', BASE_LAYER.included, 'What is included in each purchase'],
                  ['Sold together or separately', BASE_LAYER.piecesSoldTogether === null ? null : BASE_LAYER.piecesSoldTogether ? 'Together' : 'Separately', 'Whether pieces are sold together'],
                  ['Fabric', BASE_LAYER.fabricComposition, 'Fabric composition'],
                  ['Padding', BASE_LAYER.paddingSpec, 'Verified padding specification'],
                ].map(([k, v, l]) => (
                  <div key={k as string} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6">
                    <dt className="text-xs font-bold uppercase tracking-widest text-white/55">{k}</dt>
                    <dd className="sm:text-right"><Fact value={v as string | null} label={l as string} /></dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* 4 — Padding & construction: scroll separates the padding in 3D */}
        <section data-stage="padding" className="relative h-[260svh]" aria-labelledby="padding">
          <div className="sticky top-0 flex h-[100svh] items-start px-4 pt-20 md:px-[4%] md:pt-28">
            <div className="max-w-sm">
              <p className="eyebrow">Padding and construction</p>
              <h2 id="padding" className="h2 text-4xl md:text-6xl">Where it is padded</h2>
              <p className="mt-4 text-white/75"><span className="md:hidden">Scroll to separate the padding.</span><span className="hidden md:inline">Scroll to lift each padded panel off the garment. Panels are labelled only where they exist.</span></p>
              <ul className="mt-6 hidden space-y-2 text-sm md:block">
                {BASE_LAYER.paddedAreas.map((p) => (
                  <li key={p.id}><strong className="text-white">{p.label}.</strong> <span className="text-white/70">{p.description}</span></li>
                ))}
              </ul>
              <p className="mt-5 hidden text-sm md:block text-white/70"><Fact value={BASE_LAYER.paddingSpec} label="Padding material, thickness and how it is built in" /></p>
            </div>
          </div>
        </section>
        {/* readable copy of the same information for small screens and assistive tech */}
        <section className="section !py-10 md:hidden" aria-label="Padded areas">
          <ul className="glass space-y-2 rounded-3xl p-5 text-sm">
            {BASE_LAYER.paddedAreas.map((p) => <li key={p.id}><strong>{p.label}.</strong> <span className="text-white/70">{p.description}</span></li>)}
          </ul>
        </section>

        {/* 5 — Fit & sizing (garment drifts left) */}
        <section data-stage="fit" className="flex min-h-[100svh] items-center" aria-labelledby="fit">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-[4%]">
            <Reveal className="glass ml-auto max-w-xl rounded-[2rem] p-6 md:p-10">
              <p className="eyebrow">Fit and sizing</p>
              <h2 id="fit" className="h2">Find your size</h2>
              <p className="mt-4"><Fact value={BASE_LAYER.intendedFit} label="Intended fit" /></p>
              <div className="mt-6 overflow-x-auto">
                {SIZE_GUIDE.rows.length ? (
                  <table className="w-full min-w-[360px] border-collapse text-left">
                    <caption className="mb-2 text-left text-sm text-white/55">
                      {SIZE_GUIDE.measurementType ? `${SIZE_GUIDE.measurementType === 'body' ? 'Body' : 'Garment'} measurements in ${SIZE_GUIDE.unit}` : <Tbc label="Whether figures are body or garment measurements" />}
                    </caption>
                    <thead><tr>{SIZE_GUIDE.columns.map((c) => <th key={c} className="border-b-2 border-white/60 p-3">{c}</th>)}</tr></thead>
                    <tbody>{SIZE_GUIDE.rows.map((r, i) => <tr key={i} className="border-b border-white/15">{r.map((c, j) => <td key={j} className="p-3">{c}</td>)}</tr>)}</tbody>
                  </table>
                ) : <Tbc label="Sizes and measurement chart" />}
              </div>
              <Link href="/size-guide" className="btn-primary mt-6">Open the full size guide</Link>
            </Reveal>
          </div>
        </section>

        {/* 6 — Product in use (real photography only) */}
        <section className="section" aria-labelledby="in-use">
          <Reveal>
            <p className="eyebrow">In use</p>
            <h2 id="in-use" className="h2">How it sits under your kit</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <PhotoSlot label="Real photo: worn alone, showing fit" className="min-h-[300px] rounded-3xl" />
              <PhotoSlot label="Real photo: worn under goalkeeper kit" className="min-h-[300px] rounded-3xl" />
            </div>
            <p className="mt-4 text-sm text-white/55">Only authentic photography of the real product will be used here. Outer kit shown is not included unless stated.</p>
          </Reveal>
        </section>

        {/* 7 — Purchase area */}
        <section id="buy" className="section" aria-label="Buy the padded base layer">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <Image src="/images/base-layer-hero.webp" alt="A3GK padded base layer top and leggings laid flat" width={1125} height={2000} sizes="(min-width:768px) 40vw, 100vw" className="w-full max-w-sm justify-self-center rounded-3xl" />
            <div className="glass rounded-[2rem] p-6 md:p-10">{base && <PurchasePanel product={base} preorderNote={null} />}</div>
          </div>
        </section>

        {/* 8 — Complete your kit */}
        <section id="complete-your-kit" className="section !py-12" aria-labelledby="kit">
          <h2 id="kit" className="font-display text-3xl font-extrabold uppercase">Complete your kit</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {socks && <ProductCard product={socks} />}
            {bandages && <ProductCard product={bandages} />}
          </div>
          <p className="mt-3 text-sm text-white/55">Optional extras. Nothing is added to your order automatically.</p>
        </section>

        {/* 9 — Brand intro */}
        <section className="section" aria-labelledby="brand">
          <h2 id="brand" className="h2"><span className="outline-text">A3</span>GK</h2>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{BRAND_INTRO}</p>
        </section>

        {/* 10 — FAQ + contact */}
        <section className="section" aria-labelledby="faq">
          <h2 id="faq" className="h2">Questions</h2>
          <div className="mt-8"><Accordion items={FAQ.map((f) => ({ title: f.q, body: f.a ?? <Tbc label={f.tbc} /> }))} /></div>
          <p className="mt-8">
            Need a hand? <Link href="/help#contact" className="font-semibold underline underline-offset-4">Contact us</Link>
            {POLICIES.contactEmail ? <> — {POLICIES.contactEmail}</> : <> <Tbc label="Customer-service contact details" /></>}
          </p>
        </section>
      </div>
    </>
  );
}
