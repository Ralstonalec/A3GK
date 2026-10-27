'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { stage, type View } from '@/lib/stage';

const VIEWS: { id: View; label: string; pos: string }[] = [
  { id: 'set', label: 'Both pieces', pos: '50% 50%' },
  { id: 'top', label: 'Top', pos: '50% 22%' },
  { id: 'legs', label: 'Leggings', pos: '50% 82%' },
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
            className={`glass group relative flex w-[104px] flex-col items-center gap-2 rounded-3xl p-2 pb-3 text-center transition hover:bg-white/10 md:w-[118px] ${active === v.id ? '!border-accent' : ''}`}
          >
            <span className="relative block h-24 w-full overflow-hidden rounded-2xl bg-black/30">
              <Image src="/images/base-layer-hero.webp" alt="" fill sizes="120px" className="object-cover transition duration-500 group-hover:scale-110" style={{ objectPosition: v.pos, transform: v.id === 'set' ? undefined : undefined }} />
            </span>
            <span className="text-xs font-bold">{v.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-right text-xs text-white/55">Move your cursor. Tap a view to spin it round.</p>
    </div>
  );
}
