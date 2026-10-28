import Image from 'next/image';
import Link from 'next/link';
import { HANDLES, WEAR_NOTE } from '@/lib/content';
import { PROMO, type Promo } from '@/lib/photos';

const get = (id: Promo['id']) => PROMO.find((p) => p.id === id);

const Tag = () => (
  <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 backdrop-blur">Rendering</span>
);

function Tile({ p, className, sizes, priority }: { p: Promo; className: string; sizes: string; priority?: boolean }) {
  return (
    <figure className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 ${className}`}>
      <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes={sizes} priority={priority} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <Tag />
      {p.caption && <figcaption className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white drop-shadow">{p.caption}</figcaption>}
    </figure>
  );
}

/** "In action" bento grid. Renders nothing until promo images are added to PROMO. */
export function PromoGallery() {
  const dive = get('dive');
  const stance = get('stance');
  const closeup = get('closeup');
  if (!dive && !stance && !closeup) return null;
  return (
    <div>
      {dive && <Tile p={dive} className="mb-4 aspect-video" sizes="100vw" />}
      <div className="grid gap-4 md:grid-cols-5">
        {closeup && <Tile p={closeup} className="aspect-[4/3] md:col-span-3" sizes="(min-width:768px) 60vw, 100vw" />}
        {stance && <Tile p={stance} className="aspect-[3/4] md:col-span-2 md:aspect-auto" sizes="(min-width:768px) 40vw, 100vw" />}
      </div>
      <p className="mt-3 max-w-3xl text-sm text-white/70"><strong className="text-white">Short sleeves or shorts?</strong> {WEAR_NOTE}</p>
      <p className="mt-2 text-sm text-white/55">Renderings based on the real garments, not photographs. Padding is on the front only: the back is plain fabric.</p>
    </div>
  );
}

/** Wide banner with the headline sitting in the image's empty dark area. Renders nothing without a banner image. */
export function PromoBanner() {
  const b = get('banner');
  if (!b) return null;
  return (
    <section className="relative mx-auto w-full max-w-[1600px] px-4 md:px-[4%]" aria-label="A3GK padded base layer">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
        <Image src={b.src} alt={b.alt} width={b.w} height={b.h} sizes="100vw" className="aspect-[4/3] w-full object-cover object-left md:aspect-auto md:h-auto" />
        <Tag />
        <div className="flex flex-col gap-4 p-6 md:absolute md:inset-y-0 md:right-0 md:w-[42%] md:justify-center md:p-10">
          <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.9] md:text-6xl"><span className="outline-text">Padded where</span><br />it counts.</h2>
          <p className="max-w-sm text-white/80">Front panels on the chest, ribs, arms, hips, thighs and knees. Smooth fabric everywhere else.</p>
          <Link href={`/products/${HANDLES.base}`} className="btn-primary self-start">Shop the Base Layer</Link>
        </div>
      </div>
    </section>
  );
}
