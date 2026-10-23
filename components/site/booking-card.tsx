"use client";

import { useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, ShieldCheck } from "lucide-react";
import { DatePicker } from "@/components/site/date-picker";
import { DEFAULT_MAX_GUESTS, firstOpenDate, isBookable, timesFor, useBooking } from "@/components/site/booking-context";
import { GuestStepper } from "@/components/site/guest-stepper";
import { yen } from "@/lib/pricing";
import { Fx, FxNote, JpyRef, JpyRefText, Yen } from "@/components/site/money";
import { RatingSummary } from "@/components/site/reviews";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { CONTACT_EMAIL } from "@/lib/contact";
import { t, type Lang } from "@/lib/i18n";
import { QuoteRequestSwitch, quoteCopy } from "./quote-request-switch";
import { provisionalCopy } from "@/lib/provisional-booking";

/** Wide screens: the card sits beside the page, so its button opens the rest
 *  of the request (name, email, notes) inside the card. Phones: the card is
 *  in the flow above the content, and the button scrolls to the form below. */
const SIDE_BY_SIDE = "(min-width: 981px)";

/** The booking box beside the page (below the photos on phones): plan, date,
 *  head count and a running estimate, then the request itself. */
export function BookingCard({ lang, headline }: { lang: Lang; headline: string }) {
  const b = useBooking();
  const T = t(lang);
  const D = T.detail;
  const F = T.form;
  const [open, setOpen] = useState(false);
  const more = useRef<HTMLDivElement>(null);
  if (!b) return null;
  const { pricing, experience: x } = b;
  const plans = pricing?.plans ?? [];
  const plan = plans.find((p) => p.id === b.plan);
  // Group-priced products: the cheapest plan for the base party, shown per person.
  const groupRow = pricing?.unit === "group" ? pricing.rows[0] : undefined;
  const groupMin = plans.length ? Math.min(...plans.map((p) => p.regular)) : groupRow?.total ?? 0;
  // zh-TW's per-person label already carries the "from" marker (每位起), so the suffix is not repeated.
  const fromSuffix: string = D.fromSuffix;
  const groupSuffix = fromSuffix && !T.perPerson.includes(fromSuffix.trim()) ? fromSuffix : "";
  const expand = () => {
    setOpen(true);
    // After the fields render: without a date, open the date above first;
    // otherwise bring the new fields into view.
    window.setTimeout(() => {
      const date = document.querySelector<HTMLElement>("#bk-date");
      if (!b.date && date) {
        date.scrollIntoView({ behavior: "smooth", block: "center" });
        date.focus({ preventScroll: true });
        return;
      }
      // Bring the extra fields into view without focusing anything (focusing
      // a field would pop its calendar or keyboard open).
      more.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };
  const jump = () => {
    const el = document.querySelector("#request-form") ?? document.querySelector("#request");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (document.querySelector<HTMLInputElement>("#request input[name=name]"))?.focus({ preventScroll: true }), 500);
  };

  return (
    <div className={`bk-card${open ? " open" : ""}`} id="booking">
      <div className="bk-price">
        {x.provisionalCheckout && (b.quoteRequested || b.largeParty) ? <b className="bk-quote-heading">{quoteCopy[lang].heading}</b> : groupRow ? (
          <>
            {/* Group-priced: the per-person figure leads, the group total it comes from sits right under it. */}
            {D.fromPrice && <small>{D.fromPrice}</small>}
            <b><Yen n={Math.round(groupMin / groupRow.party)} />{groupSuffix && <span className="from-suffix">{groupSuffix}</span>}<span className="bk-unit">{T.perPerson}</span></b>
            <JpyRef n={Math.round(groupMin / groupRow.party)} unit={T.perPerson} lang={lang} />
            <small className="bk-total"><Fx>{D.totalForParty(yen(groupMin), groupRow.party)}</Fx></small>
          </>
        ) : (
          <>
            {/* "From" only where the price varies (plans, seasons); a fixed per-person price has none. */}
            {plans.length > 0 && D.fromPrice && <small>{D.fromPrice}</small>}
            <b>{plans.length ? <><Yen n={Math.min(...plans.map((p) => p.regular))} />{D.fromSuffix && <span className="from-suffix">{D.fromSuffix}</span>}</> : <Fx brief>{headline}</Fx>}</b>
            {plans.length ? <JpyRef n={Math.min(...plans.map((p) => p.regular))} lang={lang} /> : <JpyRefText text={headline} unit={pricing?.unit === "person" ? T.perPersonUnit : undefined} lang={lang} />}
            <small>{pricing?.extraGuest ? D.minPriceNote(pricing.extraGuest.included) : pricing?.unit === "person" ? T.perPersonUnit : D.priceTotalNote}</small>
          </>
        )}
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
              <span className="bk-plan-price"><Fx>{pricing?.planMode === "supplement" ? (p.supplement ? `+${yen(p.supplement)}` : D.planBaseShort) : yen(p.regular)}</Fx></span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="bk-grid">
        <div className="field">
          <label htmlFor="bk-date">{F.preferredDate}</label>
          <DatePicker id="bk-date" name="bk-date" lang={lang} min={firstOpenDate(x, b.minDate) ?? b.minDate} compact closed={(d) => !isBookable(d, x)} value={b.date} onChange={(d) => b.set({ date: d })} />
        </div>
        {x.startTimes && x.startTimes.length > 0 && (
          <label>
            <span>{x.timeLabel ?? F.startTime}</span>
            <select value={b.time} onChange={(e) => b.set({ time: e.target.value })}>
              {timesFor(x, b.date).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
        <div className="field">
          <label htmlFor="bk-guests">{F.partyN}</label>
          <GuestStepper id="bk-guests" value={b.guests} min={x.minGuests} max={x.maxGuests ?? DEFAULT_MAX_GUESTS} onChange={(g) => b.set({ guests: g })} label={F.guests} decLabel={F.fewerGuests} incLabel={F.moreGuests} />
        </div>
      </div>

      <div className="bk-est" aria-live="polite">
        {b.estimate ? (
          <>
            <span>{[D.estimateH, plan?.label, D.estimateFor(b.guestsNumber), plans.length && b.date ? (b.estimate.peak ? D.seasonPeak : D.seasonRegular) : ""].filter(Boolean).join(" · ")}</span>
            <b><Yen n={b.estimate.total} /></b>
            <JpyRef n={b.estimate.total} lang={lang} />
            {x.provisionalCheckout ? (b.pricing?.minCharge && b.guestsNumber < b.pricing.minCharge ? <small>{D.minChargeNote(b.pricing.minCharge)}</small> : null) : <small>{plans.length ? D.priceTotalNote : b.pricing?.minCharge && b.guestsNumber < b.pricing.minCharge ? D.minChargeNote(b.pricing.minCharge) : D.pricePartyNote}. {plans.length && !b.date ? D.pickDateForSeason : D.estimateNote}</small>}
          </>
        ) : (
          <>
            <span>{D.estimateH}</span>
            <small>{b.largeParty ? D.largeGroupNote(b.guestsNumber) : D.quoteIndividually}</small>
          </>
        )}
        <FxNote lang={lang} />
      </div>

      {!open && <QuoteRequestSwitch lang={lang} onStart={() => { if (window.matchMedia(SIDE_BY_SIDE).matches) expand(); else jump(); }} />}
      {open ? (
        <div className="bk-more" ref={more}>
          <EnquiryForm kind="guest" lang={lang} fallbackEmail={CONTACT_EMAIL} experience={{ slug: x.slug, title: x.title }} variant="card" />
        </div>
      ) : (
        <a className="bk-cta" href="#request-form" onClick={(e) => {
          e.preventDefault();
          if (window.matchMedia(SIDE_BY_SIDE).matches) expand(); else jump();
        }}>{x.provisionalCheckout && (b.largeParty || b.quoteRequested) ? quoteCopy[lang].heading : x.ctaLabel ?? D.requestCta} <ArrowRight size={16} /></a>
      )}
      <ul className="bk-trust">
        {(!open || !x.provisionalCheckout || b.largeParty || b.quoteRequested) && <li><ShieldCheck size={14} /> {x.provisionalCheckout && (b.largeParty || b.quoteRequested) ? D.noPaymentNow : x.ctaNote ?? D.noPaymentNow}</li>}
        {x.provisionalCheckout && !b.largeParty && !b.quoteRequested && !open && <li><ShieldCheck size={14} /> <strong>{provisionalCopy(lang).refund}</strong></li>}
        <li><Clock3 size={14} /> {x.provisionalCheckout && !b.largeParty && !b.quoteRequested ? provisionalCopy(lang).flow[2].title : x.replyNote ?? D.replyIn24}</li>
        <li><CalendarDays size={14} /> {D.availCutoff(x.leadDays, x.cutoffTime)}</li>
      </ul>
    </div>
  );
}
