import { motion, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { CROSS_VIEWPORT, scaleAboutOne, scaleLength, useElementScroll, useMotionScale } from '@/lib/scroll';

/**
 * Scroll-scrubbed layer: translates / scales / rotates / fades its children as
 * a target element crosses the viewport.
 *
 *   • Reversible by construction — values derive from scroll position, so
 *     scrolling up replays the motion backwards.
 *   • Transform + opacity only (zero layout shift).
 *   • Neutral at the first paint, so server HTML is already in its final state.
 *   • Off entirely under prefers-reduced-motion; half amplitude on phones.
 *
 * Output arrays line up with `input` stops (default `[0, 1]`).
 *
 *   <ScrollLayer y={['0%', '14%']} />                          // parallax, drifts slower than the page
 *   <ScrollLayer input={[0, 0.5, 1]} scale={[1.08, 1, 1.06]} rotate={[-1.5, 0, 1.5]} />
 *
 * @param {{
 *   as?: string, target?: React.RefObject<HTMLElement>, offset?: string[], input?: number[],
 *   y?: (number|string)[], scale?: number[], rotate?: number[], opacity?: number[],
 *   className?: string, style?: object, children?: React.ReactNode
 * }} props
 */
export default function ScrollLayer({ as = 'div', target, offset = CROSS_VIEWPORT, input = [0, 1], y, scale, rotate, opacity, className, style, children, ...rest }) {
  const ownRef = useRef(null);
  const amp = useMotionScale();
  const progress = useElementScroll(target || ownRef, offset);

  const neutral = (v) => input.map(() => v);
  const yValue = useTransform(progress, input, (y || neutral(0)).map((v) => scaleLength(v, amp)));
  const scaleValue = useTransform(progress, input, (scale || neutral(1)).map((v) => scaleAboutOne(v, amp)));
  const rotateValue = useTransform(progress, input, (rotate || neutral(0)).map((v) => v * amp));
  const opacityValue = useTransform(progress, input, (opacity || neutral(1)).map((v) => scaleAboutOne(v, amp)));

  const Component = motion[as] || motion.div;
  const motionStyle = { ...style };
  if (amp > 0) {
    if (y) motionStyle.y = yValue;
    if (scale) motionStyle.scale = scaleValue;
    if (rotate) motionStyle.rotate = rotateValue;
    if (opacity) {
      // Fade via a CSS variable, NOT `style.opacity`: Framer hardware-accelerates a scroll-linked
      // opacity onto a native ViewTimeline whose range does not match our offsets (the fade
      // silently never plays). A custom property is never accelerated, so it stays in step
      // with the JS-driven transforms in every browser.
      motionStyle['--scroll-opacity'] = opacityValue;
      motionStyle.opacity = 'var(--scroll-opacity, 1)';
    }
  }

  return (
    <Component ref={ownRef} className={className} style={motionStyle} {...rest}>
      {children}
    </Component>
  );
}
