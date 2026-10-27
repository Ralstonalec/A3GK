'use client';

import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { View } from '@/lib/stage';
import { buildPad, buildTube, curveSurface, ellipseSurface, hexPillow, makeKnitTexture, PITCH, type PadData, type PadSpec } from './geometry';

/**
 * Procedural ghost-mannequin model of the A3GK padded set, built from the supplied product photograph:
 * a long-sleeve top and leggings with hexagon-cell padded panels. It is an illustration, not a scan.
 * Replace with a GLB made from the real product when available; everything else (views, explode,
 * labels) keys off the pad zones below.
 */

export type GarmentCtl = { explode: number; view: View };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const EX_DIST = 0.2;
const LIFT = 0.001;
export const BASE_SCALE: Record<View, number> = { set: 1.6, top: 2.6, legs: 1.95 };
const CENTRE_Y: Record<View, number> = { set: -0.14, top: 0.42, legs: -0.51 };
const TOP_Y = 0.1;

const TOP_PADS: PadSpec[] = [
  { id: 'chest', zone: 'chest', label: 'Chest', surf: 'torso', u0: 0, y0: 0.4, a: 0.095, b: 0.09, shape: 'shield' },
  { id: 'ribs-r', zone: 'ribs', label: 'Ribs', surf: 'torso', u0: 0.135, y0: 0.2, a: 0.062, b: 0.075, shape: 'ellipse', rot: 0.25 },
  { id: 'ribs-l', zone: 'ribs', label: 'Ribs', surf: 'torso', u0: 0.865, y0: 0.2, a: 0.062, b: 0.075, shape: 'ellipse', rot: -0.25 },
  { id: 'shoulder', zone: 'shoulders', label: 'Shoulders', surf: 'sleeve', u0: 0.02, v0: 0.2, a: 0.058, b: 0.07, shape: 'ellipse', mirror: true },
  { id: 'elbow', zone: 'elbows', label: 'Elbows', surf: 'sleeve', u0: 0.96, v0: 0.56, a: 0.045, b: 0.075, shape: 'ellipse', mirror: true },
];
const LEG_PADS: PadSpec[] = [
  { id: 'hip-r', zone: 'hips', label: 'Hips', surf: 'pelvis', u0: 0.215, y0: -0.09, a: 0.07, b: 0.09, shape: 'ellipse', rot: 0.15 },
  { id: 'hip-l', zone: 'hips', label: 'Hips', surf: 'pelvis', u0: 0.785, y0: -0.09, a: 0.07, b: 0.09, shape: 'ellipse', rot: -0.15 },
  { id: 'knee', zone: 'knees', label: 'Knees', surf: 'leg', u0: 0.25, v0: 0.5, a: 0.052, b: 0.085, shape: 'ellipse', mirror: true },
];

function buildModel() {
  const torso = ellipseSurface([V(0.165, 0, 0.095), V(0.158, 0.12, 0.09), V(0.15, 0.27, 0.088), V(0.172, 0.42, 0.098), V(0.18, 0.52, 0.098), V(0.14, 0.58, 0.085), V(0.075, 0.615, 0.065), V(0.068, 0.64, 0.06)]);
  const band = ellipseSurface([V(0.166, 0, 0.106), V(0.166, -0.045, 0.106)]);
  const pelvis = ellipseSurface([V(0.164, -0.04, 0.104), V(0.172, -0.12, 0.112), V(0.15, -0.22, 0.1), V(0.1, -0.26, 0.09)]);
  const sleeve = curveSurface([V(0.12, 0.54, 0), V(0.25, 0.46, 0.005), V(0.335, 0.3, 0.03), V(0.39, 0.12, 0.05), V(0.41, 0.02, 0.045)], [[0, 0.07], [0.3, 0.06], [0.55, 0.05], [1, 0.036]], V(1, 0, 0));
  const leg = curveSurface([V(0.08, -0.16, 0), V(0.085, -0.5, 0.012), V(0.09, -0.9, 0), V(0.09, -1.02, 0)], [[0, 0.098], [0.3, 0.082], [0.5, 0.066], [0.62, 0.062], [1, 0.046]], V(1, 0, 0));
  const surfs = { torso, sleeve, pelvis, leg };
  const mk = (specs: PadSpec[]) =>
    specs.flatMap((s) => {
      const surf = surfs[s.surf as keyof typeof surfs];
      return s.mirror ? [buildPad(s, surf, 1), buildPad(s, surf, -1)] : [buildPad(s, surf, 1)];
    });
  return {
    geo: {
      torso: buildTube(torso, 56, 56),
      sleeveR: buildTube(sleeve, 44, 28),
      sleeveL: buildTube(sleeve, 44, 28, 110, true),
      band: buildTube(band, 4, 56),
      pelvis: buildTube(pelvis, 20, 56),
      legR: buildTube(leg, 56, 28),
      legL: buildTube(leg, 56, 28, 110, true),
    },
    topPads: mk(TOP_PADS),
    legPads: mk(LEG_PADS),
  };
}

function applyPart(cells: THREE.InstancedMesh, back: THREE.InstancedMesh, pads: PadData[], ex: number) {
  const d = new THREE.Object3D();
  const off = new THREE.Vector3();
  let k = 0;
  for (const p of pads) {
    off.copy(p.normal).multiplyScalar(ex * EX_DIST);
    for (const c of p.cells) {
      d.quaternion.copy(c.quat);
      d.position.copy(c.pos).addScaledVector(c.nrm, LIFT).add(off);
      d.updateMatrix();
      cells.setMatrixAt(k, d.matrix);
      d.position.copy(c.pos).addScaledVector(c.nrm, LIFT - 0.0025).add(off);
      d.updateMatrix();
      back.setMatrixAt(k, d.matrix);
      k++;
    }
  }
  cells.instanceMatrix.needsUpdate = true;
  back.instanceMatrix.needsUpdate = true;
}

