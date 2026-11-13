'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

type Scene = { src: string; w: number; h: number };

/**
 * The opening of every inner page, in the same language as the home page film: the headline rises line by line,
 * a lime rule draws in, a faint band of type drifts as you scroll, and an optional scene moves slower than the page.
 * `size="sm"` is the compact version for account, sign-in and policy pages.
 */
export function PageHero({ lines, accent, intro, children, scene, scenePosition = '50% 55%', band, size = 'lg', aside }: {
  lines: string[];
  /** Index of the line shown in the accent colour. Defaults to the last line. */
  accent?: number;
  intro?: ReactNode;
  children?: ReactNode;
  scene?: Scene;
  scenePosition?: string;
  /** Large faint word(s) behind the headline. */
  band?: string;
  size?: 'lg' | 'sm';
  /** Optional content beside the headline on wide screens (for example a form). */
  aside?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const sceneY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const bandX = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const hi = accent ?? lines.length - 1;
  const lg = size === 'lg';
  const E = [0.22, 1, 0.36, 1] as const;

  return (
    <section ref={ref} className={`relative isolate overflow-hidden ${lg ? 'min-h-[62svh] pt-32 md:min-h-[78svh] md:pt-36' : 'pt-28 md:pt-32'} flex flex-col justify-end`}>
      {scene && (
        <motion.div aria-hidden style={reduce ? undefined : { y: sceneY }} className="absolute inset-0 -z-20 scale-110">
          <Image src={scene.src} alt="" width={scene.w} height={scene.h} priority sizes="100vw" className="h-full w-full object-cover" style={{ objectPosition: scenePosition }} />
        </motion.div>
      )}
      <div aria-hidden className={`absolute inset-0 -z-10 ${scene ? 'bg-gradient-to-b from-[#080a0e]/70 via-[#080a0e]/35 to-[#080a0e]' : 'bg-[radial-gradient(110%_80%_at_70%_20%,#262d3a_0%,#12151c_50%,#080a0e_100%)]'}`} />
      {scene && <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080a0e]/80 via-[#080a0e]/25 to-transparent" />}
      {band && (
        <motion.p aria-hidden style={reduce ? undefined : { x: bandX }} className={`pointer-events-none absolute left-0 -z-10 whitespace-nowrap font-display font-extrabold uppercase leading-none text-white/[0.04] ${lg ? 'top-[14%] text-[30vw] md:text-[22vw]' : 'top-[18%] text-[26vw] md:text-[15vw]'}`}>
          {band}
        </motion.p>
      )}

      <motion.div style={reduce ? undefined : { y: copyY }} className={`mx-auto w-full max-w-6xl px-4 ${lg ? 'pb-12 md:pb-16' : 'pb-8'} ${aside ? 'grid items-end gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]' : ''}`}>
        <div className="min-w-0">
          <h1 className={`font-display font-extrabold uppercase leading-[0.85] ${!lg ? 'text-[clamp(2.8rem,10vw,6rem)]' : aside ? 'text-[clamp(3.2rem,13vw,6rem)] xl:text-[7rem]' : 'text-[clamp(3.2rem,13vw,9.5rem)]'}`}>
            {lines.map((line, i) => (
              <span key={line + i} className="block overflow-hidden pb-[0.07em]">
                <motion.span className={`block ${i === hi ? 'text-accent' : ''}`} initial={reduce ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.08 + i * 0.11, ease: E }}>
                  {line}{i < lines.length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.span aria-hidden className="mt-5 block h-1 w-24 origin-left rounded-full bg-accent" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.45, ease: E }} />
          {(intro || children) && (
            <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55, ease: E }}>
              {intro && <div className="mt-5 max-w-2xl text-lg text-white/85 md:text-xl">{intro}</div>}
              {children && <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">{children}</div>}
            </motion.div>
          )}
        </div>
        {aside && <motion.div className="min-w-0" initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65, ease: E }}>{aside}</motion.div>}
      </motion.div>
      {scene && <p className="absolute bottom-2 right-3 text-[11px] text-white/45">Background image is a rendering.</p>}
    </section>
  );
}
