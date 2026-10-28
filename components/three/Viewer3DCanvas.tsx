'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import type { View } from '@/lib/stage';
import { Garment, type GarmentCtl } from './Garment';

export type Light = 'Studio' | 'Rim light' | 'Soft';
const L: Record<Light, { key: number; rim: number; fill: number }> = {
  Studio: { key: 7, rim: 5, fill: 1.4 },
  'Rim light': { key: 1.2, rim: 14, fill: 0.3 },
  Soft: { key: 3.5, rim: 2, fill: 3.5 },
};

function Rig({ view, explode }: { view: View; explode: number }) {
  const ctl = useRef<GarmentCtl>({ explode: 0, view });
  useFrame((_, dt) => {
    ctl.current.view = view;
    ctl.current.explode += (explode - ctl.current.explode) * (1 - Math.exp(-dt * 5));
  });
  return <Garment ctl={ctl.current} />;
}

export default function Viewer3DCanvas({ view, explode, light, spin }: { view: View; explode: number; light: Light; spin: boolean }) {
  const p = L[light];
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6.4], fov: 30 }} gl={{ antialias: true, alpha: true }}>
      <Environment key={light} resolution={256} frames={1}>
        <Lightformer form="rect" intensity={p.key} position={[-3, 4, 4]} scale={[7, 4, 1]} target={[0, 0, 0]} color="#ffffff" />
        <Lightformer form="rect" intensity={p.rim} position={[4.5, 1, -3]} scale={[1.4, 9, 1]} target={[0, 0, 0]} color="#f4f6ff" />
        <Lightformer form="rect" intensity={p.rim * 0.7} position={[-4.5, 0, -3]} scale={[1.4, 9, 1]} target={[0, 0, 0]} color="#cfe0ff" />
        <Lightformer form="ring" intensity={p.fill} position={[0, -4, 3]} scale={5} target={[0, 0, 0]} color="#ffffff" />
      </Environment>
      <Rig view={view} explode={explode} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate={spin} autoRotateSpeed={1.2} minPolarAngle={Math.PI * 0.3} maxPolarAngle={Math.PI * 0.7} />
    </Canvas>
  );
}
