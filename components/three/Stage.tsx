'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, Environment, Lightformer } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { Bubbles } from './Ambient';
import { FlatGarment } from './FlatGarment';
import { BASE_SCALE, Garment, type GarmentCtl } from './Garment';
import { installActions } from './actions';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Where the garment sits for each page section (x/y are fractions of half the viewport). */
const POSES: Record<string, { x: number; y: number; s: number }> = {
  hero: { x: 0.22, y: 0, s: 1 },
  overview: { x: 0.52, y: 0, s: 0.78 },
  padding: { x: 0, y: 0, s: 0.95 },
  fit: { x: -0.52, y: 0, s: 0.72 },
};

function Lights() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={7} position={[-3, 4, 4]} scale={[7, 4, 1]} target={[0, 0, 0]} color="#ffffff" />
      <Lightformer form="rect" intensity={5} position={[4.5, 1, -3]} scale={[1.4, 9, 1]} target={[0, 0, 0]} color="#f4f6ff" />
      <Lightformer form="rect" intensity={3.2} position={[-4.5, 0, -3]} scale={[1.4, 9, 1]} target={[0, 0, 0]} color="#cfe0ff" />
      <Lightformer form="ring" intensity={1.4} position={[0, -4, 3]} scale={5} target={[0, 0, 0]} color="#ffffff" />
    </Environment>
  );
}

function Scene() {
  const root = useRef<THREE.Group>(null);
  const [mode, setMode] = useState(stage.mode);
  useEffect(() => {
    const f = () => setMode(stage.mode);
    window.addEventListener('stage-mode', f);
    return () => window.removeEventListener('stage-mode', f);
  }, []);
  const ctl = useRef<GarmentCtl>({ explode: 0, view: 'set' });
  const pose = useRef({ x: 0, y: 0, s: 1, ex: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const sections = useRef<HTMLElement[]>([]);
  const announced = useRef(false);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
    const mobile = vp.width / vp.height < 0.85;
    if (!announced.current) {
      announced.current = true;
      stage.live = true;
      document.documentElement.dataset.stageLive = '1';
      window.dispatchEvent(new Event('stage-live'));
    }

    if (!sections.current.length) sections.current = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'));
    const vh = window.innerHeight;
    let name = 'none';
    let prog = 0;
    for (const el of sections.current) {
      const r = el.getBoundingClientRect();
      if (r.top <= vh * 0.5 && r.bottom >= vh * 0.5) { name = el.dataset.stage ?? 'none'; prog = clamp((vh * 0.5 - r.top) / r.height); break; }
    }
    const P = POSES[name] ?? { x: 0, y: 0, s: 0 };
    const tx = mobile ? 0 : P.x;
    const norm = BASE_SCALE.set / BASE_SCALE[stage.view];
    const ty = mobile ? (name === 'hero' ? -0.5 : name === 'padding' ? -0.22 : 0.34) : P.y;
    const ts = mobile ? P.s * norm * (name === 'hero' ? 0.46 : name === 'padding' ? 0.72 : 0.8) : P.s;
    const tex = name === 'padding' ? smooth(0.1, 0.45, prog) * (1 - smooth(0.88, 1, prog)) : 0;
    const k = 1 - Math.exp(-dt * 3.5);
    const p = pose.current;
    p.x += (tx - p.x) * k;
    p.y += (ty - p.y) * k;
    p.s += (ts - p.s) * k;
    p.ex += (tex - p.ex) * (1 - Math.exp(-dt * 5));

    cur.current.x += (stage.mouse.x - cur.current.x) * 0.05;
    cur.current.y += (stage.mouse.y - cur.current.y) * 0.05;

    const g = root.current;
    if (!g) return;
    g.visible = p.s > 0.01;
    g.position.set(p.x * (vp.width / 2), p.y * (vp.height / 2) + Math.sin(t * 0.9) * 0.05, 0);
    g.scale.setScalar(Math.max(0.0001, p.s));
    g.rotation.y = cur.current.x * (stage.mode === 'flat' ? 0.5 : 0.9) + (name === 'hero' ? 0 : stage.mode === 'flat' ? Math.sin(t * 0.3) * 0.25 : t * 0.22) + stage.fx.spin;
    g.rotation.x = cur.current.y * 0.2;
    ctl.current.explode = p.ex;
    ctl.current.view = stage.view;
  });

  return (
    <>
      <Lights />
      <group ref={root}>
        {mode === 'flat' ? <FlatGarment ctl={ctl.current} /> : <Garment ctl={ctl.current} />}
      </group>
      <Bubbles />
      <AdaptiveDpr pixelated />
    </>
  );
}

export default function Stage() {
  useEffect(() => {
    installActions();
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __stage: unknown }).__stage = stage;
    const onMove = (e: PointerEvent) => {
      stage.mouse.x = e.clientX / window.innerWidth - 0.5;
      stage.mouse.y = e.clientY / window.innerHeight - 0.5;
      stage.ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      stage.ndc.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6.5], fov: 30 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} style={{ background: 'transparent' }}>
      <Scene />
    </Canvas>
  );
}
