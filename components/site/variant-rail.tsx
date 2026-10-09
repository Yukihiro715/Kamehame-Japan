"use client";

import { ArrowRight, CalendarDays, Check, Clock3, ShieldCheck } from "lucide-react";
import { useBooking } from "@/components/site/booking-context";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { RatingSummary } from "@/components/site/reviews";
import { countOf, fromPrice, yen } from "@/lib/pricing";
import { t, type Lang } from "@/lib/i18n";
import type { ExperienceVariant, VariantPageCopy } from "@/lib/catalog";

/** The card beside the page on a two-plan page (above it on phones): the
 *  price of the chosen plan, the plan switch, the button and the trust
 *  lines. It follows the scroll like the booking card on other pages, and
 *  reads the same booking state as the plan cards and the request form. */
export function VariantRail({ variants, copy, lang, ctaLabel, ctaNote }: {
  variants: ExperienceVariant[]; copy: VariantPageCopy["pricing"]; lang: Lang; ctaLabel: string; ctaNote: string;
}) {
  const b = useBooking();
  const D = t(lang).detail;
  if (!b) return null;
  const v = variants.find((x) => x.id === b.variant) ?? variants[0];
  const custom = b.customQuote;
  const jump = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector("#request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="bk-card vr-card" id="booking">
      <div className="bk-price">
        {!custom && copy.from && <small>{copy.from}</small>}
        <b>{custom ? copy.customQuote : <>{yen(v.price)}{copy.fromSuffix && <span className="from-suffix">{copy.fromSuffix}</span>}</>}</b>
        <small>{v.short} · {countOf(copy.golfers, b.guestsNumber)}{custom ? "" : ` · ${D.priceTotalNote}`}</small>
        <RatingSummary experience={b.experience.slug} lang={lang} href="#reviews" size={13} />
      </div>
      <fieldset className="bk-plans">
        <legend>{copy.packageCol}</legend>
        {variants.map((x) => (
          <label key={x.id} className={`bk-plan ${b.variant === x.id ? "on" : ""}`}>
            <input type="radio" name="rail-variant" value={x.id} checked={b.variant === x.id} onChange={() => b.set({ variant: x.id })} />
            <span className="bk-plan-check"><Check size={12} /></span>
            <span className="bk-plan-copy"><b>{x.cardTitle}</b><small>{x.tagline}</small></span>
            <span className="bk-plan-price">{fromPrice(copy, x.price)}</span>
          </label>
        ))}
      </fieldset>
      <a className="bk-cta" href="#request-form" onClick={jump}>{ctaLabel} <ArrowRight size={16} /></a>
      <ul className="bk-trust">
        <li><ShieldCheck size={14} /> {ctaNote}</li>
        <li><Clock3 size={14} /> {D.replyIn24}</li>
        <li><CalendarDays size={14} /> {D.availCutoff(b.experience.leadDays, b.experience.cutoffTime)}</li>
      </ul>
    </div>
  );
}

/** The page's photos with the chosen plan's photo first, so the big tile of
 *  the grid (and the phone carousel) shows the area the visitor picked. */
export function VariantGallery({ photos, variants, lang, note }: {
  photos: { img: string; alt: string }[]; variants: ExperienceVariant[]; lang: Lang; note?: string;
}) {
  const b = useBooking();
  const v = variants.find((x) => x.id === b?.variant);
  const ordered = v ? [{ img: v.img, alt: v.alt }, ...photos.filter((p) => p.img !== v.img)] : photos;
  const key = v?.id ?? "all";
  return (
    <>
      <div className="xp-hero-photo"><HeroCarousel key={key} photos={ordered} lang={lang} /></div>
      <Gallery key={`g-${key}`} photos={ordered} lang={lang} note={note} />
    </>
  );
}
