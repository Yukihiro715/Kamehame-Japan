"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import styles from "./review-photo-gallery.module.css";

const labels = {
  en: { previous: "Previous photo", next: "Next photo", swipe: "Swipe or use the arrows to browse" },
  ja: { previous: "前の写真", next: "次の写真", swipe: "左右にスワイプ、または矢印で切り替え" },
  es: { previous: "Foto anterior", next: "Foto siguiente", swipe: "Desliza o usa las flechas para ver las fotos" },
  fr: { previous: "Photo précédente", next: "Photo suivante", swipe: "Balayez ou utilisez les flèches pour parcourir les photos" },
  "zh-tw": { previous: "上一張照片", next: "下一張照片", swipe: "左右滑動或使用箭頭切換照片" },
};
const thumb = (src: string) => src.replace(/\.webp$/, "-600.webp");

export function ReviewPhotoGallery({ photos, alts, label, lang }: { photos: string[]; alts: string[]; label: string; lang: Lang }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const current = useRef(0);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const D = t(lang).detail;
  const c = labels[lang];

  const show = (i: number, button: HTMLButtonElement) => {
    opener.current = button;
    current.current = i;
    setIndex(i);
    dialog.current?.showModal();
    track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "instant" });
    setOpen(true);
  };
  const go = (i: number) => {
    const next = (i + photos.length) % photos.length;
    track.current?.scrollTo({ left: next * track.current.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const close = () => dialog.current?.close();

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const overflow = body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    const modal = body.dataset.khModal;
    body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    body.dataset.khModal = "1";
    // Keep the current photo in view when the phone rotates or the window resizes.
    const resize = new ResizeObserver(() => {
      const el = track.current;
      if (el) el.scrollTo({ left: current.current * el.clientWidth, behavior: "instant" });
    });
    if (track.current) resize.observe(track.current);
    return () => {
      resize.disconnect();
      body.style.overflow = overflow;
      document.documentElement.style.overflow = rootOverflow;
      if (modal === undefined) delete body.dataset.khModal;
      else body.dataset.khModal = modal;
    };
  }, [open]);

  if (!photos.length) return null;
  return <>
    <div className={styles.photos} role="group" aria-label={label}>
      {photos.map((src, i) => <button key={src} type="button" className={styles.photo} aria-haspopup="dialog" onClick={(e) => show(i, e.currentTarget)}>
        <img src={thumb(src)} width={84} height={112} alt={alts[i]} loading="lazy" decoding="async" />
      </button>)}
    </div>
    <dialog ref={dialog} className={styles.viewer} aria-label={label}
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClose={() => { setOpen(false); opener.current?.focus({ preventScroll: true }); }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); go(current.current + (e.key === "ArrowLeft" ? -1 : 1)); }
      }}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <span aria-live="polite" aria-atomic="true">{D.photoOf(index + 1, photos.length)}</span>
          <button type="button" autoFocus onClick={close} aria-label={D.close}><X size={24} /></button>
        </header>
        <div ref={track} className={styles.track} onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.min(photos.length - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)));
          current.current = i;
          setIndex(i);
        }}>
          {photos.map((src, i) => <figure key={src} className={styles.slide}>
            <img src={open ? src : undefined} alt={alts[i]} width={1200} height={1600} draggable={false} />
          </figure>)}
        </div>
        <footer className={styles.footer}>
          <div className={styles.controls}>
            <button type="button" aria-label={c.previous} onClick={() => go(current.current - 1)}><ChevronLeft size={26} /></button>
            <div className={styles.thumbs} role="group" aria-label={D.gallery}>
              {photos.map((src, i) => <button key={src} type="button" aria-label={D.photoOf(i + 1, photos.length)} aria-pressed={index === i} onClick={() => go(i)}>
                <img src={thumb(src)} alt="" width={36} height={48} loading="lazy" />
              </button>)}
            </div>
            <button type="button" aria-label={c.next} onClick={() => go(current.current + 1)}><ChevronRight size={26} /></button>
          </div>
          <p>{c.swipe}</p>
        </footer>
      </div>
    </dialog>
  </>;
}
