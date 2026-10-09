"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import type { EnquiryKind } from "@/lib/contact";
import type { ExperienceVariant, VariantPageCopy } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";
import { eventId, track } from "@/lib/analytics";
import { acceptedExplicitly } from "@/lib/consent";
import { SENT_KEY, type SentEnquiry } from "@/components/site/thanks-view";
import { countOf, fromPrice, yen } from "@/lib/pricing";
import { DatePicker } from "@/components/site/date-picker";
import { EmailInput } from "@/components/site/email-input";
import { DEFAULT_MAX_GUESTS, firstOpenDate, isBookable, timesFor, useBooking } from "@/components/site/booking-context";
import { GuestStepper } from "@/components/site/guest-stepper";
import { VariantPicker } from "@/components/site/variant-picker";
import { CoursePreference } from "@/components/site/course-preference";

type Status = "idle" | "sending" | "sent" | "failed";

const DATE_LOCALE: Record<Lang, string> = { en: "en-GB", es: "es-ES", ja: "ja-JP", fr: "fr-FR", "zh-tw": "zh-TW" };
const fmtDate = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(DATE_LOCALE[lang], { month: "short", day: "numeric", timeZone: "UTC" });

/** The generic contact and trade forms take `kind` only. On an experience
 *  page the form sits inside a BookingProvider and shares the plan, dates,
 *  head count and extras with the booking card beside the page.
 *
 *  `variant="card"` is the same form opened inside the booking card on wide
 *  screens: the card already shows the plan, date, time, guests and estimate,
 *  so it adds only what is still missing.
 *
 *  `golf` turns it into the stepped request of the two-plan page: area,
 *  course preference, dates, group, contact, with a summary line that
 *  matches what the mailbox receives. */
