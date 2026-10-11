import Image from 'next/image';
import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import ScrollLayer from '@/components/animation/ScrollLayer';
import SampleNote from '@/components/ui/SampleNote';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { MEDIA } from '@/lib/media';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Gear showcase', settings: ['eyebrow', 'heading', 'image'] };

/**
 * Hotspot coordinates are percentages of the showcase photo; copy and
 * positions live in data/media.json (in Shopify they become theme-editor
 * blocks with x / y range settings).
 */
export const HOTSPOTS = MEDIA.showcase.hotspots;

export default function TechnologyShowcase() {
  const baseId = useId();
  const { image, alt, heading, intro, isSample } = MEDIA.showcase;
  const [active, setActive] = useState(HOTSPOTS[0].id);
  const current = HOTSPOTS.find((h) => h.id === active);

  return (
    <Section id="technology" type="product-gallery" settings={{ eyebrow: 'Technology', heading }} labelledBy="tech-heading" className={styles.tech}>
      <div className={`page-width ${styles.techGrid}`}>
        <FadeInSection className={styles.techCopy}>
          <p className="eyebrow">Technology</p>
          <h2 id="tech-heading">{heading}</h2>
          <p className="lead">{intro}</p>
          <SampleNote isSample={isSample}>Sample hotspot copy — replace with your product’s real specification</SampleNote>

          <div className={styles.hotspotPanel} aria-live="polite" id={`${baseId}-panel`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <h3>{current.title}</h3>
                <p className="muted">{current.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <ul role="list" className={styles.hotspotList}>
            {HOTSPOTS.map((h, i) => (
              <li key={h.id}>
                <button type="button" className={cn(styles.hotspotListItem, h.id === active && styles.hotspotListItemActive)} aria-pressed={h.id === active} aria-controls={`${baseId}-panel`} onClick={() => setActive(h.id)}>
                  <span className={styles.hotspotIndex}>{String(i + 1).padStart(2, '0')}</span>
                  {h.title}
                </button>
              </li>
            ))}
          </ul>
        </FadeInSection>

        <FadeInSection className={styles.hotspotStage} delay={0.15}>
          {/*
            The photo and its hotspots move as ONE layer so the markers stay locked to the
            product. Scale never drops below 1 (and ≥ 1 + rotation allowance), so the frame
            is always fully covered. Settles at rest (scale 1, no tilt) mid-viewport.
          */}
          <ScrollLayer className={styles.hotspotLayer} input={[0, 0.5, 1]} scale={[1.08, 1, 1.06]} rotate={[-1.5, 0, 1.5]}>
            <Image src={image} alt={alt} width={1200} height={1200} sizes="(min-width: 990px) 46vw, 92vw" className={styles.hotspotImage} />
            {HOTSPOTS.map((h, i) => (
            <button
              key={h.id}
              type="button"
              className={cn(styles.hotspot, h.id === active && styles.hotspotActive)}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              aria-label={`${i + 1}. ${h.title}`}
              aria-pressed={h.id === active}
              aria-controls={`${baseId}-panel`}
              onClick={() => {
                setActive(h.id);
                track('hotspot_select', { hotspot: h.id });
              }}
            >
              <span aria-hidden="true">{i + 1}</span>
            </button>
            ))}
          </ScrollLayer>
        </FadeInSection>
      </div>
    </Section>
  );
}
