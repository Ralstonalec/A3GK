'use client';

import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { View } from '@/lib/stage';
import { buildPadMesh, buildTube, curveSurface, ellipseSurface, lineSamples, makeKnitTexture, ringSamples, seamGeometry, type PadMesh, type PadSpec } from './geometry';

/**
 * Procedural model of the A3GK padded set, built from photographs of the real garments:
 * a mock-neck long-sleeve top (bib chest pad, two kidney rib pads, long upper-arm pads, forearm pads)
 * and full-length leggings (hip + thigh pad pair, knee pads, printed waistband).
 * Pad outlines and positions are traced from flat-lay photos. It is a reconstruction, not a scan:
 * replace with a measured/scanned GLB when available. Keep zone names (see PAD specs) for labels/explode.
 */

export type GarmentCtl = { explode: number; view: View };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const EX_DIST = 0.2;
export const BASE_SCALE: Record<View, number> = { set: 1.55, top: 2.55, legs: 1.9 };
const CENTRE_Y: Record<View, number> = { set: -0.17, top: 0.42, legs: -0.58 };
const TOP_Y = 0.12;

const BIB: [number, number][] = [[-0.095, 0.085], [-0.05, 0.098], [0, 0.092], [0.05, 0.098], [0.095, 0.085], [0.1, 0.05], [0.07, 0.0], [0.055, -0.04], [0.04, -0.085], [0, -0.1], [-0.04, -0.085], [-0.055, -0.04], [-0.07, 0.0], [-0.1, 0.05]];

const TOP_PADS: PadSpec[] = [
  { id: 'chest', zone: 'chest', label: 'Chest', surf: 'torso', u0: 0, y0: 0.46, shape: { kind: 'poly', pts: BIB } },
  { id: 'ribs-r', zone: 'ribs', label: 'Ribs', surf: 'torso', u0: 0.135, y0: 0.31, shape: { kind: 'ellipse', a: 0.115, b: 0.08, n: 2.3 }, rot: 0.1 },
  { id: 'ribs-l', zone: 'ribs', label: 'Ribs', surf: 'torso', u0: 0.865, y0: 0.31, shape: { kind: 'ellipse', a: 0.115, b: 0.08, n: 2.3 }, rot: -0.1 },
  { id: 'upper-arm', zone: 'upper-arms', label: 'Upper arm', surf: 'sleeve', u0: 0.08, v0: 0.3, shape: { kind: 'ellipse', a: 0.052, b: 0.105, n: 3.2 }, mirror: true },
  { id: 'elbow', zone: 'elbows', label: 'Elbow', surf: 'sleeve', u0: 0.03, v0: 0.66, shape: { kind: 'ellipse', a: 0.054, b: 0.12, n: 3 }, mirror: true },
];
const LEG_PADS: PadSpec[] = [
  { id: 'hip-r', zone: 'hips', label: 'Hip', surf: 'pelvis', u0: 0.215, y0: -0.115, shape: { kind: 'ellipse', a: 0.065, b: 0.085, n: 2.4 }, rot: 0.2 },
  { id: 'hip-l', zone: 'hips', label: 'Hip', surf: 'pelvis', u0: 0.785, y0: -0.115, shape: { kind: 'ellipse', a: 0.065, b: 0.085, n: 2.4 }, rot: -0.2 },
  { id: 'thigh', zone: 'thighs', label: 'Thigh', surf: 'leg', u0: 0.12, v0: 0.11, shape: { kind: 'ellipse', a: 0.075, b: 0.105, n: 2.5 }, mirror: true },
  { id: 'knee', zone: 'knees', label: 'Knee', surf: 'leg', u0: 0.25, v0: 0.5, shape: { kind: 'ellipse', a: 0.07, b: 0.095, n: 2.5 }, mirror: true },
];

function waistTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0d0e11';
  g.fillRect(0, 0, 2048, 128);
  g.fillStyle = '#c3c6cc';
  g.font = '600 46px "Arial Narrow", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '7px';
  for (const x of [256, 768, 1280, 1792]) g.fillText('COMPRESSION', x, 66);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.x = -1;
  t.offset.x = 1;
  return t;
}

