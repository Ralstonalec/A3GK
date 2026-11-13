import Link from 'next/link';
import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { PageHero } from '@/components/motion/PageHero';
import { Reveal } from '@/components/Reveal';
import { Fact } from '@/components/Tbc';
import { BASE_LAYER, POLICIES } from '@/lib/content';

export const metadata: Metadata = { title: 'Help', description: 'Contact A3GK and find shipping, order tracking, returns and product care information for the padded base layer.' };

const JUMPS = [
  { href: '#contact', t: 'Contact', d: 'Send us a message' },
  { href: '#shipping', t: 'Shipping', d: 'Times and costs' },
  { href: '/track', t: 'Track', d: 'Follow your parcel' },
  { href: '#returns', t: 'Returns', d: 'Returns and exchanges' },
  { href: '#care', t: 'Care', d: 'Looking after it' },
];

const Block = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-28">
    <Reveal className="grid gap-4 border-t border-white/20 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10 md:py-14">
      <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-5xl">{title}</h2>
      <div className="space-y-3 text-lg text-white/85">{children}</div>
    </Reveal>
  </section>
);

export default function Help() {
  return (
    <>
      <PageHero lines={['How can', 'we help']} band="Help" intro="Shipping, tracking, returns and care, plus a way to reach us." />
      <nav aria-label="Help topics" className="mx-auto max-w-6xl px-4">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {JUMPS.map((j, i) => (
            <li key={j.t}>
              <Reveal delay={i * 0.06} className="h-full">
                <Link href={j.href} className="glass group flex h-full min-h-[104px] flex-col justify-between rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:bg-accent hover:text-ink">
                  <span className="font-display text-2xl font-extrabold uppercase">{j.t}</span>
                  <span className="text-sm text-white/70 group-hover:text-ink/80">{j.d}</span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-14">
        <Block id="contact" title="Contact"><p><Fact value={POLICIES.contactEmail} label="Customer-service contact details" /></p><ContactForm /></Block>
        <Block id="shipping" title="Shipping">
          <p>Processing: <Fact value={POLICIES.processingTime} label="Order processing time" /></p>
          <p>Production: <Fact value={POLICIES.productionTime} label="Production time (if made to order)" /></p>
          <p>Transit: <Fact value={POLICIES.transitTime} label="Shipping transit time" /></p>
          <p>Overall estimate: <Fact value={POLICIES.deliveryEstimate} label="Delivery estimate by destination" /></p>
          <p>Items arriving separately: <Fact value={POLICIES.separateShipments} label="Whether products may ship separately" /></p>
          <p><Link href="/track" className="font-semibold underline underline-offset-4">Track your order</Link></p>
          <p>Shipping is calculated in your cart before checkout, based on where you are sending the order.</p>
        </Block>
        <Block id="returns" title="Returns and exchanges">
          <p>Return window: <Fact value={POLICIES.returnsWindow} label="Return eligibility window" /></p>
          <p>Sizing exchanges: <Fact value={POLICIES.sizeExchanges} label="Sizing exchange terms" /></p>
          <p>How to return: <Fact value={POLICIES.returnProcess} label="Return process" /></p>
          <p>Costs: <Fact value={POLICIES.returnCosts} label="Return costs" /></p>
        </Block>
        <Block id="care" title="Product care"><p><Fact value={BASE_LAYER.care} label="Care instructions" /></p></Block>
      </div>
    </>
  );
}
