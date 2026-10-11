import { hasDeliveryEstimates, hasFreeShipping, hasShippingMethods, STORE_TERMS } from './store-terms';
import { estimateDelivery } from './utils';

/**
 * Shipping helpers. Every function degrades to "nothing configured" (null)
 * because shipping terms are intentionally unset — see lib/store-terms.js.
 */

/** @returns {object|null} the chosen method, the first one if `id` is unknown, null if none exist */
export function getShippingMethod(id) {
  if (!hasShippingMethods()) return null;
  return STORE_TERMS.shippingMethods.find((m) => m.id === id) || STORE_TERMS.shippingMethods[0];
}

/** @returns {number|null} cents, or null when no shipping methods are configured */
export function shippingCostCents(methodId, subtotalCents) {
  const method = getShippingMethod(methodId);
  if (!method) return null;
  if (method.freeOverThreshold && hasFreeShipping() && subtotalCents >= STORE_TERMS.freeShippingThresholdCents) return 0;
  return method.amountCents;
}

/** @returns {number|null} cents still needed for free shipping, or null when there is no threshold */
export function amountToFreeShipping(subtotalCents) {
  if (!hasFreeShipping()) return null;
  return Math.max(0, STORE_TERMS.freeShippingThresholdCents - subtotalCents);
}

/** Longest production lead time among the lines (0 when unpublished). */
export function productionDays(lines) {
  return lines.reduce((max, l) => Math.max(max, l.leadTimeDays || (l.customization ? STORE_TERMS.processingDays.custom || 0 : 0)), 0);
}

/** @returns {{ earliest: Date, latest: Date, label: string }|null} null unless delivery terms are fully configured */
export function deliveryEstimateFor(methodId, lines, from = new Date()) {
  if (!hasDeliveryEstimates()) return null;
  const method = getShippingMethod(methodId);
  const processing = Math.max(STORE_TERMS.processingDays.standard, productionDays(lines));
  return estimateDelivery({ from, processingDays: processing, minDays: method.minDays, maxDays: method.maxDays });
}