function buildModel() {
  const t0 = performance.now();
  const torso = ellipseSurface([V(0.2, 0, 0.108), V(0.195, 0.12, 0.104), V(0.185, 0.26, 0.1), V(0.2, 0.42, 0.108), V(0.205, 0.52, 0.108), V(0.16, 0.58, 0.095), V(0.085, 0.63, 0.07), V(0.072, 0.645, 0.064), V(0.07, 0.68, 0.062)]);
  const band = ellipseSurface([V(0.178, 0, 0.112), V(0.178, -0.055, 0.112)]);
  const pelvis = ellipseSurface([V(0.176, -0.05, 0.11), V(0.185, -0.13, 0.118), V(0.15, -0.2, 0.1), V(0.1, -0.24, 0.09)]);
  const sleeve = curveSurface([V(0.15, 0.545, 0), V(0.27, 0.47, 0.005), V(0.36, 0.31, 0.03), V(0.415, 0.12, 0.05), V(0.435, 0.02, 0.045)], [[0, 0.075], [0.3, 0.066], [0.55, 0.056], [1, 0.04]], V(1, 0, 0));
  const leg = curveSurface([V(0.085, -0.2, 0), V(0.09, -0.5, 0.012), V(0.095, -0.9, 0), V(0.097, -1.04, 0)], [[0, 0.105], [0.3, 0.088], [0.5, 0.07], [0.62, 0.066], [1, 0.05]], V(1, 0, 0));
  const surfs = { torso, sleeve, pelvis, leg };
  const mk = (specs: PadSpec[]): PadMesh[] =>
    specs.flatMap((s) => {
      const surf = surfs[s.surf as keyof typeof surfs];
      return s.mirror ? [buildPadMesh(s, surf, 1), buildPadMesh(s, surf, -1)] : [buildPadMesh(s, surf, 1)];
    });

  const seam = (g: THREE.BufferGeometry[], s: typeof torso, samples: [number, number][], closed: boolean, mirror = false) => g.push(seamGeometry(s, samples, closed, mirror));
  const topSeams: THREE.BufferGeometry[] = [];
  seam(topSeams, torso, ringSamples(0.03), true);
  seam(topSeams, torso, ringSamples(0.9), true);
  seam(topSeams, torso, lineSamples(0.25, 0.0, 0.62), false);
  seam(topSeams, torso, lineSamples(0.75, 0.0, 0.62), false);
  for (const m of [false, true]) {
    seam(topSeams, sleeve, ringSamples(0.105, 48), true, m);
    seam(topSeams, sleeve, ringSamples(0.97, 48), true, m);
    seam(topSeams, sleeve, lineSamples(0.5, 0.1, 0.97), false, m);
  }
  const legSeams: THREE.BufferGeometry[] = [];
  seam(legSeams, pelvis, ringSamples(0.02), true);
  for (const m of [false, true]) {
    seam(legSeams, leg, lineSamples(0.5, 0.02, 1), false, m);
    seam(legSeams, leg, lineSamples(0.0, 0.02, 1), false, m);
  }

  const w = { wrinkle: 0.0012 };
  const out = {
    geo: {
      torso: buildTube(torso, 80, 72, 110, false, w),
      sleeveR: buildTube(sleeve, 56, 32, 110, false, w),
      sleeveL: buildTube(sleeve, 56, 32, 110, true, w),
      band: buildTube(band, 4, 96, 110, false, { unitUV: true }),
      pelvis: buildTube(pelvis, 24, 72, 110, false, w),
      legR: buildTube(leg, 72, 32, 110, false, w),
      legL: buildTube(leg, 72, 32, 110, true, w),
    },
    topPads: mk(TOP_PADS),
    legPads: mk(LEG_PADS),
    topSeams,
    legSeams,
  };
  if (process.env.NODE_ENV !== 'production') {
    const verts = [...Object.values(out.geo), ...out.topPads.map((p) => p.geo), ...out.legPads.map((p) => p.geo)].reduce((n, g) => n + g.attributes.position.count, 0);
    console.info('[model] vertices', verts, 'pads', out.topPads.length + out.legPads.length, 'ms', Math.round(performance.now() - t0));
  }
  return out;
}

