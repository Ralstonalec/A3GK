import LegalPage from '@/components/layout/LegalPage';
import { SITE } from '@/lib/config';

const sections = [
  { id: 'commitment', title: 'Our commitment', content: <p>We aim for WCAG 2.1 Level AA across the store: keyboard operation, visible focus, sufficient contrast, text alternatives, labelled forms, reduced-motion support and responsive layouts that zoom to 400%.</p> },
  { id: 'measures', title: 'What we do', content: <ul><li>Semantic landmarks, a skip link and focus management on navigation.</li><li>Accessible dialogs built on the native dialog element.</li><li>Automated checks (axe-core, pa11y) on every release, plus manual keyboard and screen-reader spot checks.</li><li>Animations and the 3D hero respect your “reduce motion” setting; autoplay media can be paused.</li></ul> },
  { id: 'limits', title: 'Known limitations', content: <ul><li>The Design Studio preview is a visual canvas. A text description of your design is announced, and every control works from the keyboard, but colour matching is inherently visual.</li><li>The interactive 3D viewer can be operated with arrow keys and buttons; photographs are always available as an alternative.</li></ul> },
  { id: 'feedback', title: 'Feedback', content: <p>Found a barrier? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we will get back to you.</p> },
];

export default function Accessibility() {
  return <LegalPage title="Accessibility statement" path="/accessibility" updated="October 2026" description="A3GK accessibility commitment, measures and known limitations." sections={sections} />;
}
