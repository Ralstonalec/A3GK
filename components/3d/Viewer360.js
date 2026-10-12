import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useInView, usePrefersReducedMotion } from '@/lib/hooks';
import { frameUrls } from '@/lib/media';
import { cn } from '@/lib/utils';
import SequenceViewer from './SequenceViewer';
import ViewerBoundary from './ViewerBoundary';
import { IconMinus, IconPause, IconPlay, IconPlus, IconRotate } from '@/components/ui/Icons';
import styles from '@/styles/viewer.module.css';

const ProductViewer = dynamic(() => import('./ProductViewer'), { ssr: false, loading: () => <div className={styles.loading} aria-hidden="true" /> });

let webglSupport;
function hasWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement('canvas');
      webglSupport = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
const noopSubscribe = () => () => {};

function StaticFallback({ image, title }) {
  return (
    <div className={styles.fallback}>
      {image && <Image src={image.url} alt={image.altText || title} width={image.width} height={image.height} sizes="(min-width: 990px) 560px, 90vw" />}
      <p className={styles.fallbackNote}>The interactive 360° view isn’t available on this device.</p>
    </div>
  );
}

/** Does this product/section have anything real to spin? */
export function hasSpinMedia({ frames, model }) {
  return frameUrls(frames).length > 1 || Boolean(model?.url);
}

/**
 * Interactive 360° viewer for REAL product media — either turntable
 * photography (`frames`, no WebGL needed) or a 3D model (`model.url`, GLB).
 * Renders nothing if neither is provided: there is no fake stand-in.
 *
 * Mouse/touch drag, on-screen buttons and arrow keys all rotate; auto-rotate
 * respects prefers-reduced-motion; rendering pauses off-screen.
 */
export default function Viewer360({ frames, model, title, fallbackImage, className, hint = true }) {
  const controls = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [visibleRef, nearViewport] = useInView({ once: true, rootMargin: '200px', threshold: 0 });
  const [onScreenRef, onScreen] = useInView({ once: false, rootMargin: '0px', threshold: 0.05 });
  const webgl = useSyncExternalStore(noopSubscribe, hasWebGL, () => null); // null on the server
  const [auto, setAuto] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  const useFrames = frameUrls(frames).length > 1;
  const useModel = !useFrames && Boolean(model?.url);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!useFrames && !useModel) return null;

  const setRefs = (node) => {
    visibleRef.current = node;
    onScreenRef.current = node;
  };

  const onKeyDown = (event) => {
    const c = controls.current;
    if (!c) return;
    const map = { ArrowLeft: () => c.rotateBy(-18), ArrowRight: () => c.rotateBy(18), '+': () => c.zoomBy(1.15), '=': () => c.zoomBy(1.15), '-': () => c.zoomBy(1 / 1.15), Home: () => c.reset() };
    if (map[event.key]) {
      event.preventDefault();
      map[event.key]();
    }
  };

  const active = onScreen && tabVisible;
  const ready = nearViewport && (useFrames || webgl);

  return (
    <div className={cn(styles.viewer, className)}>
      <div
        ref={setRefs}
        className={styles.stage}
        role="group"
        aria-roledescription="360 degree viewer"
        aria-label={`360 degree view of ${title}. Use the left and right arrow keys to rotate, plus and minus to zoom.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {useModel && webgl === false ? (
          <StaticFallback image={fallbackImage} title={title} />
        ) : ready ? (
          useFrames ? (
            <SequenceViewer frames={frames} title={title} controlsRef={controls} active={active} autoRotate={auto} reduced={reduced} />
          ) : (
            <ViewerBoundary fallback={<StaticFallback image={fallbackImage} title={title} />}>
              <ProductViewer model={model} controlsRef={controls} active={active} autoRotate={auto && !reduced} />
            </ViewerBoundary>
          )
        ) : (
          <div className={styles.loading} aria-hidden="true" />
        )}
        {hint && ready && <p className={styles.hint} aria-hidden="true">Drag to rotate</p>}
      </div>

      <div className={styles.toolbar} role="toolbar" aria-label="360 viewer controls">
        <button type="button" onClick={() => controls.current?.rotateBy(-30)} aria-label="Rotate left"><IconRotate size={18} style={{ transform: 'scaleX(-1)' }} /></button>
        <button type="button" onClick={() => controls.current?.rotateBy(30)} aria-label="Rotate right"><IconRotate size={18} /></button>
        <button type="button" onClick={() => controls.current?.zoomBy(1 / 1.2)} aria-label="Zoom out"><IconMinus size={18} /></button>
        <button type="button" onClick={() => controls.current?.zoomBy(1.2)} aria-label="Zoom in"><IconPlus size={18} /></button>
        <button type="button" onClick={() => setAuto((a) => !a)} aria-pressed={auto && !reduced} aria-label={auto && !reduced ? 'Pause auto-rotation' : 'Start auto-rotation'}>
          {auto && !reduced ? <IconPause size={18} /> : <IconPlay size={18} />}
        </button>
        <button type="button" onClick={() => controls.current?.reset()} className={styles.resetBtn}>Reset</button>
      </div>
    </div>
  );
}
