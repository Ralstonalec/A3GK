'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

/**
 * Mounts the 3D scene only when: motion is allowed, the browser is idle, and the box is on screen.
 * The poster (static fallback) is always in the DOM underneath, so JS-off / SEO / social previews are covered.
 */
export function LazyScene({ poster, label }: { poster: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData) return;
    const start = () => setLive(true);
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const t = idle ? idle(start) : window.setTimeout(start, 600);
    return () => { if (!idle) window.clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0" role="img" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" className="h-full w-full object-cover" />
      {live && visible && <div className="absolute inset-0"><HeroScene /></div>}
    </div>
  );
}
