import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Counts up to `value` when scrolled into view.
 * The final value is rendered in the markup from the start, so no-JS, SSR,
 * crawlers and `prefers-reduced-motion` users all see the real number.
 */
export default function AnimatedCounter({ value, decimals = 0, suffix = '', prefix = '', compact = false, duration = 2, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();

  const format = (n) => {
    if (compact) return compactFormatter.format(n);
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  useEffect(() => {
    if (!inView || reduce || !ref.current) return undefined;
    const node = ref.current;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = `${prefix}${format(latest)}${suffix}`;
      },
      onComplete: () => {
        node.textContent = `${prefix}${format(value)}${suffix}`;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value, duration, decimals, suffix, prefix, compact]);

  return (
    <span ref={ref} className={className} data-counter-value={value}>
      {`${prefix}${format(value)}${suffix}`}
    </span>
  );
}
