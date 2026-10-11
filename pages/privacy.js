import LegalPage from '@/components/layout/LegalPage';
import { openConsentPanel } from '@/lib/consent';
import { isPaymentsEnabled, isShopifyConfigured, SITE } from '@/lib/config';
import { FEATURES } from '@/lib/features';

/**
 * Describes only what this site demonstrably does. Rows and list items that depend
 * on an integration appear only when that integration is configured, and nothing
 * about the company (legal entity, retention periods, sale of data, transfers) is
 * asserted — those are for the company to state and a lawyer to review.
 */
const COOKIES = [
  ['a3gk_consent', 'Cookie', 'Stores your consent choices and when you made them.', '6 months', 'Strictly necessary'],
  ['a3gk.cart.v1', 'Local storage', 'Remembers the items in your cart on this device.', 'Until cleared', 'Strictly necessary'],
  ...(isShopifyConfigured() ? [['a3gk_cart', 'Cookie (HttpOnly)', 'Identifies your Shopify cart.', '30 days', 'Strictly necessary']] : []),
  ...(FEATURES.customKit ? [['a3gk.studio.v1', 'Local storage', 'Remembers your last Design Studio configuration (never your logo file).', 'Until cleared', 'Preferences — only with your consent']] : []),
  ['a3gk_cid', 'Local storage', 'Random anonymous identifier used to group analytics events.', 'Until cleared', 'Analytics — only with your consent'],
];

const contact = SITE.email ? (
  <>
    {' '}Contact: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
  </>
) : null;

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
        {(isPaymentsEnabled() || isShopifyConfigured()) && <li><strong>Order data</strong> (name, email, delivery address, items) — entered at checkout to take payment and fulfil your order.</li>}
        {FEATURES.customKit && <li><strong>Design Studio files</strong> (colours, text, optional logo) — saved designs are kept for 180 days.</li>}
        <li><strong>Anonymous analytics</strong> (pages viewed, performance metrics) — only if you opt in.</li>
        <li><strong>Technical logs</strong> (IP address, user agent) are handled by our hosting provider for security and abuse prevention.</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar storage',
    content: (
      <>
        <p>
          Nothing optional is switched on until you choose. You can change your mind at any time:{' '}
          <button type="button" onClick={openConsentPanel} style={{ all: 'unset', color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer' }}>
            open cookie settings
          </button>
          . The site also honours the Global Privacy Control signal.
        </p>
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
        <li><strong>Vercel</strong> — hosting.</li>
        <li><strong>Google Analytics</strong> — only if analytics is enabled and you consented; events are sent from our server, not your browser.</li>
      </ul>
    ),
  },
];

export default function Privacy() {
  return <LegalPage title="Privacy & cookie policy" path="/privacy" description={`How ${SITE.name} handles personal data and cookies.`} updated="October 2026" intro="Optional cookies are only used if you say yes." sections={sections} />;
}
