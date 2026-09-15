// Party-size pricing derived for the detail page.
//
// Group-priced experiences carry confirmed tiers on the catalog entry. Per-
// person experiences derive a reference table from the unit price so the same
// component renders both — and the per-person figure is always labelled as
// the reference, never the headline, for group-priced products.

import type { Experience } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

export interface PriceRow { party: number; total: number; perPerson: number }

export interface PricingView {
  unit: "group" | "person";
  rows: PriceRow[];
  highSeason?: { rows: PriceRow[]; window: string };
  /** True when the venue takes larger parties than the table shows. */
  moreOnRequest: boolean;
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

function windowLabel(windows: { from: string; to: string }[], lang: Lang): string {
  const m = MONTHS[lang];
  const fmt = (md: string) => {
    const [mm, dd] = md.split("-").map(Number);
    return lang === "ja" || lang === "zh-tw" ? `${m[mm - 1]}${dd}日` : `${dd} ${m[mm - 1]}`;
  };
  const sep = lang === "ja" || lang === "zh-tw" ? "〜" : "–";
  return windows.map((w) => `${fmt(w.from)}${sep}${fmt(w.to)}`).join(lang === "ja" ? "、" : lang === "zh-tw" ? "、" : ", ");
}

export function pricingFor(exp: Experience, lang: Lang): PricingView {
  const size = exp.partySize ?? { min: 1, max: 6 };

  if (exp.priceUnit === "group" && exp.pricing) {
    const rows = exp.pricing.tiers.map((t) => ({ party: t.party, total: t.total, perPerson: Math.round(t.total / t.party) }));
    const hs = exp.pricing.highSeason;
    return {
      unit: "group",
      rows,
      highSeason: hs && {
        rows: hs.tiers.map((t) => ({ party: t.party, total: t.total, perPerson: Math.round(t.total / t.party) })),
        window: windowLabel(hs.windows, lang),
      },
      moreOnRequest: size.max > Math.max(...rows.map((r) => r.party)),
    };
  }

  // Per person: a short reference table across the party range.
  const unit = parseYen(exp.price);
  const parties = [...new Set([size.min, 2, 4, size.max].filter((n) => n >= size.min && n <= size.max))].sort((a, b) => a - b);
  return {
    unit: "person",
    rows: parties.map((party) => ({ party, total: unit * party, perPerson: unit })),
    moreOnRequest: false,
  };
}
