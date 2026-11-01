import Image from 'next/image';
import Link from 'next/link';
import { HANDLES, PRICING } from '@/lib/content';
import { SHORT_SET, type ShortImage } from '@/lib/photos';

function Tile({ img, className, sizes }: { img: ShortImage; className: string; sizes: string }) {
  return (
    <figure className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 ${className}`}>
      <Image src={img.src} alt={img.alt} width={img.w} height={img.h} sizes={sizes} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      {img.caption && <figcaption className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white drop-shadow">{img.caption}</figcaption>}
    </figure>
  );
}

/** The short-sleeve top and padded shorts version. Availability and pricing are unconfirmed, so they show as "To confirm". */
export function ShortSet({ compact = false }: { compact?: boolean }) {
  const { banner, stance, closeup } = SHORT_SET;
  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
        <Image src={banner.src} alt={banner.alt} width={banner.w} height={banner.h} sizes="(min-width:1024px) 90vw, 100vw" className={`w-full object-cover object-left ${compact ? 'aspect-[21/9]' : 'aspect-[4/3] md:aspect-auto md:h-auto'}`} />
          <div className={`flex flex-col gap-3 p-6 ${compact ? '' : 'md:absolute md:inset-y-0 md:right-0 md:w-[42%] md:justify-center md:p-10'}`}>
          <p className="eyebrow">Short-sleeve version</p>
          <h3 className="font-display text-3xl font-extrabold uppercase leading-[0.95] md:text-5xl">Top and shorts</h3>
          <p className="max-w-sm text-white/80">The same padding as the long-sleeve set, without the elbow and knee panels: chest, ribs and a panel on each short sleeve, plus a joined hip-and-thigh panel on each leg.</p>
          <p className="text-sm text-white/70">Each piece is sold on its own, or in any combination with the long-sleeve top and leggings. <Link href={`/products/${HANDLES.base}`} className="font-semibold text-white underline underline-offset-4">Build your kit</Link>. ${PRICING.piece} {PRICING.currency} per piece, or ${PRICING.bundle} {PRICING.currency} for a top and a bottom.</p>
        </div>
      </div>
      {!compact && (
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <Tile img={closeup} className="aspect-[4/3] md:col-span-3" sizes="(min-width:768px) 60vw, 100vw" />
          <Tile img={stance} className="aspect-[3/4] md:col-span-2 md:aspect-auto" sizes="(min-width:768px) 40vw, 100vw" />
        </div>
      )}
      <p className="mt-3 text-sm text-white/55">Renderings based on the real garments, not photographs. Padding is on the front only: the back is plain fabric.</p>
    </div>
  );
}
