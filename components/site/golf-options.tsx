"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useBooking } from "@/components/site/booking-context";
import { GuestStepper } from "@/components/site/guest-stepper";
import { GOLF_FIXED_FEE_MAX, isArrangement } from "@/lib/golf-prices";
import { clubRentalTotal, CLUB_RENTAL_COPY, GOLF_CLUB_RENTAL_JPY, type ClubRentalCopy } from "@/lib/golf-club-rental";
import { useClubRental } from "@/components/site/club-rental-context";
import { useCurrency } from "@/components/site/currency-context";
import { Fx, FxNote, JpyRef, Yen } from "@/components/site/money";
import { RatingSummary } from "@/components/site/reviews";
import { countOf, fromPrice, golfFeeBreakdown, perPersonOf, perPersonRefText, tierTotal, yen } from "@/lib/pricing";
import type { Lang } from "@/lib/i18n";
import type { ExperienceVariant, VariantPageCopy } from "@/lib/catalog";

type OptionsCopy = VariantPageCopy["options"];

/** The words and figures every price display on the golf page shares — the
 *  options panel, the sticky bar, the form summary and its confirmation —
 *  so they can never disagree. The package leads with the per-person figure and
 *  puts the group total under it; the booking service (`leadTotal`) leads with the
 *  group fee and puts its breakdown ("¥15,000 + ¥5,000 × 1 additional golfer") under
 *  it, since the fee is not a per-golfer amount. `total` is the price for `n`
 *  golfers; null means the request is quoted individually. */
