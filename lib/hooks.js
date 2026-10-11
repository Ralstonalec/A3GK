import { useAnimationControls } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const noopSubscribe = () => () => {};

/** True after hydration. Use to gate anything that differs between server and client. */
export function useHasMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * IntersectionObserver-based visibility.
 * @param {{ once?: boolean, rootMargin?: string, threshold?: number }} [opts]
 * @returns {[React.RefObject<any>, boolean]}
 */
export function useInView({ once = true, rootMargin = '0px 0px -10% 0px', threshold = 0.1 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setInView(true)); // no IO support: just show it
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return [ref, inView];
}

function subscribeMedia(query) {
  return (callback) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };
}

export function useMediaQuery(query, serverFallback = false) {
  return useSyncExternalStore(
    typeof window === 'undefined' ? () => () => {} : subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** Lock page scroll while `active` (modals, drawers). Reference-counted so stacked overlays cooperate. */
let scrollLocks = 0;
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    scrollLocks += 1;
    document.documentElement.classList.add('no-scroll');
    return () => {
      scrollLocks -= 1;
      if (scrollLocks <= 0) {
        scrollLocks = 0;
        document.documentElement.classList.remove('no-scroll');
      }
    };
  }, [active]);
}

/**
 * Scroll-reveal that never hides content that is already on screen.
 *
 * Server HTML and the first paint are fully visible (good for LCP, crawlers and
 * no-JS users). After hydration, only elements that start BELOW the fold are
 * "armed" — hidden until an IntersectionObserver sees them — so there is no
 * visible → hidden → visible flash for above-the-fold content.
 *
 * `replay` makes the reveal REVERSIBLE: when the element scrolls out of view it
 * goes back to a hidden pose — `hidden` if it left through the bottom,
 * `hiddenAbove` if it left through the top — so scrolling up plays the same
 * entrance, dropping in from above instead of rising from below.
 *
 * The entrance direction is decided at the moment of ENTRY (from where the
 * element crosses the viewport), not from the last exit. IntersectionObserver
 * only reports threshold crossings, so a jump (Home key, anchor link, "back to
 * top") from one side to the other would otherwise leave a stale direction.
 * The matching hidden pose is snapped in first — opacity is 0 in both poses, so
 * the snap is invisible — and then the entrance plays.
 *
 * With prefers-reduced-motion nothing is ever hidden.
 *
 * Spread the result onto a framer-motion element that has `variants`:
 *   const reveal = useReveal({ replay: true }); <motion.div {...reveal} variants={fadeUp} />
 */
export function useReveal({ margin = '0px 0px -12% 0px', replay = false } = {}) {
  const ref = useRef(null);
  const controls = useAnimationControls();
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (reduced) {
      // The media query reads `false` during hydration and flips to `true` a render later; an
      // element armed in that gap must be put back, or it would stay hidden forever.
      controls.set('visible');
      return undefined;
    }
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const startsOnScreen = node.getBoundingClientRect().top < window.innerHeight * 0.92;
    // One-shot reveals leave on-screen content alone (no hide → show flash).
    if (!replay && startsOnScreen) return undefined;

    /** null = at rest/visible, otherwise the pose it is waiting in. */
    let waiting = null;
    if (!startsOnScreen) {
      controls.set('hidden'); // armed before first paint of the hydrated page
      waiting = 'hidden';
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;
        const fromBelow = entry.boundingClientRect.top > viewportHeight / 2;

        if (entry.isIntersecting) {
          if (waiting === null) return; // already visible (e.g. on screen at load)
          const pose = fromBelow ? 'hidden' : 'hiddenAbove';
          if (waiting !== pose) controls.set(pose); // wrong side after a jump: re-pose invisibly
          waiting = null;
          controls.start('visible');
          if (!replay) observer.disconnect();
        } else if (fromBelow) {
          waiting = 'hidden';
          controls.start('hidden');
        } else if (replay) {
          waiting = 'hiddenAbove';
          controls.start('hiddenAbove');
        }
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin, replay, reduced, controls]);

  return { ref, initial: false, animate: controls };
}
