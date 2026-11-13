'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { BASE_LAYER } from '@/lib/content';
import { RENDER } from '@/lib/photos';
import { TOUR, type Rect } from '@/lib/tour';

const VIEWS: Record<'set' | 'top' | 'legs', Rect> = { set: [205, 45, 1540, 990], top: [215, 45, 790, 880], legs: [1345, 85, 400, 950] };

/**
 * The product picture on product pages: tap a padded area and the picture glides in on it (the same camera idea as the
 * home page film, driven by taps instead of scroll). `start` is the wide view to open on; `areas` limits the chips to one garment.
 */
export function ZoomViewer({ start = 'set', areas }: { start?: 'set' | 'top' | 'legs'; areas?: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ W: 0, H: 0 });
  const [sel, setSel] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const zones = TOUR.filter((t) => !areas || areas.includes(t.id));

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ W: el.clientWidth, H: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zone = zones.find((z) => z.id === sel);
  const [x, y, w, h] = zone ? zone.rect : VIEWS[start];
  const fit = zone ? 0.62 : 0.96;
  const s = size.W ? Math.min((fit * size.W) / w, (fit * size.H) / h, 2.4) : 0.3;
  const tx = size.W / 2 - (x + w / 2) * s;
  const ty = size.H / 2 - (y + h / 2) * s;
  const area = zone ? BASE_LAYER.paddedAreas.find((a) => a.id === zone.id) : null;
  const chip = (on: boolean) => `min-h-[44px] rounded-full px-4 text-sm font-semibold transition ${on ? 'bg-accent text-ink' : 'bg-white/[0.08] text-white hover:bg-white/15'}`;

  return (
    <figure>
      <div ref={box} className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[radial-gradient(120%_90%_at_50%_60%,#2a3140_0%,#141820_55%,#0b0d12_100%)] md:aspect-[16/11]">
        <motion.div
          className="absolute left-0 top-0 will-change-transform"
          style={{ width: RENDER.w, height: RENDER.h, transformOrigin: '0 0' }}
          initial={false}
          animate={{ x: tx, y: ty, scale: s, opacity: size.W ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 70, damping: 18, mass: 0.9 }}
        >
          <Image src={RENDER.src} alt={RENDER.alt} width={RENDER.w} height={RENDER.h} priority sizes="(min-width:768px) 120vw, 220vw" className="film-render h-full w-full select-none" draggable={false} />
        </motion.div>
        <p className="pointer-events-none absolute inset-x-4 bottom-3 min-h-[1.5rem] text-sm font-semibold text-white drop-shadow" aria-live="polite">
          {area ? area.description.replace(/\s*\((top|leggings)\)\.?$/i, '.') : ''}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Zoom in on a padded area">
        <button type="button" className={chip(sel === null)} aria-pressed={sel === null} onClick={() => setSel(null)}>Whole {start === 'set' ? 'kit' : start === 'top' ? 'top' : 'leggings'}</button>
        {zones.map((z) => {
          const a = BASE_LAYER.paddedAreas.find((p) => p.id === z.id);
          return <button key={z.id} type="button" className={chip(sel === z.id)} aria-pressed={sel === z.id} onClick={() => setSel(z.id)}>{a?.label ?? z.id}</button>;
        })}
      </div>
      <figcaption className="mt-2 text-xs text-white/55">Rendering based on the real garments. Tap a padded area to look closer.</figcaption>
    </figure>
  );
}
