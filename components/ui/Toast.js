import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconAlert, IconCheck, IconInfo } from './Icons';
import styles from '@/styles/components.module.css';

const ToastContext = createContext({ push: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS = { success: IconCheck, error: IconAlert, info: IconInfo };

/** Polite live-region toasts (role="status"); errors use role="alert". */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    ({ title, description, tone = 'info', duration = 4500 }) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((list) => [...list.slice(-2), { id, title, description, tone }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toaster} aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone] || IconInfo;
            return (
              <motion.div
                key={toast.id}
                layout
                role={toast.tone === 'error' ? 'alert' : 'status'}
                className={`${styles.toast} ${styles[`toast_${toast.tone}`]}`}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.18 } }}
              >
                <Icon size={20} className={styles.toastIcon} />
                <div>
                  <p className={styles.toastTitle}>{toast.title}</p>
                  {toast.description && <p className={styles.toastDesc}>{toast.description}</p>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
