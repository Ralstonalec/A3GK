import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import styles from '@/styles/components.module.css';

/** Simple annotated figure so measurements are not just numbers in a table. */
function Figure({ kind }) {
  if (kind === 'socks') return null;
  if (kind === 'gloves') {
    return (
      <svg viewBox="0 0 200 220" className={styles.sizeFigure} role="img" aria-label="Hand with circumference and length measurement lines">
        <path d="M70 200V120L52 92a9 9 0 0114-12l16 20V40a9 9 0 0118 0v48V28a9 9 0 0118 0v60V36a9 9 0 0118 0v56V56a9 9 0 0118 0v70c0 40-10 74-30 74z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M66 126h82" stroke="var(--color-accent)" strokeWidth="3" strokeDasharray="6 5" />
        <text x="107" y="118" textAnchor="middle" fontSize="11" fill="var(--color-accent)" fontWeight="700">circumference</text>
        <path d="M168 32v168" stroke="var(--color-accent)" strokeWidth="3" strokeDasharray="6 5" />
        <text x="174" y="120" fontSize="11" fill="var(--color-accent)" fontWeight="700" transform="rotate(90 174 120)" textAnchor="middle">length</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 240" className={styles.sizeFigure} role="img" aria-label="Torso with chest and waist measurement lines">
      <path d="M62 30l-40 28 14 60 22-8v100h84V110l22 8 14-60-40-28c-6 16-20 24-38 24s-32-8-38-24z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M44 84h112" stroke="var(--color-accent)" strokeWidth="3" strokeDasharray="6 5" />
      <text x="100" y="76" textAnchor="middle" fontSize="11" fill="var(--color-accent)" fontWeight="700">chest</text>
      <path d="M58 146h84" stroke="var(--color-accent)" strokeWidth="3" strokeDasharray="6 5" />
      <text x="100" y="138" textAnchor="middle" fontSize="11" fill="var(--color-accent)" fontWeight="700">waist</text>
    </svg>
  );
}

/**
 * Size guide: table with the active size highlighted + measurement figure.
 * `guide` comes from getSizeGuide() (lib/size-guides.js) — the real chart you
 * supplied in data/sizes.json. Without one there is nothing to show.
 */
export default function SizeGuideModal({ open, onClose, guide, kind = 'apparel', activeSize }) {
  const rowSizes = guide ? guide.rows.map((r) => r[0]) : [];
  const [picked, setPicked] = useState(null);
  const highlight = picked || (rowSizes.includes(activeSize) ? activeSize : null);
  const row = useMemo(() => guide?.rows.find((r) => r[0] === highlight), [guide, highlight]);
  if (!guide) return null;

  return (
    <Modal open={open} onClose={onClose} title={guide.title} description={guide.howToMeasure} size="lg">
      <div className={styles.sizeGuide}>
        <div className={styles.sizeAside}>
          <Figure kind={kind} />
          <Select
            label="Find my size"
            value={highlight || ''}
            placeholder="Choose a size"
            options={rowSizes}
            onChange={(e) => setPicked(e.target.value)}
          />
          {row && (
            <dl className={styles.sizeResult} aria-live="polite">
              {guide.columns.slice(1).map((col, i) => (
                <div key={col}>
                  <dt>{col}</dt>
                  <dd>{row[i + 1]}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className={styles.sizeTableWrap}>
          <table className={styles.sizeTable}>
            <caption className="visually-hidden">{guide.title} in {guide.unit}</caption>
            <thead>
              <tr>
                {guide.columns.map((c) => (
                  <th key={c} scope="col">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((r) => (
                <tr key={r[0]} className={cn(r[0] === highlight && styles.sizeRowActive)} aria-current={r[0] === highlight ? 'true' : undefined}>
                  {r.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.sizeTip}>{guide.tip}</p>
        </div>
      </div>
    </Modal>
  );
}
