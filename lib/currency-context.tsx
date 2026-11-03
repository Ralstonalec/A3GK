'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PRICING } from './content';
import { FALLBACK_RATES, formatIn, type Rates } from './currency';
import { DEFAULT_MARKET, marketById, type Market } from './markets';

type Ctx = {
  market: Market;
  setMarket: (id: string) => void;
  currency: string;
  /** True when the price comes from Shopify for this market (so it matches checkout). */
  localized: boolean;
  /** Format a CAD amount in the visitor's currency; null when CAD is shown (callers then print their own CAD text). */
  convert: (cad: number) => string | null;
  /** True when the rate behind convert() is a live or Shopify rate, not a placeholder. */
  live: boolean;
};

const CurrencyContext = createContext<Ctx>({ market: DEFAULT_MARKET, setMarket: () => {}, currency: 'CAD', localized: false, convert: () => null, live: false });
const KEY = 'a3gk.market';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarketState] = useState<Market>(DEFAULT_MARKET);
  const [piece, setPiece] = useState<number | null>(null); // what Shopify charges for one piece in this market
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);
  const [liveRates, setLiveRates] = useState(false);

  // First visit: pick the market from the visitor's country. Later visits: remember their choice.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* storage unavailable */ }
    const m = marketById(saved);
    if (m) { setMarketState(m); return; }
    fetch('/api/market').then((r) => r.json()).then((j: { market?: string }) => {
      const found = marketById(j.market);
      if (found) setMarketState(found);
    }).catch(() => { /* stay on the default market */ });
  }, []);

  // Ask Shopify what a piece costs in this market. If it has a local price, everything is converted at that rate.
  useEffect(() => {
    setPiece(null);
    if (market.currency === 'CAD') return;
    let off = false;
    fetch(`/api/prices?market=${market.id}`).then((r) => r.json()).then((j: { piece?: number | null }) => {
      if (off) return;
      if (typeof j.piece === 'number' && j.piece > 0) { setPiece(j.piece); return; }
      // Shopify has no local price here yet: fall back to an approximate rate.
      return fetch('/api/rates').then((r) => r.json()).then((x: { rates?: Rates; live?: boolean }) => {
        if (off || !x.rates) return;
        setRates(x.rates); setLiveRates(Boolean(x.live));
      });
    }).catch(() => { /* keep placeholders */ });
    return () => { off = true; };
  }, [market]);

  const setMarket = useCallback((id: string) => {
    const m = marketById(id);
    if (!m) return;
    setMarketState(m);
    try { localStorage.setItem(KEY, m.id); } catch { /* ignore */ }
  }, []);

  const localized = market.currency !== 'CAD' && piece !== null;
  const convert = useCallback((cad: number) => {
    if (market.currency === 'CAD') return null;
    const rate = piece !== null ? piece / PRICING.piece : rates[market.currency] ?? 1;
    return formatIn(cad * rate, market.currency);
  }, [market, piece, rates]);

  const value = useMemo(() => ({ market, setMarket, currency: market.currency, localized, convert, live: localized || liveRates }), [market, setMarket, localized, convert, liveRates]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);
