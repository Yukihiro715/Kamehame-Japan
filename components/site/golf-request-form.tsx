"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import type { Experience, ExperienceVariant, VariantPageCopy } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";
import { eventId, track } from "@/lib/analytics";
import { acceptedExplicitly } from "@/lib/consent";
import { SENT_KEY, type SentEnquiry } from "@/components/site/thanks-view";
import { countOf, tierTotal, yen } from "@/lib/pricing";
import { DatePicker } from "@/components/site/date-picker";
import { EmailInput } from "@/components/site/email-input";
import { isBookable, timesFor, useBooking } from "@/components/site/booking-context";
import { GolfQuickPick, golfPriceParts } from "@/components/site/golf-options";

type Status = "idle" | "sending" | "sent" | "failed";
type Rental = "required" | "own" | "unsure";
type Handed = "right" | "left" | "unsure";
type AddOn = NonNullable<Experience["addOns"]>[number];

const DATE_LOCALE: Record<Lang, string> = { en: "en-GB", es: "es-ES", ja: "ja-JP", fr: "fr-FR", "zh-tw": "zh-TW" };
const fmtDate = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(DATE_LOCALE[lang], { month: "short", day: "numeric", timeZone: "UTC" });

/** "No preference" for the departure time: a real option, so the control can
 *  be required and still let the guest leave the time to us. */
export const NO_PREFERENCE = "none";

/** The golf page's one request form. The area and the party size come from
 *  the options panel (shown read-only at the top, with a link back to it);
 *  everything the booking needs is asked here in one go — date and departure,
 *  a specific course if wanted, the hotel, each golfer's rental clubs, the
 *  contact — and the package price is confirmed above the button before it is
 *  sent. The server recomputes the price from the master; what is sent from
 *  here is the choice, not the amount. */
