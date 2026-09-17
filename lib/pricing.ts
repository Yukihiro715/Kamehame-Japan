// Pricing derived for the detail page and the booking card.
//
// Two shapes of product share one view: plan-based experiences (a price per
// plan for a base party, extra guests each, regular and peak season) and
// flat per-group tables, plus per-person products that get a reference table.
// `rows` always describes the entry plan so summaries ("From ¥… for 2 guests")
// read the same whichever shape the catalog entry uses.

import type { Experience } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

export interface PriceRow { party: number; total: number; perPerson: number }

export interface PlanView {
  id: string; label: string; name: string; performers: string; blurb: string;
  regular: number; peak: number; recommended: boolean;
}

export interface PricingView {
  unit: "group" | "person";
  rows: PriceRow[];
  highSeason?: { rows: PriceRow[]; window: string };
  /** True when the venue takes larger parties than the table shows. */
  moreOnRequest: boolean;
  plans?: PlanView[];
  extraGuest?: { regular: number; peak: number; included: number; upTo: number };
  peakWindows?: { from: string; to: string }[];
  addOns?: { id: string; name: string; description: string; price?: number }[];
}

const yenFormat = new Intl.NumberFormat("en-US");
export const yen = (n: number) => `¥${yenFormat.format(n)}`;

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

  if (exp.priceUnit === "group" && pr?.plans && pr.extraGuest) {
    const eg = pr.extraGuest;
    const text = exp.planText ?? {};
    const plans: PlanView[] = pr.plans.map((p) => ({
      id: p.id, regular: p.regular, peak: p.peak, recommended: !!p.recommended,
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
      addOns: exp.addOns,
    };
  }

  // Per person: a short reference table across the party range.
  const unit = parseYen(exp.price);
  const parties = [...new Set([size.min, 2, 4, size.max].filter((n) => n >= size.min && n <= size.max))].sort((a, b) => a - b);
  return {
    unit: "person",
    rows: parties.map((party) => ({ party, total: unit * party, perPerson: unit })),
    moreOnRequest: false,
    addOns: exp.addOns,
  };
}

export interface Quote { total: number; peak: boolean; base: number; extraCount: number; extraEach: number }

/** Price of a plan for a party on a date. Null when the party is larger than
 *  the listed range (quoted individually) or the product has no plans. */
export function quote(view: PricingView, planId: string, guests: number, iso?: string): Quote | null {
  const plan = view.plans?.find((p) => p.id === planId);
  const eg = view.extraGuest;
  if (!plan || !eg || guests > eg.upTo) return null;
  const peak = !!iso && isPeak(iso, view.peakWindows);
  const base = peak ? plan.peak : plan.regular;
  const extraEach = peak ? eg.peak : eg.regular;
  const extraCount = Math.max(0, guests - eg.included);
  return { total: base + extraCount * extraEach, peak, base, extraCount, extraEach };
}
