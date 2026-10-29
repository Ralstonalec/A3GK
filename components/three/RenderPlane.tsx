'use client';

import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { View } from '@/lib/stage';
import { CUT } from '@/lib/photos';

/**
 * The photoreal rendering placed in 3D: it tilts toward the cursor, drifts, and the camera moves
 * across it (views and the padding tour). Particles in the scene sit in front of and behind it.
 */

export type RenderCtl = { view: View; tour: number | null };
type Rect = [number, number, number, number]; // x, y, w, h in render pixels

const PH = 3.0;
const PW = PH * (CUT.longSet.w / CUT.longSet.h);
// the cutout is the studio render cropped to the garments: rects below are in studio-render pixels
const OX = 210;
const OY = 66;

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

export function RenderPlane({ ctl, vpRef, onShown }: { ctl: RenderCtl; vpRef: { current: { width: number; height: number } }; onShown?: () => void }) {
  const tex = useTexture(CUT.longSet.src);
  const mat = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  }, [tex]);
  const inner = useRef<THREE.Group>(null);

  const place = (rect: Rect, tw: number, th: number) => {
    const rw = (rect[2] / CUT.longSet.w) * PW;
    const rh = (rect[3] / CUT.longSet.h) * PH;
    const s = Math.max(0.2, Math.min(tw / rw, th / rh));
    const cx = ((rect[0] - OX + rect[2] / 2) / CUT.longSet.w - 0.5) * PW;
    const cy = -((rect[1] - OY + rect[3] / 2) / CUT.longSet.h - 0.5) * PH;
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
    let yo = 0;
    if (tour !== null) {
      const a = Math.min(TOUR.length - 1, Math.floor(tour));
      const b = Math.min(TOUR.length - 1, a + 1);
      const f = tour - a;
      const e = f * f * (3 - 2 * f);
      const mk = (i: number) => { const r = TOUR[i].rect; const narrow = vp.width / vp.height < 0.85;
      const pl = place(r, vp.width * (narrow ? 0.8 : 0.4), vp.height * (narrow ? 0.3 : 0.6)); return { ...pl, s: Math.min(pl.s, 2.6) }; };
      const A = mk(a);
      const B = mk(b);
      target = { s: lerp(A.s, B.s, e) * (1 - 0.14 * Math.sin(Math.PI * e)), cx: lerp(A.cx, B.cx, e), cy: lerp(A.cy, B.cy, e) };
      if (vp.width / vp.height < 0.85) yo = -vp.height * 0.2;
      else xo = vp.width * 0.2;
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
    g.position.set(-cur.cx * cur.s + xo, -cur.cy * cur.s + yo, 0);
  });

  return (
    <group ref={inner}>
      <mesh material={mat}>
        <planeGeometry args={[PW, PH]} />
      </mesh>
    </group>
  );
}
