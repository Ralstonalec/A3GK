'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState } from 'react';
import type { View } from '@/lib/stage';
import type { Light } from './three/Viewer3DCanvas';

const Canvas3D = dynamic(() => import('./three/Viewer3DCanvas'), { ssr: false, loading: () => <p className="p-6 text-sm text-white/60">Loading 3D…</p> });

const VIEWS: { id: View; label: string }[] = [{ id: 'set', label: 'Both pieces' }, { id: 'top', label: 'Top' }, { id: 'legs', label: 'Leggings' }];
const LIGHTS: Light[] = ['Studio', 'Rim light', 'Soft'];

/** Interactive 3D viewer. Loads only when asked, so it costs nothing until used. */
export function Viewer3D() {
  const [on, setOn] = useState(false);
  const [view, setView] = useState<View>('set');
  const [light, setLight] = useState<Light>('Studio');
  const [explode, setExplode] = useState(0);
  const [spin, setSpin] = useState(true);

  const chip = (active: boolean) => `min-h-[40px] rounded-full px-4 text-xs font-bold uppercase tracking-wider transition ${active ? 'bg-accent text-ink' : 'bg-white/10 text-white hover:bg-white/20'}`;

  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-white/[0.08] to-black/30">
        {on ? (
          <div className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" onPointerDown={() => setSpin(false)}>
            <Canvas3D view={view} explode={explode} light={light} spin={spin} />
          </div>
        ) : (
          <button onClick={() => setOn(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-4" aria-label="Explore the base layer in 3D">
            <Image src="/images/base-layer-hero.webp" alt="" fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover opacity-50 transition group-hover:opacity-70" />
            <span className="btn-primary relative">Explore in 3D</span>
          </button>
        )}
      </div>
      {on && (
        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Piece">
            {VIEWS.map((v) => <button key={v.id} role="radio" aria-checked={view === v.id} className={chip(view === v.id)} onClick={() => setView(v.id)}>{v.label}</button>)}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Lighting">
            {LIGHTS.map((l) => <button key={l} role="radio" aria-checked={light === l} className={chip(light === l)} onClick={() => setLight(l)}>{l}</button>)}
          </div>
          <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
            Separate padding
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} className="h-2 flex-1 accent-[rgb(var(--accent))]" />
          </label>
          <p className="text-xs text-white/55">Drag to rotate. 3D model is illustrative; see the photographs for the exact product.</p>
        </div>
      )}
    </div>
  );
}
