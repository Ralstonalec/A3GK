const FACTS = [
  ['Front-only padding', 'Smooth fabric on the back'],
  ['Honeycomb panels', 'Chest, ribs, arms, hips, thighs, knees'],
  ['Sold individually', 'Or in any combination'],
  ['From $50 CAD', 'Top + bottom $80 CAD'],
];

/** Confirmed facts only, as a quick scan row under the hero. */
export function FactStrip() {
  return (
    <section aria-label="At a glance" className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-[4%]">
      <ul className="glass grid grid-cols-2 divide-white/10 overflow-hidden rounded-3xl md:grid-cols-4 md:divide-x">
        {FACTS.map(([t, d]) => (
          <li key={t} className="border-b border-white/10 p-5 last:border-b-0 md:border-b-0">
            <p className="font-display text-xl font-extrabold uppercase leading-tight">{t}</p>
            <p className="mt-1 text-sm text-white/65">{d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
