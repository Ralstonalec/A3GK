import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { FABRICS, PATTERNS } from '@/lib/customizer-options';
import { formatMoney } from '@/lib/utils';
import QuantitySelector from './QuantitySelector';
import styles from '@/styles/components.module.css';

function customizationSummary(c) {
  if (!c) return null;
  const parts = [PATTERNS.find((p) => p.id === c.pattern)?.label, FABRICS.find((f) => f.id === c.fabric)?.label];
  if (c.playerName) parts.push(`“${c.playerName}”`);
  if (c.playerNumber) parts.push(`#${c.playerNumber}`);
  if (c.logo?.enabled) parts.push('Custom logo');
  return parts.filter(Boolean).join(' · ');
}

export default function CartLineItem({ line, compact = false }) {
  const { setQuantity, removeItem } = useCart();
  const summary = customizationSummary(line.customization);
  const maxQty = line.maxQuantity ?? 20;

  return (
    <li className={styles.line}>
      <Link href={`/products/${line.handle}`} className={styles.lineMedia} tabIndex={-1} aria-hidden="true">
        {line.image && <Image src={line.image.url} alt="" width={160} height={160} sizes="96px" />}
        {line.customization && (
          <span className={styles.lineSwatches} aria-hidden="true">
            <i style={{ background: line.customization.baseColor }} />
            <i style={{ background: line.customization.accentColor }} />
          </span>
        )}
      </Link>
      <div className={styles.lineBody}>
        <div className={styles.lineHead}>
          <h3 className={styles.lineTitle}>
            <Link href={`/products/${line.handle}`}>{line.title}</Link>
          </h3>
          <p className={`${styles.lineTotal} tabular`}>{formatMoney(line.unitCents * line.quantity)}</p>
        </div>
        {line.variantTitle && <p className={styles.lineMeta}>{line.variantTitle}</p>}
        {summary && <p className={styles.lineMeta}>{summary}</p>}
        {!compact && <p className={styles.lineMeta}>{formatMoney(line.unitCents)} each</p>}
        <div className={styles.lineActions}>
          <QuantitySelector size="sm" value={line.quantity} max={maxQty} label={line.title} onChange={(q) => setQuantity(line.id, q)} />
          <button type="button" className={styles.linkButton} onClick={() => removeItem(line.id)} aria-label={`Remove ${line.title}${line.variantTitle ? `, ${line.variantTitle}` : ''} from cart`}>
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
