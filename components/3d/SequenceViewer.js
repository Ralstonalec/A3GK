import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { frameUrls } from '@/lib/media';
import styles from '@/styles/viewer.module.css';

const PX_PER_FRAME = 7;
const AUTO_FPS = 6;
const RESUME_AFTER = 2.2;

/**
 * 360° viewer driven by turntable PHOTOGRAPHY: a numbered sequence of stills.
 * Frames preload in the background; drag, arrow keys or the toolbar scrub
 * through them; it auto-rotates while idle (never with prefers-reduced-motion)
 * and pauses off-screen. No WebGL needed, so it works everywhere.
 *
 * Exposes the same imperative handle as the GLB viewer: { rotateBy, zoomBy, reset }.
 */
export default function SequenceViewer({ frames, title, controlsRef, autoRotate = true, active = true, reduced = false }) {
  const urls = useMemo(() => frameUrls(frames), [frames]);
  const canvasRef = useRef(null);
  const images = useRef([]);
  const s = useRef({ pos: 0, drawn: -1, drawnZoom: 0, zoom: 1, zoomTarget: 1, dragging: false, lastX: 0, idle: 0, raf: 0 });
  const [loaded, setLoaded] = useState(0);

  const n = urls.length;

  useImperativeHandle(controlsRef, () => ({
    rotateBy(deg) {
      s.current.pos += (deg / 360) * n;
      s.current.idle = 0;
    },
    zoomBy(f) {
      s.current.zoomTarget = Math.min(2.2, Math.max(1, s.current.zoomTarget * f));
    },
    reset() {
      Object.assign(s.current, { pos: 0, zoomTarget: 1, idle: 0 });
    },
  }));

  // Preload every frame; draw as soon as the first one lands.
  useEffect(() => {
    let cancelled = false;
    let count = 0;
    images.current = urls.map((url) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
        s.current.drawn = -1; // force a repaint
      };
      img.src = url;
      return img;
    });
    return () => {
      cancelled = true;
    };
  }, [urls]);

  // Pointer scrubbing.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return undefined;
    const st = s.current;
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';
    const down = (e) => {
      st.dragging = true;
      st.lastX = e.clientX;
      st.idle = 0;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const move = (e) => {
      if (!st.dragging) return;
      st.pos -= (e.clientX - st.lastX) / PX_PER_FRAME;
      st.lastX = e.clientX;
    };
    const up = (e) => {
      st.dragging = false;
      st.idle = 0;
      el.releasePointerCapture?.(e.pointerId);
      el.style.cursor = 'grab';
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, []);

  // Render loop (only while visible).
  useEffect(() => {
    if (!active || n < 2) return undefined;
    const st = s.current;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!st.dragging) {
        st.idle += dt;
        if (autoRotate && !reduced && st.idle > RESUME_AFTER) st.pos += dt * AUTO_FPS;
      }
      st.zoom += (st.zoomTarget - st.zoom) * (1 - Math.exp(-9 * dt));

      const index = ((Math.round(st.pos) % n) + n) % n;
      const img = images.current[index] || images.current.find((i) => i?.complete && i.naturalWidth);
      const canvas = canvasRef.current;
      if (canvas && img && img.complete && img.naturalWidth && (index !== st.drawn || Math.abs(st.zoom - st.drawnZoom) > 0.001)) {
        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(st.zoom, st.zoom);
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
        ctx.restore();
        st.drawn = index;
        st.drawnZoom = st.zoom;
      }
      st.raf = requestAnimationFrame(tick);
    };
    st.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(st.raf);
  }, [active, autoRotate, reduced, n]);

  const pct = n ? Math.round((loaded / n) * 100) : 0;

  return (
    <>
      <canvas ref={canvasRef} className={styles.sequenceCanvas} role="img" aria-label={`${title}, rotatable 360 degree photograph sequence`} />
      {loaded < n && (
        <div className={styles.progress} role="progressbar" aria-label="Loading 360 view" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
        </div>
      )}
    </>
  );
}
