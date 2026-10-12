import { useState } from 'react';
import { CATEGORIES, isDemoCatalogue, PRICE_RANGES, SORT_OPTIONS } from '@/lib/config';
import { cn } from '@/lib/utils';
import Input, { Checkbox } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import styles from '@/styles/pages.module.css';

/** Filter + sort controls. All state lives in the URL (see pages/products/index.js). */
export default function ProductFilters({ filters, onChange, onReset, resultCount }) {
  const [open, setOpen] = useState(false);
  const activeCount = [filters.category !== 'all', filters.price !== 'any', filters.tags.length > 0, filters.available, Boolean(filters.q)].filter(Boolean).length;

  return (
    <form className={styles.filters} role="search" aria-label="Filter products" onSubmit={(e) => e.preventDefault()}>
      {/* Below 990px the controls sit behind this button (CSS decides), so products come first on a phone. */}
      <button type="button" className={styles.filterToggle} aria-expanded={open} aria-controls="filter-panel" onClick={() => setOpen((o) => !o)}>
        <span>Filter &amp; sort{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div id="filter-panel" className={cn(styles.filterPanel, open && styles.filterPanelOpen)}>
      <Input label="Search" type="search" value={filters.q} placeholder="Jersey, base layer, tape…" onChange={(e) => onChange({ q: e.target.value })} />

      <fieldset className={styles.filterGroup}>
        <legend>Category</legend>
        <div className={styles.chips} role="radiogroup" aria-label="Category">
          {CATEGORIES.map((c) => (
            <label key={c.id} className={cn(styles.chip, filters.category === c.id && styles.chipOn)}>
              <input type="radio" name="category" value={c.id} checked={filters.category === c.id} onChange={() => onChange({ category: c.id })} className="visually-hidden" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Select label="Price" value={filters.price} options={PRICE_RANGES.map((p) => ({ value: p.id, label: p.label }))} onChange={(e) => onChange({ price: e.target.value })} />

      {/* Meaningful only with real inventory data: the placeholder catalogue has none. */}
      {!isDemoCatalogue() && (
        <Checkbox checked={filters.available} onChange={(e) => onChange({ available: e.target.checked })}>
          In stock only
        </Checkbox>
      )}

      <Select label="Sort by" value={filters.sort} options={SORT_OPTIONS} onChange={(e) => onChange({ sort: e.target.value })} />

      <div className={styles.filterFooter}>
        <p role="status" aria-live="polite" className="muted">
          {resultCount} {resultCount === 1 ? 'product' : 'products'}
        </p>
        {activeCount > 0 && (
          <button type="button" className={styles.linkButtonInline} onClick={onReset}>
            Clear filters ({activeCount})
          </button>
        )}
      </div>

      </div>
    </form>
  );
}
