'use client';

import { useEffect, useState } from 'react';
import { BASE_LAYER } from '@/lib/content';
import { stage } from '@/lib/stage';

/** Highlights the padded area the 3D stage is currently zoomed on. Hidden until the stage is live. */
export function PaddingTour() {
  const [live, setLive] = useState(false);
  const [zone, setZone] = useState(-1);
  useEffect(() => {
    if (stage.live) setLive(true);
    const onLive = () => setLive(true);
    const onZone = (e: Event) => setZone((e as CustomEvent<number>).detail);
    window.addEventListener('stage-live', onLive);
    window.addEventListener('pad-zone', onZone);
    return () => { window.removeEventListener('stage-live', onLive); window.removeEventListener('pad-zone', onZone); };
  }, []);
  if (!live) return null;
  const cur = BASE_LAYER.paddedAreas[zone];
  return (
    <>
    <div aria-live="polite" className="glass absolute inset-x-4 bottom-8 rounded-2xl p-4 text-sm md:hidden">
      {cur ? <><strong className="text-white">{cur.label}.</strong> <span className="text-white/75">{cur.description}</span></> : <span className="text-white/75">Scroll to look at each padded area.</span>}
    </div>
    <ul className="mt-6 hidden space-y-2 text-sm md:block">
      {BASE_LAYER.paddedAreas.map((p, i) => (
        <li key={p.id} className={`pad-label border-l-2 pl-3 transition ${zone === i ? 'border-accent text-white' : 'border-white/15 text-white/55'}`}>
          <strong className="text-white">{p.label}.</strong> {p.description}
        </li>
      ))}
    </ul>
    </>
  );
}
