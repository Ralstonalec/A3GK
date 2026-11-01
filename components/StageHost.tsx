'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { stage } from '@/lib/stage';

const Stage = dynamic(() => import('./three/Stage'), { ssr: false });

/** Does any section that uses the 3D stage (hero, padded-areas tour) sit near the screen? If not, the canvas sleeps. */
function useStageActive(on: boolean) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    if (!on) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'));
    if (!els.length) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      setActive(visible.size > 0);
    }, { rootMargin: '25% 0px 25% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [on]);
  return active;
}

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/**
 * One fixed, non-interactive 3D scene behind the whole page. It only mounts when motion is allowed,
 * WebGL exists and the browser is idle; otherwise the real product photo in the hero is all there is.
 */
export function StageHost() {
  const [live, setLive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData || !webglOk()) return;
    const start = () => setLive(true);
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const t = idle ? idle(start) : window.setTimeout(start, 500);
    return () => { if (!idle) window.clearTimeout(t); };
  }, []);

  useEffect(() => {
    const lost = () => setLive(false);
    window.addEventListener('stage-lost', lost);
    return () => window.removeEventListener('stage-lost', lost);
  }, []);

  useEffect(() => {
    stage.el = ref.current;
    return () => { stage.el = null; };
  }, [live]);

  const active = useStageActive(live);
  if (!live) return null;
  return <div ref={ref} aria-hidden className="stage-host pointer-events-none fixed left-0 top-0 z-0 w-full" style={{ visibility: active ? 'visible' : 'hidden' }}><Stage active={active} /></div>;
}
