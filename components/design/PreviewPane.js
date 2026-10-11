import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import CanvasPreview from './CanvasPreview';
import { IconDownload } from '@/components/ui/Icons';
import styles from '@/styles/studio.module.css';

/** Preview card: front/back toggle, the canvas, and a PNG download. */
export default function PreviewPane({ config, view, onViewChange, logoImage }) {
  const canvasRef = useRef(null);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `a3gk-jersey-${view}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className={styles.preview}>
      <div className={styles.previewBar}>
        <div className={styles.segment} role="group" aria-label="Jersey view">
          {['front', 'back'].map((v) => (
            <button key={v} type="button" aria-pressed={view === v} className={cn(view === v && styles.segmentActive)} onClick={() => onViewChange(v)}>
              {v === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
        <button type="button" className={styles.ghostButton} onClick={download}>
          <IconDownload size={16} /> Save image
        </button>
      </div>
      <div className={styles.previewStage}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, rotateY: view === 'back' ? 40 : -40 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ transformPerspective: 900 }}>
            <CanvasPreview ref={canvasRef} config={config} view={view} logoImage={logoImage} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
