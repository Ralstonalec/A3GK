'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

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