const count = (pads: PadData[]) => pads.reduce((n, p) => n + p.cells.length, 0);

export function Garment({ ctl }: { ctl: GarmentCtl }) {
  const model = useMemo(buildModel, []);
  const mats = useMemo(() => {
    const knit = makeKnitTexture();
    const fabric = new THREE.MeshPhysicalMaterial({ color: '#1a1d22', roughness: 0.78, sheen: 1, sheenColor: new THREE.Color('#7a8494'), sheenRoughness: 0.5, bumpMap: knit, bumpScale: 1.6, side: THREE.DoubleSide });
    const band = fabric.clone();
    band.color = new THREE.Color('#20232a');
    return {
      fabric,
      band,
      cell: new THREE.MeshStandardMaterial({ color: '#2d3239', roughness: 0.88, metalness: 0 }),
      back: new THREE.MeshStandardMaterial({ color: '#101216', roughness: 1, metalness: 0 }),
    };
  }, []);
  const geos = useMemo(() => ({ cell: hexPillow(PITCH * 0.975 - 0.003, 0.0035, 0.003), back: hexPillow(PITCH * 1.12 - 0.0015, 0.0015, 0.0015) }), []);

  const inner = useRef<THREE.Group>(null);
  const topG = useRef<THREE.Group>(null);
  const legG = useRef<THREE.Group>(null);
  const tc = useRef<THREE.InstancedMesh>(null);
  const tb = useRef<THREE.InstancedMesh>(null);
  const lc = useRef<THREE.InstancedMesh>(null);
  const lb = useRef<THREE.InstancedMesh>(null);
  const labelRefs = useRef<Record<string, THREE.Group | null>>({});
  const lastEx = useRef(-1);
  const [labelsOn, setLabelsOn] = useState(false);

  const labelPads = useMemo(() => {
    const seen = new Set<string>();
    const pick = (pads: PadData[], part: 'top' | 'legs') =>
      pads.filter((p) => (seen.has(p.spec.zone) || p.side === -1 ? false : (seen.add(p.spec.zone), true))).map((p) => ({ p, part }));
    return [...pick(model.topPads, 'top'), ...pick(model.legPads, 'legs')];
  }, [model]);

  useFrame(() => {
    const { view, explode } = ctl;
    const g = inner.current;
    if (!g) return;
    const sc = BASE_SCALE[view];
    g.scale.setScalar(sc);
    g.position.y = -CENTRE_Y[view] * sc;
    if (topG.current) topG.current.visible = view !== 'legs';
    if (legG.current) legG.current.visible = view !== 'top';
    if (Math.abs(explode - lastEx.current) > 0.0004 && tc.current && tb.current && lc.current && lb.current) {
      applyPart(tc.current, tb.current, model.topPads, explode);
      applyPart(lc.current, lb.current, model.legPads, explode);
      lastEx.current = explode;
      for (const { p } of labelPads) {
        const ref = labelRefs.current[p.spec.id];
        if (ref) ref.position.copy(p.centre).addScaledVector(p.normal, explode * EX_DIST + 0.02);
      }
    }
    const on = explode > 0.72;
    if (on !== labelsOn) setLabelsOn(on);
  });

  const { geo } = model;
  return (
    <group ref={inner}>
      <group ref={topG} position={[0, TOP_Y, 0]}>
        <mesh geometry={geo.torso} material={mats.fabric} />
        <mesh geometry={geo.sleeveR} material={mats.fabric} />
        <mesh geometry={geo.sleeveL} material={mats.fabric} />
        <mesh position={[0, 0.632, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.9, 1]} material={mats.band}>
          <torusGeometry args={[0.066, 0.008, 10, 40]} />
        </mesh>
        <instancedMesh ref={tc} args={[geos.cell, mats.cell, count(model.topPads)]} frustumCulled={false} />
        <instancedMesh ref={tb} args={[geos.back, mats.back, count(model.topPads)]} frustumCulled={false} />
        {labelsOn && labelPads.filter((l) => l.part === 'top').map(({ p }) => (
          <group key={p.spec.id} ref={(r) => { labelRefs.current[p.spec.id] = r; if (r) r.position.copy(p.centre).addScaledVector(p.normal, ctl.explode * EX_DIST + 0.02); }}>
            <Html center pointerEvents="none" zIndexRange={[20, 0]}><span className="pad-label">{p.spec.label}</span></Html>
          </group>
        ))}
      </group>
      <group ref={legG}>
        <mesh geometry={geo.band} material={mats.band} />
        <mesh geometry={geo.pelvis} material={mats.fabric} />
        <mesh geometry={geo.legR} material={mats.fabric} />
        <mesh geometry={geo.legL} material={mats.fabric} />
        <instancedMesh ref={lc} args={[geos.cell, mats.cell, count(model.legPads)]} frustumCulled={false} />
        <instancedMesh ref={lb} args={[geos.back, mats.back, count(model.legPads)]} frustumCulled={false} />
        {labelsOn && labelPads.filter((l) => l.part === 'legs').map(({ p }) => (
          <group key={p.spec.id} ref={(r) => { labelRefs.current[p.spec.id] = r; if (r) r.position.copy(p.centre).addScaledVector(p.normal, ctl.explode * EX_DIST + 0.02); }}>
            <Html center pointerEvents="none" zIndexRange={[20, 0]}><span className="pad-label">{p.spec.label}</span></Html>
          </group>
        ))}
      </group>
    </group>
  );
}
