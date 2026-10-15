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
