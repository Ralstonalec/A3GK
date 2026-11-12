'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_LAYER, HANDLES } from '@/lib/content';
import { RENDER } from '@/lib/photos';
import { TOUR, type Rect } from '@/lib/tour';

/**
 * The home page's opening: one pinned scene driven by scroll. A "camera" (a CSS transform on the studio render) starts on the
 * hero framing, pulls in on the whole kit, travels across each padded area, then pulls back for the closing call to action.
 *
 * Everything is ordinary page content inside a sticky box, so it scrolls with the page on every browser (the earlier version
 * drew the product in a separate fixed 3D layer, which drifted from the text on iPhones).
 */

const FULL: Rect = [205, 45, 1540, 990];
const N = TOUR.length;

type Shot = { rect: Rect; fit: [number, number]; at: [number, number]; max: number };
type Cam = { s: number; ix: number; iy: number; cx: number; cy: number };

/** Where each shot sits on screen: `fit` is the share of the screen the subject may fill, `at` is where its centre goes. */
function shot(key: number | 'hero' | 'full' | 'end', mobile: boolean): Shot {
  if (key === 'hero') return mobile ? { rect: FULL, fit: [1.05, 0.36], at: [0.5, 0.8], max: 1 } : { rect: FULL, fit: [0.54, 0.8], at: [0.71, 0.55], max: 1.2 };
  if (key === 'full') return mobile ? { rect: FULL, fit: [1.08, 0.4], at: [0.5, 0.36], max: 1 } : { rect: FULL, fit: [0.6, 0.78], at: [0.67, 0.54], max: 1.3 };
  if (key === 'end') return mobile ? { rect: FULL, fit: [1.08, 0.4], at: [0.5, 0.3], max: 1 } : { rect: FULL, fit: [0.6, 0.72], at: [0.5, 0.4], max: 1.2 };
  return mobile ? { rect: TOUR[key].rect, fit: [0.8, 0.34], at: [0.5, 0.36], max: 2.3 } : { rect: TOUR[key].rect, fit: [0.4, 0.6], at: [0.68, 0.52], max: 2.5 };
}

function solve(sh: Shot, W: number, H: number): Cam {
  const [x, y, w, h] = sh.rect;
  return { s: Math.min((sh.fit[0] * W) / w, (sh.fit[1] * H) / h, sh.max), ix: x + w / 2, iy: y + h / 2, cx: sh.at[0] * W, cy: sh.at[1] * H };
}

