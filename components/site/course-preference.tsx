"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { useBooking } from "@/components/site/booking-context";
import type { VariantPageCopy } from "@/lib/catalog";

/** "Let us choose" vs "I have a preferred course". The second opens two
 *  fields for the course. Shown in its own section and again inside the
 *  request form; both read and write the same booking state. */
export function CoursePreference({ copy, name }: { copy: VariantPageCopy["coursePreference"]; name: string }) {
  const b = useBooking();
  const uid = useId();
  if (!b) return null;
  const preferred = b.coursePref === "preferred";
  return (
    <div className="cp">
      {copy.options.map((o) => {
        const on = b.coursePref === o.id;
        return (
          <label key={o.id} className={`cp-card${on ? " on" : ""}`}>
            <input type="radio" name={name} value={o.id} checked={on} onChange={() => b.set({ coursePref: o.id })} />
            <span className="vp-check" aria-hidden="true"><Check size={13} /></span>
            <span className="cp-badge">{o.badge}</span>
            <span className="cp-title">{o.title}</span>
            <span className="cp-body">{o.body}</span>
            {o.note && <span className="cp-note">{o.note}</span>}
          </label>
        );
      })}
      {preferred && (
        <div className="cp-fields">
          <label htmlFor={`${uid}-course`}>
            <span>{copy.courseName}</span>
            <input id={`${uid}-course`} type="text" required maxLength={160} value={b.courseName} onChange={(e) => b.set({ courseName: e.target.value })} />
          </label>
          <label htmlFor={`${uid}-url`}>
            <span>{copy.courseUrl}</span>
            <input id={`${uid}-url`} type="text" maxLength={200} value={b.courseUrl} onChange={(e) => b.set({ courseUrl: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}
