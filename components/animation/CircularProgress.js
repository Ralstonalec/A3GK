import { useReducedMotion } from 'framer-motion';
import { useHasMounted, useInView } from '@/lib/hooks';
import { IconCheck } from '@/components/ui/Icons';
import styles from '@/styles/sections.module.css';

const R = 52;
const C = 2 * Math.PI * R;

/** Circular progress ring that fills when scrolled into view; the number is always in the markup. */
export default function CircularProgress({ value, label, detail }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const reduce = useReducedMotion();
  const armed = useHasMounted();
  const filled = !armed || reduce || inView;

  return (
    <figure ref={ref} className={styles.ring}>
      <div className={styles.ringSvgWrap}>
        <svg viewBox="0 0 120 120" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
          <circle cx="60" cy="60" r={R} className={styles.ringTrack} />
          <circle
            cx="60"
            cy="60"
            r={R}
            className={styles.ringValue}
            strokeDasharray={C}
            strokeDashoffset={filled ? C * (1 - value / 100) : C}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span className={styles.ringNumber}>
          {value}
          <small>%</small>
        </span>
        <span className={styles.ringCheck} aria-hidden="true">
          <IconCheck size={14} strokeWidth={3.2} />
        </span>
      </div>
      <figcaption>
        <strong>{label}</strong>
        <span>{detail}</span>
      </figcaption>
    </figure>
  );
}
