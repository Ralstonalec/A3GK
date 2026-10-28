'use client';

import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { View } from '@/lib/stage';
import { RENDER } from '@/lib/photos';

/**
 * The photoreal rendering placed in 3D: it tilts toward the cursor, drifts, and the camera moves
 * across it (views and the padding tour). Particles in the scene sit in front of and behind it.
 */

export type RenderCtl = { view: View; tour: number | null };
type Rect = [number, number, number, number]; // x, y, w, h in render pixels

const PH = 3.0;
const PW = PH * (RENDER.w / RENDER.h);

const VIEW_RECT: Record<View, Rect> = { set: [205, 45, 1540, 990], top: [215, 45, 790, 880], legs: [1345, 85, 400, 950] };
const VIEW_FRAC: Record<View, [number, number]> = { set: [0.56, 0.8], top: [0.5, 0.78], legs: [0.26, 0.86] };

export const TOUR: { id: string; rect: Rect }[] = [
  { id: 'chest', rect: [515, 221, 268, 229] },
  { id: 'ribs', rect: [421, 457, 386, 172] },
  { id: 'upper-arms', rect: [250, 193, 114, 236] },
  { id: 'elbows', rect: [221, 471, 122, 272] },
  { id: 'hips-thighs', rect: [1593, 164, 136, 372] },
  { id: 'knees', rect: [1571, 579, 129, 200] },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function edgeFade() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 144;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 256, 144);
  const inset = 40;
  const grad = (x0: number, y0: number, x1: number, y1: number, w: number, h: number, x: number, y: number) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, '#000');
    gr.addColorStop(1, '#fff');
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  };
  // white centre with soft edges
  g.fillStyle = '#fff';
  g.fillRect(inset, inset, 256 - inset * 2, 144 - inset * 2);
  grad(0, 0, inset, 0, inset, 144, 0, 0);
  grad(256, 0, 256 - inset, 0, inset, 144, 256 - inset, 0);
  grad(0, 0, 0, inset, 256, inset, 0, 0);
  grad(0, 144, 0, 144 - inset, 256, inset, 0, 144 - inset);
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function RenderPlane({ ctl, vpRef, onShown }: { ctl: RenderCtl; vpRef: { current: { width: number; height: number } }; onShown?: () => void }) {
  const tex = useTexture(RENDER.src);
  const mat = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map: tex, alphaMap: edgeFade(), transparent: true, toneMapped: false });
  }, [tex]);
  const inner = useRef<THREE.Group>(null);

  const place = (rect: Rect, tw: number, th: number) => {
    const rw = (rect[2] / RENDER.w) * PW;
    const rh = (rect[3] / RENDER.h) * PH;
    const s = Math.max(0.2, Math.min(tw / rw, th / rh));
    const cx = ((rect[0] + rect[2] / 2) / RENDER.w - 0.5) * PW;
    const cy = -((rect[1] + rect[3] / 2) / RENDER.h - 0.5) * PH;
    return { s, cx, cy };
  };

  useFrame((_, dtRaw) => {
    const g = inner.current;
    if (!g) return;
    onShown?.();
    const dt = Math.min(dtRaw, 0.05);
    const vp = vpRef.current;
    const { view, tour } = ctl;
    let target: { s: number; cx: number; cy: number };
    let xo = 0;
    if (tour !== null) {
      const a = Math.min(TOUR.length - 1, Math.floor(tour));
      const b = Math.min(TOUR.length - 1, a + 1);
      const f = tour - a;
      const e = f * f * (3 - 2 * f);
      const mk = (i: number) => { const r = TOUR[i].rect; const narrow = vp.width / vp.height < 0.85;
      const pl = place(r, vp.width * (narrow ? 0.92 : 0.5), vp.height * (narrow ? 0.42 : 0.62)); return { ...pl, s: Math.min(pl.s, 2.6) }; };
      const A = mk(a);
      const B = mk(b);
      target = { s: lerp(A.s, B.s, e) * (1 - 0.14 * Math.sin(Math.PI * e)), cx: lerp(A.cx, B.cx, e), cy: lerp(A.cy, B.cy, e) };
      xo = vp.width / vp.height < 0.85 ? 0 : vp.width * 0.1;
    } else {
      const [fw, fh] = VIEW_FRAC[view];
      target = place(VIEW_RECT[view], vp.width * fw, vp.height * fh);
    }
    const k = 1 - Math.exp(-dt * (tour !== null ? 9 : 3.2));
    const cur = g.userData as { s?: number; cx?: number; cy?: number };
    cur.s = (cur.s ?? target.s) + (target.s - (cur.s ?? target.s)) * k;
    cur.cx = (cur.cx ?? target.cx) + (target.cx - (cur.cx ?? target.cx)) * k;
    cur.cy = (cur.cy ?? target.cy) + (target.cy - (cur.cy ?? target.cy)) * k;
    g.scale.setScalar(cur.s);
    g.position.set(-cur.cx * cur.s + xo, -cur.cy * cur.s, 0);
  });

  return (
    <group ref={inner}>
      <mesh material={mat}>
        <planeGeometry args={[PW, PH]} />
      </mesh>
    </group>
  );
}
