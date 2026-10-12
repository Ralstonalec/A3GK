import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ANNOUNCEMENT, NAV_LINKS } from '@/lib/config';
import { useCart } from '@/lib/cart';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';
import Modal from '@/components/ui/Modal';
import { IconCart, IconMenu } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

function isActive(router, href) {
  const [path, hash] = href.split('#');
  if (hash !== undefined && path === '') return false; // in-page anchors never get aria-current
  const base = path.split('?')[0] || '/';
  return base === '/' ? router.pathname === '/' && !hash : router.asPath.split('?')[0].startsWith(base) && !href.includes('?');
}

export default function Header() {
  const router = useRouter();
  const { totalQuantity, openDrawer, lastAddedId } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let frame;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  return (
    <>
      {ANNOUNCEMENT && (
        <div className={styles.announce}>
          <p>{ANNOUNCEMENT}</p>
        </div>
      )}
      <header className={cn(styles.header, scrolled && styles.headerScrolled)}>
        <div className={cn('page-width', styles.headerInner)}>
          <Logo priority />

          <nav aria-label="Primary" className={styles.nav}>
            <ul role="list" className={styles.navList}>
              {NAV_LINKS.map((link) => {
                const active = isActive(router, link.href);
                return (
                  <li key={link.href}>
                    <Link href={link.href} className={cn(styles.navLink, active && styles.navLinkActive)} aria-current={active ? 'page' : undefined}>
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.headerActions}>
            <button type="button" className={cn(styles.iconButton, styles.cartButton)} onClick={openDrawer} aria-haspopup="dialog" aria-label={`Open cart, ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`}>
              <IconCart size={22} />
              {totalQuantity > 0 && (
                <motion.span key={`${totalQuantity}-${lastAddedId}`} className={styles.cartCount} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} aria-hidden="true">
                  {totalQuantity}
                </motion.span>
              )}
            </button>
            <button type="button" className={cn(styles.iconButton, styles.menuButton)} onClick={() => setMenuOpen(true)} aria-haspopup="dialog" aria-expanded={menuOpen} aria-label="Open menu">
              <IconMenu size={24} />
            </button>
          </div>
        </div>
      </header>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" variant="drawer-left" size="sm">
        <nav aria-label="Mobile">
          <ul role="list" className={styles.mobileNav}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Modal>
    </>
  );
}
