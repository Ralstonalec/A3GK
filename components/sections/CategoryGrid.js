import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { CATEGORIES } from '@/lib/config';
import { MEDIA } from '@/lib/media';
import { cn } from '@/lib/utils';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import ScrollLayer from '@/components/animation/ScrollLayer';
import StaggeredList from '@/components/animation/StaggeredList';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Category grid', settings: ['eyebrow', 'heading'] };

/** Tile grid: phones, tablets and anyone who prefers reduced motion. */
function RangeGrid({ categories }) {
  return (
    <StaggeredList as="ul" itemAs="li" className={styles.categoryGrid} role="list">
      {categories.map((c) => (
        <Link key={c.id} href={`/products?category=${c.id}`} className={styles.categoryTile}>
          {MEDIA.categories.images[c.id] && (
            // Photo eases from a slight zoom to rest as its tile reaches mid-screen; the tile clips it.
            <ScrollLayer className={styles.categoryLayer} input={[0, 0.5, 1]} scale={[1.08, 1, 1.04]}>
              <Image src={MEDIA.categories.images[c.id]} alt="" width={640} height={800} sizes="(min-width: 990px) 24vw, 46vw" />
            </ScrollLayer>
          )}
          <span className={styles.categoryLabel}>{c.label}</span>
        </Link>
      ))}
    </StaggeredList>
  );
}

/**
 * Staged range: on wide screens the stage is pinned with plain CSS `position: sticky` while the page keeps
 * scrolling natively (no scroll hijacking), and scroll position steps through the categories. State changes
 * only at step boundaries, so scrolling back up simply steps back. Hover or keyboard focus on a row shows
 * that category too, so nothing is reachable only by scrolling. Shown only on ≥990px with motion allowed
 * (CSS decides, so there is no layout jump at hydration); everything else gets <RangeGrid />.
 */
function RangeStage({ categories }) {
  const ref = useRef(null);
  const last = useRef(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  const [forced, setForced] = useState(null);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!Number.isFinite(v)) return;
    const raw = v * categories.length;
    const next = Math.min(categories.length - 1, Math.max(0, Math.floor(raw)));
    if (next === last.current) return;
    // Hysteresis: a step changes only once the boundary is clearly crossed, so 1-2px of jitter cannot flip it back and forth.
    if (next > last.current && raw < next + 0.03) return;
    if (next < last.current && raw > last.current - 0.03) return;
    last.current = next;
    setActive(next);
    setForced(null);
  });

  const shown = forced ?? active;

  return (
    <div ref={ref} className={styles.rangeStage} style={{ '--range-count': categories.length }}>
      <div className={styles.rangeSticky}>
        <ol
          role="list"
          className={styles.rangeList}
          onMouseLeave={() => setForced(null)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setForced(null);
          }}
        >
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link href={`/products?category=${c.id}`} className={cn(styles.rangeItem, i === shown && styles.rangeItemActive)} onFocus={() => setForced(i)} onMouseEnter={() => setForced(i)}>
                <span className={styles.rangeIndex} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.rangeName}>{c.label}</span>
                <IconArrow size={28} />
              </Link>
            </li>
          ))}
        </ol>
        <div className={styles.rangeFrame} aria-hidden="true">
          {categories.map((c, i) =>
            MEDIA.categories.images[c.id] ? (
              <div key={c.id} className={cn(styles.rangeImage, i === shown && styles.rangeImageActive)}>
                <Image src={MEDIA.categories.images[c.id]} alt="" fill sizes="(min-width: 990px) 56vw, 100vw" />
              </div>
            ) : null,
          )}
          <span className={styles.rangeCount}>
            {String(shown + 1).padStart(2, '0')} / {String(categories.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * One photo per product category, straight from CATEGORIES (lib/config.js), so a category such as gloves
 * appears here the moment its feature flag is on and not before. Photos come from data/media.json.
 */
export default function CategoryGrid() {
  const categories = CATEGORIES.filter((c) => c.id !== 'all');
  return (
    <Section id="categories" type="collection-list" settings={{ eyebrow: 'Shop by category', heading: 'The range' }} labelledBy="categories-heading">
      <div className="page-width">
        <FadeInSection className="section__header">
          <p className="eyebrow">Shop by category</p>
          <h2 id="categories-heading">The range</h2>
        </FadeInSection>
        <div className={styles.rangeGridWrap}>
          <RangeGrid categories={categories} />
        </div>
        <RangeStage categories={categories} />
      </div>
    </Section>
  );
}
