"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Images, ArrowLeft } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

export interface Photo { img: string; alt: string; caption?: string }

/** Swipe track on small screens (with a peek of the next photo and a counter),
 *  a grid on wide screens. "View all photos" (and the first-view carousel)
 *  open a full-screen sheet listing every photo; tapping one there, or on
 *  the page, opens the single-photo view with prev/next. No autoplay. */
type View = { mode: "sheet" } | { mode: "single"; index: number; fromSheet: boolean };
export function Gallery({ photos, lang, note }: { photos: Photo[]; lang: Lang; note?: string }) {
  const D = t(lang).detail;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<View | null>(null);
  const open = view?.mode === "single" ? view.index : null;
  const setOpen = (i: number | null, fromSheet = false) => setView(i === null ? null : { mode: "single", index: i, fromSheet });
  const step = (d: number) => setView((v) => (v?.mode === "single" ? { ...v, index: (v.index + d + photos.length) % photos.length } : v));
  // Closing the single view returns to the sheet it was opened from.
  // Idempotent: the close button's click also bubbles to the overlay.
  const closeSingle = () => setView((v) => (v?.mode === "single" ? (v.fromSheet ? { mode: "sheet" } : null) : v));

  // Keep the counter in step with whichever photo is snapped into view.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.firstElementChild?.getBoundingClientRect().width ?? 1;
      setIndex(Math.min(photos.length - 1, Math.round(el.scrollLeft / (w + 10))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [photos.length]);

  // The first-view carousel asks for the all-photos sheet through a window event.
  useEffect(() => {
    const onOpen = () => setView({ mode: "sheet" });
    window.addEventListener("kh:photos", onOpen);
    return () => window.removeEventListener("kh:photos", onOpen);
  }, []);

  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setView((v) => (v?.mode === "single" && v.fromSheet ? { mode: "sheet" } : null));
      if (view.mode === "single" && e.key === "ArrowRight") step(1);
      if (view.mode === "single" && e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [view, photos.length]);

  return (
    <section className="gallery" id="photos" aria-label={D.gallery}>
      <div className="gallery-track" ref={track}>
        {photos.map((p, i) => (
          <figure key={p.img + i} className="gallery-item">
            <button type="button" onClick={() => setOpen(i)} aria-label={D.viewAllPhotos}>
              <img src={p.img} alt={p.alt} loading={i === 0 ? "eager" : "lazy"} />
            </button>
            {p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <div className="gallery-bar">
        <span className="gallery-count"><Images size={14} /> {D.photoOf(index + 1, photos.length)}</span>
        {note && <span className="gallery-note">{note}</span>}
        <button type="button" className="gallery-all" onClick={() => setView({ mode: "sheet" })}>{D.viewAllPhotos}</button>
      </div>

      {view?.mode === "sheet" && (
        <div className="photo-sheet" role="dialog" aria-modal="true" aria-label={D.allPhotosH(photos.length)}>
          <header className="photo-sheet-bar">
            <button type="button" onClick={() => setView(null)}><ArrowLeft size={18} /> {D.back}</button>
            <b>{D.allPhotosH(photos.length)}</b>
          </header>
          <div className="photo-sheet-grid">
            {photos.map((p, i) => (
              <button type="button" key={p.img + i} onClick={() => setOpen(i, true)} aria-label={p.caption ?? p.alt}>
                <img src={p.img} alt={p.alt} loading={i < 9 ? "eager" : "lazy"} />
              </button>
            ))}
          </div>
        </div>
      )}

      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={closeSingle}>
          <button type="button" className="lightbox-close" aria-label={D.close} onClick={closeSingle}><X size={22} /></button>
          <button type="button" className="lightbox-nav prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }}><ChevronLeft size={26} /></button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={photos[open].img} alt={photos[open].alt} />
            <figcaption>{photos[open].caption ?? photos[open].alt} · {D.photoOf(open + 1, photos.length)}</figcaption>
          </figure>
          <button type="button" className="lightbox-nav next" aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }}><ChevronRight size={26} /></button>
        </div>
      )}
    </section>
  );
}
