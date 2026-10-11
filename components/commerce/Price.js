import { cn, formatMoney } from '@/lib/utils';
import styles from '@/styles/components.module.css';

/** Price with optional compare-at (sale) price. Screen readers hear "Sale price / Regular price". */
export default function Price({ cents, compareAtCents, from = false, size = 'md', className }) {
  const onSale = compareAtCents && compareAtCents > cents;
  return (
    <p className={cn(styles.price, styles[`price_${size}`], className)}>
      {from && <span className={styles.priceFrom}>From </span>}
      {onSale && <span className="visually-hidden">Sale price </span>}
      <span className={cn(styles.priceNow, onSale && styles.priceSale, 'tabular')}>{formatMoney(cents)}</span>
      {onSale && (
        <>
          <span className="visually-hidden"> Regular price </span>
          <s className={cn(styles.priceWas, 'tabular')}>{formatMoney(compareAtCents)}</s>
        </>
      )}
    </p>
  );
}
