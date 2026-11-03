/**
 * The markets the store sells to. To add one: add a line here, then create the matching market in Shopify
 * (Settings > Markets) with the same currency and shipping. Nothing else in the site needs to change.
 */
export type Market = {
  id: string;
  label: string;
  /** A representative ISO country code, sent to Shopify to price and check out in this market. */
  country: string;
  currency: string;
  /** Every country that belongs to this market (defaults to just `country`). */
  countries?: string[];
};

export const MARKETS: Market[] = [
  { id: 'CA', label: 'Canada', country: 'CA', currency: 'CAD' },
  { id: 'US', label: 'United States & International', country: 'US', currency: 'USD' },
  { id: 'GB', label: 'United Kingdom', country: 'GB', currency: 'GBP' },
  { id: 'EU', label: 'Europe', country: 'DE', currency: 'EUR', countries: ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'] },
  { id: 'AU', label: 'Australia', country: 'AU', currency: 'AUD' },
];

export const DEFAULT_MARKET = MARKETS[0];
/** Visitors from countries that are not in any market above are shown, and pay in, US dollars. */
export const INTERNATIONAL_MARKET = MARKETS.find((m) => m.id === 'US') ?? MARKETS[0];
export const CURRENCIES = Array.from(new Set(MARKETS.map((m) => m.currency)));

export const marketById = (id: string | null | undefined) => MARKETS.find((m) => m.id === id) ?? null;
/** The market a visitor's country belongs to; every other country falls into the international (USD) market. A missing country (no location) gets the default market. */
export const marketForCountry = (cc: string | null | undefined) => {
  const c = (cc ?? '').toUpperCase();
  if (!c) return DEFAULT_MARKET;
  return MARKETS.find((m) => m.country === c || m.countries?.includes(c)) ?? INTERNATIONAL_MARKET;
};
export const isSupportedCountry = (cc: unknown): cc is string => typeof cc === 'string' && MARKETS.some((m) => m.country === cc.toUpperCase() || m.countries?.includes(cc.toUpperCase()));
