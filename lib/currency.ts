/** Display-only currency conversion. Checkout is always in CAD; other currencies are an approximate guide. */
export const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export type Rates = Record<Currency, number>; // value of 1 CAD in each currency

/** Rough placeholders, used only when the live rates cannot be loaded. */
export const FALLBACK_RATES: Rates = { CAD: 1, USD: 0.71, EUR: 0.65, GBP: 0.55 };

export const isCurrency = (v: unknown): v is Currency => typeof v === 'string' && (CURRENCIES as readonly string[]).includes(v);

export const formatIn = (amount: number, currency: Currency) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);
