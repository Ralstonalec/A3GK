import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { hasFreeShipping, hasShippingMethods, STORE_TERMS } from '@/lib/store-terms';
import { useCart } from '@/lib/cart';
import { amountToFreeShipping } from '@/lib/shipping';
import { formatMoney } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CartLineItem from './CartLineItem';
import { IconArrow } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

/** Slide-over mini cart. Opens automatically after an add-to-cart. */
export default function CartDrawer() {
  const router = useRouter();
  const { drawerOpen, closeDrawer, lines, subtotalCents, totalQuantity, notices, isPending } = useCart();

  useEffect(() => {
    router.events.on('routeChangeStart', closeDrawer);
    return () => router.events.off('routeChangeStart', closeDrawer);
  }, [router.events, closeDrawer]);

  const remaining = amountToFreeShipping(subtotalCents);
  const progress = hasFreeShipping() ? Math.min(100, Math.round((subtotalCents / STORE_TERMS.freeShippingThresholdCents) * 100)) : 0;

  return (
    <Modal open={drawerOpen} onClose={closeDrawer} title={`Your cart (${totalQuantity})`} variant="drawer" size="md">
      {lines.length === 0 ? (
        <div className={styles.emptyCart}>
          <p className="h3">Your cart is empty</p>
          <p className="muted">Gear up — your next clean sheet starts here.</p>
          <Button href="/products" onClick={closeDrawer} iconAfter={<IconArrow size={18} />}>
            Shop all gear
          </Button>
        </div>
      ) : (
        <div className={styles.drawerCart}>
          {remaining !== null && (
            <div className={styles.shipMeter}>
              <p>
                {remaining === 0 ? (
                  <strong>You have unlocked free shipping.</strong>
                ) : (
                  <>
                    Add <strong>{formatMoney(remaining)}</strong> for free shipping
                  </>
                )}
              </p>
              <div className={styles.shipTrack} role="progressbar" aria-label="Progress to free shipping" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {notices.length > 0 && (
            <ul role="list" className={styles.notices} aria-live="polite">
              {notices.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}

          <ul role="list" className={styles.lines}>
            {lines.map((line) => (
              <CartLineItem key={line.id} line={line} compact />
            ))}
          </ul>

          <div className={styles.drawerFooter}>
            <p className={styles.subtotalRow}>
              <span>Subtotal</span>
              <span className="tabular" aria-live="polite">{formatMoney(subtotalCents)}</span>
            </p>
            {hasShippingMethods() && <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>Shipping is shown at checkout.</p>}
            <Button href="/cart/checkout" size="lg" fullWidth loading={isPending} onClick={closeDrawer}>
              Checkout
            </Button>
            <Button href="/cart" variant="secondary" fullWidth onClick={closeDrawer}>
              View cart
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
