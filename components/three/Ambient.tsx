'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { hexPillow } from './geometry';

/** Loose foam cells drifting around the garment. One instanced draw call; repelled by the pointer. */
export function FoamCells({ dim, count = 30 }: { dim: { current: number }; count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => hexPillow(0.5, 0.2, 0.1), []);
  const seeds = useMemo(() => Array.from({ length: count }, () => ({ x: 0, y: 0, z: 0, s: 0, ph: 0, rx: 0, ry: 0, rz: 0, vx: 0, vy: 0, ox: 0, oy: 0, tilt: 0 })), [count]);
  const lastShuffle = useRef(-1);
  const d = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  const shuffle = (w: number, h: number) => {
    seeds.forEach((c, i) => {
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.9 + Math.random() * 0.9;
      c.x = Math.cos(ang) * rad * w * 0.42;
      c.y = Math.sin(ang) * rad * h * 0.42;
      c.z = -2.2 + Math.random() * 3.2;
      c.s = 0.07 + Math.random() * 0.2;
      c.ph = Math.random() * 6.28;
      c.rx = Math.random() * 3;
      c.ry = Math.random() * 3;
      c.rz = Math.random() * 6;
      c.vx = (Math.random() - 0.5) * 0.4;
      c.vy = (Math.random() - 0.5) * 0.4;
      const depth = (c.z + 2.2) / 3.2; // 0 far .. 1 near
      col.setScalar(0.35 + depth * 0.65);
      mesh.current?.setColorAt(i, col);
    });
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  };

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
    if (lastShuffle.current !== stage.reshuffle) {
      shuffle(vp.width, vp.height);
      lastShuffle.current = stage.reshuffle;
    }
    const t = state.clock.elapsedTime;
    const px = stage.ndc.x * (vp.width / 2);
    const py = stage.ndc.y * (vp.height / 2);
    const imp = stage.fx.implode;
    seeds.forEach((c, i) => {
      const dx = c.x + c.ox - px;
      const dy = c.y + c.oy - py;
      const dist = Math.hypot(dx, dy) || 1;
      let tx = 0;
      let ty = 0;
      let boost = 1;
      if (dist < 1.8) {
        const f = (1.8 - dist) / 1.8;
        tx = (dx / dist) * f * 1.1;
        ty = (dy / dist) * f * 1.1;
        boost = 1 + f * 5;
      }
      c.ox += (tx - c.ox) * 0.1;
      c.oy += (ty - c.oy) * 0.1;
      c.tilt += 0.004 * boost;
      const fx = Math.sin(t * 0.4 + c.ph) * 0.12 + c.vx * Math.sin(t * 0.2 + c.ph);
      const fy = Math.cos(t * 0.5 + c.ph) * 0.14;
      d.position.set(THREE.MathUtils.lerp(c.x + c.ox + fx, 0, imp), THREE.MathUtils.lerp(c.y + c.oy + fy, 0, imp), THREE.MathUtils.lerp(c.z, 0, imp));
      d.rotation.set(c.rx + c.tilt * 0.6, c.ry + c.tilt, c.rz);
      d.scale.setScalar(Math.max(0.001, c.s * (1 - 0.92 * imp) * dim.current));
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    void dt;
  });

  useEffect(() => {
    mesh.current?.setColorAt(0, new THREE.Color(1, 1, 1));
  }, []);

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial color="#2a2f37" roughness={0.85} metalness={0} />
    </instancedMesh>
  );
}

/** Tiny bubbles rising endlessly. Instanced, GPU-cheap. */
export function Bubbles({ count = 70 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const d = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), z: -1.5 + Math.random() * 3, s: 0.01 + Math.random() * 0.022, sp: 0.04 + Math.random() * 0.1, ph: Math.random() * 6.28 })), [count]);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
    const t = state.clock.elapsedTime;
    seeds.forEach((b, i) => {
      const y = (((b.y + t * b.sp) % 1) + 1) % 1;
      d.position.set((b.x - 0.5) * vp.width * 1.1 + Math.sin(t * 0.6 + b.ph) * 0.08, (y - 0.5) * vp.height * 1.15, b.z);
      d.scale.setScalar(b.s);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} />
    </instancedMesh>
  );
}
