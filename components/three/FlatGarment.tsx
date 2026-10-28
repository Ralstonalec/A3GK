'use client';

import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import data from '@/lib/flatlay.json';
import type { View } from '@/lib/stage';
import type { GarmentCtl } from './Garment';
import { buildPadMesh, makeKnitTexture, makeRibTexture, type PadMesh, type PadSpec, type Surface } from './geometry';

/**
 * The garments laid flat, exactly as photographed: silhouettes and every pad outline are traced from the
 * supplied flat-lay photographs (see scripts/trace-flatlay.py). Given real thickness, quilted pads with
 * tape borders and grooves, and the printed waistband. The top is mirrored from its left half so it is
 * symmetric; the leggings' lower legs are extended past the photo frame to a natural ankle.
 */

type Pt = [number, number];
const K = data.k;
const T = 0.0035; // half thickness of the fabric
const INFLATE = 0.035;
const STEP = 0.006;
const EX_LIFT = 0.1;

const smooth01 = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

function inside(poly: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function nearest(poly: Pt[], x: number, y: number) {
  let best = Infinity;
  let bx = x;
  let by = y;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [cx, cy] = poly[i];
    const ex = cx - ax;
    const ey = cy - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1)));
    const px = ax + t * ex;
    const py = ay + t * ey;
    const d = (x - px) * (x - px) + (y - py) * (y - py);
    if (d < best) { best = d; bx = px; by = py; }
  }
  return { d: Math.sqrt(best), x: bx, y: by };
}

const wrinkle = (x: number, y: number) => 0.0009 * (Math.sin(x * 37 + y * 11 + Math.sin(y * 7) * 2) * 0.5 + Math.sin(x * 83 - y * 29 + 1.3) * 0.3 + Math.sin(y * 53 + x * 7) * 0.2);

type Piece = { poly: Pt[]; w: number; h: number; cx: number; cy: number; hAt: (x: number, y: number) => number; front: THREE.BufferGeometry; back: THREE.BufferGeometry; band?: THREE.BufferGeometry; pads: PadMesh[] };

