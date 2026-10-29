'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { stage } from '@/lib/stage';

const Stage = dynamic(() => import('./three/Stage'), { ssr: false });

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

  if (!live) return null;
  return <div ref={ref} aria-hidden className="stage-host pointer-events-none fixed left-0 top-0 z-[5] w-full"><Stage /></div>;
}
