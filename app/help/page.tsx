import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { Fact } from '@/components/Tbc';
import { BASE_LAYER, POLICIES } from '@/lib/content';

export const metadata: Metadata = { title: 'Help' };

const Block = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24 border-t border-white/15 pt-8">
    <h2 className="text-2xl font-bold">{title}</h2>
    <div className="mt-3 space-y-2">{children}</div>
  </section>
);

export default function Help() {
  return (
    <div className="section max-w-3xl space-y-10">
      <h1 className="h2">Help</h1>
      <Block id="contact" title="Contact"><p><Fact value={POLICIES.contactEmail} label="Customer-service contact details" /></p><ContactForm /></Block>
      <Block id="shipping" title="Shipping">
        <p>Processing: <Fact value={POLICIES.processingTime} label="Order processing time" /></p>
        <p>Production: <Fact value={POLICIES.productionTime} label="Production time (if made to order)" /></p>
        <p>Transit: <Fact value={POLICIES.transitTime} label="Shipping transit time" /></p>
        <p>Overall estimate: <Fact value={POLICIES.deliveryEstimate} label="Delivery estimate by destination" /></p>
        <p>Items arriving separately: <Fact value={POLICIES.separateShipments} label="Whether products may ship separately" /></p>
      </Block>
      <Block id="returns" title="Returns and exchanges">
        <p>Return window: <Fact value={POLICIES.returnsWindow} label="Return eligibility window" /></p>
        <p>Sizing exchanges: <Fact value={POLICIES.sizeExchanges} label="Sizing exchange terms" /></p>
        <p>How to return: <Fact value={POLICIES.returnProcess} label="Return process" /></p>
        <p>Costs: <Fact value={POLICIES.returnCosts} label="Return costs" /></p>
      </Block>
      <Block id="care" title="Product care"><p><Fact value={BASE_LAYER.care} label="Care instructions" /></p></Block>
    </div>
  );
}
