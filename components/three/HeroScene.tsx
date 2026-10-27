'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, useTexture } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Cinematic layer over the real product photograph: the photo is mapped on a plane that drifts slowly
 * while a soft key light and a rim light sweep across it, with sparse instanced dust in front.
 * The garment is never redrawn or altered; the photo is the source of truth.
 */

function Photo({ src, aspect }: { src: string; aspect: number }) {
  const tex = useTexture(src);
  const mesh = useRef<THREE.Mesh>(null);
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (mesh.current) {
      mesh.current.rotation.y = Math.sin(t * 0.18) * 0.05;
      mesh.current.rotation.x = Math.sin(t * 0.13) * 0.025;
    }
    if (key.current) key.current.position.set(Math.sin(t * 0.2) * 2.5, 2 + Math.cos(t * 0.15), 3);
    if (rim.current) rim.current.position.set(-1.6 + Math.sin(t * 0.25) * 1.2, Math.cos(t * 0.2) * 1.5, 1.2);
  });
  return (
    <>
      <mesh ref={mesh}>
        <planeGeometry args={[2 * aspect, 2]} />
        {/* emissive keeps the photo's true tones; lights only add sheen on top */}
        <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={1} roughness={0.85} metalness={0} />
      </mesh>
      <spotLight ref={key} angle={0.7} penumbra={1} intensity={6} color="#ffffff" />
      <pointLight ref={rim} intensity={0.8} distance={6} color="#ffffff" />
    </>
  );
}

/** Instanced drifting dust: one draw call for all particles. */
function Dust({ count = 60 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 2.4, y: (Math.random() - 0.5) * 2.4, z: 0.2 + Math.random() * 1.2,
    s: 0.003 + Math.random() * 0.005, sp: 0.05 + Math.random() * 0.1, ph: Math.random() * 6.28,
  })), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      dummy.position.set(s.x + Math.sin(t * s.sp + s.ph) * 0.15, s.y + ((t * s.sp * 0.5 + s.ph) % 1) * 0.3, s.z);
      dummy.scale.setScalar(s.s);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
    </instancedMesh>
  );
}

export default function HeroScene({ src, aspect }: { src: string; aspect: number }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 3.4], fov: 30 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.15} />
      <Suspense fallback={null}>
        <Photo src={src} aspect={aspect} />
        <Dust />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
