"use client";

import { useCurrency } from "@/components/site/currency-context";
import { approxUsd, fxText, hasYen } from "@/lib/currency";
import { yen } from "@/lib/pricing";
import { t, type Lang } from "@/lib/i18n";

/** A formatted price string ("From ¥82,500 / person", "¥330,000 total ·
 *  4 golfers") that follows the display currency: unchanged in yen, and
 *  with each yen figure rewritten as its dollar estimate in USD. With
 *  `brief`, the yen is left out (for headlines that show it on their own
 *  line via <JpyRef>). Strings without a yen figure ("Custom quote") pass
 *  through untouched, so unpriced products never get a conversion. */
export function Fx({ children, brief = false }: { children: string | undefined | null; brief?: boolean }) {
  const { usdActive, rate } = useCurrency();
  if (children == null) return null;
  if (!usdActive || !rate || !hasYen(children)) return <>{children}</>;
  return <>{fxText(children, rate.rate, brief)}</>;
}

/** A yen amount as the headline figure: "¥82,500", or "≈ US$550" in USD. */
export function Yen({ n }: { n: number }) {
  const { usdActive, rate } = useCurrency();
  if (!usdActive || !rate) return <>{yen(n)}</>;
  return <>{approxUsd(n, rate.rate)}</>;
}

/** The yen figure under a dollar headline ("¥82,500 / person · billed in
 *  JPY"). Renders nothing in yen mode, where the headline already is the yen. */
export function JpyRef({ n, unit, lang, className = "fx-jpy" }: { n: number; unit?: string; lang: Lang; className?: string }) {
  const { usdActive, rate } = useCurrency();
  if (!usdActive || !rate) return null;
  const F = t(lang).fx;
  return <small className={className}>{yen(n)}{unit ? ` ${unit}` : ""} · {F.billedIn}</small>;
}

/** Like <JpyRef>, for a headline that arrives as a formatted string ("¥25,000"). */
export function JpyRefText({ text, unit, lang, className = "fx-jpy" }: { text: string; unit?: string; lang: Lang; className?: string }) {
  const { usdActive, rate } = useCurrency();
  const m = /¥([\d,]+)/.exec(text);
  if (!usdActive || !rate || !m) return null;
  const F = t(lang).fx;
  return <small className={className}>{m[0]}{unit ? ` ${unit}` : ""} · {F.billedIn}</small>;
}

/** The estimate notice beside a USD price, with the rate it was made at.
 *  Renders nothing in yen mode. */
export function FxNote({ lang, short = false, className = "fx-note" }: { lang: Lang; short?: boolean; className?: string }) {
  const { usdActive, rate } = useCurrency();
  if (!usdActive || !rate) return null;
  const F = t(lang).fx;
  return <p className={className}>{short ? F.estimateShort : F.note} <span className="fx-rate">{F.rateAsOf(rate.rate, rate.date)}</span></p>;
}
