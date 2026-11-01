'use client';

import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';

const CYCLE = 7;

/** Landing points in the order a body usually meets the turf in a dive. x is in the SVG's own units. */
const POINTS = [
  { label: 'Shoulder', x: 470, at: 0.2, row: 0 },
  { label: 'Ribs', x: 395, at: 0.27, row: 1 },
  { label: 'Elbow', x: 560, at: 0.34, row: 1 },
  { label: 'Hip', x: 315, at: 0.41, row: 0 },
  { label: 'Knee', x: 225, at: 0.48, row: 1 },
];

const STEPS = [
  { t: 'Dive', from: 0, to: 0.19 },
  { t: 'Land', from: 0.19, to: 0.62 },
  { t: 'Repeat', from: 0.62, to: 0.92 },
];

const DIM = 'rgba(255,255,255,0.4)';

function Pill({ t, step }: { t: MotionValue<number>; step: (typeof STEPS)[number] }) {
  const on = useTransform(t, [0, Math.max(0.0001, step.from), step.from + 0.001, step.to, step.to + 0.001, 1], [DIM, DIM, '#c8ff3d', '#c8ff3d', DIM, DIM]);
  const edge = useTransform(t, [0, Math.max(0.0001, step.from), step.from + 0.001, step.to, step.to + 0.001, 1], ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)', 'rgba(200,255,61,0.8)', 'rgba(200,255,61,0.8)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)']);
  return <motion.span className="rounded-full border bg-black/40 px-3 py-1.5" style={{ color: on, borderColor: edge }}>{step.t}</motion.span>;
}

function Contact({ t, p }: { t: MotionValue<number>; p: (typeof POINTS)[number] }) {
  const a = p.at;
  const ly = p.row ? 352 : 320;
  const ringScale = useTransform(t, [0, a, a + 0.12, 1], [0, 0, 1.6, 1.6]);
  const ringOpacity = useTransform(t, [0, a, a + 0.12, 1], [0, 0.95, 0, 0]);
  const dot = useTransform(t, [0, a, a + 0.03, a + 0.08, 0.9, 0.95, 1], [0, 0, 1.5, 1, 1, 0, 0]);
  const text = useTransform(t, [0, a, a + 0.04, 0.9, 0.95, 1], [0, 0, 1, 1, 0, 0]);
  const lift = useTransform(t, [0, a, a + 0.04, 1], [6, 6, 0, 0]);
  const box = { transformBox: 'fill-box', transformOrigin: 'center' } as const;
  return (
    <g>
      <motion.circle cx={p.x} cy="280" r="26" fill="none" stroke="#c8ff3d" strokeWidth="3" style={{ ...box, scale: ringScale, opacity: ringOpacity }} />
      <motion.circle cx={p.x} cy="278" r="11" fill="#c8ff3d" style={{ ...box, scale: dot }} />
      <motion.g style={{ opacity: text, y: lift }}>
        <line x1={p.x} y1="292" x2={p.x} y2={ly - 20} stroke="#c8ff3d" strokeWidth="2" opacity="0.7" />
        <text x={p.x} y={ly} textAnchor="middle" fontSize="22" fontWeight="800" fill="#ffffff" style={{ fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.label}</text>
      </motion.g>
    </g>
  );
}

/**
 * Side-on diagram of a goalkeeper dive: an abstract body (no face) drops to the turf, then the five
 * contact points light up one after another, each with its name. Says nothing beyond "these are the
 * parts that meet the surface".
 */
export function TurfScene() {
  const still = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const ry = useTransform(sx, [-1, 1], [-5, 5]);
  const rx = useTransform(sy, [-1, 1], [3, -3]);

  // one shared clock (0 to 1 over CYCLE seconds) drives everything, so the pieces can never drift apart
  const t = useMotionValue(still ? 0.5 : 0);
  useEffect(() => {
    if (still) return;
    const c = animate(t, 1, { duration: CYCLE, ease: 'linear', repeat: Infinity, repeatType: 'loop' });
    return () => c.stop();
  }, [still, t]);

  const fall = [0, 0.2, 0.23, 0.26, 0.92, 1];
  const by = useTransform(t, fall, [-130, 0, -7, 0, 0, 0]);
  const bx = useTransform(t, fall, [-90, 0, 0, 0, 0, 0]);
  const br = useTransform(t, fall, [-26, 0, 0, 0, 0, 0]);
  const bo = useTransform(t, [0, 0.05, 0.92, 1], [0, 1, 1, 0]);

  return (
    <div
      className="relative mx-auto mt-8 w-full max-w-5xl select-none overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-b from-[#05070b] to-[#0b1a10]"
      style={{ perspective: 1200 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      role="img"
      aria-label="Side-on diagram of a goalkeeper diving and landing. The shoulder, ribs, elbow, hip and knee meet the turf one after another."
    >
      <div className="absolute left-4 top-4 z-10 flex gap-2 text-[11px] font-bold uppercase tracking-widest md:text-xs" aria-hidden>
        {STEPS.map((s) => <Pill key={s.t} t={t} step={s} />)}
      </div>

      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
        <svg viewBox="110 100 560 290" className="block h-auto w-full" aria-hidden>
          <defs>
            <linearGradient id="turf-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#1d4a22" />
              <stop offset="1" stopColor="#0d2412" />
            </linearGradient>
          </defs>

          <rect x="60" y="281" width="680" height="120" fill="url(#turf-fill)" />
          <line x1="60" y1="281" x2="740" y2="281" stroke="#8fd95a" strokeWidth="2" />
          {Array.from({ length: 56 }).map((_, i) => (
            <line key={i} x1={80 + i * 12} y1="281" x2={76 + i * 12} y2={272 - ((i * 7) % 5)} stroke="#6fbf4a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          ))}

          {/* the diver */}
          <motion.g style={{ transformBox: 'fill-box', transformOrigin: 'center', x: bx, y: by, rotate: br, opacity: bo }}>
            <path d="M318 258 L238 266 L150 274" fill="none" stroke="#1b1f27" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="300" y="238" width="190" height="40" rx="20" fill="#1b1f27" stroke="#3a414d" strokeWidth="2" />
            <path d="M470 256 L600 266" fill="none" stroke="#1b1f27" strokeWidth="18" strokeLinecap="round" />
            <circle cx="512" cy="252" r="21" fill="#1b1f27" stroke="#3a414d" strokeWidth="2" />
          </motion.g>

          {POINTS.map((p) => <Contact key={p.label} t={t} p={p} />)}
        </svg>
      </motion.div>
    </div>
  );
}
