import faqs from '@/data/FAQs.json';
import Section from '@/components/layout/Section';
import Accordion from '@/components/ui/Accordion';
import FadeInSection from '@/components/animation/FadeInSection';
import { SITE } from '@/lib/config';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'FAQ', settings: ['eyebrow', 'heading'] };

/** null while there are no FAQs — structured data must mirror content that is actually on the page. */
export const faqJsonLd = faqs.items.length
  ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }
  : null;

/** Renders only when data/FAQs.json has real answers. */
export default function FaqSection() {
  if (!faqs.items.length) return null;

  return (
    <Section id="faq" type="faq" settings={{ eyebrow: 'Support', heading: 'Questions' }} labelledBy="faq-heading">
      <div className={`page-width ${styles.faqGrid}`}>
        <FadeInSection className="stack">
          <p className="eyebrow">Support</p>
          <h2 id="faq-heading">Questions</h2>
          {SITE.email && <p className="lead">Can’t find what you need? Email {SITE.email}.</p>}
        </FadeInSection>
        <FadeInSection delay={0.1}>
          <Accordion items={faqs.items.map((f, i) => ({ id: `faq-${i}`, title: f.q, content: <p>{f.a}</p> }))} />
        </FadeInSection>
      </div>
    </Section>
  );
}
