import LegalPage from '@/components/layout/LegalPage';
import { SITE } from '@/lib/config';

/**
 * Buying terms (shipping, returns, refunds, warranty…) have NOT been decided,
 * so this page deliberately contains no commitments — only the structure to
 * fill in. Replace each placeholder with your real terms before taking orders.
 */
const pending = <p>This section has not been published yet.</p>;

const sections = [
  { id: 'orders', title: 'Orders and pricing', content: pending },
  { id: 'custom', title: 'Custom-designed products', content: pending },
  { id: 'shipping', title: 'Shipping and delivery', content: pending },
  { id: 'returns', title: 'Returns and refunds', content: pending },
  { id: 'payment', title: 'Payment', content: pending },
  { id: 'liability', title: 'Liability', content: pending },
  { id: 'law', title: 'Governing law', content: <p>Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p> },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      path="/terms"
      updated="Not yet published"
      description="Terms for buying from A3GK."
      intro="Our purchase terms are being finalised and will be published here before orders open."
      sections={sections}
    />
  );
}
