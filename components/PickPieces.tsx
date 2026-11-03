import Image from 'next/image';
import Link from 'next/link';
import { HANDLES, PIECES, PRICING } from '@/lib/content';

type Card = { handle: string; src: string; w: number; h: number; alt: string; fit: 'cover' | 'contain'; pos?: string; rendering?: boolean };

/** One photo per piece. The short-sleeve top has no photograph yet, so it uses the rendering and says so. */
const CARDS: Card[] = [
  { handle: HANDLES.longTop, src: '/shop/set-on-pitch.jpg', w: 723, h: 777, alt: 'A3GK long-sleeve padded top: honeycomb panels on the chest, ribs and arms', fit: 'cover', pos: '8% 40%' },
  { handle: HANDLES.shortTop, src: '/photos/short-closeup.webp', w: 1600, h: 1195, alt: 'Rendering of the A3GK short-sleeve padded top: chest panel, two rib panels and a panel on the short sleeve', fit: 'cover', pos: '50% 20%', rendering: true },
  { handle: HANDLES.leggings, src: '/photos/card-leggings.webp', w: 814, h: 786, alt: 'A3GK padded leggings, side and back view, with hip, thigh and knee panels', fit: 'contain' },
  { handle: HANDLES.shorts, src: '/photos/card-shorts.webp', w: 402, h: 798, alt: 'A3GK padded shorts, side view, with a joined hip and thigh panel', fit: 'contain' },
];

const info = (h: string) => [...PIECES.tops, ...PIECES.bottoms].find((p) => p.handle === h);

function Tile({ c }: { c: Card }) {
  const piece = info(c.handle);
  return (
    <li>
      <Link href={`/products/${c.handle}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0e1117] transition hover:-translate-y-0.5 hover:border-accent/60">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0e1117]">
          <Image
            src={c.src}
            alt={c.alt}
            fill
            sizes="(min-width:1024px) 22vw, 45vw"
            className={`${c.fit === 'cover' ? 'object-cover' : 'object-contain p-3'} transition duration-700 group-hover:scale-[1.03]`}
            style={c.pos ? { objectPosition: c.pos } : undefined}
          />
          {c.rendering && <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80">Rendering</span>}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="font-display text-lg font-extrabold uppercase leading-none md:text-xl">{piece?.label ?? c.handle}</p>
          <p className="text-xs text-white/65 md:text-sm">{piece?.padding}</p>
          <p className="mt-auto pt-2 text-xs font-semibold md:text-sm">${PRICING.piece} {PRICING.currency} <span className="text-accent underline-offset-4 group-hover:underline">See details →</span></p>
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
          <p className="eyebrow">Choose your pieces</p>
          <h2 className="h2 text-4xl md:text-5xl">One layer, your length.</h2>
          <p className="mt-3 max-w-xl text-white/75">Pick a top and a bottom. Long sleeves and leggings add padding at the elbows, forearms and knees. Short sleeves and shorts keep the chest, ribs, hips and thighs covered.</p>
        </div>
        <p className="text-sm font-semibold">${PRICING.piece} {PRICING.currency} per piece · top + bottom ${PRICING.bundle} {PRICING.currency}</p>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">{CARDS.map((c) => <Tile key={c.handle} c={c} />)}</ul>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href={`/products/${HANDLES.base}`} className="btn-primary">Build your kit</Link>
        <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">Size guide</Link>
      </div>
    </div>
  );
}