function buildPiece(outlinePx: number[][], padsPx: Record<string, number[][]>, zoneOf: (id: string) => string, labelOf: (id: string) => string, bandPx?: number[]): Piece {
  const xs = outlinePx.map((p) => p[0]);
  const ys = outlinePx.map((p) => p[1]);
  const cxp = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cyp = (Math.min(...ys) + Math.max(...ys)) / 2;
  const poly: Pt[] = outlinePx.map(([x, y]) => [(x - cxp) * K, (cyp - y) * K]);
  const x0 = Math.min(...poly.map((p) => p[0]));
  const x1 = Math.max(...poly.map((p) => p[0]));
  const y0 = Math.min(...poly.map((p) => p[1]));
  const y1 = Math.max(...poly.map((p) => p[1]));
  const w = x1 - x0;
  const h = y1 - y0;
  const hAt = (x: number, y: number) => {
    if (!inside(poly, x, y)) return 0;
    const d = nearest(poly, x, y).d;
    return T * smooth01(0, INFLATE, d) + wrinkle(x, y) * smooth01(0, 0.05, d);
  };

  const nx = Math.ceil(w / STEP) + 4;
  const ny = Math.ceil(h / STEP) + 4;
  const gx0 = x0 - STEP * 2;
  const gy0 = y0 - STEP * 2;
  const ins = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) ins[j * nx + i] = inside(poly, gx0 + i * STEP, gy0 + j * STEP) ? 1 : 0;
  const idx = new Int32Array(nx * ny).fill(-1);
  const pos: number[] = [];
  const col: number[] = [];
  const uvs: number[] = [];
  const isIn: number[] = [];
  let n = 0;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      let near = ins[j * nx + i] === 1;
      if (!near) for (let dj = -1; dj <= 1 && !near; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di; const jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < ny && ins[jj * nx + ii]) { near = true; break; } }
      if (!near) continue;
      let x = gx0 + i * STEP;
      let y = gy0 + j * STEP;
      let z = 0;
      let c = 0.8;
      if (ins[j * nx + i]) {
        const nr = nearest(poly, x, y);
        const d = nr.d;
        z = T * smooth01(0, INFLATE, d) + wrinkle(x, y) * smooth01(0, 0.05, d);
        c = 0.78 + 0.22 * smooth01(0, 0.04, d);
      } else { const nr = nearest(poly, x, y); x = nr.x; y = nr.y; }
      pos.push(x, y, z);
      col.push(c, c, c);
      uvs.push((x - x0) / w, (y - y0) / h);
      isIn.push(ins[j * nx + i]);
      idx[j * nx + i] = n++;
    }
  }
  const bandYMax = bandPx ? (cyp - bandPx[0]) * K : 0; // metres, top of band
  const bandYMin = bandPx ? (cyp - bandPx[1]) * K : 0;
  const mk = (flip: boolean, onlyBand: boolean | null) => {
    const tri: number[] = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = idx[j * nx + i];
        const b = idx[j * nx + i + 1];
        const c = idx[(j + 1) * nx + i];
        const d = idx[(j + 1) * nx + i + 1];
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;
        if (!(isIn[a] || isIn[b] || isIn[c] || isIn[d])) continue;
        if (onlyBand !== null) {
          const cy = (pos[a * 3 + 1] + pos[d * 3 + 1]) / 2;
          const inBand = !!bandPx && cy >= bandYMin;
          if (inBand !== onlyBand) continue;
        }
        if (flip) tri.push(a, d, b, a, c, d); else tri.push(a, b, d, a, d, c);
      }
    }
    return tri;
  };
  const mkGeo = (flip: boolean, onlyBand: boolean | null) => {
    const g = new THREE.BufferGeometry();
    const p = flip ? pos.map((v, i) => (i % 3 === 2 ? -v : v)) : pos;
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(onlyBand ? uvs.map((v, i) => (i % 2 === 1 ? (v * h - (bandYMin - y0)) / Math.max(bandYMax - bandYMin, 1e-6) : v)) : uvs, 2));
    g.setIndex(mk(flip, onlyBand));
    g.computeVertexNormals();
    return g;
  };
  const front = mkGeo(false, bandPx ? false : null);
  const back = mkGeo(true, null);
  const band = bandPx ? mkGeo(false, true) : undefined;

  // pads on the traced outlines
  const surf: Surface = {
    point: (u, v, out = new THREE.Vector3()) => { const x = (u - 0.5) * w * 1.3; const y = (v - 0.5) * h * 1.3; return out.set(x, y, hAt(x, y)); },
    axis: (_v, out = new THREE.Vector3()) => out.set(0, 0, -1),
    circumference: () => w * 1.3,
    length: h * 1.3,
    normalAt: (_u, _v, out) => out.set(0, 0, 1),
  };
  const pads: PadMesh[] = Object.entries(padsPx).map(([id, pts]) => {
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const spec: PadSpec = {
      id,
      zone: zoneOf(id),
      label: labelOf(id),
      surf: 'flat',
      u0: 0.5 + ((mx - cxp) * K) / (w * 1.3),
      v0: 0.5 + ((cyp - my) * K) / (h * 1.3),
      shape: { kind: 'poly', pts: pts.map(([x, y]) => [(x - mx) * K, -(y - my) * K] as [number, number]) },
    };
    return buildPadMesh(spec, surf, 1);
  });
  return { poly, w, h, cx: 0, cy: 0, hAt, front, back, band, pads };
}

function waistTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0d0e11';
  g.fillRect(0, 0, 1024, 128);
  g.fillStyle = '#c9ccd2';
  g.font = '600 56px "Arial Narrow", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '8px';
  g.fillText('COMPRESSION', 300, 66);
  g.fillText('COMPRESSION', 800, 66);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

const TOP_ZONE: Record<string, [string, string]> = {
  chest: ['chest', 'Chest'], 'rib-l': ['ribs', 'Ribs'], 'rib-r': ['ribs', 'Ribs'], 'arm-l': ['upper-arms', 'Upper arm'], 'arm-r': ['upper-arms', 'Upper arm'], 'elbow-l': ['elbows', 'Elbow'], 'elbow-r': ['elbows', 'Elbow'],
};
const LEG_ZONE: Record<string, [string, string]> = { hip: ['hips', 'Hip'], thigh: ['thighs', 'Thigh'], knee: ['knees', 'Knee'] };

function buildAll() {
  const top = buildPiece(data.top.outline, data.top.pads, (id) => TOP_ZONE[id][0], (id) => TOP_ZONE[id][1]);
  const legs = buildPiece(data.legs.outline, data.legs.pads, (id) => LEG_ZONE[id][0], (id) => LEG_ZONE[id][1], data.legs.band);
  return { top, legs };
}

