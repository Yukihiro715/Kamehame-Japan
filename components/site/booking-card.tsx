"use client";

import { ArrowRight, CalendarDays, Check, Clock3, ShieldCheck } from "lucide-react";
import { DatePicker } from "@/components/site/date-picker";
import { isClosed, useBooking } from "@/components/site/booking-context";
import { yen } from "@/lib/pricing";
import { RatingSummary } from "@/components/site/reviews";
import { t, type Lang } from "@/lib/i18n";

/** The booking box beside the page (below the photos on phones): plan, date,
 *  head count and a running estimate, then a button to the request form. */
export function BookingCard({ lang, headline }: { lang: Lang; headline: string }) {
  const b = useBooking();
  const T = t(lang);
  const D = T.detail;
  const F = T.form;
  if (!b) return null;
  const { pricing, experience: x } = b;
  const plans = pricing?.plans ?? [];
  const plan = plans.find((p) => p.id === b.plan);
  const guestOptions = Array.from({ length: x.listedMax - x.minGuests + 1 }, (_, i) => x.minGuests + i);
  const jump = () => {
    const el = document.querySelector("#request");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (document.querySelector<HTMLInputElement>("#request input[name=name]"))?.focus({ preventScroll: true }), 500);
  };

  return (
    <div className="bk-card" id="booking">
      <div className="bk-price">
        <small>{D.fromPrice}</small>
        <b>{plans.length ? yen(Math.min(...plans.map((p) => p.regular))) : headline}</b>
        <small>{pricing?.extraGuest ? D.minPriceNote(pricing.extraGuest.included) : D.priceTotalNote}</small>
        <RatingSummary experience={x.slug} lang={lang} href="#reviews" size={13} />
      </div>

      {plans.length > 0 && (
        <fieldset className="bk-plans">
          <legend>{D.planLabel}</legend>
          {plans.map((p) => (
            <label key={p.id} className={`bk-plan ${b.plan === p.id ? "on" : ""}`}>
              <input type="radio" name="bk-plan" value={p.id} checked={b.plan === p.id} onChange={() => b.set({ plan: p.id })} />
              <span className="bk-plan-check"><Check size={12} /></span>
              <span className="bk-plan-copy"><b>{p.label}</b><small>{p.performers}</small></span>
              <span className="bk-plan-price">{yen(p.regular)}</span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="bk-grid">
        <div className="field">
          <label htmlFor="bk-date">{F.preferredDate}</label>
          <DatePicker id="bk-date" name="bk-date" lang={lang} min={b.minDate} compact closed={(d) => isClosed(d, x.closed)} value={b.date} onChange={(d) => b.set({ date: d })} />
        </div>
        {x.startTimes && x.startTimes.length > 0 && (
          <label>
            <span>{F.startTime}</span>
            <select value={b.time} onChange={(e) => b.set({ time: e.target.value })}>
              {x.startTimes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
        <label>
          <span>{F.partyN}</span>
          <select value={b.guests} onChange={(e) => b.set({ guests: e.target.value })}>
            {guestOptions.map((n) => <option key={n} value={n}>{F.guests(n)}</option>)}
            <option value={`${x.listedMax + 1}+`}>{F.guestsMore(x.listedMax + 1)}</option>
          </select>
        </label>
      </div>

      <div className="bk-est" aria-live="polite">
        {b.estimate ? (
          <>
            <span>{D.estimateH} · {plan?.label} · {D.estimateFor(b.guestsNumber)} · {b.estimate.peak ? D.seasonPeak : D.seasonRegular}</span>
            <b>{yen(b.estimate.total)}</b>
            <small>{D.priceTotalNote}. {b.date ? D.estimateNote : D.pickDateForSeason}</small>
          </>
        ) : (
          <>
            <span>{D.estimateH}</span>
            <small>{b.largeParty ? D.sixPlus(x.listedMax + 1) : D.quoteIndividually}</small>
          </>
        )}
      </div>

      <a className="bk-cta" href="#request" onClick={(e) => { e.preventDefault(); jump(); }}>{D.requestCta} <ArrowRight size={16} /></a>
      <ul className="bk-trust">
        <li><ShieldCheck size={14} /> {D.noPaymentNow}</li>
        <li><Clock3 size={14} /> {D.replyIn24}</li>
        <li><CalendarDays size={14} /> {D.availCutoff(x.leadDays, x.cutoffTime)}</li>
      </ul>
    </div>
  );
}
