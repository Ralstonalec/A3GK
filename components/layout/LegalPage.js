import Seo from './Seo';
import SampleNote from '@/components/ui/SampleNote';
import styles from '@/styles/pages.module.css';

/**
 * Shared shell for Terms / Privacy / Accessibility. `sections` is
 * [{ id, title, content: ReactNode }]. A table of contents is generated.
 */
export default function LegalPage({ title, path, updated, intro, sections, description }) {
  return (
    <>
      <Seo title={title} path={path} description={description} />
      <div className={`page-width ${styles.legal}`}>
        <header className={styles.pageHeader}>
          <p className="eyebrow">Legal</p>
          <h1>{title}</h1>
          <p className="muted">Last updated: {updated}</p>
          <SampleNote isSample>Template text — have it reviewed by a qualified lawyer before launch</SampleNote>
          {intro && <p className="lead">{intro}</p>}
        </header>
        <div className={styles.legalLayout}>
          <nav aria-label="On this page" className={styles.toc}>
            <h2 className={styles.tocTitle}>On this page</h2>
            <ol role="list">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.legalBody}>
            {sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
                <h2 id={`${s.id}-h`} className="h3">{s.title}</h2>
                <div className="rte">{s.content}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
