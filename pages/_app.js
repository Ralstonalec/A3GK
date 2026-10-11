import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter';
import '@/styles/globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { SWRConfig } from 'swr';
import { pageView, track } from '@/lib/analytics';
import { CartProvider } from '@/lib/cart';
import Layout from '@/components/layout/Layout';
import { ToastProvider, useToast } from '@/components/ui/Toast';

/** Cart errors (rollbacks) surface as toasts. */
function CartWithToasts({ children }) {
  const toast = useToast();
  return <CartProvider onError={(message) => toast.push({ tone: 'error', title: 'Cart update failed', description: message })}>{children}</CartProvider>;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Page views (consent-gated inside track()).
  useEffect(() => {
    const onRoute = (url) => pageView(url.split('?')[0]);
    const onConsent = (event) => {
      if (event.detail?.categories?.analytics) pageView(window.location.pathname);
    };
    pageView(window.location.pathname);
    router.events.on('routeChangeComplete', onRoute);
    window.addEventListener('a3gk:consent', onConsent);
    return () => {
      router.events.off('routeChangeComplete', onRoute);
      window.removeEventListener('a3gk:consent', onConsent);
    };
  }, [router.events]);

  // axe-core console reporting in development only.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return undefined;
    let stop;
    import('@/lib/a11y').then((m) => m.startAxeWatcher(router)).then((fn) => (stop = fn));
    return () => stop?.();
  }, [router]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MotionConfig reducedMotion="user">
        <SWRConfig value={{ dedupingInterval: 5000, errorRetryCount: 2 }}>
          <ToastProvider>
            <CartWithToasts>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </CartWithToasts>
          </ToastProvider>
        </SWRConfig>
      </MotionConfig>
    </>
  );
}

/** Core Web Vitals → analytics (only delivered if the visitor consented). */
export function reportWebVitals(metric) {
  track('web_vital', { metric_name: metric.name, metric_id: metric.id, value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), rating: metric.rating || '' });
}
