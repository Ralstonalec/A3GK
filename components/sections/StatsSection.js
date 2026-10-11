import stats from '@/data/stats.json';
import Section from '@/components/layout/Section';
import AnimatedCounter from '@/components/animation/AnimatedCounter';
import CircularProgress from '@/components/animation/CircularProgress';
import FadeInSection from '@/components/animation/FadeInSection';
import StaggeredList from '@/components/animation/StaggeredList';
import SampleNote from '@/components/ui/SampleNote';
import styles from '@/styles/sections.module.css';

export const schema = { name: 'Statistics', settings: ['eyebrow', 'heading'] };

export default function StatsSection() {
  return (
    <Section id="stats" type="stats-counter" settings={{ eyebrow: 'Global protection', heading: 'Trusted by keepers everywhere' }} labelledBy="stats-heading" className={styles.stats}>
      <div className="page-width">
        <FadeInSection className="section__header">
          <p className="eyebrow">Global protection</p>
          <h2 id="stats-heading">Trusted by keepers everywhere</h2>
          <SampleNote isSample={stats.isSample}>Sample figures — replace with verified numbers before launch</SampleNote>
        </FadeInSection>

        <StaggeredList as="ul" itemAs="li" className={styles.counters} role="list">
          {stats.counters.map((c) => (
            <div key={c.id} className={styles.counter}>
              <AnimatedCounter value={c.value} suffix={c.suffix} decimals={c.decimals || 0} compact={c.compact} className={styles.counterValue} />
              <span className={styles.counterLabel}>{c.label}</span>
            </div>
          ))}
        </StaggeredList>

        <h3 className={styles.certHeading}>Tested &amp; certified</h3>
        <ul role="list" className={styles.rings}>
          {stats.certifications.map((c) => (
            <li key={c.id}>
              <CircularProgress value={c.value} label={c.label} detail={c.detail} />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
