import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { adminClient, adminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

type Order = {
  id: number | string;
  name?: string;
  email?: string | null;
  contact_email?: string | null;
  customer?: { email?: string | null } | null;
  total_price?: string;
  currency?: string;
  created_at?: string;
  line_items?: { title?: string; variant_title?: string | null; quantity?: number }[];
};

function validSignature(raw: string, header: string | null) {
  if (!secret || !header) return false;
  const expected = createHmac('sha256', secret).update(raw, 'utf8').digest();
  let given: Buffer;
  try { given = Buffer.from(header, 'base64'); } catch { return false; }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Shopify order webhooks (orders/paid, orders/cancelled). Verifies Shopify's HMAC signature, then records the order
 * so members can see their purchases. Only email, order number, total and item names are stored.
 */
export async function POST(req: Request) {
  if (!secret || !adminConfigured) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 1_000_000 || !validSignature(raw, req.headers.get('x-shopify-hmac-sha256'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const topic = req.headers.get('x-shopify-topic');
  let order: Order;
  try { order = JSON.parse(raw) as Order; } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  if (!order || order.id === undefined || order.id === null) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const db = adminClient();
  const orderId = String(order.id);

  if (topic === 'orders/cancelled') {
    const { error } = await db.from('purchases').update({ status: 'cancelled' }).eq('shopify_order_id', orderId);
    if (error) { console.error('[webhook] cancel failed', error.message); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  }

  if (topic !== 'orders/paid') return NextResponse.json({ ok: true, ignored: topic });

  const email = (order.email || order.contact_email || order.customer?.email || '').trim().toLowerCase();
  const total = Number(order.total_price);
  if (!email || !Number.isFinite(total) || total < 0 || !order.currency || order.currency.length !== 3) {
    return NextResponse.json({ ok: true, ignored: 'no email or total' }); // nothing a member could be matched on
  }
  const { error } = await db.from('purchases').upsert(
    {
      shopify_order_id: orderId,
      order_number: order.name ?? null,
      email,
      total,
      currency: order.currency.toUpperCase(),
      line_items: (order.line_items ?? []).slice(0, 50).map((l) => ({ title: String(l.title ?? '').slice(0, 200), variant: l.variant_title ? String(l.variant_title).slice(0, 100) : null, quantity: Number(l.quantity) || 1 })),
      status: 'paid',
      placed_at: order.created_at ?? new Date().toISOString(),
    },
    { onConflict: 'shopify_order_id' },
  );
  if (error) { console.error('[webhook] upsert failed', error.message); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
