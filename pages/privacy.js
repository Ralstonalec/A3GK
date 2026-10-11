import LegalPage from '@/components/layout/LegalPage';
import { openConsentPanel } from '@/lib/consent';
import { SITE } from '@/lib/config';

const COOKIES = [
  ['a3gk_consent', 'Cookie', 'Stores your consent choices and when you made them.', '6 months', 'Strictly necessary'],
  ['a3gk_cart', 'Cookie (HttpOnly)', 'Identifies your Shopify cart. Only set when the store is connected to Shopify.', '30 days', 'Strictly necessary'],
  ['a3gk.cart.v1', 'Local storage', 'Remembers the items in your cart on this device.', 'Until cleared', 'Strictly necessary'],
  ['a3gk.studio.v1', 'Local storage', 'Remembers your last Design Studio configuration (never your logo file).', 'Until cleared', 'Preferences — only with your consent'],
  ['a3gk_cid', 'Local storage', 'Random anonymous identifier used to group analytics events.', 'Until cleared', 'Analytics — only with your consent'],
];

const sections = [
  {
    id: 'who',
    title: 'Who we are',
    content: (
      <p>
        {SITE.legalName} (“we”, “us”) runs this store. For privacy questions, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Replace this paragraph with your registered company name, address and, if required, your Data Protection Officer or EU/UK representative.
      </p>
    ),
  },
  {
    id: 'data',
    title: 'What we collect and why',
    content: (
      <ul>
        <li><strong>Order data</strong> (name, email, delivery address, items) — to take payment, ship your order and meet tax and accounting duties. Legal basis: contract and legal obligation.</li>
        <li><strong>Design Studio files</strong> (colours, text, optional logo) — to produce your custom kit. Saved designs are kept for 180 days. Legal basis: contract.</li>
        <li><strong>Anonymous analytics</strong> (pages viewed, performance metrics) — only if you opt in. Legal basis: consent.</li>
        <li><strong>Technical logs</strong> (IP address, user agent) kept briefly by our hosting provider for security and abuse prevention. Legal basis: legitimate interests.</li>
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
          .
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
        <p>When you pay, Stripe sets its own cookies on stripe.com under its privacy policy.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share data with',
    content: (
      <ul>
        <li><strong>Stripe</strong> — payment processing (we never see or store your card number).</li>
        <li><strong>Shopify</strong> — product, cart and order management, when connected.</li>
        <li><strong>Vercel</strong> and <strong>Upstash</strong> — hosting and caching infrastructure.</li>
        <li><strong>Google Analytics</strong> — only if analytics is enabled and you consented; events are sent from our server, not your browser.</li>
      </ul>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    content: (
      <>
        <p>Under GDPR / UK GDPR you can request access, correction, deletion, restriction, portability, and object to processing, and withdraw consent at any time. You may complain to your local data-protection authority.</p>
        <p>Under CCPA/CPRA, California residents may request to know and delete personal information and opt out of its sale or sharing. <strong>We do not sell personal information</strong>, and we honour Global Privacy Control signals. Email {SITE.email} to exercise any right; we respond within the legal deadline.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep data',
    content: <p>Order records: as required by tax law (typically 6–7 years). Saved designs: 180 days. Consent record: 6 months. Analytics identifier: until you clear browser storage or withdraw consent.</p>,
  },
  {
    id: 'transfers',
    title: 'International transfers',
    content: <p>Our providers may process data outside your country. Where required we rely on adequacy decisions, the EU–US Data Privacy Framework or Standard Contractual Clauses.</p>,
  },
  {
    id: 'children',
    title: 'Children',
    content: <p>The store is intended for adults. Junior products are sold to parents and guardians; we do not knowingly collect data from children under 16.</p>,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy & cookie policy"
      path="/privacy"
      updated="October 2026"
      description="How A3GK collects, uses and protects personal data, including cookies, analytics and your GDPR/CCPA rights."
      intro="We collect as little as we can and only use optional cookies if you say yes."
      sections={sections}
    />
  );
}
