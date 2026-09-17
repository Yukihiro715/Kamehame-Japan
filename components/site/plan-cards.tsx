"use client";

import { Check, Music, Users } from "lucide-react";
import { useBooking } from "@/components/site/booking-context";
import { yen } from "@/lib/pricing";
import { t, type Lang } from "@/lib/i18n";

/** The three plan cards. Choosing one updates the booking card and the
 *  request form; the price shown is the regular-season rate for the base party. */
export function PlanCards({ lang }: { lang: Lang }) {
  const b = useBooking();
  const D = t(lang).detail;
  const plans = b?.pricing?.plans ?? [];
  const eg = b?.pricing?.extraGuest;
  if (!b || !plans.length || !eg) return null;
  return (
    <div className="plan-grid">
      {plans.map((p, i) => {
        const on = b.plan === p.id;
        return (
          <article key={p.id} className={`plan ${on ? "on" : ""} ${p.recommended ? "rec" : ""}`} data-rec={D.recommended}>
            <span className="plan-label">{p.label}</span>
            <h3 className="plan-name">{p.name}</h3>
            <p className="plan-price"><small>{D.fromPrice}</small><b>{yen(p.regular)}</b><small>{D.upToGuests(eg.included)}</small></p>
            <p className="plan-peak">{D.peakFrom(b.pricing?.highSeason?.window ?? "")} {yen(p.peak)}</p>
            <p className="plan-performers">{i === 0 ? <Users size={15} /> : <Music size={15} />}<span>{p.performers}</span></p>
            <p className="plan-blurb">{p.blurb}</p>
            <button type="button" className="plan-cta" onClick={() => b.set({ plan: p.id })} aria-pressed={on}>
              {on ? <><Check size={14} /> {D.selectedPlan}</> : D.selectPlan}
            </button>
          </article>
        );
      })}
    </div>
  );
}
