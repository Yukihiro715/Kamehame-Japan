"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import type { EnquiryKind } from "@/lib/contact";
import { t, type Lang } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { yen } from "@/lib/pricing";
import { DatePicker } from "@/components/site/date-picker";
import { EmailInput } from "@/components/site/email-input";
import { DEFAULT_MAX_GUESTS, firstOpenDate, isBookable, timesFor, useBooking } from "@/components/site/booking-context";
import { GuestStepper } from "@/components/site/guest-stepper";

type Status = "idle" | "sending" | "sent" | "failed";

const DATE_LOCALE: Record<Lang, string> = { en: "en-GB", es: "es-ES", ja: "ja-JP", fr: "fr-FR", "zh-tw": "zh-TW" };
const fmtDate = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(DATE_LOCALE[lang], { month: "short", day: "numeric", timeZone: "UTC" });

/** The generic contact and trade forms take `kind` only. On an experience
 *  page the form sits inside a BookingProvider and shares the plan, dates,
 *  head count and extras with the booking card beside the page. */
export function EnquiryForm({ kind, lang, fallbackEmail, experience }: {
  kind: EnquiryKind; lang: Lang; fallbackEmail: string;
  experience?: { slug: string; title: string };
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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    // The experience form asks for concrete dates and a head count; fold them
    // into the same two fields the generic form and the mailbox already use.
    if (b) {
      const slot = (d?: string, t?: string) => d ? [d, t].filter(Boolean).join(" ") : "";
      data.dates = [slot(b.date, b.time), slot(b.altDate, b.altTime)].filter(Boolean).join(" / ");
      data.party = b.guests;
      const plan = plans.find((p) => p.id === b.plan);
      if (plan) data.plan = `${plan.label} — ${plan.name}`;
      if (b.addOns.length) data.addons = addOns.filter((a) => b.addOns.includes(a.id)).map((a) => a.name).join(", ");
      if (x?.interpreter !== false) data.interpreter = F.interpreterOpts[b.interpreter] ?? b.interpreter;
      if (b.estimate) data.estimate = `${yen(b.estimate.total)} (${[plans.length ? (b.estimate.peak ? D.seasonPeak : D.seasonRegular) : "", D.estimateFor(b.guestsNumber)].filter(Boolean).join(", ")})`;
      delete data.date; delete data.altDate; delete data.guests; delete data.time; delete data.altTime;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, kind, lang, experience: experience?.slug }),
      });
      const json = (await res.json()) as { ok: boolean };
      setStatus(json.ok ? "sent" : "failed");
      if (json.ok) {
        // GTM turns this into the GA4 / Ads conversion; no tag IDs live here.
        track("enquiry_sent", {
          enquiry_kind: kind,
          experience: experience?.slug,
          experience_title: experience?.title,
          plan: b?.plan || undefined,
          language: lang,
          party_size: Number(data.party) || undefined,
          value: b?.estimate?.total,
          currency: b?.estimate ? "JPY" : undefined,
        });
        form.reset();
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

  return (
    <form className="enquiry-form" onSubmit={submit} noValidate={false}>
      {experience && (
        <p className="form-context">
          <span>{F.about}</span>{" "}
          <b>{experience.title}</b>
        </p>
      )}

      {b && x && (
        <>
          {plans.length > 0 && (
            <label className="form-row">
              <span>{F.plan}</span>
              <select name="plan-id" value={b.plan} onChange={(e) => b.set({ plan: e.target.value })}>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.name} · {yen(p.regular)}</option>)}
              </select>
            </label>
          )}
          <div className="form-row two">
            <div className="field">
              <label htmlFor="enq-date">{F.preferredDate}</label>
              <DatePicker id="enq-date" name="date" lang={lang} min={firstOpenDate(x, b.minDate) ?? b.minDate} required closed={(d) => !isBookable(d, x)} value={b.date} onChange={(d) => b.set({ date: d })} />
              {firstOpenDate(x, b.minDate) && <small className="form-hint">{F.earliestDate(fmtDate(firstOpenDate(x, b.minDate)!, lang), x.leadDays, x.cutoffTime)}</small>}
            </div>
            {x.startTimes?.length ? (
              <label>
                <span>{F.startTime}</span>
                <select name="time" required value={b.time} onChange={(e) => b.set({ time: e.target.value })}>
                  {timesFor(x, b.date).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            ) : <span />}
          </div>
          <div className="form-row two">
            <div className="field">
              <label htmlFor="enq-alt-date">{F.altDate}</label>
              <DatePicker id="enq-alt-date" name="altDate" lang={lang} min={firstOpenDate(x, b.minDate) ?? b.minDate} closed={(d) => !isBookable(d, x)} value={b.altDate} onChange={(d) => b.set({ altDate: d })} />
            </div>
            {x.startTimes?.length ? (
              <label>
                <span>{F.altStartTime}</span>
                <select name="altTime" value={b.altTime} onChange={(e) => b.set({ altTime: e.target.value })}>
                  {timesFor(x, b.altDate).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            ) : <span />}
          </div>
          <div className="form-row two keep">
            <div className="field">
              <label htmlFor="enq-guests">{F.partyN}</label>
              <GuestStepper id="enq-guests" value={b.guests} min={x.minGuests} max={x.maxGuests ?? DEFAULT_MAX_GUESTS} onChange={(g) => b.set({ guests: g })} label={F.guests} decLabel={F.fewerGuests} incLabel={F.moreGuests} />
            </div>
            {x.interpreter !== false ? (
              <label>
                <span>{F.interpreter}</span>
                <select name="interpreter-choice" value={b.interpreter} onChange={(e) => b.set({ interpreter: e.target.value })}>
                  {Object.entries(F.interpreterOpts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            ) : <span />}
          </div>
          <div className="form-row two">
            {addOns.length > 0 && (
              <fieldset className="form-addons">
                <legend>{F.addOns}</legend>
                {addOns.map((a) => (
                  <label key={a.id} className="form-check">
                    <input type="checkbox" checked={b.addOns.includes(a.id)} onChange={() => b.toggleAddOn(a.id)} />
                    <span><b>{a.name}</b><small>{a.price ? yen(a.price) : D.priceOnRequest}</small></span>
                  </label>
                ))}
              </fieldset>
            )}
          </div>
          <div className="form-estimate" aria-live="polite">
            {b.estimate ? (
              <><span>{[D.estimateH, plans.find((p) => p.id === b.plan)?.label, D.estimateFor(b.guestsNumber), plans.length && b.date ? (b.estimate.peak ? D.seasonPeak : D.seasonRegular) : ""].filter(Boolean).join(" · ")}</span><b>{yen(b.estimate.total)}</b><small>{plans.length ? D.priceTotalNote : D.pricePartyNote}. {plans.length && !b.date ? D.pickDateForSeason : D.estimateNote}</small></>
            ) : (
              <><span>{D.estimateH}</span><small>{b.largeParty ? D.largeGroupNote(b.guestsNumber) : D.quoteIndividually}</small></>
            )}
          </div>
        </>
      )}

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

      <label className="form-row">
        <span>{trade ? F.messageTrade : b ? (x?.notesLabel ?? F.notesXp) : F.message}</span>
        <textarea
          name="message" required={!b} rows={b ? 4 : 7} maxLength={4000}
          placeholder={trade ? F.messageTradeHint : b ? (x?.notesHint ?? F.notesXpHint) : F.messageHint}
        />
      </label>

      {/* Honeypot: hidden from people, filled by bots. */}
      <label className="form-hp" aria-hidden="true">
        <span>Website</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="enquiry-actions">
        <button type="submit" className="contact-cta" disabled={status === "sending"}>
          {status === "sending" ? F.sending : b ? F.sendRequest : F.send} <ArrowRight size={15} />
        </button>
        {!b && <span className="form-privacy">{F.privacy}</span>}
      </div>
      {b && <p className="form-after">{F.sendRequestNote} <span className="form-privacy">{F.privacy}</span></p>}

      {status === "failed" && (
        <p className="form-error" role="alert">
          <Mail size={14} /> {F.failed} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>
        </p>
      )}
    </form>
  );
}
