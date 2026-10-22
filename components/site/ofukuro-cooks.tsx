"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OFUKURO } from "@/lib/ofukuro-dinner";

/** Compact horizontal carousel of cook profiles: one card and a peek of the
 *  next on phones, three across on wide screens; swipe, or the two buttons.
 *  No autoplay, no selection, no per-cook booking: cooks are matched, not chosen. */
export function OfukuroCooks() {
  const track = useRef<HTMLDivElement>(null);
  const step = (dir: 1 | -1) => {
    const el = track.current; if (!el) return;
    const card = el.querySelector<HTMLElement>(".ofk-cook");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 280) + 12), behavior: "smooth" });
  };
  return (
    <div className="ofk-carousel">
      <div className="ofk-track" ref={track} aria-label={OFUKURO.cooks.heading}>
        {OFUKURO.cooks.profiles.map((c, i) => (
          <figure className="ofk-cook" key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, as the detail pages use */}
            <img src={c.img} alt={c.alt} loading="lazy" width={800} height={1000} />
            <figcaption>
              <small className="ofk-sample">Sample profile</small>
              <b>{c.role}</b>
              <p>{c.lines}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="ofk-nav">
        <button type="button" onClick={() => step(-1)} aria-label="Previous cook"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => step(1)} aria-label="Next cook"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
