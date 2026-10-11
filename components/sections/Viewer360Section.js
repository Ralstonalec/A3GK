import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import Viewer360 from '@/components/3d/Viewer360';
import Button from '@/components/ui/Button';
import { hasViewerMedia, MEDIA } from '@/lib/media';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: '360° viewer', settings: ['eyebrow', 'heading'] };

/**
 * Renders only when real 360° media exists (turntable photos or a GLB — see
 * data/media.json → viewer). With none configured the section is omitted.
 */
export default function Viewer360Section() {
  const { viewer } = MEDIA;
  if (!hasViewerMedia(viewer)) return null;

  return (
    <Section id="viewer" type="viewer-360" settings={{ eyebrow: 'Inspect every angle', heading: viewer.title }} labelledBy="viewer-heading" className={styles.viewerSection}>
      <div className={`page-width ${styles.viewerGrid}`}>
        <FadeInSection>
          <Viewer360 frames={viewer.frames} model={viewer.modelUrl ? { url: viewer.modelUrl } : null} title={viewer.productTitle} fallbackImage={{ url: MEDIA.showcase.image, altText: viewer.productTitle, width: 1200, height: 1200 }} />
        </FadeInSection>
        <FadeInSection className={styles.viewerCopy} delay={0.12}>
          <p className="eyebrow">Inspect every angle</p>
          <h2 id="viewer-heading">{viewer.title}</h2>
          <p className="lead">Drag to rotate, use the buttons, or the arrow keys.</p>
          <Button href="/products" iconAfter={<IconArrow size={18} />}>
            Shop gear
          </Button>
        </FadeInSection>
      </div>
    </Section>
  );
}
