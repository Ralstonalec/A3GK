import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import { useHasMounted } from '@/lib/hooks';
import Seo from '@/components/layout/Seo';
import Button from '@/components/ui/Button';
import Input, { Checkbox } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import TrustBadges from '@/components/commerce/TrustBadges';
import { apiUrl, isShopifyConfigured, publicConfig } from '@/lib/config';
import { hasPublishedTerms, hasShippingMethods, STORE_TERMS } from '@/lib/store-terms';
import { track } from '@/lib/analytics';
import { toSnapshot, useCart } from '@/lib/cart';
import { deliveryEstimateFor, shippingCostCents } from '@/lib/shipping';
import { isStripeConfigured } from '@/lib/server-config';
import { formatMoney } from '@/lib/utils';
import { checkoutSchema, validate } from '@/lib/validation';
import styles from '@/styles/pages.module.css';

export async function getStaticProps() {
  const mode = isStripeConfigured() ? 'stripe' : isShopifyConfigured() ? 'shopify' : 'demo';
  return { props: { mode } };
}

export default function CheckoutPage({ mode }) {
  const toast = useToast();
  const { cart, lines, subtotalCents, hydrated, adoptCart, isPending } = useCart();
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState(STORE_TERMS.shippingMethods[0]?.id);
  const [terms, setTerms] = useState(false);
  const [company, setCompany] = useState(''); // honeypot
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const mounted = useHasMounted();
  const now = useMemo(() => (mounted ? new Date() : null), [mounted]);
  useEffect(() => {
    if (hydrated && lines.length) track('begin_checkout', { currency: 'USD', value: subtotalCents / 100, items: lines.map((l) => ({ item_id: l.variantId, item_name: l.title, price: l.unitCents / 100, quantity: l.quantity })) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Shipping terms are optional (lib/store-terms.js): with none configured there is no shipping UI at all.
  const shippingCents = hasShippingMethods() ? shippingCostCents(method, subtotalCents) : null;
  const totalCents = subtotalCents + (shippingCents || 0);
  const estimates = useMemo(() => {
    if (!now || !hasShippingMethods()) return {};
    return Object.fromEntries(STORE_TERMS.shippingMethods.map((m) => [m.id, deliveryEstimateFor(m.id, lines, now)?.label]).filter(([, label]) => label));
  }, [now, lines]);

  async function onSubmit(event) {
    event.preventDefault();
    const payload = { email: email.trim(), lines: toSnapshot(cart), ...(method ? { shippingMethod: method } : {}), acceptTerms: terms, company };
    const result = validate(checkoutSchema, payload);
    // Agreement to terms is only asked for (and required) once real terms are published.
    const termsError = hasPublishedTerms() && !terms ? { acceptTerms: 'You must accept the Terms & Conditions to continue' } : null;
    if (!result.ok || termsError) {
      setErrors({ ...(result.ok ? {} : result.errors), ...termsError });
      const first = Object.keys({ ...(result.ok ? {} : result.errors), ...termsError })[0];
      document.getElementById(first === 'email' ? 'checkout-email' : first === 'acceptTerms' ? 'checkout-terms' : '')?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/checkout'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.data) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json.details?.cart) {
        adoptCart(json.details.cart);
        toast.push({ tone: 'info', title: 'Your cart was updated', description: json.details.notices?.[0] || 'Prices or stock changed. Please review and try again.' });
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(json.details ? 'Please check the form and try again.' : json.message || 'Checkout failed.');
      window.location.assign(json.url);
    } catch (e) {
      toast.push({ tone: 'error', title: 'Checkout could not start', description: e.message });
      setSubmitting(false);
    }
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className={`page-width ${styles.cartPage}`}>
        <Seo title="Checkout" path="/cart/checkout" noindex />
        <div className={styles.emptyState}>
          <h1 className="h2">Nothing to check out</h1>
          <p className="lead">Your cart is empty.</p>
          <Button href="/products" size="lg">Shop all gear</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo title="Checkout" path="/cart/checkout" noindex />
      {mode === 'stripe' && publicConfig.stripePublishableKey && <Script src="https://js.stripe.com/v3" strategy="lazyOnload" />}
      <div className={`page-width ${styles.cartPage}`}>
        <header className={styles.pageHeader}>
          <p className="eyebrow">{mode === 'demo' ? 'Demo checkout' : 'Checkout'}</p>
          <h1>Checkout</h1>
        </header>

        {mode === 'demo' && (
          <p className={styles.banner} role="note">
            <strong>Demo mode.</strong>&nbsp;No payment is taken.
          </p>
        )}

        <form className={styles.checkoutLayout} onSubmit={onSubmit} noValidate>
          <div className={styles.checkoutMain}>
            <fieldset className={styles.panel}>
              <legend className="h3">Contact</legend>
              <Input id="checkout-email" label="Email" type="email" autoComplete="email" inputMode="email" required value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
              {/* Honeypot — hidden from people and assistive tech; bots fill it. */}
              <div aria-hidden="true" className={styles.honeypot}>
                <label>
                  Company
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
                </label>
              </div>
            </fieldset>

            {hasShippingMethods() ? (
              <fieldset className={styles.panel}>
                <legend className="h3">Delivery</legend>
                <div role="radiogroup" aria-label="Shipping method" className={styles.methods}>
                  {STORE_TERMS.shippingMethods.map((m) => {
                    const cost = shippingCostCents(m.id, subtotalCents);
                    return (
                      <label key={m.id} className={`${styles.method} ${method === m.id ? styles.methodOn : ''}`}>
                        <input type="radio" name="shipping" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="visually-hidden" />
                        <span>
                          <strong>{m.label}</strong>
                          {estimates[m.id] && <small>Arrives {estimates[m.id]}</small>}
                        </span>
                        <span className="tabular">{cost === 0 ? 'Free' : formatMoney(cost)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <>
                {mode === 'demo' && <p className="muted">Demo checkout — no delivery address is collected.</p>}
                {mode === 'shopify' && <p className="muted">Delivery details are entered at checkout on the next page.</p>}
              </>
            )}

            {/* Only once real terms exist (lib/store-terms.js → termsPublished): never ask for agreement to terms that are not written. */}
            {hasPublishedTerms() && (
              <fieldset className={styles.panel}>
                <legend className="h3">Agreements</legend>
                <Checkbox id="checkout-terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} error={errors.acceptTerms}>
                  I have read and agree to the <Link href="/terms" target="_blank">Terms &amp; Conditions</Link> and the <Link href="/privacy" target="_blank">Privacy &amp; cookie policy</Link>. <span className="visually-hidden">(required)</span>
                </Checkbox>
              </fieldset>
            )}
          </div>

          <aside className={styles.summary} aria-label="Order summary">
            <h2 className="h3">Order summary</h2>
            <ul role="list" className={styles.summaryLines}>
              {lines.map((l) => (
                <li key={l.id}>
                  <span className={styles.summaryThumb}>
                    {l.image && <Image src={l.image.url} alt="" width={96} height={96} sizes="56px" />}
                    <span className={styles.summaryQty} aria-hidden="true">{l.quantity}</span>
                  </span>
                  <span>
                    <strong>{l.title}</strong>
                    <small>{[l.variantTitle, l.customization ? 'Custom design' : ''].filter(Boolean).join(' · ')}</small>
                    <span className="visually-hidden">Quantity {l.quantity}</span>
                  </span>
                  <span className="tabular">{formatMoney(l.unitCents * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className={styles.summaryRows}>
              <div><dt>Subtotal</dt><dd className="tabular">{formatMoney(subtotalCents)}</dd></div>
              {shippingCents !== null && <div><dt>Shipping</dt><dd className="tabular">{shippingCents === 0 ? 'Free' : formatMoney(shippingCents)}</dd></div>}
              <div className={styles.summaryTotal}><dt>Total</dt><dd className="tabular">{formatMoney(totalCents)}</dd></div>
            </dl>
            <Button type="submit" size="lg" fullWidth loading={submitting || isPending}>
              {mode === 'demo' ? 'Place demo order' : 'Continue to payment'}
            </Button>
            <TrustBadges compact />
          </aside>
        </form>
      </div>
    </>
  );
}
