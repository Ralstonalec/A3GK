import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/components.module.css';

/** Wraps a control with label, hint and error wiring (aria-describedby / aria-invalid). */
export function Field({ id, label, hint, error, required, children, className, labelHidden }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={cn(styles.label, labelHidden && 'visually-hidden')}>
        {label}
        {required && <span className={styles.required} aria-hidden="true"> *</span>}
      </label>
      {children({ describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined })}
      {hint && !error && <p id={hintId} className={styles.hint}>{hint}</p>}
      {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}
    </div>
  );
}

/** Text, email, number, password… inputs. */
const Input = forwardRef(function Input({ label, hint, error, id, className, labelHidden, required, ...rest }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required} className={className} labelHidden={labelHidden}>
      {({ describedBy }) => (
        <input
          ref={ref}
          id={inputId}
          className={cn(styles.input, error && styles.inputInvalid)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          {...rest}
        />
      )}
    </Field>
  );
});

export default Input;

export const Checkbox = forwardRef(function Checkbox({ label, error, id, children, className, ...rest }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={cn(styles.checkboxWrap, className)}>
      <label htmlFor={inputId} className={styles.checkbox}>
        <input ref={ref} id={inputId} type="checkbox" aria-invalid={error ? true : undefined} aria-describedby={error ? `${inputId}-error` : undefined} {...rest} />
        <span className={styles.checkboxBox} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className={styles.checkboxLabel}>{children || label}</span>
      </label>
      {error && <p id={`${inputId}-error`} className={styles.error} role="alert">{error}</p>}
    </div>
  );
});

/** Accessible switch (role="switch"). */
export function Switch({ checked, onChange, label, description, disabled, id }) {
  const autoId = useId();
  const switchId = id || autoId;
  return (
    <div className={styles.switchRow}>
      <div>
        <label htmlFor={switchId} className={styles.switchLabel}>{label}</label>
        {description && <p className={styles.hint} id={`${switchId}-desc`}>{description}</p>}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${switchId}-desc` : undefined}
        disabled={disabled}
        className={styles.switch}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.switchThumb} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Styled range slider with a visible value. */
export function Slider({ label, value, min, max, step = 1, onChange, format = (v) => v, id }) {
  const autoId = useId();
  const sliderId = id || autoId;
  return (
    <div className={styles.field}>
      <div className={styles.sliderHead}>
        <label htmlFor={sliderId} className={styles.label}>{label}</label>
        <output htmlFor={sliderId} className={cn(styles.sliderValue, 'tabular')}>{format(value)}</output>
      </div>
      <input
        id={sliderId}
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