export function golfPriceParts(copy: OptionsCopy, total: number | null, n: number, large = false, rentals = 0, rentalCopy?: ClubRentalCopy) {
  if (total === null) {
    return large
      ? { custom: true as const, headline: copy.largePartyQuote ?? copy.customQuote, line: countOf(copy.largePartyLine ?? copy.customQuoteLine, n) }
      : { custom: true as const, headline: copy.customQuote, line: countOf(copy.customQuoteLine, n) };
  }
  // The booking service's chosen-set club rental: added to the fee, named in the breakdown.
  const rental = isArrangement() && rentalCopy ? clubRentalTotal(rentals) : 0;
  const fee = total;
  total = fee + rental;
  const { perPerson, approximate } = perPersonOf(total, n);
  const totalWords = copy.total.replace("{n}", String(n)).split("{total}").map((x) => x.trim());
  // With the club rental added, the headline is a grand total, not the fee: "総額 ¥35,000" / "¥35,000 total".
  const shortTemplate = rental > 0 && rentalCopy ? rentalCopy.grandTotal : copy.totalShort;
  const shortWords = shortTemplate.split("{total}").map((x) => x.trim());
  const ppWords = copy.perPersonRef.split("{price}").map((x) => x.trim());
  return {
    /** The booking service: the group fee leads and `breakdown` is the small line */
    leadTotal: isArrangement(),
    breakdown: rental > 0 && rentalCopy
      ? rentalCopy.total.replace("{fee}", yen(fee)).replace("{rental}", yen(GOLF_CLUB_RENTAL_JPY)).replace("{n}", String(rentals))
      : isArrangement() ? golfFeeBreakdown(copy, n) : "",
    /** The fee alone and the rental on top, for the confirmation's lines */
    fee, rental,
    /** The words of `perPersonRef` before the figure ("1名あたり", "每位") and after it ("/ person") */
    ppPrefix: ppWords[0], ppUnit: ppWords[1],
    /** "¥87,500 / person" — beside a fixed total */
    perPersonRef: perPersonRefText(copy, perPerson, approximate),
    custom: false as const,
    /** "From approx." / "1名 約" — the words before the per-person figure */
    lead: [copy.from, approximate ? copy.approx : ""].filter(Boolean).join(" "),
    perPerson, approximate,
    /** "From approx. ¥96,667" as one string */
    perPersonText: fromPrice(copy, perPerson, approximate),
    /** "¥125,000 / person" / "approx. ¥96,667 / person" — the per-person line beside the total. The package
     *  price is fixed for the chosen area and party, so there is no "From". */
    perPersonLine: perPersonRefText(copy, perPerson, approximate),
    /** "¥290,000 total · 3 golfers" */
    totalLine: copy.total.replace("{total}", yen(total)).replace("{n}", String(n)),
    /** The words of `totalLine` before the figure ("3名参加時／1組合計") and after it ("total · 3 golfers") */
    totalLead: totalWords[0], totalUnit: totalWords[1],
    /** The word of `totalShort` ("total" / "1組合計") and whether it follows the figure */
    totalWord: shortWords[1] || shortWords[0], totalWordAfter: !!shortWords[1],
    /** "¥290,000 total" */
    totalShort: shortTemplate.replace("{total}", yen(total)),
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
  const { usdActive } = useCurrency();
  const clubRental = useClubRental();
  if (!b) return null;
  const n = b.guestsNumber;
  // Five golfers or more in the booking service: no published fee, quoted for the group.
  const large = isArrangement() && n > GOLF_FIXED_FEE_MAX;
  const custom = b.customQuote || large;
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
        <GolfersSeg parties={parties} copy={copy} name="golfers" />
      </fieldset>

      {isArrangement() ? (() => {
        // The booking service charges the same fee in both areas, so the area is a pair of pills
        // (as in the form) and the fee is shown once under them (owner, 2026-10-24).
        const chosen = variants.find((v) => v.id === b.variant) ?? variants[0];
        const p = golfPriceParts(copy, custom ? null : tierTotal(chosen.tiers, n), n, large, clubRental ? b.clubRentals : 0, CLUB_RENTAL_COPY[lang]);
        return (
          <>
            <fieldset className="go-size">
              <legend>{copy.areaLegend}</legend>
              <div className={`go-seg${variants.length === 2 ? " two" : ""}`}>
                {variants.map((v) => (
                  <label key={v.id} className={`go-seg-opt${b.variant === v.id ? " on" : ""}`}>
                    <input type="radio" name="area" value={v.id} checked={b.variant === v.id} onChange={() => b.set({ variant: v.id })} />
                    <span>{b.variant === v.id && <Check size={13} aria-hidden="true" />}{v.short}</span>
                  </label>
                ))}
              </div>
              <p className="go-area-line">{chosen.tagline}</p>
            </fieldset>
            <div className="go-fee" aria-live="polite">
              {p.custom ? (
                <><b className="go-fee-quote">{p.headline}</b><small>{p.line}</small></>
              ) : (
                <>
                  <span className="go-fee-main">
                    {!p.totalWordAfter && p.totalWord && <small>{p.totalWord}</small>}
                    <b><Yen n={p.total} /></b>
                    {p.totalWordAfter && p.totalWord && <small>{p.totalWord}</small>}
                  </span>
                  <JpyRef n={p.total} unit={p.totalWordAfter ? p.totalWord : undefined} lang={lang} />
                  <small className="go-breakdown">{p.breakdown}</small>
                </>
              )}
            </div>
          </>
        );
      })() : (
      <fieldset className="go-areas">
        <legend>{copy.areaLegend}</legend>
        <div className="go-area-grid">
          {variants.map((v) => {
            const on = b.variant === v.id;
            const p = golfPriceParts(copy, custom ? null : tierTotal(v.tiers, n), n, large);
            return (
              <label key={v.id} className={`go-area${on ? " on" : ""}`}>
                <input type="radio" name="area" value={v.id} checked={on} onChange={() => b.set({ variant: v.id })} />
                <span className="vp-check" aria-hidden="true"><Check size={13} /></span>
                <span className="go-title">{v.short}</span>
                <span className="go-line">{v.tagline}</span>
                {p.custom ? (
                  <span className="go-price quote"><b>{p.headline}</b><small>{p.line}</small></span>
                ) : p.leadTotal ? (
                  <span className="go-price wide">
                    {/* the booking service: one figure, the group fee; its breakdown in a quiet line under it */}
                    {!p.totalWordAfter && p.totalWord && <small className="go-lead">{p.totalWord}</small>}
                    <b><Yen n={p.total} /></b>
                    {p.totalWordAfter && p.totalWord && <small className="go-unit">{p.totalWord}</small>}
                    <JpyRef n={p.total} unit={p.totalWordAfter ? p.totalWord : undefined} lang={lang} />
                    <small className="go-breakdown">{p.breakdown}</small>
                  </span>
                ) : (
                  <>
                    <span className="go-price">
                      {/* the per-person figure leads, as on the rest of the market; the group total follows */}
                      {(p.ppPrefix || (p.approximate && !usdActive)) && <small className="go-lead">{[p.ppPrefix, p.approximate && !usdActive ? copy.approx : ""].filter(Boolean).join(" ")}</small>}
                      <b><Yen n={p.perPerson} /></b>
                      {p.ppUnit && <small className="go-unit">{p.ppUnit}</small>}
                      <JpyRef n={p.perPerson} unit={p.ppUnit || undefined} lang={lang} />
                    </span>
                    <span className="go-tt"><Fx>{p.totalLine}</Fx></span>
                  </>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
      )}

      <p className="go-includes">{copy.includes}</p>
      {custom ? <p className="go-note">{large ? copy.largePartyNote ?? copy.customNote : copy.customNote}</p> : (
        <div className="go-assure"><ShieldCheck size={16} aria-hidden="true" /><div><b>{copy.assure.heading}</b><p>{copy.assure.body}</p></div></div>
      )}
      <FxNote lang={lang} short />
      <a className="bk-cta" href="#request-form" onClick={jump}>{ctaLabel} <ArrowRight size={16} /></a>
      <p className="go-cta-note"><ShieldCheck size={14} /> {copy.ctaNote}</p>
      <a className="go-all-prices" href="#prices" onClick={showPrices}>{copy.allPrices}</a>
    </section>
  );
}

/** The party-size control: one pill per size, the chosen one marked like the
 *  area cards (ink border, cream fill, a check). Shared by the panel and the
 *  form's summary; both write the same booking state. */
function GolfersSeg({ parties, copy, name }: { parties: number[]; copy: Pick<OptionsCopy, "golfers" | "moreGolfers">; name: string }) {
  const b = useBooking();
  if (!b) return null;
  const n = b.guestsNumber;
  // Sizes with a published fee get a pill each; the larger sizes (quoted) share
  // one "5 or more" pill that opens a stepper, so the row stays short.
  const fixed = parties.filter((k) => k <= GOLF_FIXED_FEE_MAX);
  const extra = parties.filter((k) => k > GOLF_FIXED_FEE_MAX);
  const large = extra.length > 0 && n > GOLF_FIXED_FEE_MAX;
  return (
    <div className="go-seg-wrap">
      <div className="go-seg">
        {fixed.map((k) => (
          <label key={k} className={`go-seg-opt${n === k ? " on" : ""}`}>
            <input type="radio" name={name} value={k} checked={n === k} onChange={() => b.set({ guests: String(k) })} />
            <span>{n === k && <Check size={13} aria-hidden="true" />}{countOf(copy.golfers, k)}</span>
          </label>
        ))}
        {extra.length > 0 && (
          <label className={`go-seg-opt${large ? " on" : ""}`}>
            <input type="radio" name={name} value={large ? n : extra[0]} checked={large} onChange={() => b.set({ guests: String(extra[0]) })} />
            <span>{large && <Check size={13} aria-hidden="true" />}{copy.moreGolfers ?? `${extra[0]}+`}</span>
          </label>
        )}
      </div>
      {large && (
        <GuestStepper id={`${name}-count`} value={String(n)} min={extra[0]} max={extra[extra.length - 1]} onChange={(v) => b.set({ guests: v })} label={(k) => countOf(copy.golfers, k)} decLabel="−" incLabel="+" />
      )}
    </div>
  );
}

/** The same two choices in a compact form, for the top of the request form:
 *  the party size, then the area as pills. Same booking state as the panel. */
export function GolfQuickPick({ variants, copy, parties, name }: {
  variants: ExperienceVariant[]; copy: Pick<OptionsCopy, "golfers" | "golfersLegend" | "areaLegend">; parties: number[]; name: string;
}) {
  const b = useBooking();
  if (!b) return null;
  return (
    <div className="go-pick">
      <fieldset className="go-size">
        <legend>{copy.golfersLegend}</legend>
        <GolfersSeg parties={parties} copy={copy} name={`${name}-golfers`} />
      </fieldset>
      <fieldset className="go-size">
        <legend>{copy.areaLegend}</legend>
        <div className={`go-seg${variants.length === 2 ? " two" : ""}`}>
          {variants.map((v) => (
            <label key={v.id} className={`go-seg-opt${b.variant === v.id ? " on" : ""}`}>
              <input type="radio" name={`${name}-area`} value={v.id} checked={b.variant === v.id} onChange={() => b.set({ variant: v.id })} />
              <span>{b.variant === v.id && <Check size={13} aria-hidden="true" />}{v.short}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
