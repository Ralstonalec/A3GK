'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FALLBACK_RATES, formatIn, isCurrency, type Currency, type Rates } from './currency';

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Format a CAD amount in the chosen currency; returns null when CAD is chosen (callers then show their own CAD text). */
  convert: (cad: number) => string | null;
  live: boolean;
};

const CurrencyContext = createContext<Ctx>({ currency: 'CAD', setCurrency: () => {}, convert: () => null, live: false });
const KEY = 'a3gk.currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('CAD');
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);
  const [live, setLive] = useState(false);

  useEffect(() => {
    try { const saved = localStorage.getItem(KEY); if (isCurrency(saved)) setCurrencyState(saved); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    if (currency === 'CAD') return; // nothing to convert, so do not call the rates endpoint
    let off = false;
    fetch('/api/rates').then((r) => r.json()).then((j: { rates?: Rates; live?: boolean }) => {
      if (off || !j.rates) return;
      setRates(j.rates); setLive(Boolean(j.live));
    }).catch(() => { /* keep the placeholders */ });
    return () => { off = true; };
  }, [currency]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try { localStorage.setItem(KEY, c); } catch { /* ignore */ }
  }, []);

  const convert = useCallback((cad: number) => (currency === 'CAD' ? null : formatIn(cad * rates[currency], currency)), [currency, rates]);
  const value = useMemo(() => ({ currency, setCurrency, convert, live }), [currency, setCurrency, convert, live]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);
