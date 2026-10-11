/**
 * Marks placeholder content that ships with the prototype (testimonials,
 * statistics, social posts, FAQ policy copy). Rendered only while the backing
 * data file has `"isSample": true`, so flipping that flag removes it.
 */
export default function SampleNote({ isSample, children = 'Sample content — replace before launch' }) {
  if (!isSample) return null;
  return (
    <p className="sample-note" data-sample-note>
      <span aria-hidden="true">◌</span> {children}
    </p>
  );
}
