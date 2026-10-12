import LegalPage from '@/components/layout/LegalPage';
import { SITE } from '@/lib/config';

/**
 * Buying terms (shipping, returns, refunds, warranty…) have NOT been decided, so
 * this page deliberately makes no commitments. Replace the single section below
 * with the real terms before taking orders.
 */
const sections = [
  {
    id: 'status',
    title: 'Purchase terms',
    content: (
      <p>
        Terms covering orders, pricing, shipping, returns and payment have not been published yet.
        {SITE.email && (
          <>
            {' '}Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </>
        )}
      </p>
    ),
  },
];

export default function Terms() {
  return <LegalPage title="Terms & Conditions" path="/terms" description={`${SITE.name} purchase terms.`} sections={sections} />;
}
