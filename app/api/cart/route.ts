import { NextResponse } from 'next/server';
import { addToCart, getCart, shopifyConfigured, updateLine } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

type Body =
  | { action: 'get'; cartId: string }
  | { action: 'add'; cartId: string | null; merchandiseId: string; quantity: number }
  | { action: 'update'; cartId: string; lineId: string; quantity: number };

const gid = (kind: string) => new RegExp(`^gid://shopify/${kind}/[A-Za-z0-9_-]+(\\?key=[A-Za-z0-9_-]+)?$`);
const CART_ID = gid('Cart');
const VARIANT_ID = gid('ProductVariant');
const LINE_ID = gid('CartLine');
const MAX_QTY = 20;

const isStr = (v: unknown, re: RegExp): v is string => typeof v === 'string' && v.length < 200 && re.test(v);
const isQty = (v: unknown, min: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= MAX_QTY;
const bad = () => NextResponse.json({ error: 'Bad request' }, { status: 400 });

/** Only the site's own pages may call this: reject browser requests whose Origin is another site. */
function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin fetches from older browsers and server tools omit it
  try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!shopifyConfigured) {
    return NextResponse.json({ error: 'Store is not connected yet.' }, { status: 503 });
  }
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad();
  }
  if (!body || typeof body !== 'object') return bad();
  try {
    if (body.action === 'get') {
      if (!isStr(body.cartId, CART_ID)) return bad();
      return NextResponse.json({ cart: await getCart(body.cartId) });
    }
    if (body.action === 'add') {
      if ((body.cartId !== null && !isStr(body.cartId, CART_ID)) || !isStr(body.merchandiseId, VARIANT_ID) || !isQty(body.quantity, 1)) return bad();
      return NextResponse.json({ cart: await addToCart(body.cartId, body.merchandiseId, body.quantity) });
    }
    if (body.action === 'update') {
      if (!isStr(body.cartId, CART_ID) || !isStr(body.lineId, LINE_ID) || !isQty(body.quantity, 0)) return bad();
      return NextResponse.json({ cart: await updateLine(body.cartId, body.lineId, body.quantity) });
    }
    return bad();
  } catch (e) {
    console.error('[cart]', e);
    return NextResponse.json({ error: 'Cart request failed.' }, { status: 500 });
  }
}
