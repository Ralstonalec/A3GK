'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

/**
 * The real product photo is always rendered (JS-off, SEO, social previews, reduced motion).
 * The 3D layer mounts on top only when motion is allowed, the browser is idle and the box is on screen.
 */
export function LazyScene({ src, width, height, alt }: { src: string; width: number; height: number; alt: string }) {
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
    <div ref={ref} className="relative overflow-hidden" style={{ aspectRatio: `${width} / ${height}` }}>
      <Image src={src} alt={alt} width={width} height={height} priority sizes="(min-width: 768px) 40vw, 80vw" className="h-full w-full object-cover" />
      {live && visible && <div className="absolute inset-0" aria-hidden><HeroScene src={src} aspect={width / height} /></div>}
    </div>
  );
}
