import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useReveal } from '@/lib/hooks';

/**
 * Scroll-triggered reveal built on the Intersection Observer API.
 * Content that is on screen at load is never hidden (see useReveal).
 *
 * `replay` (default on) makes it reversible: scroll past it and it fades out;
 * scroll back — from either direction — and it plays again, rising from below
 * or dropping from above. Pass `replay={false}` for a one-shot reveal.
 */
export default function FadeInSection({ as = 'div', delay = 0, variants = fadeUp, replay = true, className, children, ...rest }) {
  const Component = motion[as] || motion.div;
  const reveal = useReveal({ replay });
  return (
    <Component className={className} variants={variants} custom={delay} {...reveal} {...rest}>
      {children}
    </Component>
  );
}
