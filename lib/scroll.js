import { useScroll } from 'framer-motion';
import { useMediaQuery, usePrefersReducedMotion } from './hooks';

/**
 * Scroll-linked ("scrubbed") motion helpers.
 *
 * Unlike the IntersectionObserver reveals in lib/hooks.js, these values are a
 * pure function of scroll position, so they play forwards when scrolling down
 * and in exact reverse when scrolling up — no state, no direction logic.
 */

/** Default window: 0 when the element's top meets the viewport bottom, 1 when its bottom meets the viewport top. */
export const CROSS_VIEWPORT = ['start end', 'end start'];

/**
 * Amplitude multiplier for scroll-linked motion:
 *   0   – prefers-reduced-motion: no scroll-linked movement at all
 *   0.5 – phones (< 750px): half the travel / scale / rotation
 *   1   – everything else
 */
export function useMotionScale() {
  const reduced = usePrefersReducedMotion();
  const small = useMediaQuery('(max-width: 749px)');
  if (reduced) return 0;
  return small ? 0.5 : 1;
}

/**
 * Scroll progress (0 → 1) of `ref` crossing the viewport.
 * @param {React.RefObject<HTMLElement>} ref
 * @param {string[]} [offset]
 */
export function useElementScroll(ref, offset = CROSS_VIEWPORT) {
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return scrollYProgress;
}

/** Scale a length (`12`, `'14%'`, `'-3vh'`) by `amp`, keeping its unit. */
export function scaleLength(value, amp) {
  if (typeof value === 'number') return value * amp;
  const match = /^(-?\d*\.?\d+)(.*)$/.exec(String(value));
  return match ? `${Number.parseFloat(match[1]) * amp}${match[2]}` : value;
}

/** Scale a value that is neutral at 1 (scale, opacity) toward/away from 1 by `amp`. */
export function scaleAboutOne(value, amp) {
  return 1 + (value - 1) * amp;
}
