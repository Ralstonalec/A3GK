import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { hoverLift } from '@/lib/animations';
import { cn } from '@/lib/utils';
import Price from './Price';
import { IconEye } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

/**
 * Grid product card. The title link is stretched over the whole card (one tab
 * stop, large click target); Quick view sits above it as its own button.
 * Mirrors ShopifyTheme/snippets/product-card.liquid.
 */
export default function ProductCard({ product, onQuickView, priority = false, sizes = '(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw' }) {
  const [first, second] = product.images;
  const soldOut = !product.availableForSale;
  const sale = product.compareAtMinCents && product.compareAtMinCents > product.priceRange.minCents;
  const badge = soldOut ? 'Sold out' : product.badges?.[0] || (sale ? 'Sale' : null);
  const multiPrice = product.priceRange.maxCents > product.priceRange.minCents;

  return (
    <motion.article className={cn(styles.card, soldOut && styles.cardSoldOut)} whileHover={hoverLift} data-product-handle={product.handle}>
      <div className={styles.cardMedia}>
        {first && (
          <Image
            src={first.url}
            alt={first.altText || product.title}
            width={first.width}
            height={first.height}
            sizes={sizes}
            priority={priority}
            className={cn(styles.cardImage, second && styles.cardImagePrimary)}
          />
        )}
        {second && <Image src={second.url} alt="" width={second.width} height={second.height} sizes={sizes} className={cn(styles.cardImage, styles.cardImageSecondary)} aria-hidden="true" />}
        {badge && <span className={cn(styles.badge, soldOut && styles.badgeMuted)}>{badge}</span>}
        {onQuickView && (
          <button type="button" className={styles.quickViewButton} onClick={() => onQuickView(product)} aria-label={`Quick view: ${product.title}`}>
            <IconEye size={18} /> <span>Quick view</span>
          </button>
        )}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardType}>{product.productType}</p>
        <h3 className={styles.cardTitle}>
          <Link href={`/products/${product.handle}`} className={styles.cardLink}>
            {product.title}
          </Link>
        </h3>
        <Price cents={product.priceRange.minCents} compareAtCents={product.compareAtMinCents} from={multiPrice} size="sm" />
      </div>
    </motion.article>
  );
}
