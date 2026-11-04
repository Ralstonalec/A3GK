export type Tracking = { number: string; company: string | null; url: string | null; status: string | null; shipped_at: string | null };

const LABELS: Record<string, string> = {
  label_printed: 'Label printed',
  label_purchased: 'Label purchased',
  attempted_delivery: 'Delivery attempted',
  ready_for_pickup: 'Ready for pickup',
  confirmed: 'Confirmed by carrier',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failure: 'Delivery problem',
  success: 'Shipped',
  open: 'Shipped',
};

export const statusLabel = (s: string | null) => (s ? LABELS[s] ?? s.replace(/_/g, ' ') : null);

/** The carrier's own link when Shopify gave one (https only), otherwise a universal tracker. */
export const trackUrl = (t: Tracking) => (t.url && /^https:\/\//i.test(t.url) ? t.url : `https://t.17track.net/en#nums=${encodeURIComponent(t.number)}`);

/** Reads the tracking list out of a database row, tolerating anything unexpected. */
export function readTracking(value: unknown): Tracking[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) => {
    if (!v || typeof v !== 'object') return [];
    const o = v as Record<string, unknown>;
    if (typeof o.number !== 'string' || !o.number) return [];
    const str = (x: unknown) => (typeof x === 'string' && x ? x : null);
    return [{ number: o.number, company: str(o.company), url: str(o.url), status: str(o.status), shipped_at: str(o.shipped_at) }];
  });
}
