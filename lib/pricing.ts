// Pricing derived for the detail page and the booking card.
//
// Two shapes of product share one view: plan-based experiences (a price per
// plan for a base party, extra guests each, regular and peak season) and
// flat per-group tables, plus per-person products that get a reference table.
// `rows` always describes the entry plan so summaries ("From ¥… for 2 guests")
// read the same whichever shape the catalog entry uses.

import type { Experience, ExperienceVariant } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

export interface PriceRow { party: number; total: number; perPerson: number }

export interface PlanView {
  id: string; label: string; name: string; performers: string; blurb: string;
  regular: number; peak: number; recommended: boolean;
  /** Supplement plans: the flat amount added to the party-size table (0 for the base plan). */
  supplement?: number;
}

export interface PricingView {
  unit: "group" | "person";
  rows: PriceRow[];
  highSeason?: { rows: PriceRow[]; window: string };
  /** True when the venue takes larger parties than the table shows. */
  moreOnRequest: boolean;
  plans?: PlanView[];
  /** "supplement": plans are flat amounts on top of `rows` / `highSeason` (see Experience.pricing.plans). */
  planMode?: "supplement";
  extraGuest?: { regular: number; peak: number; included: number; upTo: number };
  peakWindows?: { from: string; to: string }[];
  addOns?: { id: string; name: string; description: string; price?: number; priceFrom?: boolean }[];
  /** Per-person products: the price per guest and the largest party it covers. */
  perPerson?: number;
  maxGuests?: number;
  /** A smaller party pays as this many guests. */
  minCharge?: number;
}

const yenFormat = new Intl.NumberFormat("en-US");
export const yen = (n: number) => `¥${yenFormat.format(n)}`;

/** "{n} golfers" → "2 golfers" (two-plan page copy). */
export const countOf = (template: string, n: number) => template.replace("{n}", String(n));

/** "From ¥125,000" / "1名 ¥125,000〜", as the language puts it; `approx`
 *  adds the rounded-figure word ("From approx. ¥96,667", "1名 約¥96,667〜"). */
export const fromPrice = (copy: { from: string; approx?: string; fromSuffix?: string }, price: number, approx = false) => {
  const lead = [copy.from, approx ? copy.approx : ""].filter(Boolean).join(" ");
  // "約" sits against the figure ("1名 約¥96,667〜"); every other lead takes a space.
  const gap = lead && !/[約约]$/.test(lead) ? " " : "";
  return `${lead}${gap}${yen(price)}${copy.fromSuffix ?? ""}`;
};

/** "¥45,000" → 45000 */
const parseYen = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  ja: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  "zh-tw": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};

export function windowLabel(windows: { from: string; to: string }[], lang: Lang): string {
  const m = MONTHS[lang];
  const fmt = (md: string) => {
    const [mm, dd] = md.split("-").map(Number);
    return lang === "ja" || lang === "zh-tw" ? `${m[mm - 1]}${dd}日` : `${dd} ${m[mm - 1]}`;
  };
  const sep = lang === "ja" || lang === "zh-tw" ? "〜" : "–";
  return windows.map((w) => `${fmt(w.from)}${sep}${fmt(w.to)}`).join(lang === "ja" || lang === "zh-tw" ? "、" : ", ");
}

/** True when the month-day of `iso` falls inside any window (windows may wrap the year end). */
export function isPeak(iso: string, windows?: { from: string; to: string }[]): boolean {
  if (!windows?.length || iso.length < 10) return false;
  const md = iso.slice(5, 10);
  return windows.some((w) => (w.from <= w.to ? md >= w.from && md <= w.to : md >= w.from || md <= w.to));
}

