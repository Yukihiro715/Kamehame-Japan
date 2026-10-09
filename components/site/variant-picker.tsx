"use client";

import { Check } from "lucide-react";
import { useBooking } from "@/components/site/booking-context";
import { countOf, yen } from "@/lib/pricing";
import type { ExperienceVariant, VariantPageCopy } from "@/lib/catalog";

/** The two plan cards. Compact in the hero and the request form (title, one
 *  line, price); detailed in the "choose" section (bullets and a Select
 *  button). All instances share the choice through the booking context. */
export function VariantPicker({ variants, copy, detailed, name }: {
  variants: ExperienceVariant[]; copy: VariantPageCopy["pricing"]; detailed?: boolean; name: string;
}) {
  const b = useBooking();
  if (!b) return null;
  return (
    <div className={`vp ${detailed ? "vp-detailed" : "vp-compact"}`}>
      {variants.map((v) => {
        const on = b.variant === v.id;
        return (
          <label key={v.id} className={`vp-card${on ? " on" : ""}`}>
            <input type="radio" name={name} value={v.id} checked={on} onChange={() => b.set({ variant: v.id })} />
            <span className="vp-check" aria-hidden="true"><Check size={13} /></span>
            <span className="vp-title">{detailed ? v.title : v.cardTitle}</span>
            {detailed
              ? <ul className="vp-bullets">{v.bullets.map((x) => <li key={x}>{x}</li>)}</ul>
              : <span className="vp-tagline">{v.tagline}</span>}
            <span className="vp-price">{copy.from && <small>{copy.from}</small>} <b>{yen(v.price)}{copy.fromSuffix && <span className="from-suffix">{copy.fromSuffix}</span>}</b> <small>/ {countOf(copy.golfers, v.basePartySize)}</small></span>
            {detailed && <span className="vp-select">{v.select}</span>}
          </label>
        );
      })}
    </div>
  );
}
