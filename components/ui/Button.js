import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/components.module.css';

/**
 * Button — primary / secondary / ghost, sm / md / lg.
 * Renders a Next <Link> when `href` is given, otherwise a <button>.
 * `loading` sets aria-busy and blocks activation without removing focusability.
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', href, loading = false, iconAfter, iconBefore, fullWidth = false, className, children, disabled, onClick, type = 'button', ...rest },
  ref,
) {
  const classes = cn(styles.button, styles[`button_${variant}`], styles[`button_${size}`], fullWidth && styles.buttonFull, loading && styles.buttonLoading, className);

  const content = (
    <>
      {iconBefore && <span className={styles.buttonIcon}>{iconBefore}</span>}
      <span className={styles.buttonLabel}>{children}</span>
      {iconAfter && <span className={cn(styles.buttonIcon, styles.buttonIconAfter)}>{iconAfter}</span>}
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link ref={ref} href={href} className={classes} onClick={onClick} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
