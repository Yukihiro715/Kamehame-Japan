"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, LandPlot, PackageCheck, X } from "lucide-react";
import { CLUB_RENTAL_COPY, CLUB_SETS, clubSetById, clubSetName, type ClubHand, type ClubSet } from "@/lib/golf-club-rental";
import type { Lang } from "@/lib/i18n";

/** The two ways to rent clubs, side by side, then the sets a guest can choose, each opening
 *  a sheet with the large photo and the specifications. Shown on the golf page only while the
 *  option is on (ClubRentalProvider). The supplier is never named. */
export function GolfClubRental({ lang }: { lang: Lang }) {
  const C = CLUB_RENTAL_COPY[lang];
  const [open, setOpen] = useState<ClubSet | null>(null);
  return (
    <section className="xp-section gcr" id="rental-clubs" aria-labelledby="gcr-heading">
      <h2 id="gcr-heading">{C.heading}</h2>
      <p className="gcr-lede">{C.lede}</p>
      <div className="gcr-ways">
        <div className="gcr-way">
          <span className="gcr-way-icon" aria-hidden="true"><LandPlot size={20} /></span>
          <b>{C.course.title}</b>
          <em>{C.course.price}</em>
          <p>{C.course.body}</p>
        </div>
        <div className="gcr-way gcr-way-on">
          <span className="gcr-way-icon" aria-hidden="true"><PackageCheck size={20} /></span>
          <b>{C.chosen.title}</b>
          <em>{C.chosen.price}</em>
          <p>{C.chosen.body}</p>
        </div>
      </div>
      <h3 className="xp-sub-h">{C.gridH}</h3>
      <ul className="gcr-grid">
        {CLUB_SETS.map((s) => (
          <li key={s.id}>
            <button type="button" className="gcr-card" onClick={() => setOpen(s)} aria-haspopup="dialog">
              <span className="gcr-photo"><img src={s.thumb} alt={clubSetName(s)} width={240} height={360} loading="lazy" decoding="async" /></span>
              <span className="gcr-brand">{s.brand}</span>
              <span className="gcr-model">{s.model}</span>
              <span className="gcr-tags">{C.flex} {s.flex} · {C.hand[s.hand]} · {C.gender[s.gender]}</span>
              <span className="gcr-more">{C.details}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="gcr-note">{C.gridNote}</p>
      <ul className="gcr-facts">
        <li>{C.returns}</li>
        <li>{C.deadline}</li>
        <li>{C.cancel}</li>
      </ul>
      {open && <ClubSetSheet lang={lang} set={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** The sheet with one set: large photo, name, tags, what the set holds. `onPick` adds a
 *  "choose this set" button (the form's picker); the page's details sheet has none. */
export function ClubSetSheet({ lang, set, onClose, onPick, picked }: { lang: Lang; set: ClubSet; onClose: () => void; onPick?: (s: ClubSet) => void; picked?: boolean }) {
  const C = CLUB_RENTAL_COPY[lang];
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="gcr-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gcr-sheet-box">
        <button ref={closeRef} type="button" className="gcr-close" onClick={onClose} aria-label={C.close}><X size={18} /></button>
        <img src={set.img} alt={clubSetName(set)} width={660} height={1000} decoding="async" />
        <div className="gcr-sheet-text">
          <b id={titleId}>{clubSetName(set)}</b>
          <span className="gcr-tags">{C.flex} {set.flex} · {C.hand[set.hand]} · {C.gender[set.gender]} · {C.tier[set.tier]}</span>
          <p>{C.setIncludes}</p>
          <p className="gcr-fine">{C.condition}</p>
          {onPick && (
            <button type="button" className={`contact-cta gcr-pick${picked ? " on" : ""}`} onClick={() => { onPick(set); onClose(); }}>
              {picked && <Check size={16} aria-hidden="true" />} {picked ? C.picked : C.pickThis}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The form's picker for one golfer: the sets that fit the hand, as a compact list; tapping
 *  one opens the sheet, where it is chosen. */
export function ClubSetPicker({ lang, hand, value, onChange, onClose, golferLabel }: {
  lang: Lang; hand: ClubHand | "unsure"; value?: string; onChange: (id: string) => void; onClose: () => void; golferLabel: string;
}) {
  const C = CLUB_RENTAL_COPY[lang];
  const [open, setOpen] = useState<ClubSet | null>(null);
  const titleId = useId();
  const sets = CLUB_SETS.filter((s) => hand === "unsure" || s.hand === hand);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !open) onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, open]);
  return (
    <div className="gcr-sheet gcr-picker" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gcr-sheet-box gcr-picker-box">
        <div className="gcr-picker-bar">
          <b id={titleId}>{C.forGolfer.replace("{golfer}", golferLabel)}</b>
          <button type="button" className="gcr-close" onClick={onClose} aria-label={C.close}><X size={18} /></button>
        </div>
        <ul className="gcr-pick-list">
          {sets.map((s) => (
            <li key={s.id}>
              <button type="button" className={`gcr-pick-row${value === s.id ? " on" : ""}`} onClick={() => { onChange(s.id); onClose(); }}>
                <img src={s.thumb} alt="" width={48} height={72} loading="lazy" decoding="async" />
                <span><b>{clubSetName(s)}</b><small>{C.hand[s.hand]} · {C.gender[s.gender]} · {C.tier[s.tier]}</small></span>
                {value === s.id ? <Check size={16} aria-hidden="true" /> : <em onClick={(e) => { e.stopPropagation(); setOpen(s); }}>{C.details}</em>}
              </button>
            </li>
          ))}
        </ul>
        <p className="gcr-fine gcr-picker-note">{C.gridNote}</p>
        {open && <ClubSetSheet lang={lang} set={open} onClose={() => setOpen(null)} onPick={(s) => { onChange(s.id); onClose(); }} picked={value === open.id} />}
      </div>
    </div>
  );
}

/** "TaylorMade Qi10 (S)" for a chosen id, or the "not chosen" words. */
export function clubSetLabel(lang: Lang, id: string | undefined) {
  const s = clubSetById(id);
  return s ? clubSetName(s) : CLUB_RENTAL_COPY[lang].notChosen;
}
