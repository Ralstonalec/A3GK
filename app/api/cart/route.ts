import { NextResponse } from 'next/server';
import { addToCart, getCart, shopifyConfigured, updateLine } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

type Body =
  | { action: 'get'; cartId: string }
  | { action: 'add'; cartId: string | null; merchandiseId: string; quantity: number }
  | { action: 'update'; cartId: string; lineId: string; quantity: number };

export async function POST(req: Request) {
  if (!shopifyConfigured) {
    return NextResponse.json({ error: 'Store is not connected yet.' }, { status: 503 });
  }
  try {
    const body = (await req.json()) as Body;
    if (body.action === 'get') return NextResponse.json({ cart: await getCart(body.cartId) });
    if (body.action === 'add') {
      const qty = Math.max(1, Math.min(20, Math.floor(body.quantity)));
      return NextResponse.json({ cart: await addToCart(body.cartId, body.merchandiseId, qty) });
    }
    if (body.action === 'update') {
      return NextResponse.json({ cart: await updateLine(body.cartId, body.lineId, Math.floor(body.quantity)) });
    }
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  } catch (e) {
    console.error('[cart]', e);
    return NextResponse.json({ error: 'Cart request failed.' }, { status: 500 });
  }
}
