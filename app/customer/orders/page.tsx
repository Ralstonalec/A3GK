import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthRequired, customerAccountConfigured, getCustomerWithOrders, type CustomerProfile } from '@/lib/customer-account';
import { formatMoney } from '@/lib/format';

export const metadata: Metadata = { title: 'Your orders' };
export const dynamic = 'force-dynamic';

export default async function CustomerOrders() {
  if (!customerAccountConfigured) {
    return <div className="section max-w-xl"><h1 className="h2">Orders</h1><p className="mt-4 text-white/75">Store accounts are not connected yet.</p></div>;
  }
  let customer: CustomerProfile;
  try {
    customer = await getCustomerWithOrders();
  } catch (e) {
    if (e instanceof AuthRequired) redirect(e.canRefresh ? '/customer/refresh?next=/customer/orders' : '/customer/login?next=/customer/orders');
    console.error('[customer-account] orders failed', e);
    return <div className="section max-w-xl"><h1 className="h2">Orders</h1><p role="alert" className="mt-4 text-red-300">We could not load your orders right now. Please try again.</p></div>;
  }
  const orders = customer.orders.nodes;
  return (
    <div className="section max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h2">Your orders</h1>
          <p className="mt-2 text-white/70">{[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.emailAddress?.emailAddress}</p>
        </div>
        <a href="/customer/logout" className="min-h-[44px] font-semibold underline underline-offset-4">Sign out of store account</a>
      </div>
      <section className="glass rounded-[2rem] p-6 md:p-8">
        {orders.length ? (
          <ul className="divide-y divide-white/10">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                <div>
                  <p className="font-semibold">{o.name} <span className="font-normal text-white/60">· {new Date(o.processedAt).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}</span></p>
                  <p className="text-sm text-white/65">{o.lineItems.nodes.map((l) => `${l.quantity} × ${l.title}`).join(', ')}</p>
                  {o.statusPageUrl && <a href={o.statusPageUrl} className="text-sm underline underline-offset-4" rel="noopener">Order status</a>}
                </div>
                <p className="font-semibold">{formatMoney(o.totalPrice.amount, o.totalPrice.currencyCode)}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-white/70">No orders yet. Orders placed with this store account appear here.</p>}
      </section>
      <p className="text-sm text-white/60"><Link href="/account" className="underline underline-offset-4">Back to your account</Link></p>
    </div>
  );
}
