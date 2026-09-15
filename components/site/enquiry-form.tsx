"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import type { EnquiryKind } from "@/lib/contact";
import { t, type Lang } from "@/lib/i18n";

type Status = "idle" | "sending" | "sent" | "failed";

export interface EnquiryExperience {
  slug: string;
  title: string;
  partySize?: { min: number; max: number };
  /** Days of notice the venue needs; the date picker starts after them. */
  leadDays?: number;
  /** Start times the venue offers; shown as a select when present. */
  startTimes?: string[];
}

export function EnquiryForm({
  kind, lang, fallbackEmail, experience,
}: { kind: EnquiryKind; lang: Lang; fallbackEmail: string; experience?: EnquiryExperience }) {
  const T = t(lang);
  const F = T.form;
  const [status, setStatus] = useState<Status>("idle");
  const trade = kind === "trade";
  const times = experience?.startTimes && experience.startTimes.length > 0 ? experience.startTimes : undefined;
  // Pre-select the typical dinner slot so the example reads 18:00, not the last slot.
  const sampleTime = times?.includes("18:00") ? "18:00" : times?.[0];
  // Earliest selectable date, in the visitor's own time zone — computed after
  // mount so the server and the browser never disagree about "today".
  const [minDate, setMinDate] = useState<string>();
  useEffect(() => {
    const d = new Date(); d.setDate(d.getDate() + (experience?.leadDays ?? 3));
    setMinDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, [experience?.leadDays]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    // The experience form asks for concrete dates and a head count; fold them
    // into the same two fields the generic form and the mailbox already use.
    if (experience) {
      const slot = (d?: string, t?: string) => d ? [d, t].filter(Boolean).join(" ") : "";
      data.dates = [slot(data.date, data.time), slot(data.altDate, data.altTime)].filter(Boolean).join(" / ");
      data.party = data.guests;
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
      if (json.ok) form.reset();
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
      <div className="form-row two">
        <label>
          <span>{F.name}</span>
          <input name="name" type="text" required autoComplete="name" maxLength={120} />
        </label>
        <label>
          <span>{F.email}</span>
          <input name="email" type="email" required autoComplete="email" maxLength={200} />
        </label>
      </div>

      {trade ? (
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
      ) : experience ? (
        <>
          <div className="form-row two">
            <label>
              <span>{F.preferredDate}</span>
              <input name="date" type="date" required min={minDate} />
            </label>
            {times ? (
              <label>
                <span>{F.startTime}</span>
                <select name="time" required defaultValue={sampleTime}>
                  {times.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            ) : <span />}
          </div>
          <div className="form-row two">
            <label>
              <span>{F.altDate}</span>
              <input name="altDate" type="date" min={minDate} />
            </label>
            {times ? (
              <label>
                <span>{F.altStartTime}</span>
                <select name="altTime" defaultValue={sampleTime}>
                  {times.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            ) : <span />}
          </div>
          <div className="form-row two">
            <label>
              <span>{F.partyN}</span>
              <input
                name="guests" type="number" inputMode="numeric" required
                min={experience.partySize?.min ?? 1} max={experience.partySize?.max ?? 40}
                defaultValue={experience.partySize?.min ?? 2}
              />
            </label>
          </div>
        </>
      ) : (
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
        <span>{trade ? F.messageTrade : experience ? F.messageXp : F.message}</span>
        <textarea
          name="message" required={!experience} rows={experience ? 4 : 7} maxLength={4000}
          placeholder={trade ? F.messageTradeHint : experience ? F.messageXpHint : F.messageHint}
        />
      </label>

      {/* Honeypot: hidden from people, filled by bots. */}
      <label className="form-hp" aria-hidden="true">
        <span>Website</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="enquiry-actions">
        <button type="submit" className="contact-cta" disabled={status === "sending"}>
          {status === "sending" ? F.sending : experience ? F.sendRequest : F.send} <ArrowRight size={15} />
        </button>
        {!experience && <span className="form-privacy">{F.privacy}</span>}
      </div>
      {experience && <p className="form-after">{F.sendRequestNote} <span className="form-privacy">{F.privacy}</span></p>}

      {status === "failed" && (
        <p className="form-error" role="alert">
          <Mail size={14} /> {F.failed} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>
        </p>
      )}
    </form>
  );
}
