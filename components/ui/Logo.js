import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import styles from '@/styles/components.module.css';

/**
 * Header / footer brand link.
 *
 * Shows the company's own logo once one has been installed with `npm run brand`
 * (data/brand.json). Until then it renders a plain text wordmark — deliberately
 * not an invented mark, so nothing on the site passes for the real logo.
 *
 * `variant="lockup"` (footer) prefers the full logo (symbol + name) when one was
 * supplied, at a size where its small text stays readable; otherwise it falls back
 * to the header logo. SVG logos are served as-is (`unoptimized`): the optimiser
 * would rasterise them.
 */
export default function Logo({ variant = 'header', priority = false }) {
  const { name, hasLogo } = BRAND;
  const lockup = variant === 'lockup' && BRAND.lockup?.src ? BRAND.lockup : null;
  const logo = lockup || BRAND.logo;
  const displayHeight = lockup ? 96 : 40;
  const width = hasLogo && logo.width && logo.height ? Math.round((logo.width / logo.height) * displayHeight) : displayHeight;

  return (
    <Link href="/" className={styles.logo}>
      {hasLogo ? (
        <>
          <Image src={logo.src} alt="" width={width} height={displayHeight} priority={priority} unoptimized={logo.src.endsWith('.svg')} className={lockup ? styles.logoLockup : styles.logoImage} />
          <span className="visually-hidden">{name} home</span>
        </>
      ) : (
        <span className={styles.logoWord}>
          {name}
          {/* Hidden text keeps the visible label inside the accessible name (WCAG 2.5.3). */}
          <span className="visually-hidden"> home</span>
        </span>
      )}
    </Link>
  );
}
