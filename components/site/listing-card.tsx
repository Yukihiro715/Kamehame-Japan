"use client";

/** One experience in a listing: a swipeable photo (dots on phones, arrows on
 *  hover), the interest, the title and one line of facts. The description
 *  stays on the experience page. Arrows and dots sit beside the link, not
 *  inside it, so the markup stays valid and a drag never counts as a tap. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Star } from "lucide-react";
import type { ListingItem } from "@/lib/collections";
import { listingCopy } from "@/lib/listing-copy";
import { t, type Lang } from "@/lib/i18n";
import { Fx } from "@/components/site/money";

export function ListingCard({ item, lang = "en", view = "grid", eager = false }: { item: ListingItem; lang?: Lang; view?: "grid" | "list"; eager?: boolean }) {
  const T = t(lang), L = listingCopy(lang);
  const photos = item.photos.length ? item.photos : [item.img];
  const many = photos.length > 1;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(1);
  useEffect(() => {
    const el = track.current;
    if (!el || !many) return;
    const onScroll = () => { const i = Math.round(el.scrollLeft / el.clientWidth); setIndex(i); setSeen((s) => Math.max(s, i + 2)); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [many]);
  const go = (e: React.MouseEvent, i: number) => {
    e.preventDefault(); e.stopPropagation();
    const el = track.current; if (!el) return;
    const n = (i + photos.length) % photos.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    setSeen((s) => Math.max(s, n + 2));
  };
  const soon = item.kind === "experience" && !item.live;
  return (
    <article className={`lc lc-${view}${soon ? " is-soon" : ""}`}>
      <div className="lc-media">
        <Link className="lc-photos" href={item.href} aria-label={item.title} tabIndex={-1}>
          <div className="lc-track" ref={track}>
            {photos.map((src, i) => (
              <div className="lc-slide" key={src + i}>
                <img src={i < seen ? src : undefined} data-src={src} alt={i === 0 ? item.alt : ""} loading={eager && i === 0 ? "eager" : "lazy"} decoding="async" draggable={false} />
              </div>
            ))}
          </div>
        </Link>
        {many && (
          <>
            <button type="button" className="lc-arrow prev" aria-label={L.previous} onClick={(e) => go(e, index - 1)}><ChevronLeft size={18} /></button>
            <button type="button" className="lc-arrow next" aria-label={L.next} onClick={(e) => go(e, index + 1)}><ChevronRight size={18} /></button>
            <div className="lc-dots" aria-hidden="true">{photos.map((_, i) => <i key={i} className={i === index ? "on" : ""} />)}</div>
            <span className="sr-only" aria-live="polite">{L.photoOf(index + 1, photos.length)}</span>
          </>
        )}
        {soon && <span className="soon-badge">{T.comingSoon}</span>}
      </div>
      <div className="lc-body">
        <p className="lc-cat"><span>{item.categoryLabel}</span></p>
        <h3 className="lc-title"><Link href={item.href}>{item.title}</Link></h3>
        <p className="lc-facts">
          <span>{item.cityLabel}</span>
          {item.durationLabel && <span><Clock3 size={12} /> {item.durationLabel}</span>}
          <span className="lc-price">{T.from} <b><Fx>{item.price}</Fx></b> {item.kind === "experience" ? (item.unit === "group" ? T.perGroupShort : T.perPerson) : ""}</span>
        </p>
        {item.priceNote && <small className="lc-note"><Fx>{item.priceNote}</Fx></small>}
        {item.rating && <p className="lc-rating"><Star size={12} fill="currentColor" /> {item.rating.average.toFixed(1)} <span>{L.reviews(item.rating.count)}</span></p>}
      </div>
    </article>
  );
}
