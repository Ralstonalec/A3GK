import faqs from '@/data/FAQs.json';
import Section from '@/components/layout/Section';
import Accordion from '@/components/ui/Accordion';
import FadeInSection from '@/components/animation/FadeInSection';
import SampleNote from '@/components/ui/SampleNote';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'FAQ', settings: ['eyebrow', 'heading'] };

export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function FaqSection() {
  return (
    <Section id="faq" type="faq" settings={{ eyebrow: 'Support', heading: 'Answers, fast' }} labelledBy="faq-heading">
      <div className={`page-width ${styles.faqGrid}`}>
        <FadeInSection className="stack">
          <p className="eyebrow">Support</p>
          <h2 id="faq-heading">Answers, fast</h2>
          <p className="lead">Sizing, shipping, custom orders and care. Still stuck? Email us and a real keeper will reply.</p>
          <SampleNote isSample={faqs.isSample}>Placeholder policy copy — match to your real policies</SampleNote>
        </FadeInSection>
        <FadeInSection delay={0.1}>
          <Accordion items={faqs.items.map((f, i) => ({ id: `faq-${i}`, title: f.q, content: <p>{f.a}</p> }))} />
        </FadeInSection>
      </div>
    </Section>
  );
}
