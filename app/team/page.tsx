import type { Metadata } from 'next';
import { Tbc } from '@/components/Tbc';
import { TeamForm } from '@/components/TeamForm';
import { TEAM_ORDERS } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Team orders',
  description: 'Ordering the A3GK padded base layer for a team or club? Tell us what you need and we will get back to you.',
};

const subject = encodeURIComponent('Team order enquiry');
const body = encodeURIComponent('Team or club:\nApproximate number of players:\nPieces wanted (top, bottom or both):\nSizes needed, if known:\nNeeded by:\n');

const STEPS = [
  { t: 'Tell us what you need', d: 'Your team, how many players, and which pieces. A rough idea is fine.' },
  { t: 'We reply by email', d: 'We come back with the details for your order.' },
  { t: 'Confirm sizes', d: 'Players pick sizes from the size guide, and we confirm the order with you.' },
];

export default function TeamOrders() {
  return (
    <div className="section max-w-4xl space-y-10">
      <header>
        <p className="eyebrow">Team orders</p>
        <h1 className="h2 text-4xl md:text-6xl">Order for the whole team</h1>
        <p className="mt-5 max-w-2xl text-lg text-white/80">
          Buying the A3GK padded base layer for a team or club? Send us what you need and we will be in touch. Every piece is sold on its own, so players can have a top, a bottom, or both.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a href={`mailto:${TEAM_ORDERS.email}?subject=${subject}&body=${body}`} className="btn-primary">Email {TEAM_ORDERS.email}</a>
          <a href="/size-guide" className="min-h-[48px] py-3 font-semibold underline underline-offset-4">Size guide</a>
        </div>
      </header>

      <ol className="grid gap-3 overflow-hidden rounded-2xl md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.t} className="glass rounded-2xl p-5">
            <h2 className="font-display text-xl font-extrabold uppercase">{s.t}</h2>
            <p className="mt-1 text-sm text-white/75">{s.d}</p>
          </li>
        ))}
      </ol>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="font-bold text-white/60">Minimum order</dt><dd className="mt-1">{TEAM_ORDERS.minimumOrder ?? <Tbc label="Team order minimum" />}</dd></div>
        <div><dt className="font-bold text-white/60">Team pricing</dt><dd className="mt-1">{TEAM_ORDERS.bulkPricing ?? <Tbc label="Team or bulk pricing" />}</dd></div>
        <div><dt className="font-bold text-white/60">Lead time</dt><dd className="mt-1">{TEAM_ORDERS.leadTime ?? <Tbc label="Team order lead time" />}</dd></div>
        <div><dt className="font-bold text-white/60">Customisation</dt><dd className="mt-1">{TEAM_ORDERS.customisation ?? <Tbc label="Team names, numbers or logos" />}</dd></div>
      </dl>

      <section className="glass rounded-[2rem] p-6 md:p-8" aria-labelledby="enquiry">
        <h2 id="enquiry" className="font-display text-2xl font-extrabold uppercase">Send an enquiry</h2>
        <p className="mt-2 text-sm text-white/70">Prefer email? Write to <a className="underline underline-offset-4" href={`mailto:${TEAM_ORDERS.email}`}>{TEAM_ORDERS.email}</a>.</p>
        <div className="mt-5"><TeamForm /></div>
      </section>
    </div>
  );
}
