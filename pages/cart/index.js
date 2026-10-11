import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo from '@/components/layout/Seo';
import CartLineItem from '@/components/commerce/CartLineItem';
import TrustBadges from '@/components/commerce/TrustBadges';
import Button from '@/components/ui/Button';
import { IconArrow, IconInfo } from '@/components/ui/Icons';
import { hasFreeShipping, STORE_TERMS } from '@/lib/store-terms';
import { useCart } from '@/lib/cart';
import { amountToFreeShipping } from '@/lib/shipping';
import { formatMoney } from '@/lib/utils';
import styles from '@/styles/pages.module.css';

export default function CartPage() {
  const router = useRouter();
  const { lines, subtotalCents, totalQuantity, notices, isPending, hydrated } = useCart();
  const remaining = amountToFreeShipping(subtotalCents);
  const progress = hasFreeShipping() ? Math.min(100, Math.round((subtotalCents / STORE_TERMS.freeShippingThresholdCents) * 100)) : 0;

  return (
    <>
      <Seo title="Your cart" path="/cart" noindex />
      <div className={`page-width ${styles.cartPage}`}>
        <header className={styles.pageHeader}>
          <p className="eyebrow">Cart</p>
          <h1>Your cart{hydrated && totalQuantity > 0 ? ` (${totalQuantity})` : ''}</h1>
        </header>

        {router.query.cancelled && (
          <p className={styles.banner} role="status">
            <IconInfo size={18} /> Checkout was cancelled — your cart is saved.
          </p>
        )}

        {notices.length > 0 && (
          <ul role="list" className={styles.notices} aria-live="polite">
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}

        {hydrated && lines.length === 0 ? (
          <div className={styles.emptyState}>
            <p className="h2">Your cart is empty</p>
            <p className="lead">Gear up — your next clean sheet starts here.</p>
            <Button href="/products" size="lg" iconAfter={<IconArrow size={20} />}>
              Shop all gear
            </Button>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <ul role="list" className={styles.cartLines} aria-busy={isPending}>
              {lines.map((line) => (
                <CartLineItem key={line.id} line={line} />
              ))}
            </ul>

            <aside className={styles.summary} aria-label="Order summary">
              <h2 className="h3">Order summary</h2>
              <dl className={styles.summaryRows}>
                <div>
                  <dt>Subtotal</dt>
                  <dd className="tabular" aria-live="polite">{formatMoney(subtotalCents)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{remaining === 0 ? 'Free' : 'Shown at checkout'}</dd>
                </div>
              </dl>
              {remaining !== null && (
                <div className={styles.shipMeter}>
                  <p>
                    {remaining === 0 ? <strong>You have unlocked free shipping.</strong> : <>Add <strong>{formatMoney(remaining)}</strong> for free shipping</>}
                  </p>
                  <div className={styles.shipTrack} role="progressbar" aria-label="Progress to free shipping" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
              <Button href="/cart/checkout" size="lg" fullWidth loading={isPending} iconAfter={<IconArrow size={20} />}>
                Checkout
              </Button>
              <Link href="/products" className={styles.continue}>Continue shopping</Link>
              <TrustBadges compact />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
