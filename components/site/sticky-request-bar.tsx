"use client";

import { useEffect, useState } from "react";

/** Bottom bar on small screens: shows once the first-view button has scrolled
 *  away, hides again while the request section (and its form) is on screen,
 *  and keeps clear of the iPhone home indicator. */
export function StickyRequestBar({
  price, condition, label, watchHero = "#hero-cta", watchTarget = "#request",
}: { price: string; condition: string; label: string; watchHero?: string; watchTarget?: string }) {
  const [heroGone, setHeroGone] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(watchHero);
    const target = document.querySelector(watchTarget);
    if (!hero || !target) return;
    const a = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    const b = new IntersectionObserver(([e]) => setTargetVisible(e.isIntersecting), { threshold: 0.05 });
    a.observe(hero); b.observe(target);
    return () => { a.disconnect(); b.disconnect(); };
  }, [watchHero, watchTarget]);

  const show = heroGone && !targetVisible;
  return (
    <div className={`sticky-request ${show ? "show" : ""}`} aria-hidden={!show}>
      <div className="sticky-price">
        <b>{price}</b>
        <small>{condition}</small>
      </div>
      <a className="booking-cta as-link" href={watchTarget} tabIndex={show ? 0 : -1}>{label}</a>
    </div>
  );
}
