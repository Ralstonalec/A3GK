import stats from '@/data/stats.json';
import Section from '@/components/layout/Section';
import AnimatedCounter from '@/components/animation/AnimatedCounter';
import FadeInSection from '@/components/animation/FadeInSection';
import StaggeredList from '@/components/animation/StaggeredList';
import styles from '@/styles/sections.module.css';

const HEADING = 'By the numbers';

export const schema = { name: 'Statistics', settings: ['eyebrow', 'heading'] };

/**
 * Company figures. Renders ONLY when data/stats.json has real counters — nothing
 * is invented or estimated, and a stat is never shown without being supplied.
 * `asOf` (when set) is printed under the figures so the claim stays time-bound.
 */
export default function StatsSection() {
  if (!stats.counters?.length) return null;

  return (
    <Section id="stats" type="stats-counter" settings={{ eyebrow: 'A3GK', heading: HEADING }} labelledBy="stats-heading" className={styles.stats}>
      <div className="page-width">
        <FadeInSection className="section__header">
          <p className="eyebrow">A3GK</p>
          <h2 id="stats-heading">{HEADING}</h2>
        </FadeInSection>

        <StaggeredList as="ul" itemAs="li" className={styles.counters} role="list">
          {stats.counters.map((c) => (
            <div key={c.id} className={styles.counter}>
              <AnimatedCounter value={c.value} suffix={c.suffix} decimals={c.decimals || 0} compact={c.compact} className={styles.counterValue} />
              <span className={styles.counterLabel}>{c.label}</span>
            </div>
          ))}
        </StaggeredList>
        {stats.asOf && <p className="muted">As of {stats.asOf}.</p>}
      </div>
    </Section>
  );
}
