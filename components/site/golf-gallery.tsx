"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useBooking } from "@/components/site/booking-context";
import { t, type Lang } from "@/lib/i18n";
import type { ExperienceVariant } from "@/lib/catalog";

export interface GolfPhoto { img: string; alt: string; area?: string; caption?: string }

/** Small copies (480px) of the same files, for the thumbnail strip and the all-photos sheet. */
const thumb = (img: string) => img.replace(/^\/images\//, "/images/thumbs/");

/** The golf page's photos: a swipe track with a counter and a thumbnail
 *  strip on phones, a one-big-four-small grid on wide screens, and the same
 *  lightbox (close, previous, next, Escape, focus returned) from both. The
 *  chosen area's photo comes first and its other photos follow; the rest of
 *  the set stays viewable so both areas can be compared. No autoplay, and
 *  switching area never scrolls the page. */
export function GolfGallery({ photos, variants, lang, note }: {
  photos: GolfPhoto[]; variants: ExperienceVariant[]; lang: Lang; note?: string;
}) {
  const b = useBooking();
  const chosen = variants.find((v) => v.id === b?.variant) ?? variants[0];
  const ordered = useMemo(() => {
    const first = photos.filter((p) => p.img === chosen.img);
    const same = photos.filter((p) => p.img !== chosen.img && p.area === chosen.id);
    const rest = photos.filter((p) => p.img !== chosen.img && p.area !== chosen.id);
    return [...first, ...same, ...rest];
  }, [photos, chosen]);
  // Remount on an area switch: the track starts again at the new first photo.
  return <GalleryView key={chosen.id} photos={ordered} variants={variants} lang={lang} note={note} />;
}

type View = { mode: "sheet" } | { mode: "single"; index: number; fromSheet: boolean };

function GalleryView({ photos, variants, lang, note }: { photos: GolfPhoto[]; variants: ExperienceVariant[]; lang: Lang; note?: string }) {
  const D = t(lang).detail;
  const track = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [wide, setWide] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const n = photos.length;
  const areaLabel = (area?: string) => variants.find((v) => v.id === area)?.short;
  const captionOf = (p: GolfPhoto) => [areaLabel(p.area), p.caption ?? p.alt].filter(Boolean).join(" · ");

  const open = (v: View) => {
    opener.current = document.activeElement as HTMLElement | null;
    setView(v);
  };
  const close = () => {
    setView(null);
    // Focus goes back to where the visitor was, as a dialog should.
    opener.current?.focus?.();
  };
  const closeSingle = () => setView((v) => (v?.mode === "single" && v.fromSheet ? { mode: "sheet" } : null));
  const step = (d: number) => setView((v) => (v?.mode === "single" ? { ...v, index: (v.index + d + n) % n } : v));
  const single = view?.mode === "single" ? view.index : null;

  // The grid on wide screens shows five photos at once; the phone track
  // loads a couple ahead of the one in view (native lazy-loading inside a
  // horizontal track is unreliable on iOS Safari).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 981px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const loadUpTo = wide ? 4 : Math.max(1, index + 2);

  // Counter and thumbnail highlight follow whichever photo is snapped into view.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [n]);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // While a sheet or the lightbox is open: keys, no page scroll, and the
  // phone's sticky bar stays out of the way (see body[data-kh-modal]).
  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); if (view.mode === "single" && view.fromSheet) setView({ mode: "sheet" }); else close(); }
      if (view.mode === "single" && e.key === "ArrowRight") step(1);
      if (view.mode === "single" && e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.dataset.khModal = "1";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; delete document.body.dataset.khModal; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close/step are stable closures over setView
  }, [view, n]);

  // The lightbox takes focus when it opens, so Escape and the arrow keys work at once.
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (single !== null) closeBtn.current?.focus(); }, [single]);

  return (
    <div className="gg" aria-label={D.gallery}>
      <div className="gg-frame">
        <div className="gg-track" ref={track}>
          {photos.map((p, i) => (
            <figure key={p.img} className="gg-item">
              <button type="button" onClick={() => open({ mode: "single", index: i, fromSheet: false })} aria-label={`${captionOf(p)} — ${D.viewAllPhotos}`}>
                <img src={i <= loadUpTo ? p.img : undefined} data-src={p.img} alt={p.alt} width={1600} height={1200} fetchPriority={i === 0 ? "high" : undefined} decoding="async" />
              </button>
              {areaLabel(p.area) && <span className="gg-area" aria-hidden="true">{areaLabel(p.area)}</span>}
            </figure>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" className="gg-arrow prev" aria-label="Previous" onClick={() => go((index - 1 + n) % n)}><ChevronLeft size={20} /></button>
            <button type="button" className="gg-arrow next" aria-label="Next" onClick={() => go((index + 1) % n)}><ChevronRight size={20} /></button>
            <span className="gg-count" aria-live="polite">{D.photoOf(index + 1, n)}</span>
          </>
        )}
        <button type="button" className="gg-all" onClick={() => open({ mode: "sheet" })}><Images size={14} /> {D.viewAllPhotos}</button>
      </div>
      {n > 1 && (
        <div className="gg-thumbs" role="tablist" aria-label={D.gallery}>
          {photos.map((p, i) => (
            <button key={p.img} type="button" role="tab" aria-selected={i === index} aria-label={`${i + 1} / ${n}`} onClick={() => go(i)}>
              <img src={thumb(p.img)} alt="" width={120} height={90} loading={i < 6 ? "eager" : "lazy"} decoding="async" />
            </button>
          ))}
        </div>
      )}
      {note && <p className="gg-note">{note}</p>}

      {view?.mode === "sheet" && (
        <div className="photo-sheet" role="dialog" aria-modal="true" aria-label={D.allPhotosH(n)}>
          <header className="photo-sheet-bar">
            <button type="button" onClick={close}><ArrowLeft size={18} /> {D.back}</button>
            <b>{D.allPhotosH(n)}</b>
          </header>
          <div className="photo-sheet-grid gg-sheet-grid">
            {photos.map((p, i) => (
              <button type="button" key={p.img} onClick={() => setView({ mode: "single", index: i, fromSheet: true })} aria-label={captionOf(p)}>
                <img src={thumb(p.img)} alt={p.alt} loading={i < 9 ? "eager" : "lazy"} />
                {areaLabel(p.area) && <span className="gg-area" aria-hidden="true">{areaLabel(p.area)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {single !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={captionOf(photos[single])} onClick={closeSingle}>
          <button type="button" ref={closeBtn} className="lightbox-close" aria-label={D.close} onClick={(e) => { e.stopPropagation(); if (view?.mode === "single" && view.fromSheet) setView({ mode: "sheet" }); else close(); }}><X size={22} /></button>
          <button type="button" className="lightbox-nav prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }}><ChevronLeft size={26} /></button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={photos[single].img} alt={photos[single].alt} />
            <figcaption>{captionOf(photos[single])} · {D.photoOf(single + 1, n)}</figcaption>
          </figure>
          <button type="button" className="lightbox-nav next" aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }}><ChevronRight size={26} /></button>
        </div>
      )}
    </div>
  );
}
