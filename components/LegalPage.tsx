import type { ReactNode } from 'react';
import { LEGAL_UPDATED } from '@/lib/content';
import { PageHero } from './motion/PageHero';

/** Shared layout for the policy pages. */
export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageHero size="sm" lines={title.split(' ').length > 2 ? [title.split(' ').slice(0, -1).join(' '), title.split(' ').slice(-1)[0]] : [title]} intro={<><span className="block text-sm text-white/55">Last updated {LEGAL_UPDATED}</span></>} />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <div className="text-lg text-white/80">{intro}</div>
        <div className="mt-10 space-y-8">{children}</div>
      </div>
    </>
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
