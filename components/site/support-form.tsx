"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { DatePicker } from "@/components/site/date-picker";
import { EmailInput } from "@/components/site/email-input";
import { GuestStepper } from "@/components/site/guest-stepper";
import { readAttribution } from "@/lib/attribution-client";
import { eventId, track } from "@/lib/analytics";
import { acceptedExplicitly } from "@/lib/consent";
import { SENT_KEY, type SentEnquiry } from "@/components/site/thanks-view";
import { supportCopy } from "@/lib/support";
import { t, type Lang } from "@/lib/i18n";

type Status = "idle" | "sending" | "failed";

/** 06:00 to 24:00 in half hours. */
const TIMES = Array.from({ length: 37 }, (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

/** Tomorrow in Japan, as the first date the picker offers. */
function tomorrowJst(): string {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  jst.setUTCDate(jst.getUTCDate() + 1);
  return jst.toISOString().slice(0, 10);
}

/** The babysitting request: date, place, hours, children, language, how to
 *  reach you, and the golf case (a venue away from the hotel, travel time in
 *  the care hours). Posts to /api/contact as kind "support"; the server keeps
 *  the fields apart for the team's record and the acknowledgement. */
export function SupportForm({ lang, fallbackEmail }: { lang: Lang; fallbackEmail: string }) {
  const S = supportCopy(lang);
  const F = S.form;
  const T = t(lang);
  const [status, setStatus] = useState<Status>("idle");
  const [date, setDate] = useState("");
  const [children, setChildren] = useState("1");
  const [place, setPlace] = useState<"hotel" | "apartment" | "venue" | "other">("hotel");
  const [golf, setGolf] = useState(false);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("17:00");
  const [dateMissing, setDateMissing] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    if (!date) { setDateMissing(true); document.querySelector<HTMLElement>("#sp-date")?.focus(); return; }
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "support", service: "babysitter", lang,
          name: data.name, email: data.email, whatsapp: data.whatsapp, message: data.message, website: data.website,
          dates: date, start, end, party: children,
          place, place_detail: data.place_detail, ages: data.ages, language: data.language,
          golf: golf ? "1" : "", golf_venue: golf ? data.golf_venue : "", travel: golf && data.travel === "on" ? "1" : "",
          attribution: readAttribution(),
        }),
      });
      const json = (await res.json()) as { ok: boolean; request_id?: string };
      if (!json.ok) { setStatus("failed"); return; }
      const event = {
        enquiry_id: json.request_id || eventId("enq"),
        user_data: data.email && acceptedExplicitly() ? { email: data.email.trim().toLowerCase() } : undefined,
        enquiry_kind: "support", experience: "support-babysitter", experience_title: S.baby.h1, language: lang,
        party_size: Number(children) || undefined,
      };
      const sent: SentEnquiry = { kind: "guest", email: data.email?.trim() || undefined, experienceTitle: S.baby.h1, experienceUrl: window.location.pathname, dates: `${date} ${start}–${end}`, guests: `${children}`, note: F.thanksNote, event };
      try {
        sessionStorage.setItem(SENT_KEY, JSON.stringify(sent));
        window.location.assign(`/${lang}/thanks/`);
      } catch {
        track("enquiry_sent", event);
        form.reset();
        setStatus("idle");
      }
    } catch {
      setStatus("failed");
    }
  }

  return (
    <form className="enquiry-form sp-form" method="post" action="/api/contact" onSubmit={submit} data-clarity-mask="True">
      {dateMissing && !date && <p className="form-error" role="alert">{T.form.chooseDateFirst}</p>}
      <div className="form-row two">
        <div className="field">
          <label htmlFor="sp-date">{F.date}</label>
          <DatePicker id="sp-date" name="date" lang={lang} min={tomorrowJst()} required value={date} onChange={(d) => { setDate(d); setDateMissing(false); }} />
        </div>
        <label>
          <span>{F.place}</span>
          <select name="place" value={place} onChange={(e) => setPlace(e.target.value as typeof place)}>
            {(Object.keys(F.placeOpts) as (keyof typeof F.placeOpts)[]).map((k) => <option key={k} value={k}>{F.placeOpts[k]}</option>)}
          </select>
        </label>
      </div>
      <label className="form-row">
        <span>{F.placeDetail}</span>
        <input name="place_detail" type="text" required maxLength={200} placeholder={F.placeDetailHint} />
      </label>
      <div className="form-row two">
        <label>
          <span>{F.start}</span>
          <select name="start" value={start} onChange={(e) => setStart(e.target.value)}>{TIMES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
        </label>
        <label>
          <span>{F.end}</span>
          <select name="end" value={end} onChange={(e) => setEnd(e.target.value)}>{TIMES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
        </label>
      </div>
      <div className="form-row two keep">
        <div className="field">
          <label htmlFor="sp-children">{F.children}</label>
          <GuestStepper id="sp-children" value={children} min={1} max={6} onChange={setChildren} label={(n) => `${n}`} decLabel="−" incLabel="+" />
        </div>
        <label>
          <span>{F.ages}</span>
          <input name="ages" type="text" required maxLength={80} placeholder={F.agesHint} />
        </label>
      </div>
      <label className="form-row">
        <span>{F.language}</span>
        <select name="language" defaultValue="en">
          {(Object.keys(F.languageOpts) as (keyof typeof F.languageOpts)[]).map((k) => <option key={k} value={k}>{F.languageOpts[k]}</option>)}
        </select>
      </label>

      <label className="form-check">
        <input type="checkbox" checked={golf} onChange={(e) => setGolf(e.target.checked)} />
        <span><b>{F.golf}</b></span>
      </label>
      {golf && (
        <div className="sp-golf">
          <label className="form-row">
            <span>{F.golfVenue}</span>
            <input name="golf_venue" type="text" maxLength={160} placeholder={F.golfVenueHint} />
          </label>
          <label className="form-check">
            <input name="travel" type="checkbox" defaultChecked />
            <span><b>{F.travel}</b></span>
          </label>
        </div>
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
      <label className="form-row">
        <span>{F.whatsapp}</span>
        <input name="whatsapp" type="tel" autoComplete="tel" maxLength={60} inputMode="tel" />
      </label>
      <label className="form-row">
        <span>{F.notes}</span>
        <textarea name="message" rows={4} maxLength={4000} placeholder={F.notesHint} />
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
      </div>
      <p className="form-after">{F.after} <span className="form-privacy">{F.privacy}</span></p>
      {status === "failed" && (
        <p className="form-error" role="alert">
          <Mail size={14} /> {F.failed} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>
        </p>
      )}
    </form>
  );
}
