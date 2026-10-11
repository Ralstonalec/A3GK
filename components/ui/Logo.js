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
 * SVG logos are served as-is (`unoptimized`): the optimiser would rasterise them.
 */
export default function Logo({ priority = false }) {
  const { logo, hasLogo, name } = BRAND;
  const height = 34;
  const width = hasLogo && logo.width && logo.height ? Math.round((logo.width / logo.height) * height) : height;

  return (
    <Link href="/" className={styles.logo}>
      {hasLogo ? (
        <>
          <Image src={logo.src} alt="" width={width} height={height} priority={priority} unoptimized={logo.src.endsWith('.svg')} className={styles.logoImage} />
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
