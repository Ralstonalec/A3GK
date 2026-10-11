import { AnimatePresence, motion } from 'framer-motion';
import { formatMoney } from '@/lib/utils';
import styles from '@/styles/studio.module.css';

/**
 * Real-time price breakdown for the Design Studio.
 * `result` comes from calculateCustomPrice(); every control change re-renders
 * this instantly, with the headline total animating on change.
 */
export default function PriceCalculator({ result }) {
  const { lines, quantity, subtotalCents, discountPercent, discountCents, totalCents, nextTier } = result;
  return (
    <section className={styles.calculator} aria-label="Price breakdown">
      <ul role="list" className={styles.calcLines}>
        {lines.map((line) => (
          <li key={line.id} className={styles.calcLine}>
            <span>{line.label}</span>
            <span className="tabular">{formatMoney(line.cents)}</span>
          </li>
        ))}
        {quantity > 1 && (
          <li className={styles.calcLine}>
            <span>× {quantity} pieces</span>
            <span className="tabular">{formatMoney(subtotalCents)}</span>
          </li>
        )}
        {discountPercent > 0 && (
          <li className={`${styles.calcLine} ${styles.calcDiscount}`}>
            <span>Team discount ({discountPercent}%)</span>
            <span className="tabular">−{formatMoney(discountCents)}</span>
          </li>
        )}
      </ul>

      <div className={styles.calcTotal}>
        <span className={styles.calcTotalLabel}>Total</span>
        <span aria-live="polite" aria-atomic="true" className={styles.calcTotalValue}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={totalCents} className="tabular" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.2 }}>
              {formatMoney(totalCents)}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      {nextTier && (
        <p className={styles.calcHint}>
          Add {nextTier.minQuantity - quantity} more for <strong>{nextTier.percent}% off</strong> the whole order.
        </p>
      )}
    </section>
  );
}
