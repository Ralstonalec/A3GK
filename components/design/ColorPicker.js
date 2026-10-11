import { useId, useState } from 'react';
import { PALETTE } from '@/lib/customizer-options';
import { contrastRatio, isValidHex, normalizeHex } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { IconCheck } from '@/components/ui/Icons';
import styles from '@/styles/studio.module.css';

/**
 * Colour picker: preset swatches (radio group) + native picker + hex field with
 * validation. Always shows the hex code; optionally the WCAG contrast ratio
 * against another colour (useful for lettering).
 */
export default function ColorPicker({ label, value, onChange, palette = PALETTE, contrastWith, hint }) {
  const id = useId();
  const [text, setText] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const [lastValue, setLastValue] = useState(value);

  // Re-sync the text box when the colour changes from outside (swatch, native picker, loaded design).
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
    setInvalid(false);
  }

  const commit = (raw) => {
    const normalized = normalizeHex(raw, null);
    if (normalized) {
      setInvalid(false);
      onChange(normalized);
    } else {
      setInvalid(true);
    }
  };

  const ratio = contrastWith && isValidHex(value) ? contrastRatio(value, contrastWith) : null;

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.pickerLegend}>
        {label}
        <span className={cn(styles.hexBadge, 'tabular')}>{value.toUpperCase()}</span>
      </legend>

      <div role="radiogroup" aria-label={`${label} presets`} className={styles.swatches}>
        {palette.map((color) => {
          const selected = color.hex === value.toLowerCase();
          return (
            <label key={color.hex} className={cn(styles.swatch, selected && styles.swatchSelected)} title={color.name}>
              <input type="radio" name={`${id}-preset`} value={color.hex} checked={selected} onChange={() => onChange(color.hex)} className="visually-hidden" />
              <span className={styles.swatchChip} style={{ background: color.hex }} aria-hidden="true">
                {selected && <IconCheck size={16} strokeWidth={3} />}
              </span>
              <span className="visually-hidden">{color.name} {color.hex}</span>
            </label>
          );
        })}
      </div>

      <div className={styles.pickerCustom}>
        <input type="color" aria-label={`${label} custom colour picker`} value={isValidHex(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value.toLowerCase())} className={styles.nativeColor} />
        <div className={styles.hexField}>
          <label htmlFor={`${id}-hex`} className="visually-hidden">{label} hex code</label>
          <span aria-hidden="true">#</span>
          <input
            id={`${id}-hex`}
            type="text"
            inputMode="text"
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            value={text.replace(/^#/, '').toUpperCase()}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${id}-err` : undefined}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
              setText(`#${v}`);
              if (v.length === 6) commit(v);
              else setInvalid(false);
            }}
            onBlur={() => (text.length > 1 && text.replace('#', '').length !== 6 ? setInvalid(true) : null)}
          />
        </div>
        {ratio && (
          <span className={styles.contrast} title="WCAG contrast ratio against the jersey colour">
            {ratio.toFixed(1)}:1 {ratio >= 4.5 ? '✓ readable' : ratio >= 3 ? '· fair' : '· low contrast'}
          </span>
        )}
      </div>
      {invalid && <p id={`${id}-err`} className={styles.fieldError} role="alert">Enter a 6-digit hex code, e.g. D4FF3A</p>}
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </fieldset>
  );
}
