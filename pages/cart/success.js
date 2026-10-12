import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Seo from '@/components/layout/Seo';
import Button from '@/components/ui/Button';
import { IconCheck, IconInfo } from '@/components/ui/Icons';
import { apiUrl } from '@/lib/config';
import { useCart } from '@/lib/cart';
import { track } from '@/lib/analytics';
import styles from '@/styles/pages.module.css';

/**
 * Order confirmation. For Stripe we ask the server whether the session is
 * actually paid (never trust the bare ?session_id= in the URL); demo orders are
 * labelled as demo. The cart is cleared only once the outcome is known.
 */
export default function Success() {
  const router = useRouter();
  const { clear } = useCart();
  const [state, setState] = useState({ phase: 'checking' }); // checking | paid | pending | demo | unknown
  const cleared = useRef(false);

  useEffect(() => {
    if (!router.isReady) return undefined;
    const { demo, ref, session_id: sessionId } = router.query;
    let cancelled = false;

    const finish = (next) => {
      if (cancelled) return;
      setState(next);
      if ((next.phase === 'paid' || next.phase === 'demo') && !cleared.current) {
        cleared.current = true;
        clear();
        if (next.phase === 'paid') track('purchase_confirmed_view', { session: String(sessionId).slice(-8) });
      }
    };

    if (demo) {
      finish({ phase: 'demo', ref: String(ref || '') });
    } else if (typeof sessionId === 'string') {
      fetch(apiUrl(`/checkout?session_id=${encodeURIComponent(sessionId)}`))
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('status'))))
        .then((s) => finish({ phase: s.paid ? 'paid' : 'pending' }))
        .catch(() => finish({ phase: 'unknown' }));
    } else {
      finish({ phase: 'unknown' });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  const copy = {
    checking: { title: 'Confirming your order…', body: 'One moment while we confirm your payment.' },
    paid: { title: 'Thank you — payment confirmed', body: 'Your payment has been received.' },
    pending: { title: 'We are still confirming your payment', body: 'This can take a minute. Refresh this page to check again.' },
    demo: { title: 'Demo order placed', body: 'This was a demo checkout — no payment was taken and nothing will ship.' },
    unknown: { title: 'We could not verify this order', body: 'We could not confirm a payment for this visit. Your cart is still saved.' },
  }[state.phase];

  return (
    <>
      <Seo title="Order status" path="/cart/success" noindex />
      <div className={`page-width ${styles.successPage}`}>
        <div className={styles.successCard} role="status" aria-live="polite">
          <span className={styles.successIcon} aria-hidden="true">{state.phase === 'paid' || state.phase === 'demo' ? <IconCheck size={32} strokeWidth={2.4} /> : <IconInfo size={32} />}</span>
          <h1 className="h2">{copy.title}</h1>
          <p className="lead">{copy.body}</p>
          {state.ref && <p className="muted">Reference: <code>{state.ref}</code></p>}
          <div className="cluster" style={{ justifyContent: 'center' }}>
            <Button href="/products" size="lg">Keep shopping</Button>
            {state.phase === 'unknown' && <Button href="/cart" variant="secondary" size="lg">Back to cart</Button>}
          </div>
        </div>
      </div>
    </>
  );
}
