"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_CURRENCY, type Currency, type FxRate } from "@/lib/currency";
import { ensureRate, getCurrency, getRate, serverCurrency, serverRate, setCurrency, subscribe } from "@/lib/currency-store";

interface CurrencyContextValue {
  /** The visitor's choice (JPY until they pick USD). */
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** The reference rate, once loaded; null until then or when unavailable. */
  rate: FxRate | null;
  /** True only when USD is chosen AND a rate is available: the only state in
   *  which anything on the page shows dollars. Otherwise prices stay in yen. */
  usdActive: boolean;
}

const Ctx = createContext<CurrencyContextValue>({ currency: DEFAULT_CURRENCY, setCurrency: () => {}, rate: null, usdActive: false });

/** Holds the display currency and the day's USD→JPY rate for the whole page.
 *  The server always renders yen (so the HTML never depends on a visitor's
 *  choice or on the rate); the stored choice and the rate are read after
 *  hydration, and prices re-render in place without any navigation. */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribe, getCurrency, serverCurrency);
  const rate = useSyncExternalStore(subscribe, getRate, serverRate);

  useEffect(() => { void ensureRate(); }, []);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency, setCurrency, rate, usdActive: currency === "USD" && !!rate,
  }), [currency, rate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCurrency = () => useContext(Ctx);
