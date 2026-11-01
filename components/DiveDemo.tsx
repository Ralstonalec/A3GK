'use client';

import { useEffect, useRef, useState } from 'react';

/** Portrait demonstration clip of a dive. Plays muted on a loop while on screen, with a pause control, and stays still for reduced-motion users. */
export function DiveDemo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) { setUserPaused(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { setUserPaused(false); v.play().catch(() => {}); } else { setUserPaused(true); v.pause(); }
  }

  return (
    <figure className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[2rem] border border-white/15 bg-black">
      <video
        ref={ref}
        className="block aspect-[9/16] w-full object-cover"
        src="/video/dive-demo.mp4"
        poster="/video/dive-demo-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Demonstration video of a goalkeeper diving onto turf in the A3GK padded base layer"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing && !userPaused ? 'Pause video' : 'Play video'}
        className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
      >
        {playing && !userPaused
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="2" width="3.5" height="12" /><rect x="9.5" y="2" width="3.5" height="12" /></svg>
          : <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2l10 6-10 6z" /></svg>}
      </button>
      <figcaption className="sr-only">Illustrative demonstration of a dive in the padded base layer.</figcaption>
    </figure>
  );
}
