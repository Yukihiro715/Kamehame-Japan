"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import type { Photo } from "@/components/site/gallery";

/** First-view photos: a swipeable, snap-scrolling track that advances on its
 *  own every few seconds (pausing while it is hovered, touched, off screen,
 *  or when the visitor prefers reduced motion). Photos load two slides ahead
 *  of the one in view — native lazy-loading inside a horizontal track is
 *  unreliable on iOS Safari and left slides black. Tapping any slide or the
 *  photo-count button opens the all-photos sheet in the gallery component. */
export function HeroCarousel({ photos, lang, children }: { photos: Photo[]; lang: Lang; children?: React.ReactNode }) {
  const D = t(lang).detail;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = photos.length > 1;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + photos.length) % photos.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  // Counter follows whichever photo is snapped into view.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-advance, but only while the carousel is actually being looked at.
  useEffect(() => {
    if (!many || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = track.current;
    if (!el) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 });
    io.observe(el);
    const id = window.setInterval(() => {
      if (!visible || document.hidden) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: ((i + 1) % photos.length) * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => { window.clearInterval(id); io.disconnect(); };
  }, [many, paused, photos.length]);

  const openAll = () => window.dispatchEvent(new CustomEvent("kh:photos"));
  // Slides up to two ahead of the current one carry a src; the rest wait.
  const loadUpTo = Math.max(1, index + 2);

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      <div className="hero-track" ref={track}>
        {photos.map((p, i) => (
          <figure key={p.img + i} className="hero-slide">
            <button type="button" onClick={openAll} aria-label={D.viewAllPhotos}>
              <img src={i <= loadUpTo ? p.img : undefined} alt={p.alt} fetchPriority={i === 0 ? "high" : undefined} />
            </button>
          </figure>
        ))}
      </div>
      {children}
      {many && (
        <>
          <button type="button" className="hero-arrow prev" aria-label="Previous" onClick={() => go(index - 1)}><ChevronLeft size={20} /></button>
          <button type="button" className="hero-arrow next" aria-label="Next" onClick={() => go(index + 1)}><ChevronRight size={20} /></button>
          <div className="hero-dots" role="tablist">
            {photos.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`${i + 1} / ${photos.length}`} onClick={() => go(i)} />
            ))}
          </div>
          <button type="button" className="photo-count" onClick={openAll}>
            <Images size={14} /> {D.photosCount(photos.length)}
          </button>
        </>
      )}
    </div>
  );
}
