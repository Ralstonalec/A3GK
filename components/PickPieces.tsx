import Image from 'next/image';
import Link from 'next/link';
import { HANDLES, PIECES, PRICING } from '@/lib/content';
import { CurrencyNote, Money } from './Money';

type Card = { handle: string; src: string; w: number; h: number; alt: string; pos: string };

/** One picture per piece, cropped from the two studio renderings (long set and short set). All are renderings, and say so. */
const LONG = { src: '/photos/render-set.webp', w: 2000, h: 1116 };
const SHORT = { src: '/photos/short-set.webp', w: 1376, h: 768 };
const CARDS: Card[] = [
  { handle: HANDLES.longTop, ...LONG, alt: 'Rendering of the A3GK long-sleeve padded top: honeycomb panels on the chest, ribs and arms', pos: '17% 50%' },
  { handle: HANDLES.shortTop, ...SHORT, alt: 'Rendering of the A3GK short-sleeve padded top: a chest panel, two rib panels and a panel on each short sleeve', pos: '12% 50%' },
  { handle: HANDLES.leggings, ...LONG, alt: 'Rendering of the A3GK padded leggings: hip, thigh and knee panels and a printed waistband', pos: '100% 50%' },
  { handle: HANDLES.shorts, ...SHORT, alt: 'Rendering of the A3GK padded shorts: a joined hip-and-thigh panel on each leg and a printed waistband', pos: '88% 50%' },
];

const info = (h: string) => [...PIECES.tops, ...PIECES.bottoms].find((p) => p.handle === h);

function Tile({ c }: { c: Card }) {
  const piece = info(c.handle);
  return (
    <li>
      <Link href={`/products/${c.handle}`} className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white/[0.06] transition hover:bg-white/10">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0e1117]">
          <Image
            src={c.src}
            alt={c.alt}
            fill
            sizes="(min-width:1024px) 22vw, 45vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
            style={{ objectPosition: c.pos }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="font-display text-lg font-extrabold uppercase leading-none md:text-xl">{piece?.label ?? c.handle}</p>
          <p className="text-xs text-white/65 md:text-sm">{piece?.padding}</p>
          <p className="mt-auto pt-2 text-xs font-semibold md:text-sm"><Money cad={PRICING.piece} /> <span className="text-accent underline-offset-4 group-hover:underline">See details →</span></p>
        </div>
      </Link>
    </li>
  );
}

/** The four pieces as choices of one product: pick a top and a bottom, in the length you want. */
export function PickPieces() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="h2 text-4xl md:text-5xl">One layer, your length</h2>
          <p className="mt-3 max-w-xl text-white/75">Pick a top and a bottom. Long sleeves and leggings add padding at the elbows, forearms and knees. Short sleeves and shorts keep the chest, ribs, hips and thighs covered.</p>
        </div>
        <div className="text-sm font-semibold"><p><Money cad={PRICING.piece} showCode /> per piece · top + bottom <Money cad={PRICING.bundle} showCode /></p><CurrencyNote className="mt-1 font-normal" /></div>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">{CARDS.map((c) => <Tile key={c.handle} c={c} />)}</ul>
      <p className="mt-3 text-xs text-white/55">Images are renderings of the real garments.</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href={`/products/${HANDLES.base}`} className="btn-primary">Build your kit</Link>
        <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">Size guide</Link>
      </div>
    </div>
  );
}
