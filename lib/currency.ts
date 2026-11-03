/** Currency helpers. Which currencies exist comes from lib/markets.ts. */
import { CURRENCIES } from './markets';

export type Currency = string;
export type Rates = Record<string, number>; // value of 1 CAD in each currency

export { CURRENCIES };

/** Rough placeholders, used only when neither Shopify nor the live rates can be reached. */
export const FALLBACK_RATES: Rates = { CAD: 1, USD: 0.71, EUR: 0.65, GBP: 0.55, AUD: 1.08 };

export const formatIn = (amount: number, currency: Currency) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);
