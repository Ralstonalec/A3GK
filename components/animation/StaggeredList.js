import { Children } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useReveal } from '@/lib/hooks';

/**
 * Staggers its children into view. Each child is wrapped in a motion item;
 * pass `as="ul"` / `itemAs="li"` for list semantics.
 * One-shot by default: card grids should not re-stagger on every pass. Set
 * `replay` for a reversible reveal (see useReveal).
 */
export default function StaggeredList({ as = 'div', itemAs = 'div', stagger = 0.08, delay = 0, replay = false, className, itemClassName, children, ...rest }) {
  const Container = motion[as] || motion.div;
  const Item = motion[itemAs] || motion.div;
  const reveal = useReveal({ replay });
  return (
    <Container className={className} variants={staggerContainer(stagger, delay)} {...reveal} {...rest}>
      {Children.toArray(children).map((child, i) => (
        <Item key={child.key ?? i} variants={staggerItem} className={itemClassName}>
          {child}
        </Item>
      ))}
    </Container>
  );
}
