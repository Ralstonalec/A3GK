'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { stage } from '@/lib/stage';
import { Bubbles } from './Ambient';
import { RenderPlane, TOUR, type RenderCtl } from './RenderPlane';
import { installActions } from './actions';

const coarseNow = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Where the render sits for each page section (x/y are fractions of half the viewport). */
const POSES: Record<string, { x: number; y: number; s: number }> = {
  hero: { x: 0.14, y: 0, s: 1 },
  overview: { x: 0.52, y: 0, s: 0.8 },
  padding: { x: 0, y: 0, s: 1 },
  fit: { x: -0.52, y: 0, s: 0.74 },
};

function Scene() {
  const root = useRef<THREE.Group>(null);
  const ctl = useRef<RenderCtl>({ view: 'set', tour: null });
  const vpRef = useRef({ width: 1, height: 1 });
  const pose = useRef({ x: 0, y: 0, s: 1 });
  const cur = useRef({ x: 0, y: 0 });
  const sections = useRef<HTMLElement[]>([]);
  const announced = useRef(false);
  const onShown = () => {
    if (announced.current) return;
    announced.current = true;
    stage.live = true;
    document.documentElement.dataset.stageLive = '1';
    window.dispatchEvent(new Event('stage-live'));
  };
  const zone = useRef(-1);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
    vpRef.current = { width: vp.width, height: vp.height };
    const mobile = vp.width / vp.height < 0.85;
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
    const ty = mobile ? (name === 'hero' ? -0.36 : name === 'padding' ? -0.04 : 0.5) : P.y;
    const ts = mobile ? P.s * (name === 'hero' ? 1.25 : name === 'padding' ? 0.9 : 1.5) : P.s;
    const k = 1 - Math.exp(-dt * 3.5);
    const p = pose.current;
    p.x += (tx - p.x) * k;
    p.y += (ty - p.y) * k;
    p.s += (ts - p.s) * k;

    cur.current.x += (stage.mouse.x - cur.current.x) * 0.05;
    cur.current.y += (stage.mouse.y - cur.current.y) * 0.05;

    const inTour = name === 'padding';
    const tour = inTour ? clamp((prog - 0.05) / 0.88) * (TOUR.length - 1) : null;
    ctl.current.tour = tour;
    ctl.current.view = stage.view;
    const z = tour === null ? -1 : Math.round(tour);
    if (z !== zone.current) {
      zone.current = z;
      stage.padZone = z;
      window.dispatchEvent(new CustomEvent('pad-zone', { detail: z }));
    }

    const g = root.current;
    if (!g) return;
    g.visible = p.s > 0.01;
    g.position.set(p.x * (vp.width / 2), p.y * (vp.height / 2) + Math.sin(t * 0.9) * 0.04, 0);
    g.scale.setScalar(Math.max(0.0001, p.s));
    g.rotation.y = cur.current.x * 0.22;
    g.rotation.x = cur.current.y * 0.12;
  });

  return (
    <>
      <group ref={root}>
        <Suspense fallback={null}>
          <RenderPlane ctl={ctl.current} vpRef={vpRef} onShown={onShown} />
        </Suspense>
      </group>
      <Bubbles count={coarseNow() ? 28 : 70} />
    </>
  );
}

export default function Stage() {
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
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
    <Canvas dpr={[1, coarse ? 1.5 : 1.75]} resize={{ debounce: 250, scroll: false }} camera={{ position: [0, 0, 6.5], fov: 30 }} onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', () => { delete document.documentElement.dataset.stageLive; stage.live = false; window.dispatchEvent(new Event('stage-lost')); })} gl={{ antialias: !coarse, alpha: true, powerPreference: 'high-performance' }} style={{ background: 'transparent' }}>
      <Scene />
    </Canvas>
  );
}
