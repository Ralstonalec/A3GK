/** Framer Motion variant library. Reduced-motion is handled globally by <MotionConfig reducedMotion="user">. */

export const EASE_OUT = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT = [0.65, 0, 0.35, 1];

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

/**
 * Reveal states (see useReveal in lib/hooks.js):
 *   hidden       – waiting BELOW the viewport: rises up into place
 *   hiddenAbove  – waiting ABOVE the viewport (scrolled past): drops down into place
 *   visible      – at rest
 * Hiding has its own short transition so a reversed scroll plays the reverse motion.
 */
const HIDE = { duration: 0.45, ease: EASE_OUT };

export const fadeUp = {
  hidden: { opacity: 0, y: 28, transition: HIDE },
  hiddenAbove: { opacity: 0, y: -28, transition: HIDE },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT, delay } }),
};

export const fadeIn = {
  hidden: { opacity: 0, transition: HIDE },
  hiddenAbove: { opacity: 0, transition: HIDE },
  visible: (delay = 0) => ({ opacity: 1, transition: { duration: 0.8, ease: EASE_OUT, delay } }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94, transition: HIDE },
  hiddenAbove: { opacity: 0, scale: 0.94, transition: HIDE },
  visible: (delay = 0) => ({ opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE_OUT, delay } }),
};

export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  hiddenAbove: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Cart-add confirmation: quick scale pop. */
export const pop = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.18, 1], transition: { duration: 0.4, ease: EASE_OUT } },
};

export const hoverLift = { y: -6, transition: { duration: 0.3, ease: EASE_OUT } };