export function EnquiryForm({ kind, lang, fallbackEmail, experience, variant = "page", golf }: {
  kind: EnquiryKind; lang: Lang; fallbackEmail: string;
  experience?: { slug: string; title: string };
  variant?: "page" | "card";
  golf?: { variants: ExperienceVariant[]; copy: VariantPageCopy };
}) {
  const T = t(lang);
  const F = T.form;
  const D = T.detail;
  const [status, setStatus] = useState<Status>("idle");
  const trade = kind === "trade";
  const b = useBooking();
  const x = b?.experience;
  const plans = b?.pricing?.plans ?? [];
  const addOns = b?.pricing?.addOns ?? [];
  const card = variant === "card";
  const [needDate, setNeedDate] = useState(false);
  const g = golf && b ? golf : undefined;
  const G = g?.copy;
  const [rental, setRental] = useState<"all" | "some" | "none">("all");
  const started = useRef(false);

  /** One "form started" event per page view, on the first focus inside the form. */
  const markStarted = () => {
    if (started.current || !b) return;
    started.current = true;
    track(`${x?.eventPrefix ?? "experience"}_booking_form_started`, { experience: experience?.slug });
  };

  /** What the two-plan form shows above its button, and what it sends: the
   *  same words in both places. */
  const golfSummary = () => {
    if (!g || !b || !G) return null;
    const v = b.variantView;
    const pref = G.coursePreference.options.find((o) => o.id === b.coursePref);
    const line = [v?.title, countOf(G.pricing.golfers, b.guestsNumber), pref?.title].filter(Boolean).join(" · ");
    const price = b.customQuote || !v ? G.pricing.customQuote : fromPrice(G.pricing, v.price);
    return { line, price, custom: b.customQuote || !v };
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A double click, or Enter while the request is on its way, sends nothing twice.
    if (status === "sending") return;
    const form = e.currentTarget;
    // In the card the date picker sits above the form, outside its validation.
    if (card && b && !b.date) {
      setNeedDate(true);
      document.querySelector<HTMLElement>("#bk-date")?.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const summary = golfSummary();
    // The experience form asks for concrete dates and a head count; fold them
    // into the same two fields the generic form and the mailbox already use.
    if (b) {
      const slot = (d?: string, t?: string) => d ? [d, t].filter(Boolean).join(" ") : "";
      data.dates = slot(b.date, b.time);
      data.party = b.guests;
      const plan = plans.find((p) => p.id === b.plan);
      if (plan) data.plan = `${plan.label} — ${plan.name}`;
      if (b.addOns.length) data.addons = addOns.filter((a) => b.addOns.includes(a.id)).map((a) => a.name).join(", ");
      if (x?.interpreter !== false) data.interpreter = F.interpreterOpts[b.interpreter] ?? b.interpreter;
      if (b.estimate) data.estimate = `${yen(b.estimate.total)} (${[plans.length ? (b.estimate.peak ? D.seasonPeak : D.seasonRegular) : "", D.estimateFor(b.guestsNumber)].filter(Boolean).join(", ")})`;
      if (g && G && summary) {
        const v = b.variantView;
        data.area = v ? `${v.title} (${v.id})` : "";
        data.course_pref = G.coursePreference.options.find((o) => o.id === b.coursePref)?.title ?? b.coursePref;
        if (b.coursePref === "preferred") { data.course = b.courseName; data.course_url = b.courseUrl; }
        if (b.altDate) data.alt_date = b.altDate;
        // The mailbox sees exactly what the guest saw above the button.
        data.estimate = `${summary.price} — ${summary.line}`;
      }
      delete data.date; delete data.guests; delete data.time; delete data["alt-date"];
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, kind, lang, experience: experience?.slug }),
      });
      const json = (await res.json()) as { ok: boolean };
      if (!json.ok) { setStatus("failed"); return; }
      {
        // GTM turns this into the GA4 / Ads conversion; no tag IDs live here.
        const event = {
          // Unique per submission: Google Ads uses it as the transaction ID so a
          // double submit or a reload never counts twice.
          enquiry_id: eventId("enq"),
          // Enhanced conversions / Meta advanced matching: GTM's tags read this and
          // it leaves the browser hashed. Only after an explicit Accept, not the
          // regional default (see acceptedExplicitly).
          user_data: data.email && acceptedExplicitly() ? { email: data.email.trim().toLowerCase() } : undefined,
          enquiry_kind: kind,
          experience: experience?.slug,
          experience_title: experience?.title,
          plan: b?.plan || undefined,
          // Two-plan pages: which area and how the course is chosen, so the two
          // areas can be counted separately.
          area: g ? b?.variant : undefined,
          course_preference: g ? b?.coursePref : undefined,
          custom_quote: g ? !!b?.customQuote : undefined,
          language: lang,
          party_size: Number(data.party) || undefined,
          value: b?.estimate?.total,
          currency: b?.estimate ? "JPY" : undefined,
        };
        // Hand over to the confirmation page, which fires the conversion once it
        // has loaded (so leaving this page cannot cut the tag off) and shows a
        // clear "received". If storage is blocked, confirm here instead.
        const sent: SentEnquiry = {
          kind: kind === "trade" ? "trade" : "guest",
          email: data.email?.trim() || undefined,
          experienceTitle: g && b?.variantView ? `${experience?.title} — ${b.variantView.title}` : experience?.title,
          experienceUrl: experience ? window.location.pathname : undefined,
          // Readable dates for the page ("15 Oct 10:30"), not the raw ISO sent to the mailbox.
          dates: b ? (b.date ? `${fmtDate(b.date, lang)} ${b.time}` : undefined) : data.dates || undefined,
          guests: b ? (G ? countOf(G.pricing.golfers, b.guestsNumber) : D.estimateFor(b.guestsNumber)) : undefined,
          estimate: summary ? summary.price : b?.estimate ? yen(b.estimate.total) : undefined,
          event,
        };
        try {
          sessionStorage.setItem(SENT_KEY, JSON.stringify(sent));
          window.location.assign(`/${lang}/thanks/`);
          return;
        } catch {
          track("enquiry_sent", event);
          setStatus("sent");
          form.reset();
        }
      }
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-done" role="status">
        <Check size={20} />
        <div>
          <b>{F.sentTitle}</b>
          <p>{F.sentBody}</p>
        </div>
      </div>
    );
  }

  const summary = golfSummary();

  return (
    <form className={card ? "bk-form" : "enquiry-form"} method="post" action="/api/contact" onSubmit={submit} onFocusCapture={markStarted} noValidate={false} data-clarity-mask="True">
      {card && needDate && !b?.date && <p className="form-error" role="alert">{F.chooseDateFirst}</p>}
      {experience && !card && !g && (
        <p className="form-context">
          <span>{F.about}</span>{" "}
          <b>{experience.title}</b>
        </p>
      )}

      {/* Two-plan request: five steps, then the summary the mailbox also gets */}
      {g && G && b && x && (
        <>
          <fieldset className="form-step">
            <legend>{G.form.steps.area}</legend>
            <VariantPicker variants={g.variants} copy={G.pricing} name="form-variant" />
          </fieldset>
          <fieldset className="form-step">
            <legend>{G.form.steps.course}</legend>
            <CoursePreference copy={G.coursePreference} name="form-course" />
          </fieldset>
          <fieldset className="form-step">
            <legend>{G.form.steps.dates}</legend>
            <div className="form-row three">
              <div className="field">
                <label htmlFor="enq-date">{F.preferredDate}</label>
                <DatePicker id="enq-date" name="date" lang={lang} min={b.minDate} required closed={(d) => !isBookable(d, x)} value={b.date} onChange={(d) => b.set({ date: d })} />
                {b.minDate && <small className="form-hint">{F.earliestDate(fmtDate(b.minDate, lang), x.leadDays, x.cutoffTime)}</small>}
              </div>
              <div className="field">
                <label htmlFor="enq-alt-date">{G.form.altDate}</label>
                <DatePicker id="enq-alt-date" name="alt-date" lang={lang} min={b.minDate} closed={(d) => !isBookable(d, x)} value={b.altDate} onChange={(d) => b.set({ altDate: d })} />
              </div>
              {x.startTimes?.length ? (
                <label>
                  <span>{x.timeLabel ?? F.startTime}</span>
                  <select name="time" required value={b.time} onChange={(e) => b.set({ time: e.target.value })}>
                    {timesFor(x, b.date).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              ) : <span />}
            </div>
          </fieldset>
          <fieldset className="form-step">
            <legend>{G.form.steps.group}</legend>
            <div className="form-row two">
              <div className="field">
                <label htmlFor="enq-guests">{G.form.golfers}</label>
                <GuestStepper id="enq-guests" value={b.guests} min={x.minGuests} max={x.maxGuests ?? DEFAULT_MAX_GUESTS} onChange={(n) => b.set({ guests: n })} label={(n) => countOf(G.pricing.golfers, n)} decLabel={F.fewerGuests} incLabel={F.moreGuests} />
              </div>
              <label>
                <span>{G.form.experience}</span>
                <input name="handicap" type="text" maxLength={160} placeholder={G.form.experienceHint} />
              </label>
            </div>
            <div className="form-row two">
              <label>
                <span>{G.form.rental}</span>
                <select name="rental" value={G.form.rentalOpts[rental]} onChange={(e) => setRental((Object.keys(G.form.rentalOpts) as ("all" | "some" | "none")[]).find((k) => G.form.rentalOpts[k] === e.target.value) ?? "all")}>
                  {(Object.keys(G.form.rentalOpts) as ("all" | "some" | "none")[]).map((k) => <option key={k} value={G.form.rentalOpts[k]}>{G.form.rentalOpts[k]}</option>)}
                </select>
              </label>
              {rental !== "none" ? (
                <label>
                  <span>{G.form.handed}</span>
                  <input name="handed" type="text" maxLength={120} placeholder={G.form.handedHint} />
                </label>
              ) : <span />}
            </div>
          </fieldset>
          <fieldset className="form-step">
            <legend>{G.form.steps.contact}</legend>
            <div className="form-row two">
              <label>
                <span>{F.name}</span>
                <input name="name" type="text" required autoComplete="name" maxLength={120} />
              </label>
              <label>
                <span>{F.email}</span>
                <EmailInput lang={lang} required />
              </label>
            </div>
            <div className="form-row two">
              <label>
                <span>{G.form.pickup}</span>
                <input name="pickup" type="text" required maxLength={200} placeholder={G.form.pickupHint} />
              </label>
              <label>
                <span>{G.form.whatsapp}</span>
                <input name="whatsapp" type="tel" maxLength={60} autoComplete="tel" />
              </label>
            </div>
            <label className="form-row">
              <span>{G.form.requests}</span>
              <textarea name="message" rows={4} maxLength={4000} placeholder={G.form.requestsHint} />
            </label>
          </fieldset>
          {summary && (
            <div className="form-estimate" aria-live="polite">
              <span>{G.form.summaryH}</span>
              <b>{summary.price}</b>
              <small>{summary.line}. {summary.custom ? G.pricing.customQuoteNote : D.estimateNote}</small>
            </div>
          )}
        </>
      )}

      {b && x && !g && (
        <>
          {plans.length > 0 && !card && (
            <label className="form-row">
              <span>{F.plan}</span>
              <select name="plan-id" value={b.plan} onChange={(e) => b.set({ plan: e.target.value })}>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.name} · {b?.pricing?.planMode === "supplement" ? (p.supplement ? `+${yen(p.supplement)}` : D.planBaseShort) : yen(p.regular)}</option>)}
              </select>
            </label>
          )}
          {!card && <div className="form-row two">
            <div className="field">
              <label htmlFor="enq-date">{F.preferredDate}</label>
              <DatePicker id="enq-date" name="date" lang={lang} min={firstOpenDate(x, b.minDate) ?? b.minDate} required closed={(d) => !isBookable(d, x)} value={b.date} onChange={(d) => b.set({ date: d })} />
              {firstOpenDate(x, b.minDate) && <small className="form-hint">{F.earliestDate(fmtDate(firstOpenDate(x, b.minDate)!, lang), x.leadDays, x.cutoffTime)}</small>}
            </div>
            {x.startTimes?.length ? (
              <label>
                <span>{x.timeLabel ?? F.startTime}</span>
                <select name="time" required value={b.time} onChange={(e) => b.set({ time: e.target.value })}>
                  {timesFor(x, b.date).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            ) : <span />}
          </div>}
          <div className={card ? "form-row" : "form-row two keep"}>
            {!card && <div className="field">
              <label htmlFor="enq-guests">{F.partyN}</label>
              <GuestStepper id="enq-guests" value={b.guests} min={x.minGuests} max={x.maxGuests ?? DEFAULT_MAX_GUESTS} onChange={(g) => b.set({ guests: g })} label={F.guests} decLabel={F.fewerGuests} incLabel={F.moreGuests} />
            </div>}
            {x.interpreter !== false ? (
              <label>
                <span>{F.interpreter}</span>
                <select name="interpreter-choice" value={b.interpreter} onChange={(e) => b.set({ interpreter: e.target.value })}>
                  {Object.entries(F.interpreterOpts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            ) : !card && <span />}
          </div>
          <div className={card ? "form-row" : "form-row two"}>
            {addOns.length > 0 && (
              <fieldset className="form-addons">
                <legend>{F.addOns}</legend>
                {addOns.map((a) => (
                  <label key={a.id} className="form-check">
                    <input type="checkbox" checked={b.addOns.includes(a.id)} onChange={() => b.toggleAddOn(a.id)} />
                    <span><b>{a.name}</b><small>{a.price ? `${a.priceFrom && D.fromPrice ? `${D.fromPrice} ` : ""}${yen(a.price)}${a.priceFrom ? D.fromSuffix : ""}` : D.priceOnRequest}</small></span>
                  </label>
                ))}
              </fieldset>
            )}
          </div>
          {!card && <div className="form-estimate" aria-live="polite">
            {b.estimate ? (
              <><span>{[D.estimateH, plans.find((p) => p.id === b.plan)?.label, D.estimateFor(b.guestsNumber), plans.length && b.date ? (b.estimate.peak ? D.seasonPeak : D.seasonRegular) : ""].filter(Boolean).join(" · ")}</span><b>{yen(b.estimate.total)}</b><small>{plans.length ? D.priceTotalNote : b.pricing?.minCharge && b.guestsNumber < b.pricing.minCharge ? D.minChargeNote(b.pricing.minCharge) : D.pricePartyNote}. {plans.length && !b.date ? D.pickDateForSeason : D.estimateNote}</small></>
            ) : (
              <><span>{D.estimateH}</span><small>{b.largeParty ? D.largeGroupNote(b.guestsNumber) : D.quoteIndividually}</small></>
            )}
          </div>}
        </>
      )}

      {!g && (
        <div className={card ? "form-row" : "form-row two"}>
          <label>
            <span>{F.name}</span>
            <input name="name" type="text" required autoComplete="name" maxLength={120} />
          </label>
          <label>
            <span>{F.email}</span>
            <EmailInput lang={lang} required />
          </label>
        </div>
      )}

      {trade && (
        <div className="form-row two">
          <label>
            <span>{F.company}</span>
            <input name="company" type="text" required autoComplete="organization" maxLength={160} />
          </label>
          <label>
            <span>{F.country}</span>
            <input name="country" type="text" autoComplete="country-name" maxLength={80} />
          </label>
        </div>
      )}
      {!trade && !b && (
        <div className="form-row two">
          <label>
            <span>{F.dates}</span>
            <input name="dates" type="text" placeholder={F.datesHint} maxLength={120} />
          </label>
          <label>
            <span>{F.party}</span>
            <input name="party" type="text" placeholder={F.partyHint} maxLength={60} />
          </label>
        </div>
      )}

      {!g && (
        <label className="form-row">
          <span>{trade ? F.messageTrade : b ? (x?.notesLabel ?? F.notesXp) : F.message}</span>
          <textarea
            name="message" required={!b} rows={card ? 3 : b ? 4 : 7} maxLength={4000}
            placeholder={trade ? F.messageTradeHint : b ? (x?.notesHint ?? F.notesXpHint) : F.messageHint}
          />
        </label>
      )}

      {/* Honeypot: hidden from people, filled by bots. */}
      <label className="form-hp" aria-hidden="true">
        <span>Website</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="enquiry-actions">
        <button type="submit" className={card ? "bk-cta" : "contact-cta"} disabled={status === "sending"}>
          {status === "sending" ? F.sending : G ? G.form.cta : b ? x?.ctaLabel ?? F.sendRequest : F.send} <ArrowRight size={15} />
        </button>
        {!b && <span className="form-privacy">{F.privacy}</span>}
      </div>
      {b && <p className="form-after">{G ? G.form.note : F.sendRequestNote} <span className="form-privacy">{F.privacy}</span></p>}

      {status === "failed" && (
        <p className="form-error" role="alert">
          <Mail size={14} /> {F.failed} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>
        </p>
      )}
    </form>
  );
}
