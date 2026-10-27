export function Accordion({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <div className="divide-y divide-charcoal-700/20 border-y border-charcoal-700/20">
      {items.map((it) => (
        <details key={it.title} className="group py-1">
          <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold">
            {it.title}
            <span aria-hidden className="text-xl transition group-open:rotate-45">+</span>
          </summary>
          <div className="pb-4 text-[15px] leading-relaxed text-charcoal-700">{it.body}</div>
        </details>
      ))}
    </div>
  );
}
