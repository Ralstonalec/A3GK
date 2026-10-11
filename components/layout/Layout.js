import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/lib/animations';
import { useHasMounted } from '@/lib/hooks';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '@/components/commerce/CartDrawer';
import ConsentBanner from '@/components/privacy/ConsentBanner';
import styles from '@/styles/components.module.css';

/** Site shell: skip link, header, animated <main>, footer, global overlays. */
export default function Layout({ children }) {
  const router = useRouter();
  const mainRef = useRef(null);
  const first = useRef(true);
  const mounted = useHasMounted();
  const path = router.asPath.split('?')[0].split('#')[0];

  // Move focus to <main> after client-side navigation (WCAG 2.4.3); skip the initial load.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!window.location.hash) mainRef.current?.focus({ preventScroll: true });
  }, [path]);

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <Header />
      <motion.main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        key={path}
        className={styles.main}
        // First paint is never hidden (LCP / no-JS); later navigations fade in.
        initial={mounted ? pageTransition.initial : false}
        animate={pageTransition.animate}
      >
        {children}
      </motion.main>
      <Footer />
      <CartDrawer />
      <ConsentBanner />
    </>
  );
}
