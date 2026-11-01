'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { BASE_LAYER } from '@/lib/content';
import { stage } from '@/lib/stage';
import { TOUR, tourBox } from '@/lib/tour';

const N = TOUR.length;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const two = (n: number) => String(n).padStart(2, '0');

/** "A panel over each knee (leggings)." -> { text: "A panel over each knee.", on: "leggings" } */
function split(desc: string) {
  const m = desc.match(/\s*\((top|leggings)\)\.?$/i);
  return { text: m ? desc.slice(0, m.index).replace(/\.?$/, '.') : desc, on: m ? m[1].toLowerCase() : null };
}

/**
 * The info layer over the 3D tour. A frame locks onto the padded area the camera has zoomed to (it is sized from the
 * same maths as the camera and driven from the scroll position, so it never lags), a numbered card pops in for
 * each zone, and a segmented bar fills as you scroll. Hidden until the 3D stage is live.
 */
export function PaddingTour() {
  const [live, setLive] = useState(false);
  const [zone, setZone] = useState(-1);
  const frame = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const anchor = useRef({ x: 0, y: 0 }); // where the connector starts (card's right edge), measured on resize, not per frame

  useEffect(() => {
    if (stage.live) setLive(true);
    const onLive = () => setLive(true);
    const onZone = (e: Event) => setZone((e as CustomEvent<number>).detail);
    window.addEventListener('stage-live', onLive);
    window.addEventListener('pad-zone', onZone);
    return () => { window.removeEventListener('stage-live', onLive); window.removeEventListener('pad-zone', onZone); };
  }, []);

  useEffect(() => {
    if (!live) return;
    const measure = () => {
      const c = card.current;
      if (c) anchor.current = { x: c.offsetLeft + c.offsetWidth, y: c.offsetTop + 52 };
    };
    measure();
    window.addEventListener('resize', measure);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = stage.tour;
      const f = frame.current;
      if (!f) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const narrow = W / H < 0.85;
      if (t === null) { f.style.opacity = '0'; if (line.current) line.current.style.opacity = '0'; return; }
      const a = Math.min(N - 1, Math.floor(t));
      const b = Math.min(N - 1, a + 1);
      const fr = t - a;
      const e = fr * fr * (3 - 2 * fr);
      const A = tourBox(a, W, H);
      const B = tourBox(b, W, H);
      const shrink = 1 - 0.14 * Math.sin(Math.PI * e);
      const w = lerp(A.w, B.w, e) * shrink;
      const h = lerp(A.h, B.h, e) * shrink;
      const cx = W / 2 + (narrow ? 0 : W * 0.1);
      const cy = H / 2;
      f.style.width = `${w}px`;
      f.style.height = `${h}px`;
      f.style.transform = `translate(${cx - w / 2}px, ${cy - h / 2}px)`;
      f.style.opacity = String(clamp(Math.min(t + 0.35, N - 1 - t + 0.35)));
      fills.current.forEach((s, i) => { if (s) s.style.transform = `scaleX(${clamp(t - i + 0.5)})`; });
      const l = line.current;
      if (l) {
        if (narrow) { l.style.opacity = '0'; } else {
          l.setAttribute('x1', String(anchor.current.x));
          l.setAttribute('y1', String(anchor.current.y));
          l.setAttribute('x2', String(cx - w / 2));
          l.setAttribute('y2', String(cy));
          l.style.opacity = f.style.opacity;
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, [live]);

  if (!live) return null;
  const area = BASE_LAYER.paddedAreas[zone];
  const d = area ? split(area.description) : null;
  return (
    <>
      {/* progress: one segment per padded area */}
      <div className="mt-5 flex max-w-sm gap-1.5" aria-hidden>
        {BASE_LAYER.paddedAreas.map((p, i) => (
          <span key={p.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <span ref={(el) => { fills.current[i] = el; }} className="block h-full origin-left rounded-full bg-accent " style={{ transform: 'scaleX(0)' }} />
          </span>
        ))}
      </div>

      {/* viewfinder frame locked onto the zone the camera is zoomed to */}
      <div ref={frame} aria-hidden className="pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform">
        <span className="absolute -left-1 -top-1 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-accent" />
        <span className="absolute -right-1 -top-1 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-accent" />
        <span className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-accent" />
        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-accent" />
        <span className="absolute inset-0 rounded-md border border-white/10" />
        <span className="absolute inset-0 overflow-hidden rounded-md"><span className="tour-scan block h-full w-full" /></span>
        <AnimatePresence mode="wait">
          {area && (
            <motion.span key={area.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute left-0 top-full mt-2 hidden whitespace-nowrap rounded-full md:top-auto md:-top-8 md:mt-0 md:block border border-accent/50 bg-black/75 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent">
              Zone {two(zone + 1)} · {area.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* connector from the card to the frame (desktop) */}
      <svg aria-hidden className="pointer-events-none fixed inset-0 hidden h-full w-full md:block">
        <line ref={line} stroke="rgb(var(--accent))" strokeWidth="1.5" strokeDasharray="4 6" className="tour-dash opacity-0" />
      </svg>

      {/* info card: pops in for each zone */}
      <div ref={card} className="absolute inset-x-4 bottom-6 md:inset-x-auto md:left-[4%] md:top-[24rem] md:bottom-auto md:w-[22rem]">
        <AnimatePresence mode="wait">
          {area && d && (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="glass relative overflow-hidden rounded-3xl p-5 "
            >
              <div className="flex items-baseline gap-2">
                <span className="outline-text font-display text-6xl font-extrabold leading-none">{two(zone + 1)}</span>
                <span className="font-display text-lg font-bold text-white/50">/ {two(N)}</span>
                {d.on && <span className="ml-auto rounded-full border border-accent/60 bg-accent/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-accent">{d.on === 'top' ? 'On the top' : 'On the leggings'}</span>}
              </div>
              <h3 className="mt-3 font-display text-3xl font-extrabold uppercase leading-none">{area.label}</h3>
              <p aria-live="polite" className="mt-2 text-sm text-white/80">{d.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {!area && <p className="glass rounded-2xl p-4 text-sm text-white/75" aria-live="polite">Scroll to look at each padded area.</p>}
      </div>
    </>
  );
}
