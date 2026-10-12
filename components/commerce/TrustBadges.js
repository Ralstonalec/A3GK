import { isPaymentsEnabled } from '@/lib/config';
import { hasFreeShipping, hasReturnWindow, STORE_TERMS } from '@/lib/store-terms';
import { cn, formatMoney } from '@/lib/utils';
import { IconCard, IconCheck, IconReturn, IconTruck } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

/**
 * Assurance badges — each one appears ONLY when it is true of the running site:
 *   • payment badge: only when Stripe is the checkout actually in use
 *   • free-shipping / returns badges: only once those terms are set in lib/store-terms.js
 * In demo mode (no payments, no terms) there are no badges, and the section renders nothing.
 */
export function getTrustBadges() {
  const badges = [];
  // Named only when Stripe is the checkout actually in use (checkoutProvider in lib/config.js). Card details are entered
  // on Stripe's hosted page, so they never pass through this site.
  if (isPaymentsEnabled()) {
    badges.push({ id: 'payments', Icon: IconCard, title: 'Payments by Stripe', text: 'Card details are entered on Stripe’s payment page and never pass through this site.' });
  }
  // Only terms that were explicitly configured are stated, and only in the words of the configuration.
  if (hasFreeShipping()) {
    badges.push({ id: 'shipping', Icon: IconTruck, title: 'Free shipping', text: `Free standard shipping over ${formatMoney(STORE_TERMS.freeShippingThresholdCents, { trimZeros: true })}.` });
  }
  if (hasReturnWindow()) {
    badges.push({ id: 'returns', Icon: IconReturn, title: `${STORE_TERMS.returnWindowDays}-day returns`, text: `Return unworn items within ${STORE_TERMS.returnWindowDays} days.` });
  }
  return badges;
}

/** Trust & assurance row. `compact` is the slim variant for product / cart pages. */
export default function TrustBadges({ compact = false, heading = 'Shop with confidence' }) {
  const badges = getTrustBadges();
  if (badges.length === 0) return null;
  return (
    <section className={cn(styles.trust, compact && styles.trustCompact)} aria-label={heading}>
      <ul role="list" className={styles.trustList}>
        {badges.map(({ id, Icon, title, text }) => (
          <li key={id} className={styles.trustItem}>
            <span className={styles.trustIcon}>
              <Icon size={compact ? 20 : 26} />
              <span className={styles.trustCheck} aria-hidden="true">
                <IconCheck size={10} strokeWidth={3.2} />
              </span>
            </span>
            <div>
              <h3 className={styles.trustTitle}>{title}</h3>
              {!compact && <p className={styles.trustText}>{text}</p>}
              {compact && <p className="visually-hidden">{text}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