const GAP = 0.12;
export function flatLayout(top: { w: number; h: number }, legs: { w: number; h: number }) {
  const totalW = top.w + GAP + legs.w;
  const topX = -totalW / 2 + top.w / 2;
  const legX = totalW / 2 - legs.w / 2;
  const scale: Record<View, number> = {
    set: Math.min(2.45 / Math.max(legs.h, top.h), 3.4 / totalW),
    top: Math.min(1.7 / top.h, 2.7 / top.w),
    legs: Math.min(2.45 / legs.h, 1.5 / legs.w),
  };
  return { totalW, topX, legX, scale };
}

export function FlatGarment({ ctl }: { ctl: GarmentCtl }) {
  const model = useMemo(buildAll, []);
  const mats = useMemo(() => {
    const knit = makeKnitTexture();
    const rib = makeRibTexture();
    const fabric = new THREE.MeshPhysicalMaterial({ color: '#111216', roughness: 0.6, sheen: 1, sheenColor: new THREE.Color('#8a94a8'), sheenRoughness: 0.38, vertexColors: true, bumpMap: knit, bumpScale: 0.1, side: THREE.DoubleSide });
    const pad = new THREE.MeshPhysicalMaterial({ color: '#1d1e24', roughness: 0.72, sheen: 0.5, sheenColor: new THREE.Color('#8a94a8'), sheenRoughness: 0.5, vertexColors: true, bumpMap: rib, bumpScale: 0.1, side: THREE.DoubleSide });
    const band = new THREE.MeshStandardMaterial({ map: waistTexture(), roughness: 0.7, side: THREE.DoubleSide });
    return { fabric, pad, band };
  }, []);
  const layout = useMemo(() => flatLayout(model.top, model.legs), [model]);

  const inner = useRef<THREE.Group>(null);
  const topG = useRef<THREE.Group>(null);
  const legG = useRef<THREE.Group>(null);
  const padRefs = useRef<Record<string, THREE.Group | null>>({});
  const lastEx = useRef(-1);
  const [labelsOn, setLabelsOn] = useState(false);

  const all = useMemo(() => [...model.top.pads.map((p) => ({ p, part: 'top' as const })), ...model.legs.pads.map((p) => ({ p, part: 'legs' as const }))], [model]);
  const labelPads = useMemo(() => { const seen = new Set<string>(); return all.filter(({ p }) => (seen.has(p.spec.zone) ? false : (seen.add(p.spec.zone), true))); }, [all]);

  useFrame(() => {
    const { view, explode } = ctl;
    const g = inner.current;
    if (!g) return;
    const s = layout.scale[view];
    g.scale.setScalar(s);
    g.position.set(view === 'top' ? -layout.topX * s : view === 'legs' ? -layout.legX * s : 0, 0, 0);
    if (topG.current) topG.current.visible = view !== 'legs';
    if (legG.current) legG.current.visible = view !== 'top';
    if (Math.abs(explode - lastEx.current) > 0.0004) {
      for (const { p } of all) { const r = padRefs.current[`${p.spec.id}`]; if (r) r.position.z = explode * EX_LIFT; }
      lastEx.current = explode;
    }
    const on = explode > 0.72;
    if (on !== labelsOn) setLabelsOn(on);
  });

  const piece = (part: 'top' | 'legs', m: Piece, x: number, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[x, 0, 0]}>
      <mesh geometry={m.front} material={mats.fabric} />
      <mesh geometry={m.back} material={mats.fabric} />
      {m.band && <mesh geometry={m.band} material={mats.band} />}
      {m.pads.map((p) => (
        <group key={p.spec.id} ref={(r) => { padRefs.current[p.spec.id] = r; }}>
          <mesh geometry={p.geo} material={mats.pad} />
        </group>
      ))}
      {labelsOn && labelPads.filter((l) => l.part === part).map(({ p }) => (
        <group key={`l-${p.spec.id}`} position={[p.centre.x, p.centre.y, 0.12 + ctl.explode * EX_LIFT]}>
          <Html center pointerEvents="none" zIndexRange={[20, 0]}><span className="pad-label">{p.spec.label}</span></Html>
        </group>
      ))}
    </group>
  );
  return (
    <group ref={inner}>
      {piece('top', model.top, layout.topX, topG)}
      {piece('legs', model.legs, layout.legX, legG)}
    </group>
  );
}
