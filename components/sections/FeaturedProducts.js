import { useState } from 'react';
import Section from '@/components/layout/Section';
import ProductCard from '@/components/commerce/ProductCard';
import QuickViewModal from '@/components/commerce/QuickViewModal';
import StaggeredList from '@/components/animation/StaggeredList';
import FadeInSection from '@/components/animation/FadeInSection';
import Button from '@/components/ui/Button';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Featured products', settings: ['eyebrow', 'heading', 'products_to_show'] };

export default function FeaturedProducts({ products, eyebrow = 'The lineup', heading = 'Featured gear' }) {
  const [quick, setQuick] = useState(null);
  return (
    <Section id="featured" type="featured-products" settings={{ eyebrow, heading, products_to_show: products.length }} labelledBy="featured-heading">
      <div className="page-width">
        <FadeInSection className="section__header">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="featured-heading">{heading}</h2>
        </FadeInSection>
        <StaggeredList as="ul" itemAs="li" className="grid grid--2-col-mobile grid--2-col-tablet grid--4-col-desktop" role="list">
          {products.map((p, i) => (
            <ProductCard key={p.handle} product={p} onQuickView={setQuick} priority={i < 2} />
          ))}
        </StaggeredList>
        <div className={styles.sectionCta}>
          <Button href="/products" variant="secondary" size="lg" iconAfter={<IconArrow size={18} />}>
            Shop all gear
          </Button>
        </div>
      </div>
      <QuickViewModal product={quick} onClose={() => setQuick(null)} />
    </Section>
  );
}
