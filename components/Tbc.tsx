/** Visible marker for any fact the business has not confirmed. Must be resolved before launch. */
export function Tbc({ label }: { label: string }) {
  return (
    <span
      data-tbc
      className="inline-block rounded-sm border border-dashed border-amber-600 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
    >
      To confirm: {label}
    </span>
  );
}

/** Renders the value if known, otherwise the To-confirm marker. */
export function Fact({ value, label }: { value: string | null | undefined; label: string }) {
  return value ? <>{value}</> : <Tbc label={label} />;
}
