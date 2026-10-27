/** Clearly marked slot for real product photography. Never filled with stock or AI imagery. */
export function PhotoSlot({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div data-tbc className={`flex items-center justify-center border border-dashed border-amber-400/60 bg-amber-400/10 p-4 text-center text-sm font-semibold text-amber-200 ${className}`}>
      Photograph to be added: {label}
    </div>
  );
}
