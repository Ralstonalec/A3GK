'use client';

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const CYCLE = 5;

/** Looping 3D picture of the problem: a dive arcs in, lands on a tilted turf plane, shock rings spread. Pure CSS 3D + SVG, no faces, no claims. */
export function TurfScene() {
  const still = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const ry = useTransform(sx, [-1, 1], [-9, 9]);
  const rx = useTransform(sy, [-1, 1], [5, -5]);

  const label = (t: string, from: number, to: number, cls: string) => (
    <motion.span
      className={`absolute font-display text-2xl font-extrabold uppercase tracking-tight md:text-4xl ${cls}`}
      style={{ transform: 'translateZ(60px)' }}
      initial={{ opacity: still ? 1 : 0 }}
      animate={still ? undefined : { opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, -6, -6] }}
      transition={still ? undefined : { duration: CYCLE, repeat: Infinity, times: [0, from - 0.02, from, to, to + 0.04, 1], ease: 'easeOut' }}
    >
      {t}
    </motion.span>
  );

  return (
    <div
      className="relative mx-auto mt-8 h-[300px] w-full max-w-5xl select-none overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-b from-[#05070b] via-[#0a1210] to-[#0d1d12] md:h-[420px]"
      style={{ perspective: 1000 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      aria-hidden
    >
      <motion.div className="absolute inset-0" style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
        {/* turf plane */}
        <div
          className="absolute left-1/2 top-[34%] h-[150%] w-[170%] -translate-x-1/2"
          style={{
            transform: 'translateX(-50%) rotateX(66deg)',
            transformOrigin: '50% 0%',
            background:
              'repeating-linear-gradient(90deg, rgba(120,200,90,0.10) 0 56px, rgba(0,0,0,0) 56px 112px), repeating-linear-gradient(0deg, rgba(190,255,120,0.18) 0 2px, rgba(0,0,0,0) 2px 70px), linear-gradient(180deg, #0f2a14 0%, #143a1a 100%)',
            maskImage: 'linear-gradient(180deg, transparent 0%, #000 22%, #000 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 22%, #000 70%, transparent 100%)',
          }}
        >
          {/* shock rings, centred on the landing point */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border-2 border-accent"
              style={{ left: '57%', top: '21%', width: 420, height: 420, marginLeft: -210, marginTop: -210 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={still ? { scale: 0.6 + i * 0.3, opacity: 0.4 } : { scale: [0, 0, 1], opacity: [0, 0.9, 0] }}
              transition={still ? undefined : { duration: CYCLE * 0.55, repeat: Infinity, repeatDelay: CYCLE * 0.45, delay: CYCLE * 0.36 + i * 0.28, times: [0, 0.01, 1], ease: 'easeOut' }}
            />
          ))}
          <span className="absolute h-20 w-20 rounded-full bg-accent/50 blur-2xl" style={{ left: '57%', top: '21%', marginLeft: -40, marginTop: -40 }} />
        </div>

        {/* dive path */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" style={{ transform: 'translateZ(30px)' }}>
          <defs>
            <linearGradient id="trail" x1="0" x2="1">
              <stop offset="0" stopColor="#c8ff3d" stopOpacity="0" />
              <stop offset="1" stopColor="#c8ff3d" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path id="dive" d="M60 60 C 260 -20, 440 80, 560 262" fill="none" stroke="url(#trail)" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 9" />
          {!still && (
            <g>
              <circle r="9" fill="#c8ff3d">
                <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.36;1" calcMode="linear" path="M60 60 C 260 -20, 440 80, 560 262" />
                <animate attributeName="opacity" dur={`${CYCLE}s`} repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.04;0.36;0.4;1" />
              </circle>
            </g>
          )}
        </svg>

        {label('Dive', 0.06, 0.32, 'left-[6%] top-[8%]')}
        {label('Land', 0.38, 0.62, 'right-[8%] top-[10%] text-accent')}
        {label('Repeat', 0.7, 0.96, 'left-1/2 top-[8%] -translate-x-1/2')}
      </motion.div>
    </div>
  );
}
