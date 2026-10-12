/**
 * COMMERCIAL TERMS — intentionally empty.
 *
 * Shipping rates, free-shipping thresholds, delivery times, production lead
 * times, return windows and volume discounts are business decisions that have
 * not been made yet, so NOTHING here is shown to shoppers or enforced until you
 * fill it in. Every consumer (header, cart, checkout, product page, trust
 * badges, Stripe session, FAQ, terms page) checks these values and simply
 * omits what is unset.
 *
 * When you decide, edit this one file:
 *
 *   shippingMethods: [
 *     { id: 'standard', label: 'Standard', amountCents: 0, minDays: 3, maxDays: 5 },
 *   ],
 *   shipTo: ['US', 'CA', 'GB'],
 *   freeShippingThresholdCents: 10000,   // optional
 *   returnWindowDays: 30,                // optional
 *   processingDays: { standard: 1, custom: 10 },
 *   quantityDiscounts: [{ minQuantity: 5, percent: 5 }],
 *   allowPromotionCodes: true,           // let Stripe Checkout show a promo-code box
 *   termsPublished: true,                // once pages/terms.js holds real terms: checkout then asks shoppers to accept them
 *
 * LIVE-MODE GUARD: with a live Stripe key (sk_live_…) checkout refuses to start
 * until `shipTo` is set, so a real order can never be taken with undefined
 * shipping. Test keys and demo mode are unaffected.
 */
export const STORE_TERMS = {
  freeShippingThresholdCents: null,
  returnWindowDays: null,
  /** @type {{ id: string, label: string, amountCents: number, minDays?: number, maxDays?: number, freeOverThreshold?: boolean }[]} */
  shippingMethods: [],
  /** ISO 3166-1 alpha-2 country codes the store ships to. */
  shipTo: [],
  /** Business days between order and dispatch. null = not published. */
  processingDays: { standard: null, custom: null },
  /** @type {{ minQuantity: number, percent: number }[]} highest matching tier wins */
  quantityDiscounts: [],
  /** Off until discounts are decided: Stripe Checkout shows no promo-code field. */
  allowPromotionCodes: false,
  /** Off until pages/terms.js has real terms: checkout asks for no agreement to terms that do not exist. */
  termsPublished: false,
};

/** Technical safety limits (not marketing terms). */
export const CART_LIMITS = { maxLineQuantity: 20, maxCartLines: 25 };

export const hasShippingMethods = () => STORE_TERMS.shippingMethods.length > 0;
export const hasFreeShipping = () => Number.isFinite(STORE_TERMS.freeShippingThresholdCents) && STORE_TERMS.freeShippingThresholdCents > 0;
export const hasReturnWindow = () => Number.isFinite(STORE_TERMS.returnWindowDays) && STORE_TERMS.returnWindowDays > 0;
export const hasDeliveryEstimates = () =>
  hasShippingMethods() && STORE_TERMS.shippingMethods.every((m) => Number.isFinite(m.minDays) && Number.isFinite(m.maxDays)) && Number.isFinite(STORE_TERMS.processingDays.standard);
export const termsReadyForLive = () => STORE_TERMS.shipTo.length > 0;
export const hasPublishedTerms = () => STORE_TERMS.termsPublished === true;
