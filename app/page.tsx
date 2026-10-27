import Image from 'next/image';
import Link from 'next/link';
import { Accordion } from '@/components/Accordion';
import { Hero } from '@/components/Hero';
import { PhotoSlot } from '@/components/PhotoSlot';
import { ProductCard } from '@/components/ProductCard';
import { PurchasePanel } from '@/components/PurchasePanel';
import { Reveal } from '@/components/Reveal';
import { Fact, Tbc } from '@/components/Tbc';
import { BASE_LAYER, BRAND_INTRO, FAQ, HANDLES, POLICIES, SIZE_GUIDE } from '@/lib/content';
import { getProduct } from '@/lib/shopify';

export default async function Home() {
  const [base, socks, bandages] = await Promise.all([getProduct(HANDLES.base), getProduct(HANDLES.socks), getProduct(HANDLES.bandages)]);

  return (
    <>
      <Hero />

      {/* 3 — Quick overview */}
      <section className="section" aria-labelledby="overview">
        <Reveal>
          <p className="eyebrow">Overview</p>
          <h2 id="overview" className="h2">What it is</h2>
          <p className="mt-5 max-w-2xl text-lg">
            The A3GK padded base layer is a <strong><Fact value={BASE_LAYER.garmentType} label="Garment type: top, bottom or set" /></strong> worn underneath goalkeeper kit.
          </p>
          <dl className="mt-8 grid gap-px bg-charcoal-700/20 sm:grid-cols-2">
            {[
              ['What you receive', BASE_LAYER.included, 'What is included in each purchase'],
              ['Sold together or separately', BASE_LAYER.piecesSoldTogether === null ? null : BASE_LAYER.piecesSoldTogether ? 'Together' : 'Separately', 'Whether pieces are sold together'],
              ['Fabric', BASE_LAYER.fabricComposition, 'Fabric composition'],
              ['Padding', BASE_LAYER.paddingSpec, 'Verified padding specification'],
            ].map(([k, v, l]) => (
              <div key={k as string} className="bg-bone p-5">
                <dt className="text-xs font-bold uppercase tracking-widest text-charcoal-500">{k}</dt>
                <dd className="mt-1"><Fact value={v as string | null} label={l as string} /></dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* 4 — Padding & construction */}
      <section className="bg-charcoal-900 text-white" aria-labelledby="padding">
        <div className="section">
          <Reveal>
            <p className="eyebrow !text-white/60">Construction</p>
            <h2 id="padding" className="h2">Where it is padded</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <PhotoSlot label="Front view with padded areas labelled" className="min-h-[260px] !bg-charcoal-800 !text-amber-200" />
              <PhotoSlot label="Back view with padded areas labelled" className="min-h-[260px] !bg-charcoal-800 !text-amber-200" />
              <PhotoSlot label="Close-up of padding and seams" className="min-h-[260px] !bg-charcoal-800 !text-amber-200" />
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-bold">Padded areas</h3>
                {BASE_LAYER.paddedAreas.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">{BASE_LAYER.paddedAreas.map((p) => <li key={p.id}><strong>{p.label}.</strong> {p.description}</li>)}</ul>
                ) : <p className="mt-2"><Tbc label="Actual padding locations" /></p>}
              </div>
              <div>
                <h3 className="font-bold">How the padding is built in</h3>
                <p className="mt-2 text-white/80"><Fact value={BASE_LAYER.paddingSpec} label="Padding material, thickness and how it is incorporated" /></p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5 — Fit & sizing */}
      <section className="section" aria-labelledby="fit">
        <Reveal>
          <p className="eyebrow">Fit and sizing</p>
          <h2 id="fit" className="h2">Find your size</h2>
          <p className="mt-4 max-w-2xl"><Fact value={BASE_LAYER.intendedFit} label="Intended fit" /></p>
          <div className="mt-6 overflow-x-auto">
            {SIZE_GUIDE.rows.length ? (
              <table className="w-full min-w-[420px] border-collapse text-left">
                <caption className="mb-2 text-left text-sm text-charcoal-500">
                  {SIZE_GUIDE.measurementType ? `${SIZE_GUIDE.measurementType === 'body' ? 'Body' : 'Garment'} measurements in ${SIZE_GUIDE.unit}` : <Tbc label="Whether figures are body or garment measurements" />}
                </caption>
                <thead><tr>{SIZE_GUIDE.columns.map((c) => <th key={c} className="border-b-2 border-ink p-3">{c}</th>)}</tr></thead>
                <tbody>{SIZE_GUIDE.rows.map((r, i) => <tr key={i} className="border-b border-charcoal-700/20">{r.map((c, j) => <td key={j} className="p-3">{c}</td>)}</tr>)}</tbody>
              </table>
            ) : <Tbc label="Sizes and measurement chart" />}
          </div>
          <Link href="/size-guide" className="btn-primary mt-6 !bg-ink !text-white">Open the full size guide</Link>
        </Reveal>
      </section>

      {/* 6 — Product in use */}
      <section className="bg-white" aria-labelledby="in-use">
        <div className="section">
          <Reveal>
            <p className="eyebrow">In use</p>
            <h2 id="in-use" className="h2">How it sits under your kit</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <PhotoSlot label="Real photo: worn alone, showing fit" className="min-h-[300px]" />
              <PhotoSlot label="Real photo: worn under goalkeeper kit" className="min-h-[300px]" />
            </div>
            <p className="mt-4 text-sm text-charcoal-500">Only authentic photography of the real product will be used here. Outer kit shown is not included unless stated.</p>
          </Reveal>
        </div>
      </section>

      {/* 7 — Purchase area */}
      <section id="buy" className="section" aria-label="Buy the padded base layer">
        <div className="grid gap-10 md:grid-cols-2">
          <Image src="/images/base-layer-hero.webp" alt="A3GK padded base layer top and leggings laid flat" width={1125} height={2000} sizes="(min-width:768px) 40vw, 100vw" className="w-full max-w-sm justify-self-center" />
          {base && <PurchasePanel product={base} preorderNote={null} />}
        </div>
      </section>

      {/* 8 — Complete your kit */}
      <section id="complete-your-kit" className="section !py-12" aria-labelledby="kit">
        <h2 id="kit" className="font-display text-2xl font-bold uppercase">Complete your kit</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {socks && <ProductCard product={socks} />}
          {bandages && <ProductCard product={bandages} />}
        </div>
        <p className="mt-3 text-sm text-charcoal-500">Optional extras. Nothing is added to your order automatically.</p>
      </section>

      {/* 9 — Brand intro */}
      <section className="bg-charcoal-900 text-white" aria-labelledby="brand">
        <div className="section">
          <h2 id="brand" className="h2">A3GK</h2>
          <p className="mt-5 max-w-2xl text-lg text-white/85">{BRAND_INTRO}</p>
        </div>
      </section>

      {/* 10 — FAQ + contact */}
      <section className="section" aria-labelledby="faq">
        <h2 id="faq" className="h2">Questions</h2>
        <div className="mt-8">
          <Accordion items={FAQ.map((f) => ({ title: f.q, body: f.a ?? <Tbc label={f.tbc} /> }))} />
        </div>
        <p className="mt-8">
          Need a hand? <Link href="/help#contact" className="font-semibold underline underline-offset-4">Contact us</Link>
          {POLICIES.contactEmail ? <> — {POLICIES.contactEmail}</> : <> <Tbc label="Customer-service contact details" /></>}
        </p>
      </section>
    </>
  );
}
