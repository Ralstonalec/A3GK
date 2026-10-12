import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'framer-motion';
import { apiUrl } from '@/lib/config';
import { FEATURES } from '@/lib/features';
import { getSizeGuide, guideKindFor } from '@/lib/size-guides';
import { track } from '@/lib/analytics';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Price from './Price';
import AddToCartButton from './AddToCartButton';
import VariantSelector, { useVariantSelection } from './VariantSelector';
import SizeGuideModal from './SizeGuideModal';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load product');
  return (await res.json()).product;
};

function Skeleton() {
  return (
    <div className={styles.quickGrid} aria-hidden="true">
      <div className={`${styles.skeleton} ${styles.skeletonMedia}`} />
      <div className="stack">
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '40%' }} />
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '80%', height: 36 }} />
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '30%' }} />
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ height: 120 }} />
      </div>
    </div>
  );
}

function QuickViewBody({ product, onClose }) {
  const selection = useVariantSelection(product);
  const [guide, setGuide] = useState(false);
  const { variant } = selection;
  const [activeImage, setActiveImage] = useState(0);
  const image = product.images[activeImage] || product.images[0];
  const priceCents = variant?.priceCents ?? product.priceRange.minCents;
  const guideKind = guideKindFor(product);
  const sizeGuide = getSizeGuide(guideKind);

  return (
    <motion.div className={styles.quickGrid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div>
        <div className={styles.quickMedia}>
          {image && <Image src={image.url} alt={image.altText || product.title} width={image.width} height={image.height} sizes="(min-width: 800px) 400px, 90vw" />}
        </div>
        {product.images.length > 1 && (
          <ul role="list" className={styles.quickThumbs}>
            {product.images.map((img, i) => (
              <li key={img.url}>
                <button type="button" onClick={() => setActiveImage(i)} aria-label={`Show image ${i + 1} of ${product.images.length}`} aria-pressed={i === activeImage} className={styles.quickThumb}>
                  <Image src={img.url} alt="" width={96} height={96} sizes="64px" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="stack">
        <p className="eyebrow">{product.productType}</p>
        <h3 className={styles.quickTitle}>{product.title}</h3>
        <Price cents={priceCents} compareAtCents={variant?.compareAtPriceCents} size="lg" />
        <p className="muted">{product.description}</p>
        <VariantSelector product={product} {...selection} onOpenSizeGuide={sizeGuide ? () => setGuide(true) : undefined} />
        {product.customizable && FEATURES.customKit ? (
          <Button href="/customizer" size="lg" fullWidth iconAfter={<IconArrow size={18} />} onClick={onClose}>
            Design yours in the studio
          </Button>
        ) : (
          <AddToCartButton product={product} variant={variant} />
        )}
        <Link href={`/products/${product.handle}`} className={styles.quickMore} onClick={onClose}>
          View full details <IconArrow size={16} />
        </Link>
      </div>
      {sizeGuide && <SizeGuideModal open={guide} onClose={() => setGuide(false)} guide={sizeGuide} kind={guideKind} activeSize={selection.selected.Size} />}
    </motion.div>
  );
}

/** AJAX quick view: product JSON is fetched on open (SWR-cached) from /api/products?handle=… */
export default function QuickViewModal({ product: summary, onClose }) {
  const { data, error } = useSWR(summary ? apiUrl(`/products?handle=${encodeURIComponent(summary.handle)}`) : null, fetcher, { fallbackData: undefined, revalidateOnFocus: false });

  useEffect(() => {
    if (summary) track('quick_view', { item_id: summary.handle, item_name: summary.title });
  }, [summary]);

  return (
    <Modal open={Boolean(summary)} onClose={onClose} title={summary ? `Quick view: ${summary.title}` : 'Quick view'} hideTitle size="xl">
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <p role="alert">We could not load this product. <Link href={`/products/${summary?.handle}`}>Open the full page</Link>.</p>
        ) : data ? (
          <QuickViewBody key={data.handle} product={data} onClose={onClose} />
        ) : (
          <Skeleton key="skeleton" />
        )}
      </AnimatePresence>
    </Modal>
  );
}
