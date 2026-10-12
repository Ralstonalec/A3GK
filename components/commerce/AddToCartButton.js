import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/lib/cart';
import { useHasMounted } from '@/lib/hooks';
import { deliveryEstimateFor } from '@/lib/shipping';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { IconCheck, IconTruck } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

const LOW_STOCK_THRESHOLD = 5;

/** "In stock — 12 available" / "Only 3 left" / "Sold out" — no label when inventory is not tracked or exposed. */
export function stockStatus(variant) {
  if (!variant) return { tone: 'neutral', label: 'Select options' };
  if (!variant.availableForSale) return { tone: 'out', label: 'Sold out' };
  const qty = variant.quantityAvailable;
  if (typeof qty === 'number' && qty <= LOW_STOCK_THRESHOLD) return { tone: 'low', label: `Only ${qty} left` };
  if (typeof qty === 'number') return { tone: 'in', label: `In stock — ${qty} available` };
  // No inventory data (untracked / placeholder): say nothing rather than assert stock.
  return { tone: 'in', label: '' };
}

/**
 * Smart add-to-cart: inventory signal + estimated delivery + optimistic add
 * with a confirmation state. Used on product pages, in quick view and in the
 * Design Studio (with `customization`).
 */
export default function AddToCartButton({ product, variant, quantity = 1, customization, designId, beforeAdd, label, fullWidth = true, shipping = 'standard' }) {
  const { addItem } = useCart();
  const [state, setState] = useState('idle'); // idle | adding | added
  const mounted = useHasMounted();
  const status = stockStatus(variant);
  const disabled = !variant || !variant.availableForSale;

  // Delivery date depends on "today", so compute after mount to avoid a server/client mismatch.
  // Only shown once delivery terms are configured in lib/store-terms.js.
  const eta = useMemo(() => {
    if (!mounted) return null;
    const estimate = deliveryEstimateFor(shipping, [{ leadTimeDays: product.leadTimeDays || 0, customization }]);
    return estimate ? estimate.label : null;
  }, [mounted, product.leadTimeDays, customization, shipping]);

  useEffect(() => {
    if (state !== 'added') return undefined;
    const t = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(t);
  }, [state]);

  async function handleClick() {
    if (disabled || state === 'adding') return;
    setState('adding');
    try {
      const extra = beforeAdd ? await beforeAdd() : {};
      await addItem({ product, variant, quantity, customization, designId, ...extra });
      setState('added');
    } catch {
      setState('idle');
    }
  }

  return (
    <div className={styles.atc}>
      {status.label && (
        <p className={cn(styles.stock, styles[`stock_${status.tone}`])} role="status">
          <span className={styles.stockDot} aria-hidden="true" />
          {status.label}
        </p>
      )}

      <Button size="lg" fullWidth={fullWidth} disabled={disabled} loading={state === 'adding'} onClick={handleClick} className={cn(state === 'added' && styles.atcAdded)}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={state === 'added' ? 'added' : 'idle'} className={styles.atcLabel} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.16 }}>
            {state === 'added' ? (
              <>
                <IconCheck size={20} /> Added to cart
              </>
            ) : disabled ? (
              'Sold out'
            ) : (
              label || 'Add to cart'
            )}
          </motion.span>
        </AnimatePresence>
      </Button>

      {eta && !disabled && (
        <p className={styles.eta}>
          <IconTruck size={18} />
          <span>
            Order today, arrives <strong>{eta}</strong>
          </span>
        </p>
      )}
    </div>
  );
}
