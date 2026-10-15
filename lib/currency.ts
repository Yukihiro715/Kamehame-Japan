// Display currency. Every price on the site is set, quoted, charged and
// measured in Japanese yen; US dollars are shown only as an estimate beside
// the yen figure, from a published daily rate (see app/api/fx/route.ts).
// Nothing here changes what is sent to the booking API, Stripe or GA4.

export type Currency = "JPY" | "USD";
export const CURRENCIES: Currency[] = ["JPY", "USD"];
export const DEFAULT_CURRENCY: Currency = "JPY";
export const isCurrency = (v: unknown): v is Currency => v === "JPY" || v === "USD";

/** localStorage keys: the visitor's choice, and the cached rate. */
export const CURRENCY_KEY = "kh-currency";
export const FX_CACHE_KEY = "kh-fx";

/** A published USD→JPY reference rate and when it was published. */
export interface FxRate {
  base: "USD";
  quote: "JPY";
  /** Yen per one US dollar. */
  rate: number;
  /** Date the rate was published (ISO date, e.g. "2026-10-14"). */
  date: string;
  /** When the server fetched it (ISO date-time). */
  fetchedAt: string;
  /** True when the source was unreachable and the last known rate is served instead. */
  stale?: boolean;
}

/** Sanity bounds: anything outside is treated as a bad response, not a rate. */
export const isPlausibleRate = (r: unknown): r is number => typeof r === "number" && Number.isFinite(r) && r > 50 && r < 400;

/** How old a published rate may be before dollars are no longer shown. The
 *  source publishes on working days, so a long weekend or a holiday run is
 *  a few days; a week means the feed has been failing and the estimate would
 *  mislead. Past this, the site shows yen only until a fresh rate arrives. */
export const MAX_RATE_AGE_DAYS = 7;
/** A published date may run a little ahead of the visitor's clock (time zones). */
const FUTURE_TOLERANCE_MS = 36 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Age of a published rate in days at `now`, from its ISO date (UTC midnight). */
export const rateAgeDays = (date: string, now = Date.now()) => (now - Date.parse(`${date}T00:00:00Z`)) / DAY_MS;

/** The rate as a verified value, or null for anything that cannot be trusted:
 *  wrong currencies, an implausible figure, a malformed or future date, or a
 *  date older than MAX_RATE_AGE_DAYS. Accepts any parsed JSON. */
export function validateRate(input: unknown, now = Date.now()): FxRate | null {
  if (!input || typeof input !== "object") return null;
  const fx = input as Partial<FxRate>;
  if (fx.base !== "USD" || fx.quote !== "JPY" || !isPlausibleRate(fx.rate)) return null;
  if (typeof fx.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fx.date)) return null;
  const published = Date.parse(`${fx.date}T00:00:00Z`);
  if (!Number.isFinite(published)) return null;
  if (published - now > FUTURE_TOLERANCE_MS) return null;
  if (rateAgeDays(fx.date, now) > MAX_RATE_AGE_DAYS) return null;
  const fetchedAt = typeof fx.fetchedAt === "string" && Number.isFinite(Date.parse(fx.fetchedAt)) ? fx.fetchedAt : new Date(now).toISOString();
  return { base: "USD", quote: "JPY", rate: fx.rate, date: fx.date, fetchedAt, ...(fx.stale ? { stale: true } : {}) };
}

/** True when a cached copy taken at `cachedAt` is still within `ttlMs` of
 *  `now`. A missing, unparsable or future timestamp counts as expired. */
export function cacheIsFresh(cachedAt: unknown, ttlMs: number, now = Date.now()): boolean {
  if (typeof cachedAt !== "string") return false;
  const age = now - Date.parse(cachedAt);
  return Number.isFinite(age) && age >= 0 && age < ttlMs;
}

const usdFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Whole dollars for a yen amount at the given rate (yen per dollar). */
export const usdOf = (yen: number, rate: number) => Math.round(yen / rate);

/** "US$550" — never a bare "$", which could be read as another dollar. */
export const usd = (n: number) => `US$${usdFormat.format(n)}`;

/** "≈ US$550" */
export const approxUsd = (yen: number, rate: number) => `≈ ${usd(usdOf(yen, rate))}`;

const YEN_RE = /¥([\d,]+)/g;
/** Words that already say "about", after which a second "≈" would be noise. */
const APPROX_BEFORE = /(approx\.?|aprox\.?|env\.?|environ|約|约)\s*$/i;

/** Rewrites every yen figure in an already-formatted string as its dollar
 *  estimate, keeping the yen beside it: "From ¥82,500 / person" becomes
 *  "From ≈ US$550 (¥82,500) / person". With `brief`, the yen is dropped
 *  ("From ≈ US$550 / person") for places that show it on their own line. */
export function fxText(text: string, rate: number, brief = false): string {
  return text.replace(YEN_RE, (match, digits: string, offset: number) => {
    const n = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(n)) return match;
    const before = text.slice(0, offset);
    const tilde = APPROX_BEFORE.test(before) ? "" : "≈ ";
    return brief ? `${tilde}${usd(usdOf(n, rate))}` : `${tilde}${usd(usdOf(n, rate))} (${match})`;
  });
}

/** True when the string carries a yen figure that can be converted. */
export const hasYen = (text: string) => /¥[\d,]+/.test(text);
