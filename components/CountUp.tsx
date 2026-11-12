'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

/** A number that counts up once when it scrolls into view. Shows the final value straight away for reduced motion and without JavaScript. */
export function CountUp({ to, suffix = '', className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduce = useReducedMotion();
  const fmt = (n: number) => Math.round(n).toLocaleString('en-CA') + suffix;
  useEffect(() => {
    const el = ref.current;
    if (!el || !seen || reduce) return;
    const c = animate(0, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { el.textContent = fmt(v); } });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, reduce, to]);
  return <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(to)}</span>;
}
