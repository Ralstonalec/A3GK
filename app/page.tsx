import Link from 'next/link';
import { Accordion } from '@/components/Accordion';
import { ClubForm } from '@/components/ClubForm';
import { Hero } from '@/components/Hero';
import { PaddingTour } from '@/components/PaddingTour';
import { StageHost } from '@/components/StageHost';
import { KitBuilder } from '@/components/KitBuilder';
import { MacroGrid } from '@/components/MacroGrid';
import { PhotoSlot } from '@/components/PhotoSlot';
import { ProductCard } from '@/components/ProductCard';
import { PromoGallery } from '@/components/PromoGallery';
import { Reveal } from '@/components/Reveal';
import { TurfProblem } from '@/components/TurfProblem';
import { SceneBackdrop } from '@/components/SceneBackdrop';
import { ShortSet } from '@/components/ShortSet';
import { Tbc } from '@/components/Tbc';
import { BRAND_INTRO, FAQ, HANDLES, POLICIES } from '@/lib/content';
import { PROMO, SCENE } from '@/lib/photos';
import { getProduct, unavailable } from '@/lib/shopify';
import { supabaseConfigured } from '@/lib/supabase/env';

export default async function Home() {
  const [socks, bandages] = await Promise.all([getProduct(HANDLES.socks), getProduct(HANDLES.bandages)]);
  const kit = await Promise.all([HANDLES.longTop, HANDLES.shortTop, HANDLES.leggings, HANDLES.shorts].map(async (h) => (await getProduct(h)) ?? unavailable(h)));

  return (
    <>
      <StageHost />
      <div className="relative z-10">
      <Hero />

      <TurfProblem />

            {/* Scroll tour of the padded areas (the 3D stage moves across the garments). Only takes space when the stage is live. */}
      <div id="tour" />
      <section data-stage="padding" className="stage-only relative h-[300svh]" aria-labelledby="padding">
        <div className="sticky top-0 flex h-[100svh] items-start px-4 pt-20 md:px-[4%] md:pt-28">
          <div className="max-w-sm">
            <p className="eyebrow">The solution</p>
            <h2 id="padding" className="h2 text-4xl md:text-6xl">Built into the layer</h2>
            <p className="mt-4 text-white/75">Hexagonal panels designed to spread the impact and still flex with you. Padding on the front only, smooth fabric on the back. Scroll to move across each padded area.</p>
            <PaddingTour />
          </div>
        </div>
      </section>

      <section id="closeups" className="section scroll-mt-24 !py-10" aria-labelledby="closeups-h">
        <h2 id="closeups-h" className="sr-only">Close-ups</h2>
        <MacroGrid />
        <p className="mt-3 text-sm text-white/55">Photographs of the real garments. Swipe or scroll for more.</p>
      </section>

      {/* In use */}
      <section className="section !py-14 md:!py-20" aria-labelledby="in-use">
        <Reveal>
          <p className="eyebrow">In use</p>
          <h2 id="in-use" className="h2 text-4xl md:text-5xl">How it sits under your kit</h2>
          <div className="mt-6">
            {PROMO.length ? <PromoGallery /> : (
              <div className="grid gap-4 md:grid-cols-2">
                <PhotoSlot label="Real photo: worn alone, showing fit" className="min-h-[300px] rounded-3xl" />
                <PhotoSlot label="Real photo: worn under goalkeeper kit" className="min-h-[300px] rounded-3xl" />
              </div>
            )}
          </div>
        </Reveal>
        <div className="mt-8"><ShortSet compact /></div>
      </section>

      {/* Buy, on the pitch */}
      <section id="buy" className="section relative isolate !py-14 md:!py-20" aria-label="Buy the padded base layer">
        <SceneBackdrop scene={SCENE.stadiumNight} position="60% 40%" />
        <div className="mx-auto max-w-2xl"><div className="glass rounded-[2rem] p-6 md:p-10"><KitBuilder products={kit} /></div></div>
      </section>

      {/* Extras */}
      <section id="complete-your-kit" className="section !py-10" aria-labelledby="kit">
        <h2 id="kit" className="font-display text-3xl font-extrabold uppercase">Complete your kit</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {socks && <ProductCard product={socks} />}
          {bandages && <ProductCard product={bandages} />}
        </div>
      </section>

      {/* Club */}
      <section className="section !py-10" aria-labelledby="club">
        <Reveal className="glass relative isolate grid items-center gap-8 overflow-hidden rounded-[2rem] p-6 md:grid-cols-2 md:p-10">
          <SceneBackdrop scene={SCENE.grassLine} position="50% 70%" fade="bottom" />
          <div>
            <p className="eyebrow">A3 Goalkeepers Club</p>
            <h2 id="club" className="h2 text-4xl md:text-5xl">Hear it first</h2>
            <p className="mt-4 text-white/75">An email when new gear drops, and first in line for early access to future products. <Link href="/club" className="font-semibold underline underline-offset-4">More about the club</Link></p>
          </div>
          {supabaseConfigured ? <ClubForm id="home-join" /> : <Link href="/club" className="btn-primary justify-self-start">Join the club</Link>}
        </Reveal>
      </section>

      {/* About + FAQ */}
      <section className="section !py-14 md:!py-20" aria-labelledby="faq">
        <p className="max-w-2xl text-lg text-white/80"><span className="font-display text-2xl font-extrabold"><span className="outline-text">A3</span>GK</span> {BRAND_INTRO}</p>
        <h2 id="faq" className="h2 mt-10 text-4xl md:text-5xl">Questions</h2>
        <div className="mt-6"><Accordion items={FAQ.map((f) => ({ title: f.q, body: f.a ?? <Tbc label={f.tbc} /> }))} /></div>
        <p className="mt-8">
          Need a hand? <Link href="/help#contact" className="font-semibold underline underline-offset-4">Contact us</Link>
          {POLICIES.contactEmail ? <> — {POLICIES.contactEmail}</> : <> <Tbc label="Customer-service contact details" /></>}
        </p>
      </section>
      </div>
    </>
  );
}
