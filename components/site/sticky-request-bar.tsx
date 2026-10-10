"use client";

import { useEffect, useState } from "react";
import { useBooking } from "@/components/site/booking-context";
import { golfPriceParts } from "@/components/site/golf-options";
import { countOf, tierTotal, yen } from "@/lib/pricing";
import { t, type Lang } from "@/lib/i18n";
import type { VariantPageCopy } from "@/lib/catalog";

/** Bottom bar on small screens: shows once the first-view button has
 *  scrolled away, hides again while the request section (and its form) is on
 *  screen, while a field anywhere has the keyboard up, and while the photo
 *  sheet or lightbox is open (body[data-kh-modal]); it keeps clear of the
 *  iPhone home indicator. Inside a BookingProvider it follows the chosen plan
 *  and head count; on the golf page (`golf` copy) it names the area, the
 *  party size, the per-person figure and the group total, or "Custom quote". */
export function StickyRequestBar({
  price, condition, label, lang, watchHero = "#hero-cta", watchTarget = "#request", golf,
}: { price: string; condition: string; label: string; lang?: Lang; watchHero?: string; watchTarget?: string; golf?: VariantPageCopy["options"] }) {
  const [heroGone, setHeroGone] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const [typing, setTyping] = useState(false);
  const b = useBooking();
  const D = lang ? t(lang).detail : undefined;

  useEffect(() => {
    const hero = document.querySelector(watchHero);
    const target = document.querySelector(watchTarget);
    if (!hero || !target) return;
    const a = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    const bb = new IntersectionObserver(([e]) => setTargetVisible(e.isIntersecting), { threshold: 0.05 });
    a.observe(hero); bb.observe(target);
    return () => { a.disconnect(); bb.disconnect(); };
  }, [watchHero, watchTarget]);

  // A soft keyboard would otherwise sit under the bar: hide it while any field has focus.
  useEffect(() => {
    // Text-like fields only: a radio or checkbox never raises the keyboard.
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el instanceof HTMLInputElement && !/^(radio|checkbox|button|submit)$/.test(el.type)));
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setTyping(true); };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => { document.removeEventListener("focusin", onIn); document.removeEventListener("focusout", onOut); };
  }, []);

  const plan = b?.pricing?.plans?.find((p) => p.id === b.plan);
  const variant = b?.variantView;
  const perPerson = !!b && !plan && !variant && !!b.estimate;
  const show = heroGone && !targetVisible && !typing;

  if (b && variant && golf) {
    const n = b.guestsNumber;
    const p = golfPriceParts(golf, b.customQuote ? null : tierTotal(variant.tiers, n), n);
    return (
      <div className={`sticky-request sticky-golf ${show ? "show" : ""}`} aria-hidden={!show}>
        <div className="sticky-price">
          <small>{variant.short} · {countOf(golf.golfers, n)}</small>
          {p.custom ? <b>{p.headline}</b> : (
            <>
              <b>{yen(p.perPerson)}<em>{golf.fromSuffix}{golf.perPerson}{p.approximate ? ` · ${golf.approx}` : ""}</em></b>
              <small>{p.totalShort}</small>
            </>
          )}
        </div>
        <a className="booking-cta as-link" href={watchTarget} tabIndex={show ? 0 : -1}>{label}</a>
      </div>
    );
  }

  let shownPrice = price;
  let shownCondition = condition;
  if (b && plan) {
    // Per person, like the golf bar: exact once a party size is chosen, otherwise the base-party "from" figure.
    const total = b.estimate?.total ?? plan.regular;
    const n = b.estimate ? b.guestsNumber : (b.pricing?.rows[0]?.party ?? b.guestsNumber);
    shownPrice = `${yen(Math.round(total / n))}${!b.estimate && D ? D.fromSuffix : ""}`;
    if (D) shownCondition = `${plan.label} · ${D.totalForParty(yen(total), n)}`;
  } else if (perPerson) {
    shownPrice = yen(b!.estimate!.total);
    if (D) shownCondition = D.estimateFor(b!.guestsNumber);
  }

  return (
    <div className={`sticky-request ${show ? "show" : ""}`} aria-hidden={!show}>
      <div className="sticky-price">
        <b>{shownPrice}</b>
        <small>{shownCondition}</small>
      </div>
      <a className="booking-cta as-link" href={watchTarget} tabIndex={show ? 0 : -1}>{label}</a>
    </div>
  );
}
