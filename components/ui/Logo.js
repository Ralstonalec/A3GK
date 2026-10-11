import Link from 'next/link';
import { SITE } from '@/lib/config';
import styles from '@/styles/components.module.css';

/** Single geometric source for the A3GK mark (also used by scripts/generate-assets.mjs). */
export const BRAND_MARK_PATH = 'M24 3 L45 45 H34.5 L24 24.5 L13.5 45 H3 Z M14 33 H34 V38.5 H14 Z';

export function LogoMark({ size = 28, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d={BRAND_MARK_PATH} />
    </svg>
  );
}

export default function Logo({ withTagline = false }) {
  return (
    <Link href="/" className={styles.logo}>
      <LogoMark size={30} className={styles.logoMark} />
      <span className={styles.logoWord}>
        {SITE.name}
        {withTagline && (
          <>
            {' '}
            <span className={styles.logoTag}>Goalkeeper gear</span>
          </>
        )}
        {/* Hidden text keeps the visible label inside the accessible name (WCAG 2.5.3). */}
        <span className="visually-hidden"> home</span>
      </span>
    </Link>
  );
}
