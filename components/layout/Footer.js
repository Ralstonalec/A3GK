import Link from 'next/link';
import { SITE } from '@/lib/config';
import { openConsentPanel } from '@/lib/consent';
import Logo from '@/components/ui/Logo';
import { IconInstagram, IconLock, IconTiktok, IconYoutube } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/products', label: 'All gear' },
      { href: '/products?category=gloves', label: 'Goalkeeper gloves' },
      { href: '/products?category=apparel', label: 'Apparel & padding' },
      { href: '/products?category=accessories', label: 'Bags & care' },
      { href: '/customizer', label: 'Design Studio' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/#faq', label: 'FAQ' },
      { href: '/#faq', label: 'Size guide' },
      { href: '/cart', label: 'Your cart' },
      { href: `mailto:${SITE.email}`, label: 'Contact us' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/#technology', label: 'Technology' },
      { href: '/#community', label: 'Community' },
      { href: '/accessibility', label: 'Accessibility' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms & Conditions' },
      { href: '/privacy', label: 'Privacy & cookies' },
    ],
  },
];

const SOCIAL = [
  { href: SITE.social.instagram, label: 'Instagram', Icon: IconInstagram },
  { href: SITE.social.youtube, label: 'YouTube', Icon: IconYoutube },
  { href: SITE.social.tiktok, label: 'TikTok', Icon: IconTiktok },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`page-width ${styles.footerInner}`}>
        <div className={styles.footerBrand}>
          <Logo withTagline />
          <p className={styles.footerBlurb}>{SITE.tagline}. Engineered with keepers, for keepers.</p>
          <ul role="list" className={styles.socialList}>
            {SOCIAL.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} className={styles.socialLink} target="_blank" rel="noopener noreferrer" aria-label={`${SITE.name} on ${label} (opens in a new tab)`}>
                  <Icon size={20} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className={styles.footerCol}>
            <h2 className={styles.footerHeading}>{column.title}</h2>
            <ul role="list" className={styles.footerLinks}>
              {column.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  {link.href.startsWith('mailto:') ? <a href={link.href}>{link.label}</a> : <Link href={link.href}>{link.label}</Link>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className={`page-width ${styles.footerBottom}`}>
        <p className={styles.footerSecure}>
          <IconLock size={16} /> Secure checkout, payments processed by Stripe
        </p>
        <p className={styles.footerLegal}>
          © {new Date().getFullYear()} {SITE.legalName}.{' '}
          <button type="button" className={styles.linkButton} onClick={openConsentPanel}>
            Cookie settings
          </button>
        </p>
      </div>
    </footer>
  );
}