export function Garment({ ctl }: { ctl: GarmentCtl }) {
  const model = useMemo(buildModel, []);
  const mats = useMemo(() => {
    const knit = makeKnitTexture();
    const knitPad = knit.clone();
    knitPad.needsUpdate = true;
    const fabric = new THREE.MeshPhysicalMaterial({ color: '#0d0e11', roughness: 0.88, sheen: 1, sheenColor: new THREE.Color('#566070'), sheenRoughness: 0.55, bumpMap: knit, bumpScale: 0.9, side: THREE.DoubleSide });
    const pad = new THREE.MeshPhysicalMaterial({ color: '#16181c', roughness: 0.7, sheen: 0.8, sheenColor: new THREE.Color('#6a7484'), sheenRoughness: 0.45, bumpMap: knitPad, bumpScale: 1.4, side: THREE.DoubleSide });
    const band = new THREE.MeshStandardMaterial({ map: waistTexture(), roughness: 0.82, side: THREE.DoubleSide });
    const seam = new THREE.MeshStandardMaterial({ color: '#23262b', roughness: 0.9 });
    return { fabric, pad, band, seam };
  }, []);

  const inner = useRef<THREE.Group>(null);
  const topG = useRef<THREE.Group>(null);
  const legG = useRef<THREE.Group>(null);
  const padRefs = useRef<Record<string, THREE.Group | null>>({});
  const lastEx = useRef(-1);
  const [labelsOn, setLabelsOn] = useState(false);

  const allPads = useMemo(() => [...model.topPads.map((p) => ({ p, part: 'top' as const })), ...model.legPads.map((p) => ({ p, part: 'legs' as const }))], [model]);
  const labelPads = useMemo(() => {
    const seen = new Set<string>();
    return allPads.filter(({ p }) => (p.side === -1 || seen.has(p.spec.zone) ? false : (seen.add(p.spec.zone), true)));
  }, [allPads]);

  useFrame(() => {
    const { view, explode } = ctl;
    const g = inner.current;
    if (!g) return;
    const sc = BASE_SCALE[view];
    g.scale.setScalar(sc);
    g.position.y = -CENTRE_Y[view] * sc;
    if (topG.current) topG.current.visible = view !== 'legs';
    if (legG.current) legG.current.visible = view !== 'top';
    if (Math.abs(explode - lastEx.current) > 0.0004) {
      for (const { p } of allPads) {
        const ref = padRefs.current[`${p.spec.id}${p.side}`];
        if (ref) ref.position.copy(p.normal).multiplyScalar(explode * EX_DIST);
      }
      lastEx.current = explode;
    }
    const on = explode > 0.72;
    if (on !== labelsOn) setLabelsOn(on);
  });

  const { geo } = model;
  const renderPads = (part: 'top' | 'legs') =>
    allPads.filter((a) => a.part === part).map(({ p }) => (
      <group key={`${p.spec.id}${p.side}`} ref={(r) => { padRefs.current[`${p.spec.id}${p.side}`] = r; }}>
        <mesh geometry={p.geo} material={mats.pad} />
      </group>
    ));
  const renderLabels = (part: 'top' | 'legs') =>
    labelsOn && labelPads.filter((l) => l.part === part).map(({ p }) => (
      <group key={`l-${p.spec.id}`} position={p.centre.clone().addScaledVector(p.normal, ctl.explode * EX_DIST + 0.03)}>
        <Html center pointerEvents="none" zIndexRange={[20, 0]}><span className="pad-label">{p.spec.label}</span></Html>
      </group>
    ));

  return (
    <group ref={inner}>
      <group ref={topG} position={[0, TOP_Y, 0]}>
        <mesh geometry={geo.torso} material={mats.fabric} />
        <mesh geometry={geo.sleeveR} material={mats.fabric} />
        <mesh geometry={geo.sleeveL} material={mats.fabric} />
        {model.topSeams.map((g, i) => <mesh key={i} geometry={g} material={mats.seam} />)}
        {renderPads('top')}
        {renderLabels('top')}
      </group>
      <group ref={legG}>
        <mesh geometry={geo.band} material={mats.band} />
        <mesh geometry={geo.pelvis} material={mats.fabric} />
        <mesh geometry={geo.legR} material={mats.fabric} />
        <mesh geometry={geo.legL} material={mats.fabric} />
        {model.legSeams.map((g, i) => <mesh key={i} geometry={g} material={mats.seam} />)}
        {renderPads('legs')}
        {renderLabels('legs')}
      </group>
    </group>
  );
}
