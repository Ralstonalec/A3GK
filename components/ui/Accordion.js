import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconPlus } from './Icons';
import styles from '@/styles/components.module.css';

/**
 * Disclosure accordion (WAI-ARIA accordion pattern). Single-open by default.
 * @param {{ items: { id?: string, title: string, content: React.ReactNode }[], multiple?: boolean, defaultOpen?: number[] }} props
 */
export default function Accordion({ items, multiple = false, defaultOpen = [] }) {
  const baseId = useId();
  const [open, setOpen] = useState(new Set(defaultOpen));

  const toggle = (index) =>
    setOpen((current) => {
      const next = new Set(multiple ? current : []);
      if (current.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className={styles.accordion}>
      {items.map((item, index) => {
        const isOpen = open.has(index);
        const buttonId = `${baseId}-b${index}`;
        const panelId = `${baseId}-p${index}`;
        return (
          <div key={item.id || index} className={cn(styles.accordionItem, isOpen && styles.accordionOpen)}>
            <h3 className={styles.accordionHeading}>
              <button
                id={buttonId}
                type="button"
                className={styles.accordionButton}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span>{item.title}</span>
                <IconPlus className={styles.accordionIcon} size={22} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.accordionPanel}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className={styles.accordionContent}>{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
