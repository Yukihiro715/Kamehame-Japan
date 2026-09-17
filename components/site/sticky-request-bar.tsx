"use client";

import { useEffect, useState } from "react";
import { useBooking } from "@/components/site/booking-context";
import { yen } from "@/lib/pricing";
import { t, type Lang } from "@/lib/i18n";

/** Bottom bar on small screens: shows once the booking card has scrolled
 *  away, hides again while the request section (and its form) is on screen,
 *  and keeps clear of the iPhone home indicator. Inside a BookingProvider it
 *  follows the chosen plan and head count. */
export function StickyRequestBar({
  price, condition, label, lang, watchHero = "#hero-cta", watchTarget = "#request",
}: { price: string; condition: string; label: string; lang?: Lang; watchHero?: string; watchTarget?: string }) {
  const [heroGone, setHeroGone] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
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

  const plan = b?.pricing?.plans?.find((p) => p.id === b.plan);
  const shownPrice = b && plan ? yen(b.estimate?.total ?? plan.regular) : price;
  const shownCondition = b && plan && D ? `${plan.label} · ${D.estimateFor(b.guestsNumber)}` : condition;

  const show = heroGone && !targetVisible;
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
