import { useCallback, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/components.module.css';

/** Variant state for a product: selected options → resolved variant + per-value availability. */
export function useVariantSelection(product) {
  const initial = useMemo(() => {
    const firstAvailable = product.variants.find((v) => v.availableForSale) || product.variants[0];
    return Object.fromEntries(firstAvailable.selectedOptions.map((o) => [o.name, o.value]));
  }, [product]);

  const [selected, setSelected] = useState(initial);

  const variant = useMemo(
    () => product.variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value)) || null,
    [product, selected],
  );

  /** Is there any purchasable variant that has `value` for `optionName` given the OTHER current selections? */
  const isValueAvailable = useCallback(
    (optionName, value) =>
      product.variants.some(
        (v) =>
          v.availableForSale &&
          v.selectedOptions.every((o) => (o.name === optionName ? o.value === value : selected[o.name] === o.value || !(o.name in selected))),
      ),
    [product, selected],
  );

  const setOption = useCallback((name, value) => setSelected((s) => ({ ...s, [name]: value })), []);

  return { selected, variant, setOption, isValueAvailable };
}

/**
 * Radio-group option picker. Unavailable values stay focusable (struck through,
 * announced "sold out") so users learn why they cannot pick them.
 */
export default function VariantSelector({ product, selected, setOption, isValueAvailable, onOpenSizeGuide }) {
  const baseId = useId();
  const options = product.options.filter((o) => !(o.name === 'Title' && o.values.length === 1 && o.values[0] === 'Default Title'));
  if (!options.length) return null;

  return (
    <div className={styles.variantSelector}>
      {options.map((option) => {
        const groupId = `${baseId}-${option.name}`;
        const isSize = option.name.toLowerCase() === 'size';
        return (
          <fieldset key={option.name} className={styles.optionGroup}>
            <legend className={styles.optionLegend} id={groupId}>
              <span>
                {option.name}: <strong>{selected[option.name]}</strong>
              </span>
              {isSize && onOpenSizeGuide && (
                <button type="button" className={styles.linkButton} onClick={onOpenSizeGuide}>
                  Size guide
                </button>
              )}
            </legend>
            <div role="radiogroup" aria-labelledby={groupId} className={styles.optionValues}>
              {option.values.map((value) => {
                const checked = selected[option.name] === value;
                const available = isValueAvailable(option.name, value);
                return (
                  <label key={value} className={cn(styles.optionValue, checked && styles.optionChecked, !available && styles.optionSoldOut)}>
                    <input
                      type="radio"
                      name={groupId}
                      value={value}
                      checked={checked}
                      onChange={() => setOption(option.name, value)}
                      className="visually-hidden"
                    />
                    <span>{value}</span>
                    {!available && <span className="visually-hidden"> (sold out)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
