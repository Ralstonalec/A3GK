'use client';

import { RENDER } from '@/lib/photos';
import { useEffect, useState } from 'react';
import { stage, type View } from '@/lib/stage';

const VIEWS: { id: View; label: string }[] = [
  { id: 'set', label: 'Both pieces' },
  { id: 'top', label: 'Top' },
  { id: 'legs', label: 'Leggings' },
];

/** Card selector for the 3D view. Only rendered once the 3D stage is live. */
export function HeroViews() {
  const [live, setLive] = useState(false);
  const [active, setActive] = useState<View>('set');
  useEffect(() => {
    if (stage.live) setLive(true);
    const on = () => setLive(true);
    window.addEventListener('stage-live', on);
    return () => window.removeEventListener('stage-live', on);
  }, []);
  if (!live) return null;
  return (
    <div className="pointer-events-auto" role="radiogroup" aria-label="Choose what to view in 3D">
      <div className="flex gap-3">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="radio"
            aria-checked={active === v.id}
            onClick={() => { setActive(v.id); stage.requestView?.(v.id); }}
            className={`glass group relative flex w-[84px] min-[360px]:w-[104px] flex-col items-center gap-2 rounded-3xl p-2 pb-3 text-center transition hover:bg-white/10 md:w-[118px] ${active === v.id ? '!border-accent' : ''}`}
          >
            <span className="relative flex h-24 w-full items-center justify-center gap-1 overflow-hidden rounded-2xl bg-black/30 p-1.5">
              <span
                aria-hidden
                className="h-full w-full rounded-xl bg-no-repeat transition duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${RENDER.src})`, backgroundSize: v.id === 'set' ? '100% auto' : v.id === 'top' ? '230% auto' : '420% auto', backgroundPosition: v.id === 'set' ? '50% 50%' : v.id === 'top' ? '22% 38%' : '94% 40%' }}
              />
            </span>
            <span className="text-xs font-bold">{v.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-right text-xs text-white/55"><span className="hidden md:inline">Move your cursor. </span>Tap a view to flip to it.</p>
    </div>
  );
}
