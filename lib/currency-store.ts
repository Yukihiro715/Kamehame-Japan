// Client-side store for the display currency and the day's rate, read by the
// CurrencyProvider through useSyncExternalStore. The server snapshot is
// always yen with no rate, so server HTML and the first client render agree;
// the stored choice and the cached rate are applied in the render that
// follows hydration, without a navigation or a form reset.

import { cacheIsFresh, CURRENCY_KEY, DEFAULT_CURRENCY, FX_CACHE_KEY, isCurrency, validateRate, type Currency, type FxRate } from "@/lib/currency";
import { track } from "@/lib/analytics";

/** The browser keeps the rate for half a day; the server for a day. A page
 *  left open re-checks on this schedule, and when it comes back into view. */
export const CLIENT_TTL_MS = 12 * 60 * 60 * 1000;
/** After a failed fetch, wait this long before asking again. */
const RETRY_AFTER_MS = 5 * 60 * 1000;

/** What the visitor should be told when USD is chosen: the rate is being
 *  fetched, is in use, or could not be had (prices stay in yen). */
export type FxStatus = "idle" | "loading" | "ready" | "unavailable";

let loaded = false;
let currency: Currency = DEFAULT_CURRENCY;
let rate: FxRate | null = null;
/** When the rate in memory was taken (fetched here or read from the cache). */
let takenAt = 0;
let fetching: Promise<void> | null = null;
let failedAt = 0;
let status: FxStatus = "idle";
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

/** A cached rate counts only when the copy is fresh and the rate itself still
 *  validates (currencies, figure, date not in the future or too old). */
function readCachedRate(now = Date.now()): { fx: FxRate; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { cachedAt?: unknown };
    if (!cacheIsFresh(parsed.cachedAt, CLIENT_TTL_MS, now)) return null;
    const fx = validateRate(parsed, now);
    return fx ? { fx, cachedAt: Date.parse(parsed.cachedAt as string) } : null;
  } catch {
    return null;
  }
}

/** First read on the client: the stored choice and any fresh cached rate. */
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  currency = readStoredCurrency();
  const cached = readCachedRate();
  if (cached) { rate = cached.fx; takenAt = cached.cachedAt; status = "ready"; }
}

/** The rate in memory, re-validated at `now`: a copy that has aged past the
 *  client TTL or whose published date is now too old is dropped, so a page
 *  left open for days never keeps showing an old estimate. */
function currentRate(now = Date.now()): FxRate | null {
  if (!rate) return null;
  if (now - takenAt >= CLIENT_TTL_MS || !validateRate(rate, now)) { rate = null; takenAt = 0; if (status === "ready") status = "idle"; }
  return rate;
}

/** True when the visitor picked a currency themselves (stored); false for the default. */
function hasStoredChoice(): boolean {
  try { return isCurrency(localStorage.getItem(CURRENCY_KEY)); } catch { return false; }
}

/** A page's preferred display currency (the golf booking service shows dollars first): applied
 *  only while the visitor has not chosen one, never stored, so their own choice always wins. */
export function preferCurrency(c: Currency) {
  load();
  if (hasStoredChoice() || currency === c) return;
  currency = c;
  emit();
  if (c === "USD") void ensureRate();
}

export const getCurrency = (): Currency => { load(); return currency; };
export const getRate = (): FxRate | null => { load(); return currentRate(); };
export const getStatus = (): FxStatus => { load(); currentRate(); return status; };
export const serverCurrency = (): Currency => DEFAULT_CURRENCY;
export const serverRate = (): FxRate | null => null;
export const serverStatus = (): FxStatus => "idle";

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

/** Fetch the day's rate when nothing fresh is in memory, whatever the choice,
 *  so switching to USD later is instant. One request at a time; after a
 *  failure, not again for a few minutes. */
export function ensureRate(): Promise<void> {
  load();
  const now = Date.now();
  if (currentRate(now) || fetching) return fetching ?? Promise.resolve();
  if (failedAt && now - failedAt < RETRY_AFTER_MS) return Promise.resolve();
  status = "loading"; emit();
  fetching = (async () => {
    try {
      const res = await fetch("/api/fx", { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      const fx = res.ok ? validateRate(await res.json()) : null;
      if (!fx) { failedAt = Date.now(); status = "unavailable"; return; }
      rate = fx; takenAt = Date.now(); failedAt = 0; status = "ready";
      try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ...fx, cachedAt: new Date(takenAt).toISOString() })); } catch { /* storage blocked */ }
    } catch {
      failedAt = Date.now(); status = "unavailable";
    } finally {
      fetching = null;
      emit();
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
