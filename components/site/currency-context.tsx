"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_CURRENCY, type Currency, type FxRate } from "@/lib/currency";
import { ensureRate, getCurrency, getRate, getStatus, serverCurrency, serverRate, serverStatus, setCurrency, subscribe, type FxStatus } from "@/lib/currency-store";

interface CurrencyContextValue {
  /** The visitor's choice (JPY until they pick USD). */
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** The reference rate, once loaded; null until then or when unavailable. */
  rate: FxRate | null;
  /** True only when USD is chosen AND a valid rate is available: the only state
   *  in which anything on the page shows dollars. Otherwise prices stay in yen. */
  usdActive: boolean;
  /** Whether the rate is being fetched, in use, or could not be had. */
  status: FxStatus;
}

const Ctx = createContext<CurrencyContextValue>({ currency: DEFAULT_CURRENCY, setCurrency: () => {}, rate: null, usdActive: false, status: "idle" });

/** How often an open page re-checks that its rate is still current. */
const RECHECK_MS = 10 * 60 * 1000;

/** Holds the display currency and the day's USD→JPY rate for the whole page.
 *  The server always renders yen (so the HTML never depends on a visitor's
 *  choice or on the rate); the stored choice and the rate are read after
 *  hydration, and prices re-render in place without any navigation. */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribe, getCurrency, serverCurrency);
  const rate = useSyncExternalStore(subscribe, getRate, serverRate);
  const status = useSyncExternalStore(subscribe, getStatus, serverStatus);

  // Fetch once after mount, re-check on a timer and whenever the tab comes
  // back into view, so a page left open does not keep yesterday's rate.
  useEffect(() => {
    void ensureRate();
    const tick = () => { if (document.visibilityState !== "hidden") void ensureRate(); };
    const timer = window.setInterval(tick, RECHECK_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, []);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency, setCurrency, rate, usdActive: currency === "USD" && !!rate, status,
  }), [currency, rate, status]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCurrency = () => useContext(Ctx);
