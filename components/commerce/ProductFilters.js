import { CATEGORIES, PRICE_RANGES, SORT_OPTIONS } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Input';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import styles from '@/styles/pages.module.css';

const TAGS = [
  { id: 'pro', label: 'Pro level' },
  { id: 'padded', label: 'Padded' },
  { id: 'junior', label: 'Junior' },
  { id: 'custom', label: 'Customisable' },
];

/** Filter + sort controls. All state lives in the URL (see pages/products/index.js). */
export default function ProductFilters({ filters, onChange, onReset, resultCount, queryString }) {
  const activeCount = [filters.category !== 'all', filters.price !== 'any', filters.tags.length > 0, filters.available, Boolean(filters.q)].filter(Boolean).length;

  return (
    <form className={styles.filters} role="search" aria-label="Filter products" onSubmit={(e) => e.preventDefault()}>
      <Input label="Search" type="search" value={filters.q} placeholder="Gloves, jersey, padded…" onChange={(e) => onChange({ q: e.target.value })} />

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

      <fieldset className={styles.filterGroup}>
        <legend>Features</legend>
        <div className="stack" style={{ '--stack-gap': 'var(--space-2)' }}>
          {TAGS.map((t) => (
            <Checkbox
              key={t.id}
              checked={filters.tags.includes(t.id)}
              onChange={(e) => onChange({ tags: e.target.checked ? [...filters.tags, t.id] : filters.tags.filter((x) => x !== t.id) })}
            >
              {t.label}
            </Checkbox>
          ))}
          <Checkbox checked={filters.available} onChange={(e) => onChange({ available: e.target.checked })}>
            In stock only
          </Checkbox>
        </div>
      </fieldset>

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

      {queryString && (
        <details className={styles.queryDebug}>
          <summary>Shopify search query</summary>
          <code>{queryString}</code>
        </details>
      )}
    </form>
  );
}
