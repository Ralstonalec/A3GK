import LegalPage from '@/components/layout/LegalPage';
import { HAS_OPTIONAL_CONSENT, openConsentPanel } from '@/lib/consent';
import { checkoutProvider, isAnalyticsEnabled, isPaymentsEnabled, isShopifyConfigured, SITE } from '@/lib/config';
import { FEATURES } from '@/lib/features';

/**
 * Describes only what this site demonstrably does. Rows and list items that depend
 * on an integration appear only when that integration is configured, and nothing
 * about the company (legal entity, retention periods, sale of data, transfers) is
 * asserted — those are for the company to state and a lawyer to review.
 */
const COOKIES = [
  ...(HAS_OPTIONAL_CONSENT ? [['a3gk_consent', 'Cookie', 'Stores your consent choices and when you made them.', '6 months', 'Strictly necessary']] : []),
  ['a3gk.cart.v1', 'Local storage', 'Remembers the items in your cart on this device.', 'Until cleared', 'Strictly necessary'],
  ...(isShopifyConfigured() ? [['a3gk_cart', 'Cookie (HttpOnly)', 'Identifies your Shopify cart.', '30 days', 'Strictly necessary']] : []),
  ...(FEATURES.customKit ? [['a3gk.studio.v1', 'Local storage', 'Remembers your last Design Studio configuration (never your logo file).', 'Until cleared', 'Preferences — only with your consent']] : []),
  ...(isAnalyticsEnabled() ? [['a3gk_cid', 'Local storage', 'Random identifier used to group analytics events from this browser.', 'Until cleared', 'Analytics — only with your consent']] : []),
];

const contact = SITE.email ? (
  <>
    {' '}Contact: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
  </>
) : null;

const takesOrders = checkoutProvider() !== 'demo';

const sections = [
  {
    id: 'who',
    title: 'Who runs this site',
    content: (
      <p>
        {SITE.name} runs this website.{contact}
      </p>
    ),
  },
  {
    id: 'data',
    title: 'What the site processes',
    content: (
      <ul>
        {takesOrders && <li><strong>Order data</strong> (name, email, delivery address, items) — entered at checkout to take payment and fulfil your order.</li>}
        {FEATURES.customKit && <li><strong>Design Studio files</strong> (colours, text, optional logo) — saved designs are kept for up to 180 days.</li>}
        {isAnalyticsEnabled() && <li><strong>Analytics</strong> (pages viewed, performance metrics, a random identifier stored in your browser) — only if you opt in.</li>}
        <li><strong>Technical request data</strong> (such as your IP address and browser details) is processed by our hosting and infrastructure providers to serve the site and protect it from abuse.</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar storage',
    content: (
      <>
        {HAS_OPTIONAL_CONSENT ? (
          <p>
            Nothing optional is switched on until you choose. You can change your mind at any time:{' '}
            <button type="button" onClick={openConsentPanel} style={{ all: 'unset', color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer' }}>
              open cookie settings
            </button>
            .
          </p>
        ) : (
          <p>This site currently uses only the strictly necessary storage listed below, so there are no optional cookies to switch on.</p>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <caption className="visually-hidden">Cookies and local storage used by this site</caption>
            <thead>
              <tr>{['Name', 'Type', 'Purpose', 'Duration', 'Category'].map((h) => <th key={h} scope="col" style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--color-line-strong)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {COOKIES.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (i === 0 ? <th key={i} scope="row" style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--color-line)' }}><code>{cell}</code></th> : <td key={i} style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-line)' }}>{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isPaymentsEnabled() && <p>When you pay, Stripe sets its own cookies on stripe.com under its privacy policy.</p>}
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Services that handle data',
    content: (
      <ul>
        {isPaymentsEnabled() && <li><strong>Stripe</strong> — payment processing; card details are entered on Stripe’s hosted page and never reach this site.</li>}
        {isShopifyConfigured() && <li><strong>Shopify</strong> — product, cart and order management.</li>}
        <li><strong>Hosting and infrastructure providers</strong> — serve this site and, where configured, store short-lived data such as rate-limit counters (which include your IP address){FEATURES.customKit ? ' and saved designs' : ''}.</li>
        {isAnalyticsEnabled() && <li><strong>Analytics provider</strong> — only if you consent; events are sent from our server, not your browser.</li>}
      </ul>
    ),
  },
];

export default function Privacy() {
  return <LegalPage title="Privacy & cookie policy" path="/privacy" description={`How ${SITE.name} handles personal data and cookies.`} updated="October 2026" intro={HAS_OPTIONAL_CONSENT ? 'Optional cookies are only used if you say yes.' : undefined} sections={sections} />;
}