export function GolfRequestForm({ lang, fallbackEmail, experience, variants, copy, addOns, parties }: {
  lang: Lang; fallbackEmail: string; experience: { slug: string; title: string };
  variants: ExperienceVariant[]; copy: VariantPageCopy; addOns: AddOn[]; parties: number[];
}) {
  const T = t(lang);
  const F = T.form;
  const G = copy.form;
  const O = copy.options;
  const b = useBooking();
  const [status, setStatus] = useState<Status>("idle");
  const [hotelUndecided, setHotelUndecided] = useState(false);
  const [rental, setRental] = useState<Record<number, Rental>>({});
  const [handed, setHanded] = useState<Record<number, Handed>>({});
  const started = useRef(false);
  if (!b) return null;
  const x = b.experience;
  const v = b.variantView ?? variants[0];
  const n = b.guestsNumber;
  const golfers = Array.from({ length: n }, (_, i) => i + 1);
  const specific = b.coursePref === "preferred";
  const total = specific ? null : tierTotal(v.tiers, n);
  const p = golfPriceParts(O, total, n);
  const rentalOf = (i: number): Rental => rental[i] ?? "required";
  const handedOf = (i: number): Handed => handed[i] ?? "right";
  const anyRental = golfers.some((i) => rentalOf(i) !== "own");
  const blocked = (a: AddOn) => !!a.maxParty && n > a.maxParty;
  const chosenAddOns = addOns.filter((a) => b.addOns.includes(a.id) && !blocked(a));
  const addOnPrice = (a: AddOn) => (a.price ? yen(a.perGuest ? a.price * n : a.price) : T.detail.priceOnRequest);
  const addOnLine = (a: AddOn) => `${a.name}${a.perGuest ? ` × ${n}` : ""} (${addOnPrice(a)})`;
  const timeLabel = b.time === NO_PREFERENCE || !b.time ? G.noPreference : b.time;
  const times = timesFor(x, b.date);

  /** One "form started" event per page view, on the first focus inside the form. */
  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    track(`${x.eventPrefix ?? "experience"}_booking_form_started`, { experience: experience.slug });
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A double click, or Enter while the request is on its way, sends nothing twice.
    if (status === "sending" || !b) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const level = data.level as keyof typeof G.experienceOpts;
    const payload = {
      kind: "guest", lang, experience: experience.slug,
      name: data.name, email: data.email, whatsapp: data.whatsapp, message: data.message, website: data.website,
      area: v.title, area_id: v.id, party: String(n),
      course_mode: specific ? "specific" : "recommended",
      course: specific ? b.courseName : "", course_url: specific ? b.courseUrl : "",
      dates: `${b.date} ${timeLabel}`,
      pickup: hotelUndecided ? [G.hotelUndecided, data["hotel-area"]].filter(Boolean).join(" — ") : data.pickup,
      level: [G.experienceOpts[level], data.handicap && `${G.handicap.replace(/\s*[(（].*$/, "")}: ${data.handicap}`].filter(Boolean).join(" · "),
      rental: golfers.map((i) => `${countOf(G.golferN, i)}: ${G.rentalOpts[rentalOf(i)]}${rentalOf(i) !== "own" ? ` (${G.handedOpts[handedOf(i)]})` : ""}`).join(" · "),
      clubs: anyRental ? data.clubs : "",
      // The same choices as keys, for the team's Japanese notification.
      level_key: level, handicap: data.handicap,
      rental_keys: golfers.map((i) => (rentalOf(i) === "own" ? "own" : `${rentalOf(i)}:${handedOf(i)}`)).join(","),
      addons: chosenAddOns.map(addOnLine).join(", "),
    };
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = (await res.json()) as { ok: boolean };
      if (!json.ok) { setStatus("failed"); return; }
      // GTM turns this into the GA4 / Ads conversion once the confirmation page
      // has loaded. The choice, the size and the package amount — no names,
      // hotels or free text.
      const event = {
        enquiry_id: eventId("enq"),
        user_data: data.email && acceptedExplicitly() ? { email: data.email.trim().toLowerCase() } : undefined,
        enquiry_kind: "guest",
        experience: experience.slug,
        experience_title: experience.title,
        area: v.id,
        golfers: n,
        course_mode: specific ? "specific" : "recommended",
        custom_quote: specific,
        language: lang,
        party_size: n,
        value: total ?? undefined,
        currency: total ? "JPY" : undefined,
      };
      const sent: SentEnquiry = {
        kind: "guest",
        email: data.email?.trim() || undefined,
        experienceTitle: `${experience.title} — ${v.title}`,
        experienceUrl: window.location.pathname,
        dates: b.date ? `${fmtDate(b.date, lang)} · ${timeLabel}` : undefined,
        guests: countOf(O.golfers, n),
        estimate: p.custom ? p.headline : p.totalShort,
        note: G.sentNote,
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
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-done" role="status">
        <Check size={20} />
        <div><b>{F.sentTitle}</b><p>{G.sentNote}</p></div>
      </div>
    );
  }

  return (
    <form className="enquiry-form golf-form" method="post" action="/api/contact" onSubmit={submit} onFocusCapture={markStarted} data-clarity-mask="True">
      {/* The choice, repeated compactly so it can be changed here too (same state as the panel) */}
      <div className="go-summary" aria-live="polite">
        <span className="go-summary-h">{G.summaryH}</span>
        <GolfQuickPick variants={variants} copy={O} parties={parties} name="form" />
        {p.custom
          ? <span className="go-summary-price"><strong>{p.headline}</strong><small>{p.line}</small></span>
          : <span className="go-summary-price"><strong>{p.totalShort}</strong><small>{p.perPersonRef}</small></span>}
      </div>

      <fieldset className="form-step">
        <legend>{G.steps.dates}</legend>
        <div className="form-row two">
          <div className="field">
            <label htmlFor="enq-date">{F.preferredDate}</label>
            <DatePicker id="enq-date" name="date" lang={lang} min={b.minDate} required closed={(d) => !isBookable(d, x)} value={b.date} onChange={(d) => b.set({ date: d })} />
            {b.minDate && <small className="form-hint">{F.earliestDate(fmtDate(b.minDate, lang), x.leadDays, x.cutoffTime)}</small>}
          </div>
          <label>
            <span>{G.departure}</span>
            <select name="time" required value={b.time} onChange={(e) => b.set({ time: e.target.value })}>
              {times.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value={NO_PREFERENCE}>{G.noPreference}</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="form-step">
        <legend>{G.steps.course}</legend>
        <label className="form-check go-check">
          <input type="checkbox" name="specific-course" checked={specific} onChange={(e) => b.set({ coursePref: e.target.checked ? "preferred" : "recommended" })} />
          <span><b>{G.specificCourse}</b><small>{G.specificCourseNote}</small></span>
        </label>
        {specific && (
          <div className="form-row two">
            <label>
              <span>{G.courseName}</span>
              <input name="course" type="text" required maxLength={160} value={b.courseName} onChange={(e) => b.set({ courseName: e.target.value })} />
            </label>
            <label>
              <span>{G.courseUrl}</span>
              <input name="course-url" type="text" maxLength={200} value={b.courseUrl} onChange={(e) => b.set({ courseUrl: e.target.value })} />
            </label>
            <small className="form-hint full">{G.specificCourseQuote}</small>
          </div>
        )}
      </fieldset>

      <fieldset className="form-step">
        <legend>{G.steps.hotel}</legend>
        <div className="form-row two">
          <label>
            <span>{G.pickup}</span>
            <input name="pickup" type="text" required={!hotelUndecided} disabled={hotelUndecided} maxLength={200} placeholder={G.pickupHint} />
          </label>
          {hotelUndecided ? (
            <label>
              <span>{G.hotelArea}</span>
              <input name="hotel-area" type="text" maxLength={120} placeholder={G.hotelAreaHint} />
            </label>
          ) : <span />}
        </div>
        <label className="form-check go-check one">
          <input type="checkbox" name="hotel-undecided" checked={hotelUndecided} onChange={(e) => setHotelUndecided(e.target.checked)} />
          <span><b>{G.hotelUndecided}</b></span>
        </label>
      </fieldset>

      <fieldset className="form-step">
        <legend>{G.steps.group}</legend>
        <div className="form-row two">
          <label>
            <span>{G.experience}</span>
            <select name="level" required defaultValue="">
              <option value="" disabled>{G.experienceSelect}</option>
              {(Object.keys(G.experienceOpts) as (keyof typeof G.experienceOpts)[]).map((k) => <option key={k} value={k}>{G.experienceOpts[k]}</option>)}
            </select>
          </label>
          <label>
            <span>{G.handicap}</span>
            <input name="handicap" type="text" maxLength={120} placeholder={G.handicapHint} />
          </label>
        </div>
        <div className="go-rental" role="group" aria-label={G.rental}>
          <span className="go-rental-h">{G.rental}</span>
          {golfers.map((i) => (
            <div className="go-rental-row" key={i}>
              <b>{countOf(G.golferN, i)}</b>
              <select name={`rental-${i}`} aria-label={`${countOf(G.golferN, i)} — ${G.rental}`} value={rentalOf(i)} onChange={(e) => setRental((r) => ({ ...r, [i]: e.target.value as Rental }))}>
                {(Object.keys(G.rentalOpts) as Rental[]).map((k) => <option key={k} value={k}>{G.rentalOpts[k]}</option>)}
              </select>
              {rentalOf(i) !== "own" ? (
                <select name={`handed-${i}`} aria-label={`${countOf(G.golferN, i)} — ${G.handed}`} value={handedOf(i)} onChange={(e) => setHanded((h) => ({ ...h, [i]: e.target.value as Handed }))}>
                  {(Object.keys(G.handedOpts) as Handed[]).map((k) => <option key={k} value={k}>{G.handedOpts[k]}</option>)}
                </select>
              ) : <span />}
            </div>
          ))}
        </div>
        {anyRental && (
          <label className="form-row">
            <span>{G.clubSpecs}</span>
            <input name="clubs" type="text" maxLength={200} placeholder={G.clubSpecsHint} />
          </label>
        )}
      </fieldset>

      <fieldset className="form-step">
        <legend>{G.steps.contact}</legend>
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
            <span>{G.whatsapp}</span>
            <input name="whatsapp" type="tel" maxLength={60} autoComplete="tel" inputMode="tel" placeholder={G.whatsappHint} />
          </label>
          <span />
        </div>
        <label className="form-row">
          <span>{G.requests}</span>
          <textarea name="message" rows={4} maxLength={4000} placeholder={G.requestsHint} />
        </label>
        {addOns.length > 0 && (
          <fieldset className="go-extras">
            <legend>{G.extras}</legend>
            <p className="form-hint">{G.extrasNote}</p>
            {addOns.map((a) => (
              <label key={a.id} className="form-check">
                <input type="checkbox" disabled={blocked(a)} checked={!blocked(a) && b.addOns.includes(a.id)} onChange={() => b.toggleAddOn(a.id)} />
                <span><b>{a.name}</b><small>{blocked(a) ? G.notForFour : addOnPrice(a)}</small><small>{a.description}</small></span>
              </label>
            ))}
          </fieldset>
        )}
      </fieldset>

      {/* Everything that matters, once more, right above the button */}
      <div className="form-estimate go-confirm" aria-live="polite">
        <span>{G.confirmH}</span>
        <dl>
          <div><dt>{O.areaLegend}</dt><dd>{v.title}</dd></div>
          <div><dt>{O.golfersLegend}</dt><dd>{countOf(O.golfers, n)}</dd></div>
          <div><dt>{F.preferredDate}</dt><dd>{b.date ? `${fmtDate(b.date, lang)} · ${timeLabel}` : "—"}</dd></div>
          <div><dt>{G.steps.course}</dt><dd>{specific ? (b.courseName || G.specificCourse) : G.recommendedCourse}</dd></div>
          <div className="go-confirm-price"><dt>{G.package}</dt><dd><b>{p.custom ? p.headline : p.totalShort}</b>{!p.custom && <small>{p.perPersonRef} · {G.perPersonRef}</small>}</dd></div>
          {chosenAddOns.map((a) => <div key={a.id}><dt>{G.extras}</dt><dd>{addOnLine(a)}</dd></div>)}
        </dl>
        <small>{G.confirmNote}</small>
      </div>

      {/* Honeypot: hidden from people, filled by bots. */}
      <label className="form-hp" aria-hidden="true">
        <span>Website</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="enquiry-actions">
        <button type="submit" className="contact-cta" disabled={status === "sending"}>
          {status === "sending" ? F.sending : G.cta} <ArrowRight size={15} />
        </button>
      </div>
      <p className="form-after">{G.note} <a href="#terms">{G.terms}</a> <span className="form-privacy">{F.privacy}</span></p>

      {status === "failed" && (
        <p className="form-error" role="alert">
          <Mail size={14} /> {F.failed} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>
        </p>
      )}
    </form>
  );
}
