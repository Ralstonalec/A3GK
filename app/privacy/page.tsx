import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { Fact } from '@/components/Tbc';
import { BUSINESS } from '@/lib/content';

export const metadata: Metadata = { title: 'Privacy policy' };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={<p>This explains what personal information A3 Goalkeeping (&ldquo;A3GK&rdquo;, &ldquo;we&rdquo;) collects through this website, why, who helps us handle it, and the choices you have. We aim to collect only what we need.</p>}
    >
      <LegalSection title="Who we are">
        <p>Operated by <Fact value={BUSINESS.legalName} label="Legal business name" />, <Fact value={BUSINESS.mailingAddress} label="Mailing address" />. Privacy questions and requests: <Fact value={BUSINESS.privacyContactEmail} label="Privacy contact email" />.</p>
      </LegalSection>

      <LegalSection title="What we collect and why">
        <ul>
          <li><strong>Orders.</strong> When you check out, your payment, delivery address and contact details are handled by our checkout provider. We keep a record of the order number, items, total and the email on the order so you can see your orders in your account.</li>
          <li><strong>Account.</strong> If you create an account: your email, your password (stored by our login provider in protected form, not readable by us), and your name and phone number if you add them.</li>
          <li><strong>Saved sizes and items (optional).</strong> If you use these features: height, weight, body measurements, preferred sizes, notes, and the products you save. Only you can see them while signed in.</li>
          <li><strong>Messages.</strong> If you use the contact form: your name, email, optional order number and your message, so we can reply.</li>
          <li><strong>Email list.</strong> If you join the A3 Goalkeepers Club or tick the box at sign-up: your email address and when you agreed, so we can tell you about new products.</li>
          <li><strong>Technical data.</strong> Our hosting provider and servers process standard request data such as IP address and browser type to deliver the site and protect it from abuse.</li>
        </ul>
        <p>We use this information to take and deliver orders, run accounts, answer you, send emails you asked for, prevent fraud and abuse, and meet legal obligations.</p>
      </LegalSection>

      <LegalSection title="Cookies and similar storage">
        <p>The site uses only what it needs to work: a sign-in session cookie if you have an account, and your cart is remembered in your browser&rsquo;s local storage. We do not currently use advertising or analytics cookies. If that changes, we will update this page and ask for your consent where required.</p>
      </LegalSection>

      <LegalSection title="Emails">
        <p>We send marketing email only if you agree (by joining the club or ticking the box at sign-up). Every marketing email includes our name and mailing address and an unsubscribe link, and you can also change your choice in your account. Order and account emails are separate and not affected by unsubscribing.</p>
      </LegalSection>

      <LegalSection title="Who handles your information">
        <p>We use service providers to run the site. They may process your information only to provide their service to us:</p>
        <ul>
          <li>Website hosting: Vercel.</li>
          <li>Accounts and the database: Supabase, with our database in a Canadian region.</li>
          <li>Checkout and payments: <Fact value={null} label="Checkout and payment provider (Shopify or Stripe)" />. Card details go directly to the payment provider; we never see or store your full card number.</li>
          <li>Order delivery and supplier fulfilment: our suppliers and carriers receive the name, address and contact details needed to deliver your order. <Fact value={null} label="Names of fulfilment partners, if you want to list them" /></li>
          <li>Email sending: <Fact value={null} label="Email provider (none connected yet)" />.</li>
        </ul>
        <p>Some providers may process information outside Canada. We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p><Fact value={null} label="Retention periods (for example: order records for the period required by tax law; accounts until you delete them; messages for a set time)" /></p>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <ul>
          <li>Ask to see the personal information we hold about you, or to correct it.</li>
          <li>Withdraw your consent to marketing email at any time, using the unsubscribe link or your account.</li>
          <li>Ask us to delete your account and the information tied to it, subject to records we must keep by law.</li>
          <li>Complain to us, and if you are not satisfied, to the Office of the Privacy Commissioner of Canada or your provincial privacy regulator.</li>
        </ul>
        <p>To make a request, contact <Fact value={BUSINESS.privacyContactEmail} label="Privacy contact email" /> or use the <Link href="/help#contact">contact form</Link>.</p>
      </LegalSection>

      <LegalSection title="Security">
        <p>The site is served over HTTPS, and our accounts and database use access rules so members can only see their own information. No system is perfectly secure; if a breach puts your information at real risk of harm, we will notify you and the regulator as the law requires.</p>
      </LegalSection>

      <LegalSection title="Children">
        <p><Fact value={null} label="Age policy (the site is not directed at young children; state the minimum age you accept for accounts and purchases)" /></p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>If we change this policy, we will update the date at the top. For material changes affecting how we use your information, we will tell you.</p>
      </LegalSection>
    </LegalPage>
  );
}
