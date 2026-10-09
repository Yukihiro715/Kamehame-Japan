"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useBooking } from "@/components/site/booking-context";
import { RatingSummary } from "@/components/site/reviews";
import { countOf, fromPrice, perPersonOf, tierTotal, yen } from "@/lib/pricing";
import type { Lang } from "@/lib/i18n";
import type { ExperienceVariant, VariantPageCopy } from "@/lib/catalog";

type OptionsCopy = VariantPageCopy["options"];

/** The words and figures every price display on the golf page shares — the
 *  options panel, the sticky bar, the form summary and its confirmation —
 *  so they can never disagree. `total` is the package price for `n`
 *  golfers; null means the request is quoted individually. */
export function golfPriceParts(copy: OptionsCopy, total: number | null, n: number) {
  if (total === null) {
    return { custom: true as const, headline: copy.customQuote, line: countOf(copy.customQuoteLine, n) };
  }
  const { perPerson, approximate } = perPersonOf(total, n);
  return {
    custom: false as const,
    /** "From approx." / "1名 約" — the words before the per-person figure */
    lead: [copy.from, approximate ? copy.approx : ""].filter(Boolean).join(" "),
    perPerson, approximate,
    /** "From approx. ¥96,667" as one string */
    perPersonText: fromPrice(copy, perPerson, approximate),
    /** "¥290,000 total · 3 golfers" */
    totalLine: copy.total.replace("{total}", yen(total)).replace("{n}", String(n)),
    /** "¥290,000 total" */
    totalShort: copy.totalShort.replace("{total}", yen(total)),
    total,
  };
}

/** The one place on the golf page where the party size and the area are
 *  chosen (beside the photos on wide screens, under them on phones). Every
 *  other display — the sticky bar, the request form — reads the same state;
 *  nothing else on the page asks for these two choices again. */
export function GolfOptions({ variants, copy, lang, ctaLabel, parties }: {
  variants: ExperienceVariant[]; copy: OptionsCopy; lang: Lang; ctaLabel: string; parties: number[];
}) {
  const b = useBooking();
  if (!b) return null;
  const n = b.guestsNumber;
  const custom = b.customQuote;
  const jump = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector("#request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const showPrices = (e: React.MouseEvent) => {
    const d = document.querySelector<HTMLDetailsElement>("#prices");
    if (!d) return;
    e.preventDefault();
    d.open = true;
    d.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section className="bk-card go-card" id="golf-options" aria-labelledby="go-heading">
      <h2 id="go-heading" className="go-h">{copy.heading}</h2>
      <RatingSummary experience={b.experience.slug} lang={lang} href="#reviews" size={13} />

      <fieldset className="go-size">
        <legend>{copy.golfersLegend}</legend>
        <div className="go-seg">
          {parties.map((k) => (
            <label key={k} className={`go-seg-opt${n === k ? " on" : ""}`}>
              <input type="radio" name="golfers" value={k} checked={n === k} onChange={() => b.set({ guests: String(k) })} />
              <span>{countOf(copy.golfers, k)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="go-areas">
        <legend>{copy.areaLegend}</legend>
        <div className="go-area-grid">
          {variants.map((v) => {
            const on = b.variant === v.id;
            const p = golfPriceParts(copy, custom ? null : tierTotal(v.tiers, n), n);
            return (
              <label key={v.id} className={`go-area${on ? " on" : ""}`}>
                <input type="radio" name="area" value={v.id} checked={on} onChange={() => b.set({ variant: v.id })} />
                <span className="vp-check" aria-hidden="true"><Check size={13} /></span>
                <span className="go-title">{v.short}</span>
                <span className="go-line">{v.tagline}</span>
                {p.custom ? (
                  <span className="go-price quote"><b>{p.headline}</b><small>{p.line}</small></span>
                ) : (
                  <>
                    <span className="go-price">
                      {p.lead && <small className="go-lead">{p.lead}</small>}
                      <b>{yen(p.perPerson)}{copy.fromSuffix && <span className="go-suffix">{copy.fromSuffix}</span>}</b>
                      {copy.perPerson && <small className="go-unit">{copy.perPerson}</small>}
                    </span>
                    {/* the words wrap as they like; the figure never breaks */}
                    <span className="go-total">{p.totalLine.split(yen(p.total)).map((x, i, all) => <span key={i}>{x}{i < all.length - 1 && <span className="nw">{yen(p.total)}</span>}</span>)}</span>
                  </>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="go-note">{custom ? copy.customNote : copy.note}</p>
      <a className="bk-cta" href="#request-form" onClick={jump}>{ctaLabel} <ArrowRight size={16} /></a>
      <p className="go-cta-note"><ShieldCheck size={14} /> {copy.ctaNote}</p>
      <a className="go-all-prices" href="#prices" onClick={showPrices}>{copy.allPrices}</a>
    </section>
  );
}
