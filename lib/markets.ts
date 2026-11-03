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
  { id: 'US', label: 'United States', country: 'US', currency: 'USD' },
  { id: 'GB', label: 'United Kingdom', country: 'GB', currency: 'GBP' },
  { id: 'EU', label: 'Europe', country: 'DE', currency: 'EUR', countries: ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'] },
  { id: 'AU', label: 'Australia', country: 'AU', currency: 'AUD' },
];

export const DEFAULT_MARKET = MARKETS[0];
export const CURRENCIES = Array.from(new Set(MARKETS.map((m) => m.currency)));

export const marketById = (id: string | null | undefined) => MARKETS.find((m) => m.id === id) ?? null;
/** The market a visitor's country belongs to; countries we do not serve fall back to the default market. */
export const marketForCountry = (cc: string | null | undefined) => {
  const c = (cc ?? '').toUpperCase();
  return MARKETS.find((m) => m.country === c || m.countries?.includes(c)) ?? DEFAULT_MARKET;
};
export const isSupportedCountry = (cc: unknown): cc is string => typeof cc === 'string' && MARKETS.some((m) => m.country === cc.toUpperCase() || m.countries?.includes(cc.toUpperCase()));
