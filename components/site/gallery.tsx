"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

export interface Photo { img: string; alt: string; caption?: string }

/** Swipe track on small screens (with a peek of the next photo and a counter),
 *  a grid on wide screens, and a lightbox behind "View all photos".
 *  No autoplay anywhere. */
export function Gallery({ photos, lang, note }: { photos: Photo[]; lang: Lang; note?: string }) {
  const D = t(lang).detail;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

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

  // The first-view carousel asks for the lightbox through a window event.
  useEffect(() => {
    const onOpen = (e: Event) => setOpen(Math.max(0, Math.min(photos.length - 1, (e as CustomEvent<number>).detail ?? 0)));
    window.addEventListener("kh:lightbox", onOpen);
    return () => window.removeEventListener("kh:lightbox", onOpen);
  }, [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, photos.length]);

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
        <button type="button" className="gallery-all" onClick={() => setOpen(index)}>{D.viewAllPhotos}</button>
      </div>

      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <button type="button" className="lightbox-close" aria-label={D.close} onClick={() => setOpen(null)}><X size={22} /></button>
          <button type="button" className="lightbox-nav prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + photos.length) % photos.length); }}><ChevronLeft size={26} /></button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={photos[open].img} alt={photos[open].alt} />
            <figcaption>{photos[open].caption ?? photos[open].alt} · {D.photoOf(open + 1, photos.length)}</figcaption>
          </figure>
          <button type="button" className="lightbox-nav next" aria-label="Next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % photos.length); }}><ChevronRight size={26} /></button>
        </div>
      )}
    </section>
  );
}
