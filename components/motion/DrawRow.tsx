'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/** A wide row for lists of benefits or steps: a rule draws across as it enters, then the heading and text rise in. */
export function DrawRow({ title, children, i = 0, as = 'li' }: { title: string; children: ReactNode; i?: number; as?: 'li' | 'div' }) {
  const reduce = useReducedMotion();
  const Tag = as === 'li' ? motion.li : motion.div;
  const E = [0.22, 1, 0.36, 1] as const;
  return (
    <Tag className="relative grid gap-2 py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-10 md:py-9" initial={reduce ? false : 'off'} whileInView="on" viewport={{ once: true, margin: '-70px' }}>
      <motion.span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left bg-white/25" variants={{ off: { scaleX: 0 }, on: { scaleX: 1 } }} transition={{ duration: 0.9, delay: i * 0.06, ease: E }} />
      <motion.h3 className="font-display text-3xl font-extrabold uppercase leading-[0.95] md:text-5xl" variants={{ off: { opacity: 0, y: 26 }, on: { opacity: 1, y: 0 } }} transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: E }}>{title}</motion.h3>
      <motion.div className="max-w-xl text-lg text-white/80" variants={{ off: { opacity: 0, y: 26 }, on: { opacity: 1, y: 0 } }} transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: E }}>{children}</motion.div>
    </Tag>
  );
}
