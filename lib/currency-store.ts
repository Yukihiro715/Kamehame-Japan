// Client-side store for the display currency and the day's rate, read by the
// CurrencyProvider through useSyncExternalStore. The server snapshot is
// always yen with no rate, so server HTML and the first client render agree;
// the stored choice and the cached rate are applied in the render that
// follows hydration, without a navigation or a form reset.

import { CURRENCY_KEY, DEFAULT_CURRENCY, FX_CACHE_KEY, isCurrency, isPlausibleRate, type Currency, type FxRate } from "@/lib/currency";
import { track } from "@/lib/analytics";

/** The browser keeps the rate for half a day; the server for a day. */
const CLIENT_TTL_MS = 12 * 60 * 60 * 1000;

let loaded = false;
let currency: Currency = DEFAULT_CURRENCY;
let rate: FxRate | null = null;
let fetching: Promise<void> | null = null;
const listeners = new Set<() => void>();

const emit = () => { for (const l of listeners) l(); };

function readStoredCurrency(): Currency {
  try {
    const v = localStorage.getItem(CURRENCY_KEY);
    return isCurrency(v) ? v : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

function readCachedRate(): FxRate | null {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const fx = JSON.parse(raw) as FxRate & { cachedAt?: string };
    if (!isPlausibleRate(fx.rate) || !fx.date) return null;
    const age = Date.now() - Date.parse(fx.cachedAt ?? fx.fetchedAt ?? "");
    return Number.isFinite(age) && age < CLIENT_TTL_MS ? fx : null;
  } catch {
    return null;
  }
}

/** First read on the client: the stored choice and any fresh cached rate. */
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  currency = readStoredCurrency();
  rate = readCachedRate();
}

export const getCurrency = (): Currency => { load(); return currency; };
export const getRate = (): FxRate | null => { load(); return rate; };
export const serverCurrency = (): Currency => DEFAULT_CURRENCY;
export const serverRate = (): FxRate | null => null;

function onStorage(e: StorageEvent) {
  // Another tab's choice follows here too.
  if (e.key === CURRENCY_KEY && isCurrency(e.newValue) && e.newValue !== currency) { currency = e.newValue; emit(); }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Fetch the day's rate once per page when nothing fresh is cached, whatever
 *  the choice, so switching to USD later is instant. */
export function ensureRate(): Promise<void> {
  load();
  if (rate || fetching) return fetching ?? Promise.resolve();
  fetching = (async () => {
    try {
      const res = await fetch("/api/fx", { headers: { accept: "application/json" } });
      if (!res.ok) return;
      const fx = (await res.json()) as FxRate;
      if (!isPlausibleRate(fx.rate) || fx.base !== "USD" || fx.quote !== "JPY" || !fx.date) return;
      rate = fx;
      try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ...fx, cachedAt: new Date().toISOString() })); } catch { /* storage blocked */ }
      emit();
    } catch {
      /* no rate: prices stay in yen */
    } finally {
      fetching = null;
    }
  })();
  return fetching;
}

export function setCurrency(c: Currency) {
  load();
  if (c === currency) return;
  currency = c;
  try { localStorage.setItem(CURRENCY_KEY, c); } catch { /* storage blocked: the choice lasts for this page */ }
  track("currency_selected", { currency: c });
  emit();
  if (c === "USD") void ensureRate();
}
