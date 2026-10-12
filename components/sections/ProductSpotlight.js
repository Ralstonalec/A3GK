import Image from 'next/image';
import Section from '@/components/layout/Section';
import FadeInSection from '@/components/animation/FadeInSection';
import ScrollLayer from '@/components/animation/ScrollLayer';
import Price from '@/components/commerce/Price';
import Button from '@/components/ui/Button';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Product spotlight', settings: ['product'] };

/**
 * One product, large. Only real catalogue data is shown (name, type, description, price): no feature
 * or performance copy is written here. The photo frame grows into place as the section scrolls in,
 * and the photo drifts inside it; both are scroll-scrubbed, so they reverse exactly when scrolling up.
 */
export default function ProductSpotlight({ product }) {
  if (!product) return null;
  const image = product.images[0];

  return (
    <Section id="spotlight" type="product-spotlight" settings={{ product: product.handle }} labelledBy="spotlight-heading" className={styles.spotlight}>
      <div className={`page-width ${styles.spotlightGrid}`}>
        {/* Decorative: the category name as outlined type, drifting against the photo. */}
        <ScrollLayer x={['-7%', '7%']} className={styles.spotlightGhost} aria-hidden="true">
          {product.productType}
        </ScrollLayer>

        <div className={styles.spotlightStage}>
          <ScrollLayer className={styles.spotlightFrame} input={[0, 0.4, 1]} scale={[0.85, 1, 1]}>
            <ScrollLayer className={styles.spotlightPhoto} y={['-6%', '6%']}>
              {image && <Image src={image.url} alt={image.altText || product.title} width={image.width} height={image.height} sizes="(min-width: 990px) 46vw, 92vw" />}
            </ScrollLayer>
          </ScrollLayer>
        </div>

        <FadeInSection className={styles.spotlightCopy}>
          <p className="eyebrow">{product.productType}</p>
          <h2 id="spotlight-heading">{product.title}</h2>
          {product.description && <p className="lead">{product.description}</p>}
          <Price cents={product.priceRange.minCents} compareAtCents={product.compareAtMinCents} from={product.priceRange.maxCents > product.priceRange.minCents} size="lg" />
          <div className="cluster">
            <Button href={`/products/${product.handle}`} size="lg" iconAfter={<IconArrow size={20} />}>
              View product
            </Button>
            <Button href={`/products?category=${product.category}`} size="lg" variant="secondary">
              Shop {product.productType.toLowerCase()}
            </Button>
          </div>
        </FadeInSection>
      </div>
    </Section>
  );
}
