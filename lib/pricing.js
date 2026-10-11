import { EXTRAS, FABRICS, PATTERNS } from './customizer-options';
import { STORE_TERMS } from './store-terms';

/**
 * Real-time pricing engine for customised kit.
 *
 * Pure and deterministic: the browser calls it on every control change for
 * instant feedback, and the server calls it again (api/checkout, api/cart)
 * so a tampered client price can never reach a payment session.
 *
 * @param {{ basePriceCents: number, config: object, quantity?: number }} input
 */
export function calculateCustomPrice({ basePriceCents, config, quantity = 1 }) {
  const qty = Math.max(1, Math.floor(quantity));
  const lines = [{ id: 'base', label: 'Base jersey', cents: basePriceCents }];

  const fabric = FABRICS.find((f) => f.id === config.fabric);
  if (fabric && fabric.priceCents) lines.push({ id: 'fabric', label: fabric.label, cents: fabric.priceCents });

  const pattern = PATTERNS.find((p) => p.id === config.pattern);
  if (pattern && pattern.priceCents) lines.push({ id: 'pattern', label: `${pattern.label} print`, cents: pattern.priceCents });

  if (config.playerName && config.playerName.trim()) {
    lines.push({ id: 'playerName', label: EXTRAS.playerName.label, cents: EXTRAS.playerName.priceCents });
  }
  if (config.playerNumber && config.playerNumber.trim()) {
    lines.push({ id: 'playerNumber', label: EXTRAS.playerNumber.label, cents: EXTRAS.playerNumber.priceCents });
  }
  if (config.logo && config.logo.enabled) {
    lines.push({ id: 'logo', label: EXTRAS.logo.label, cents: EXTRAS.logo.priceCents });
  }

  const unitCents = lines.reduce((sum, l) => sum + l.cents, 0);
  const subtotalCents = unitCents * qty;
  // Volume discounts are a commercial term: empty until configured in lib/store-terms.js.
  const ladder = [...STORE_TERMS.quantityDiscounts].sort((a, b) => b.minQuantity - a.minQuantity);
  const tier = ladder.find((t) => qty >= t.minQuantity);
  const discountPercent = tier ? tier.percent : 0;
  const discountCents = Math.round((subtotalCents * discountPercent) / 100);
  const totalCents = subtotalCents - discountCents;
  // Discount is spread evenly so a per-unit figure can be shown / sent to Stripe.
  const discountedUnitCents = Math.round(totalCents / qty);

  const nextTier = [...ladder].reverse().find((t) => qty < t.minQuantity) || null;

  return {
    lines,
    quantity: qty,
    unitCents,
    subtotalCents,
    discountPercent,
    discountCents,
    totalCents,
    discountedUnitCents,
    nextTier,
  };
}
