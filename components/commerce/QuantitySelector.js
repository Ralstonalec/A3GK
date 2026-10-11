import { useId } from 'react';
import { cn } from '@/lib/utils';
import { IconMinus, IconPlus } from '@/components/ui/Icons';
import styles from '@/styles/components.module.css';

/**
 * Quantity stepper. `label` names the item for assistive tech
 * ("Decrease quantity of Apex Pro Glove").
 */
export default function QuantitySelector({ value, onChange, min = 1, max = 20, label = 'item', disabled = false, size = 'md', className }) {
  const id = useId();
  const clamp = (n) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div role="group" aria-label={`Quantity of ${label}`} className={cn(styles.qty, styles[`qty_${size}`], className)}>
      <button type="button" className={styles.qtyButton} onClick={() => onChange(clamp(value - 1))} disabled={disabled || atMin} aria-label={`Decrease quantity of ${label}`}>
        <IconMinus size={16} />
      </button>
      <input
        id={id}
        className={cn(styles.qtyInput, 'tabular')}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        disabled={disabled}
        aria-label={`Quantity of ${label}`}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          if (digits === '') return;
          onChange(clamp(Number.parseInt(digits, 10)));
        }}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" className={styles.qtyButton} onClick={() => onChange(clamp(value + 1))} disabled={disabled || atMax} aria-label={`Increase quantity of ${label}`}>
        <IconPlus size={16} />
      </button>
    </div>
  );
}