export function pricingFor(exp: Experience, lang: Lang): PricingView {
  const size = exp.partySize ?? { min: 1, max: 6 };
  const pr = exp.pricing;

  // Party-size table plus flat plan supplements (e.g. the geiko evening: a
  // base table by party, then +¥ for live shamisen or a second performer).
  if (exp.priceUnit === "group" && pr?.tiers && pr.plans) {
    const text = exp.planText ?? {};
    const toRows = (t: { party: number; total: number }[]) => t.map((r) => ({ party: r.party, total: r.total, perPerson: Math.round(r.total / r.party) }));
    const rows = toRows(pr.tiers);
    const hs = pr.highSeason;
    const hsRows = hs ? toRows(hs.tiers) : undefined;
    const plans: PlanView[] = pr.plans.map((p) => {
      const sup = p.supplement ?? 0;
      return {
        id: p.id, supplement: sup, recommended: !!p.recommended,
        regular: rows[0].total + sup, peak: (hsRows?.[0].total ?? rows[0].total) + sup,
        label: text[p.id]?.label ?? p.id, name: text[p.id]?.name ?? exp.title,
        performers: text[p.id]?.performers ?? "", blurb: text[p.id]?.blurb ?? "",
      };
    });
    return {
      unit: "group",
      rows,
      highSeason: hs && hsRows ? { rows: hsRows, window: windowLabel(hs.windows, lang) } : undefined,
      moreOnRequest: size.max > Math.max(...rows.map((r) => r.party)),
      plans, planMode: "supplement", peakWindows: hs?.windows, addOns: exp.addOns,
    };
  }

  if (exp.priceUnit === "group" && pr?.plans && pr.extraGuest) {
    const eg = pr.extraGuest;
    const text = exp.planText ?? {};
    const plans: PlanView[] = pr.plans.map((p) => ({
      id: p.id, regular: p.regular ?? 0, peak: p.peak ?? p.regular ?? 0, recommended: !!p.recommended,
      label: text[p.id]?.label ?? p.id, name: text[p.id]?.name ?? exp.title,
      performers: text[p.id]?.performers ?? "", blurb: text[p.id]?.blurb ?? "",
    }));
    const base = plans[0];
    const table = (price: number, extra: number) =>
      Array.from({ length: eg.upTo - eg.included + 1 }, (_, i) => {
        const party = eg.included + i;
        const total = price + (party - eg.included) * extra;
        return { party, total, perPerson: Math.round(total / party) };
      });
    const windows = pr.peakWindows ?? [];
    return {
      unit: "group",
      rows: table(base.regular, eg.regular),
      highSeason: windows.length ? { rows: table(base.peak, eg.peak), window: windowLabel(windows, lang) } : undefined,
      moreOnRequest: size.max > eg.upTo,
      plans, extraGuest: eg, peakWindows: windows, addOns: exp.addOns,
    };
  }

  if (exp.priceUnit === "group" && pr?.tiers) {
    const rows = pr.tiers.map((t) => ({ party: t.party, total: t.total, perPerson: Math.round(t.total / t.party) }));
    const hs = pr.highSeason;
    return {
      unit: "group",
      rows,
      highSeason: hs && {
        rows: hs.tiers.map((t) => ({ party: t.party, total: t.total, perPerson: Math.round(t.total / t.party) })),
        window: windowLabel(hs.windows, lang),
      },
      moreOnRequest: size.max > Math.max(...rows.map((r) => r.party)),
      peakWindows: hs?.windows,
      addOns: exp.addOns,
    };
  }

  // Per person: a short reference table across the party range.
  const unit = parseYen(exp.price);
  const minCharge = pr?.minCharge ?? 1;
  const parties = [...new Set([size.min, 2, 4, size.max].filter((n) => n >= size.min && n <= size.max))].sort((a, b) => a - b);
  return {
    unit: "person",
    rows: parties.map((party) => {
      const total = unit * Math.max(party, minCharge);
      return { party, total, perPerson: Math.round(total / party) };
    }),
    minCharge,
    moreOnRequest: false,
    addOns: exp.addOns,
    perPerson: unit,
    maxGuests: size.max,
  };
}

export interface Quote { total: number; peak: boolean; base: number; extraCount: number; extraEach: number }

/** Price of a plan for a party on a date (or, for per-person products, the
 *  party's total). Null when the party is larger than the listed range
 *  (quoted individually) or there is nothing to price. */
export function quote(view: PricingView, planId: string, guests: number, iso?: string): Quote | null {
  if (!view.plans?.length && view.unit === "person" && view.perPerson) {
    if (view.maxGuests && guests > view.maxGuests) return null;
    const total = view.perPerson * Math.max(guests, view.minCharge ?? 1);
    return { total, peak: false, base: total, extraCount: 0, extraEach: 0 };
  }
  // Flat group table: the row for this party size (high-season table when the
  // date falls in it), plus the chosen plan's flat supplement where plans are
  // supplements rather than separate price lists.
  if ((!view.plans?.length || view.planMode === "supplement") && view.unit === "group") {
    const peak = !!iso && !!view.highSeason && !!view.peakWindows?.length && isPeak(iso, view.peakWindows);
    const row = (peak ? view.highSeason!.rows : view.rows).find((r) => r.party === guests);
    const sup = view.plans?.find((p) => p.id === planId)?.supplement ?? 0;
    return row ? { total: row.total + sup, peak, base: row.total, extraCount: sup ? 1 : 0, extraEach: sup } : null;
  }
  const plan = view.plans?.find((p) => p.id === planId);
  const eg = view.extraGuest;
  if (!plan || !eg || guests > eg.upTo) return null;
  const peak = !!iso && isPeak(iso, view.peakWindows);
  const base = peak ? plan.peak : plan.regular;
  const extraEach = peak ? eg.peak : eg.regular;
  const extraCount = Math.max(0, guests - eg.included);
  return { total: base + extraCount * extraEach, peak, base, extraCount, extraEach };
}

/** Price view of one alternative on a two-plan page: its package table by
 *  party size. Any party size outside the table is quoted. */
export function pricingForVariant(exp: Experience, v: ExperienceVariant, lang: Lang): PricingView {
  return pricingFor({ ...exp, pricing: { ...(exp.pricing ?? {}), tiers: v.tiers, plans: undefined, highSeason: undefined } }, lang);
}

/** Per-person figure of a group price, for display only: rounded, and
 *  flagged as approximate when it does not divide exactly (three golfers). */
export const perPersonOf = (total: number, n: number) => ({ perPerson: Math.round(total / n), approximate: total % n !== 0 });

/** The package total for a party size, or null when that size is quoted. */
export const tierTotal = (tiers: { party: number; total: number }[], n: number) => tiers.find((t) => t.party === n)?.total ?? null;
