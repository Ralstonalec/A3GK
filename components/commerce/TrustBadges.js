import { hasFreeShipping, hasReturnWindow, hasShippingMethods, STORE_TERMS } from '@/lib/store-terms';
import { cn, formatMoney } from '@/lib/utils';
import { IconCard, IconCheck, IconLock, IconReturn, IconTruck } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

/**
 * Assurance badges. Security and payment badges are always true of this build;
 * the shipping and returns badges appear ONLY once those terms are configured
 * in lib/store-terms.js (nothing is promised before it is decided).
 */
export function getTrustBadges() {
  const badges = [
    { id: 'ssl', Icon: IconLock, title: 'Secure checkout', text: 'SSL-encrypted. Payments are handled by Stripe — we never see your card details.' },
    { id: 'payments', Icon: IconCard, title: 'Trusted payments', text: 'Card payments processed securely by Stripe.' },
  ];
  if (hasShippingMethods()) {
    badges.push({
      id: 'shipping',
      Icon: IconTruck,
      title: hasFreeShipping() ? 'Free shipping available' : 'Tracked shipping',
      text: hasFreeShipping() ? `Free standard shipping over ${formatMoney(STORE_TERMS.freeShippingThresholdCents, { trimZeros: true })}.` : 'Every order ships with tracking.',
    });
  }
  if (hasReturnWindow()) {
    badges.push({ id: 'returns', Icon: IconReturn, title: `${STORE_TERMS.returnWindowDays}-day guarantee`, text: 'Not right? Return unworn items for a full refund.' });
  }
  return badges;
}

/** Trust & assurance row. `compact` is the slim variant for product / cart pages. */
export default function TrustBadges({ compact = false, heading = 'Shop with confidence' }) {
  const badges = getTrustBadges();
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
