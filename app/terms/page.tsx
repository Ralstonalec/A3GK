import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { Fact } from '@/components/Tbc';
import { BUSINESS, PRICING, POLICIES, WEAR_NOTE } from '@/lib/content';

export const metadata: Metadata = { title: 'Terms of sale' };

export default function Terms() {
  return (
    <LegalPage
      title="Terms of sale"
      intro={<p>These terms apply when you use this website and buy from A3 Goalkeeping (&ldquo;A3GK&rdquo;, &ldquo;we&rdquo;). By placing an order you agree to them. Please also read our <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.</p>}
    >
      <LegalSection title="Who is selling">
        <p>The seller is <Fact value={BUSINESS.legalName} label="Legal business name" />, <Fact value={BUSINESS.mailingAddress} label="Mailing address" />. Contact: <Fact value={POLICIES.contactEmail} label="Customer-service contact details" />.</p>
      </LegalSection>

      <LegalSection title="Products and prices">
        <ul>
          <li>Prices are in {PRICING.currency}. Each piece is ${PRICING.piece} {PRICING.currency}; a top plus a bottom is ${PRICING.bundle} {PRICING.currency}. Pieces are sold individually and in any combination.</li>
          <li>Taxes and shipping are added at checkout where they apply, before you pay.</li>
          <li>We may correct pricing or product errors. If an order is affected, we will contact you and you can confirm or cancel it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Product information">
        <ul>
          <li>Some images on this site are computer-made renderings based on the real garments. Colours, panel details and fit can look different in person. Close-up photographs are shown where available.</li>
          <li>The padding is on the front of the garment; the back is plain fabric.</li>
          <li>{WEAR_NOTE}</li>
          <li>The padding is not a guarantee against injury. Use the product at your own judgment and follow the care instructions.</li>
          <li>Fabric, sizing and care details: <Fact value={null} label="Confirmed fabric composition, size chart and care instructions" /></li>
        </ul>
      </LegalSection>

      <LegalSection title="Orders and payment">
        <p>An order is accepted when we confirm it by email. Payment is taken by our payment provider at checkout. We may refuse or cancel an order, for example for suspected fraud, stock or pricing errors, and will refund anything you have paid for a cancelled order.</p>
      </LegalSection>

      <LegalSection id="shipping" title="Shipping and delivery">
        <p>Delivery times and costs are shown at checkout and on the <Link href="/help#shipping">Help page</Link>. Estimates are not guarantees. <Fact value={POLICIES.deliveryEstimate} label="Delivery estimates by destination" /></p>
      </LegalSection>

      <LegalSection id="returns" title="Returns and exchanges">
        <p>Our return and exchange rules are on the <Link href="/help#returns">Help page</Link>. <Fact value={POLICIES.returnsWindow} label="Return window and conditions" /> This does not limit rights you have under consumer protection laws that apply to you.</p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>You are responsible for keeping your login private and for activity on your account. Tell us if you think someone else has used it. We may suspend accounts that are misused.</p>
      </LegalSection>

      <LegalSection title="Using the site">
        <p>Do not misuse the site: no attempts to break, overload or scrape it, and no unlawful activity. The A3GK name, images and content belong to us or are used with permission; do not copy them without our written consent.</p>
      </LegalSection>

      <LegalSection title="Liability">
        <p><Fact value={null} label="Limits of liability wording (have a lawyer review this section)" /> Nothing in these terms excludes liability that cannot be excluded by law.</p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>These terms are governed by <Fact value={BUSINESS.governingLaw} label="Governing law (your province and Canada)" />.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>We may update these terms. The version in force when you place an order applies to that order.</p>
      </LegalSection>
    </LegalPage>
  );
}
