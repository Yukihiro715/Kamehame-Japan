"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import type { EnquiryKind } from "@/lib/contact";
import { t, type Lang } from "@/lib/i18n";

type Status = "idle" | "sending" | "sent" | "failed";

export function EnquiryForm({
  kind, lang, fallbackEmail, experience,
}: { kind: EnquiryKind; lang: Lang; fallbackEmail: string; experience?: { slug: string; title: string } }) {
  const T = t(lang);
  const F = T.form;
  const [status, setStatus] = useState<Status>("idle");
  const trade = kind === "trade";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
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
        <span>{trade ? F.messageTrade : F.message}</span>
        <textarea name="message" required rows={7} maxLength={4000} placeholder={trade ? F.messageTradeHint : F.messageHint} />
      </label>

      {/* Honeypot: hidden from people, filled by bots. */}
      <label className="form-hp" aria-hidden="true">
        <span>Website</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="enquiry-actions">
        <button type="submit" className="contact-cta" disabled={status === "sending"}>
          {status === "sending" ? F.sending : F.send} <ArrowRight size={15} />
        </button>
        <span className="form-privacy">{F.privacy}</span>
      </div>

      {status === "failed" && (
        <p className="form-error" role="alert">
          <Mail size={14} /> {F.failed} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>
        </p>
      )}
    </form>
  );
}
