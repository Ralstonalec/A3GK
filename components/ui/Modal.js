import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useScrollLock } from '@/lib/hooks';
import { IconClose } from './Icons';
import styles from '@/styles/components.module.css';

const CLOSE_MS = 220;

/**
 * Accessible modal / drawer built on the native <dialog> element.
 *
 * The platform supplies the hard parts: focus is moved into the dialog and
 * trapped, the rest of the page becomes inert, Esc closes, and focus returns
 * to the opener.  We add: backdrop-click to dismiss, scroll lock, enter/exit
 * animation and a labelled title.
 *
 * @param {{ open: boolean, onClose: () => void, title: string, description?: string,
 *           variant?: 'modal'|'drawer'|'drawer-left', size?: 'sm'|'md'|'lg'|'xl',
 *           hideTitle?: boolean, children: React.ReactNode }} props
 */
export default function Modal({ open, onClose, title, description, variant = 'modal', size = 'md', hideTitle = false, children, className }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useScrollLock(mounted);

  // Mount the content as soon as it is asked to open (adjusting state during render, not in an effect).
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && mounted) {
      if (!dialog.open) dialog.showModal();
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    if (!open && dialog.open) {
      setVisible(false);
      const timer = setTimeout(() => {
        dialog.close();
        setMounted(false);
      }, CLOSE_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, mounted]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(styles.dialog, styles[`dialog_${variant}`], styles[`dialogSize_${size}`], className)}
      data-visible={visible}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(event) => {
        event.preventDefault(); // we animate out, then close() ourselves
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {mounted && (
        <div className={styles.dialogInner}>
          <header className={styles.dialogHeader}>
            <h2 id={titleId} className={cn(styles.dialogTitle, hideTitle && 'visually-hidden')}>{title}</h2>
            <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close dialog">
              <IconClose />
            </button>
          </header>
          {description && <p id={descId} className={cn('muted', styles.dialogDesc)}>{description}</p>}
          <div className={styles.dialogBody}>{children}</div>
        </div>
      )}
    </dialog>
  );
}
