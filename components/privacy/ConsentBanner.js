import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clearAnalyticsIdentity } from '@/lib/analytics';
import { acceptAll, CONSENT_CATEGORIES, closeConsentPanel, HAS_OPTIONAL_CONSENT, initConsent, openConsentPanel, rejectAll, saveConsent, useConsent } from '@/lib/consent';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Input';
import styles from '@/styles/components.module.css';

function Preferences({ consent }) {
  const [draft, setDraft] = useState(consent.categories);
  const [seen, setSeen] = useState({ categories: consent.categories, open: consent.panelOpen });

  // Reset the draft whenever the panel is reopened or the saved choice changes.
  if (seen.categories !== consent.categories || seen.open !== consent.panelOpen) {
    setSeen({ categories: consent.categories, open: consent.panelOpen });
    setDraft(consent.categories);
  }

  const save = (categories) => {
    if (!categories.analytics) clearAnalyticsIdentity();
    saveConsent(categories);
  };

  return (
    <Modal open={consent.panelOpen} onClose={closeConsentPanel} title="Privacy preferences" description="Choose which optional cookies and storage we may use. Nothing optional is on until you switch it on." size="md">
      <ul role="list" className={styles.consentList}>
        {CONSENT_CATEGORIES.map((c) => (
          <li key={c.id}>
            <Switch
              label={c.label}
              description={c.description}
              checked={c.required ? true : draft[c.id]}
              disabled={c.required}
              onChange={(v) => setDraft((d) => ({ ...d, [c.id]: v }))}
            />
          </li>
        ))}
      </ul>
      <div className={styles.consentActions}>
        <Button variant="secondary" onClick={() => save(DENY)}>Reject all</Button>
        <Button variant="secondary" onClick={() => save(draft)}>Save choices</Button>
        <Button onClick={acceptAll}>Accept all</Button>
      </div>
      <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)' }}>
        Details in our <Link href="/privacy" onClick={closeConsentPanel}>Privacy &amp; cookie policy</Link>. You can change your mind any time from “Cookie settings” in the footer.
      </p>
    </Modal>
  );
}

const DENY = { necessary: true, preferences: false, analytics: false, marketing: false };

/**
 * Consent banner. Reject is exactly as prominent as Accept, nothing is
 * pre-selected, and the banner never blocks the page (it is not a modal).
 */
export default function ConsentBanner() {
  const consent = useConsent();
  useEffect(() => initConsent(), []);

  // With nothing optional to choose (no analytics destination, no saved design preferences) there is nothing to ask.
  const showBanner = HAS_OPTIONAL_CONSENT && consent.ready && !consent.decided;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.section
            className={styles.consent}
            aria-label="Cookie consent"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.consentCopy}>
              <h2 className={styles.consentTitle}>Your privacy, your call</h2>
              <p>
                We use essential storage to run the store{CONSENT_CATEGORIES.some((c) => c.id === 'analytics') ? ', and — only if you agree — analytics to improve it' : ', and — only if you agree — to remember your design preferences'}.{' '}
                See our <Link href="/privacy">privacy &amp; cookie policy</Link>.
              </p>
            </div>
            <div className={styles.consentButtons}>
              <Button variant="secondary" onClick={rejectAll}>Reject all</Button>
              <Button variant="secondary" onClick={openConsentPanel} aria-haspopup="dialog">
                Customise
              </Button>
              <Button onClick={acceptAll}>Accept all</Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <Preferences consent={consent} />
    </>
  );
}
