import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { Field } from './Input';
import { IconChevron } from './Icons';
import styles from '@/styles/components.module.css';

/**
 * Select — a natively-rendered <select> with custom chrome.
 * Using the platform control keeps keyboard, screen-reader and mobile-picker
 * behaviour correct for free (a hand-rolled listbox is a WCAG liability).
 */
const Select = forwardRef(function Select({ label, hint, error, id, options = [], placeholder, className, labelHidden, required, ...rest }, ref) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={required} className={className} labelHidden={labelHidden}>
      {({ describedBy }) => (
        <div className={styles.selectWrap}>
          <select
            ref={ref}
            id={selectId}
            className={cn(styles.select, error && styles.inputInvalid)}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            required={required}
            {...rest}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((o) => {
              const opt = typeof o === 'string' ? { value: o, label: o } : o;
              return (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              );
            })}
          </select>
          <IconChevron size={18} className={styles.selectIcon} />
        </div>
      )}
    </Field>
  );
});

export default Select;
