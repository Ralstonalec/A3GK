import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FONTS } from '@/lib/customizer-options';
import { JERSEY_SIZE } from '@/lib/jersey-geometry';
import { drawJersey } from '@/lib/jersey-canvas';
import styles from '@/styles/studio.module.css';

const SCALE = 2; // backing store is 2× for crisp text on hi-dpi screens

function describe(config, view) {
  const bits = [`Jersey ${view} view`, `body ${config.baseColor}`, `accent ${config.accentColor}`, `${config.pattern} pattern`];
  if (view === 'back' && config.playerName) bits.push(`name ${config.playerName}`);
  if (config.playerNumber) bits.push(`number ${config.playerNumber}`);
  if (config.logo.enabled) bits.push('custom logo');
  return bits.join(', ');
}

/** Live <canvas> jersey preview. Re-draws (coalesced to one frame) whenever inputs change. */
const CanvasPreview = forwardRef(function CanvasPreview({ config, view = 'front', logoImage = null }, ref) {
  const canvasRef = useRef(null);
  const [fontTick, setFontTick] = useState(0);
  useImperativeHandle(ref, () => canvasRef.current);

  // Canvas text only uses a web font once it has loaded — load the selected one, then redraw.
  useEffect(() => {
    const font = FONTS.find((f) => f.id === config.font);
    if (!font || !document.fonts?.load) return undefined;
    let cancelled = false;
    document.fonts.load(`${font.weight} 48px ${font.family}`, '0123456789ABC').then(() => {
      if (!cancelled) setFontTick((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [config.font]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const frame = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      drawJersey(ctx, config, { view, logoImage });
    });
    return () => cancelAnimationFrame(frame);
  }, [config, view, logoImage, fontTick]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={JERSEY_SIZE.width * SCALE}
      height={JERSEY_SIZE.height * SCALE}
      role="img"
      aria-label={describe(config, view)}
    />
  );
});

export default CanvasPreview;