// Scroll script (0 to 1 across the pinned range). Each padded area is reached at ARRIVE(i), held, then the camera travels on.
const INTRO_END = 0.1;
const FIRST = 0.2;
const STEP = 0.118;
const HOLD = 0.055;
const ARRIVE = (i: number) => FIRST + i * STEP;
const OUTRO = ARRIVE(N - 1) + HOLD + 0.05; // camera is back on the whole kit from here
const STOPS: [number, number | 'hero' | 'full' | 'end'][] = [
  [0, 'hero'], [INTRO_END, 'full'], [INTRO_END + 0.035, 'full'],
  ...TOUR.flatMap((_, i) => [[ARRIVE(i), i], [ARRIVE(i) + HOLD, i]] as [number, number][]),
  [OUTRO, 'end'], [1, 'end'],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

/** "A panel over each knee (leggings)." -> { text: "A panel over each knee.", on: "leggings" } */
function split(desc: string) {
  const m = desc.match(/\s*\((top|leggings)\)\.?$/i);
  return { text: m ? desc.slice(0, m.index).replace(/\.?$/, '.') : desc, on: m ? m[1].toLowerCase() : null };
}

const HEADLINE = ['Goalkeeper', 'kit starts', 'underneath'];

export function ProductFilm() {
  const reduce = useReducedMotion();
  if (reduce) return <StaticFilm />;
  return <Film />;
}

function Film() {
  const section = useRef<HTMLElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  const size = useRef({ W: 0, H: 0 });
  const [ready, setReady] = useState(false);
  const [zone, setZone] = useState(-1); // -1 before the tour, N after it
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  const place = useCallback((p: number) => {
    const { W, H } = size.current;
    if (!W || !H) return;
    const mobile = W < 768;
    let i = 0;
    while (i < STOPS.length - 2 && p > STOPS[i + 1][0]) i++;
    const [p0, k0] = STOPS[i];
    const [p1, k1] = STOPS[i + 1];
    const t = ease(Math.min(1, Math.max(0, (p - p0) / Math.max(1e-6, p1 - p0))));
    const a = solve(shot(k0, mobile), W, H);
    const b = solve(shot(k1, mobile), W, H);
    const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)); // zoom evenly: interpolate the scale on a log curve
    scale.set(s);
    x.set(lerp(a.cx, b.cx, t) - lerp(a.ix, b.ix, t) * s);
    y.set(lerp(a.cy, b.cy, t) - lerp(a.iy, b.iy, t) * s);
  }, [scale, x, y]);

  useEffect(() => {
    const el = stageEl.current;
    if (!el) return;
    const measure = () => { size.current = { W: el.clientWidth, H: el.clientHeight }; place(scrollYProgress.get()); setReady(true); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [place, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    place(p);
    const z = p < ARRIVE(0) - 0.05 ? -1 : p >= OUTRO - 0.03 ? N : Math.min(N - 1, Math.max(0, Math.floor((p - (ARRIVE(0) - 0.05)) / STEP)));
    setZone((cur) => (cur === z ? cur : z));
  });

  // Hero copy leaves as the camera pulls in; the tour heading, spotlight and closing frame follow the same script.
  const heroOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.08], [0, -80]);
  const bandX = useTransform(scrollYProgress, [0, 0.3], ['2%', '-38%']);
  const bandOpacity = useTransform(scrollYProgress, [0, 0.1, 0.16], [1, 1, 0]);
  const introOpacity = useTransform(scrollYProgress, [0.07, 0.1, ARRIVE(0) - 0.06, ARRIVE(0) - 0.03], [0, 1, 1, 0]);
  const introY = useTransform(scrollYProgress, [0.07, 0.1], [30, 0]);
  const spot = useTransform(scrollYProgress, [ARRIVE(0) - 0.05, ARRIVE(0), OUTRO - 0.05, OUTRO], [0, 1, 1, 0]);
  const endOpacity = useTransform(scrollYProgress, [OUTRO - 0.02, OUTRO + 0.02], [0, 1]);
  const endY = useTransform(scrollYProgress, [OUTRO - 0.02, OUTRO + 0.02], [30, 0]);
  const endEvents = useTransform(scrollYProgress, (p) => (p > OUTRO - 0.02 ? 'auto' : 'none'));
  const heroEvents = useTransform(scrollYProgress, (p) => (p < 0.03 ? 'auto' : 'none'));
  const cue = useTransform(scrollYProgress, [0, 0.03], [1, 0]);

  const area = zone >= 0 && zone < N ? BASE_LAYER.paddedAreas.find((a) => a.id === TOUR[zone].id) : undefined;
  const d = area ? split(area.description) : null;

  return (
    <section ref={section} className="relative h-[780svh]" aria-label="The A3GK padded base layer">
      <div id="tour" className="absolute left-0" style={{ top: `${(ARRIVE(0) - 0.07) * 100}%` }} aria-hidden />
      <div ref={stageEl} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* backdrop: a soft floor light, and a slow band of type that slides as you scroll */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_70%_at_62%_58%,#2a3140_0%,#141820_45%,#080a0e_100%)]" />
        <motion.p aria-hidden style={{ x: bandX, opacity: bandOpacity }} className="pointer-events-none absolute left-0 top-[16%] whitespace-nowrap font-display text-[34vw] font-extrabold uppercase leading-none text-white/[0.035] md:top-[8%] md:text-[24vw]">
          Padded where you land
        </motion.p>

        {/* the product, moved by the camera */}
        <motion.div
          style={{ x, y, scale, width: RENDER.w, height: RENDER.h, transformOrigin: '0 0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="film-render absolute left-0 top-0 will-change-transform"
        >
          <Image src={RENDER.src} alt={RENDER.alt} width={RENDER.w} height={RENDER.h} priority sizes="(min-width:768px) 150vw, 300vw" className="h-full w-full select-none" draggable={false} />
        </motion.div>

        {/* spotlight: the camera centres each padded area, and the rest of the frame falls away */}
        <motion.div aria-hidden style={{ opacity: spot }} className="film-spot pointer-events-none absolute inset-0" />

        {/* 1. hero copy */}
        <motion.div style={{ opacity: heroOpacity, y: heroY, pointerEvents: heroEvents }} className="absolute inset-x-0 top-0 flex h-full flex-col px-5 pb-8 pt-24 md:justify-center md:px-[5%] md:pt-20">
          <h1 className="font-display text-[clamp(3.3rem,17vw,6rem)] font-extrabold uppercase leading-[0.84] md:text-[clamp(4rem,7.6vw,9.5rem)]">
            {HEADLINE.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span className={`block ${i === 2 ? 'text-accent' : ''}`} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}>
                  {line}{i < 2 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}>
            <p className="mt-4 max-w-[26rem] text-base text-white/80 md:mt-6 md:text-lg">Hexagonal padding designed to spread the impact of a dive, and still flex with you. Meet the A3GK padded base layer.</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href={`/products/${HANDLES.base}`} className="btn-primary">Shop the base layer</Link>
              <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">View size guide</Link>
            </div>
          </motion.div>
        </motion.div>
        <motion.p style={{ opacity: cue }} className="pointer-events-none absolute inset-x-0 bottom-3 px-5 text-center text-xs text-white/55 md:px-[5%] md:text-left">
          <span className="film-cue mr-2 inline-block h-4 w-px bg-white/60 align-middle" />Scroll to see where it is padded. Image is a rendering based on the real garments.
        </motion.p>

        {/* 2. tour heading */}
        <motion.div style={{ opacity: introOpacity, y: introY }} className="pointer-events-none absolute inset-x-0 bottom-[14%] px-5 md:inset-x-auto md:bottom-auto md:left-[5%] md:top-1/2 md:w-[30%] md:-translate-y-1/2 md:px-0">
          <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.9] md:text-7xl">Built into<br />the layer</h2>
          <p className="mt-3 max-w-sm text-white/80">Six padded areas on the front. Smooth fabric on the back.</p>
        </motion.div>

        {/* 3. one caption per padded area */}
        <div className="absolute inset-x-0 bottom-[7%] px-5 md:inset-x-auto md:bottom-auto md:left-[5%] md:top-1/2 md:w-[30%] md:-translate-y-1/2 md:px-0" aria-live="polite">
          <AnimatePresence mode="wait">
            {area && d && (
              <motion.div key={area.id} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                <p className="font-semibold text-accent">{d.on === 'leggings' ? 'On the leggings' : 'On the top'}</p>
                <h3 className="mt-1 font-display text-[clamp(3rem,13vw,4.5rem)] font-extrabold uppercase leading-[0.88] md:text-[clamp(3.5rem,6vw,7rem)]">{area.label}</h3>
                <p className="mt-3 max-w-sm text-lg text-white/85">{d.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {zone >= 0 && zone < N && (
            <div className="mt-5 flex max-w-[16rem] gap-1.5" aria-hidden>
              {TOUR.map((t, i) => <span key={t.id} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= zone ? 'bg-accent' : 'bg-white/20'}`} />)}
            </div>
          )}
        </div>
        {zone >= 0 && zone < N && <a href="#after-film" className="absolute right-4 top-24 rounded-full bg-black/50 px-4 py-2.5 text-sm font-semibold text-white/85 md:right-[5%]">Skip the tour</a>}

        {/* 4. closing frame */}
        <motion.div style={{ opacity: endOpacity, y: endY, pointerEvents: endEvents }} className="absolute inset-x-0 bottom-[8%] flex flex-col items-center px-5 text-center md:bottom-[7%]">
          <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.9] md:text-7xl">Six padded areas. <span className="text-accent">One layer.</span></h2>
          <p className="mt-3 max-w-md text-white/80">Buy a top, a bottom, or both. Every piece is sold on its own.</p>
          <Link href={`/products/${HANDLES.base}`} className="btn-primary mt-5">Build your kit</Link>
        </motion.div>
      </div>
      <div id="after-film" className="absolute bottom-0 left-0" aria-hidden />
    </section>
  );
}

/** Reduced motion: the same content with nothing pinned or animated. Each padded area is a still crop of the same render. */
function StaticFilm() {
  return (
    <section className="px-5 pb-16 pt-28 md:px-[5%]" aria-label="The A3GK padded base layer">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="font-display text-[clamp(3.3rem,15vw,6rem)] font-extrabold uppercase leading-[0.86] md:text-[clamp(4rem,7vw,8.5rem)]">Goalkeeper kit starts <span className="text-accent">underneath</span></h1>
          <p className="mt-5 max-w-[26rem] text-lg text-white/80">Hexagonal padding designed to spread the impact of a dive, and still flex with you. Meet the A3GK padded base layer.</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href={`/products/${HANDLES.base}`} className="btn-primary">Shop the base layer</Link>
            <Link href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">View size guide</Link>
          </div>
        </div>
        <figure>
          <Image src={RENDER.src} alt={RENDER.alt} width={RENDER.w} height={RENDER.h} priority sizes="(min-width:768px) 55vw, 100vw" className="h-auto w-full rounded-2xl" />
          <figcaption className="mt-2 text-xs text-white/55">Rendering based on the real garments.</figcaption>
        </figure>
      </div>
      <div id="tour" className="scroll-mt-24 pt-16">
        <h2 className="font-display text-5xl font-extrabold uppercase leading-[0.9] md:text-7xl">Built into the layer</h2>
        <p className="mt-3 max-w-sm text-white/80">Six padded areas on the front. Smooth fabric on the back.</p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOUR.map((t) => {
            const area = BASE_LAYER.paddedAreas.find((a) => a.id === t.id);
            if (!area) return null;
            const d = split(area.description);
            const [x, y, w, h] = t.rect;
            const pad = 40;
            const k = 320 / (w + pad * 2); // crop shown 320px wide
            return (
              <li key={t.id}>
                <div aria-hidden className="h-56 w-full max-w-[320px] rounded-2xl bg-no-repeat" style={{ backgroundImage: `url(${RENDER.src})`, backgroundSize: `${RENDER.w * k}px ${RENDER.h * k}px`, backgroundPosition: `${-(x - pad) * k}px ${-(y + h / 2) * k + 112}px` }} />
                <p className="mt-3 font-semibold text-accent">{d.on === 'leggings' ? 'On the leggings' : 'On the top'}</p>
                <h3 className="font-display text-3xl font-extrabold uppercase">{area.label}</h3>
                <p className="mt-1 text-white/80">{d.text}</p>
              </li>
            );
          })}
        </ul>
        <Link href={`/products/${HANDLES.base}`} className="btn-primary mt-8 inline-flex">Build your kit</Link>
      </div>
    </section>
  );
}
