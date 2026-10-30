import type { ReactNode } from 'react';
import { LEGAL_UPDATED } from '@/lib/content';

/** Shared layout for the policy pages. */
export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="section max-w-3xl">
      <p className="eyebrow">A3 Goalkeeping</p>
      <h1 className="h2">{title}</h1>
      <p className="mt-2 text-sm text-white/55">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-6 text-lg text-white/80">{intro}</div>
      <div className="mt-10 space-y-8">{children}</div>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/15 pt-6">
      <h2 className="font-display text-2xl font-extrabold uppercase">{title}</h2>
      <div className="mt-3 space-y-3 text-white/80 [&_li]:ml-5 [&_li]:list-disc [&_a]:underline [&_a]:underline-offset-4">{children}</div>
    </section>
  );
}
