import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/config';
import { MEDIA } from '@/lib/media';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import ScrollLayer from '@/components/animation/ScrollLayer';
import StaggeredList from '@/components/animation/StaggeredList';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Category grid', settings: ['eyebrow', 'heading'] };

/**
 * One photo tile per product category, straight from CATEGORIES (lib/config.js) —
 * so a category such as gloves appears here the moment its feature flag is on and
 * not before. Tile photos come from data/media.json → categories.images.
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
      </div>
    </Section>
  );
}
