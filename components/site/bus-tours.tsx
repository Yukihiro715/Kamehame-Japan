"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bus, Check, ChevronLeft, ShieldCheck, Users, UtensilsCrossed } from "lucide-react";
import { GOLFPAQ_RENTAL_JPY, enquiryTotal, yen, type PublicTour } from "@/lib/golfpaq";
import type { BusCopy } from "@/lib/golfpaq-copy";
import type { Lang } from "@/lib/i18n";
import { track } from "@/lib/analytics";

const seatsText = (tpl: string, n: number) => { const [one, many] = tpl.split("|"); return (n === 1 || !many ? one : many).replace("{n}", String(n)); };
const FALLBACK_IMG = "/images/golf-gallery-10-golf-course.webp";
const MAX_PEOPLE = 8;

const dateLabel = (d: string, lang: Lang) => {
  const x = new Date(`${d}T00:00:00Z`);
  return lang === "ja" ? `${x.getUTCMonth() + 1}月${x.getUTCDate()}日（${"日月火水木金土"[x.getUTCDay()]}）` : x.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
};
const monthLabel = (m: string, lang: Lang) => { const [y, mm] = m.split("-").map(Number); return lang === "ja" ? `${y}年${mm}月` : new Date(Date.UTC(y, mm - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }); };

function Lunch({ t, C }: { t: PublicTour; C: BusCopy }) {
  const label = t.departure.lunch === "included" ? C.lunchIncluded : t.departure.lunch === "subsidy" ? C.lunchSubsidy : C.lunchNot;
  return <span className="gb-tag"><UtensilsCrossed size={12} /> {label}</span>;
}

/** The catalogue, the filters, the enquiry form and the thank-you screen. */
export function BusTours({ tours, updatedAt, lang, C }: { tours: PublicTour[]; updatedAt: string | null; lang: Lang; C: BusCopy }) {
  const [month, setMonth] = useState(""), [people, setPeople] = useState(1), [area, setArea] = useState("");
  const [chosen, setChosen] = useState<PublicTour | null>(null);
  const [open, setOpen] = useState<PublicTour | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const months = useMemo(() => [...new Set(tours.map((t) => t.date.slice(0, 7)))].sort(), [tours]);
  const areas = useMemo(() => [...new Set(tours.map((t) => t.departure.area))].sort(), [tours]);
  const filtered = useMemo(() => tours.filter((t) => (!month || t.date.startsWith(month)) && (!area || t.departure.area === area) && t.seats >= people), [tours, month, area, people]);
  useEffect(() => { if (chosen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [chosen]);
  const updatedText = updatedAt ? new Date(updatedAt).toLocaleString(lang === "ja" ? "ja-JP" : "en-GB", { timeZone: "Asia/Tokyo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " JST" : null;

  return (
    <section className="gb-tours" id="tours" aria-labelledby="gb-tours-h">
      <div className="gb-wrap">
        <h2 id="gb-tours-h">{C.toursH}</h2>
        <p className="gb-lede">{C.toursLede}</p>
        <div className="gb-filters">
          <label><span>{C.filterMonth}</span><select value={month} onChange={(e) => setMonth(e.target.value)}><option value="">{C.allMonths}</option>{months.map((m) => <option key={m} value={m}>{monthLabel(m, lang)}</option>)}</select></label>
          <label><span>{C.filterGolfers}</span><select value={people} onChange={(e) => setPeople(Number(e.target.value))}>{Array.from({ length: MAX_PEOPLE }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <label><span>{C.filterDeparture}</span><select value={area} onChange={(e) => setArea(e.target.value)}><option value="">{C.allDepartures}</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
          {updatedText && <span className="gb-updated">{C.updated}: {updatedText}</span>}
        </div>
        <div className="gb-how">
          <b><ShieldCheck size={16} /> {C.howH}</b>
          <p>{C.howBody} {C.howAvailability}</p>
        </div>
        {tours.length === 0 ? <p className="gb-empty">{C.unavailable}</p> : filtered.length === 0 ? <p className="gb-empty">{C.noMatch}</p> : (
          <ul className="gb-grid">
            {filtered.map((t) => (
              <li key={t.id} className={`gb-card${chosen?.id === t.id ? " on" : ""}`}>
                <div className="gb-photo"><img src={t.imageUrl ?? FALLBACK_IMG} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /><span className="gb-date">{dateLabel(t.date, lang)}</span></div>
                <div className="gb-body">
                  <h3>{t.course}</h3>
                  <p className="gb-meta"><Bus size={14} /> {t.departure.area}{t.departure.via ? ` · ${t.departure.via}` : ""}{t.departure.time ? ` · ${C.departs} ${t.departure.time}` : ""}</p>
                  <div className="gb-tags"><Lunch t={t} C={C} />{t.departure.throughPlay && <span className="gb-tag">{C.throughPlay}</span>}<span className="gb-tag"><Users size={12} /> {seatsText(C.seatsLeft, t.seats)}</span></div>
                  <p className="gb-price"><b>{yen(t.perPersonYen)}</b> <span>{C.perPerson}</span></p>
                  <p className="gb-incl">{C.includesLine}</p>
                  <button type="button" className="gb-btn" onClick={() => { setChosen(t); track("bus_tour_select", { tour_id: t.id, date: t.date }); }}>{C.enquireBtn}</button>
                  <p className="gb-nopay">{C.noPayment}</p>
                  {(t.highlights || t.schedule) && <button type="button" className="gb-link" onClick={() => setOpen(t)}>{C.details}</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={formRef}>
          {chosen && <Enquiry key={chosen.id} tour={chosen} initialPeople={people} lang={lang} C={C} onBack={() => setChosen(null)} />}
        </div>
      </div>
      {open && <TourSheet tour={open} lang={lang} C={C} onClose={() => setOpen(null)} />}
    </section>
  );
}

function TourSheet({ tour, lang, C, onClose }: { tour: PublicTour; lang: Lang; C: BusCopy; onClose: () => void }) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [onClose]);
  return (
    <div className="gb-sheet" role="dialog" aria-modal="true" aria-label={tour.course} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gb-sheet-box">
        <button type="button" className="gb-close" onClick={onClose} aria-label="Close">×</button>
        <img src={tour.imageUrl ?? FALLBACK_IMG} alt="" referrerPolicy="no-referrer" />
        <h3>{tour.course}</h3>
        <p className="gb-meta">{dateLabel(tour.date, lang)} · {tour.departure.area}{tour.departure.time ? ` · ${C.departs} ${tour.departure.time}` : ""} · <b>{yen(tour.perPersonYen)}</b> {C.perPerson}</p>
        {tour.highlights && <><h4>{C.highlightsH}</h4><p className="gb-pre">{tour.highlights}</p></>}
        {tour.schedule && <><h4>{C.scheduleH}</h4><p className="gb-pre">{tour.schedule}</p></>}
        {tour.notes?.length ? <><h4>{C.notesH}</h4><ul>{tour.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></> : null}
      </div>
    </div>
  );
}

function Enquiry({ tour, initialPeople, lang, C, onBack }: { tour: PublicTour; initialPeople: number; lang: Lang; C: BusCopy; onBack: () => void }) {
  const [people, setPeople] = useState(Math.min(initialPeople, tour.seats));
  const [rental, setRental] = useState(false), [renters, setRenters] = useState(initialPeople);
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [phone, setPhone] = useState(""), [note, setNote] = useState(""), [consent, setConsent] = useState(false), [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle"), [error, setError] = useState<string | null>(null), [reference, setReference] = useState("");
  const [requestId] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : ""));
  const effectiveRenters = rental ? Math.min(Math.max(renters, 1), people) : 0;
  const money = enquiryTotal(tour.perPersonYen, people, effectiveRenters);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || status === "sending") return;
    setStatus("sending"); setError(null);
    try {
      const r = await fetch("/api/golfpaq/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: tour.id, date: tour.date, people, rental, renters: effectiveRenters, name, email, phone, note, lang, consent, request_id: requestId, website }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; reference?: string; error?: string };
      if (!r.ok || !j.ok) { setError(C.errors[j.error ?? ""] ?? C.errors.default); setStatus("idle"); return; }
      setReference(j.reference ?? ""); setStatus("done");
      track("bus_tour_enquiry", { tour_id: tour.id, date: tour.date, golfers: people, rentals: effectiveRenters, value: money.total, currency: "JPY" });
    } catch { setError(C.errors.default); setStatus("idle"); }
  }

  if (status === "done") {
    return (
      <div className="gb-form gb-done" role="status">
        <h3>{C.doneH}</h3>
        {C.doneLines.map((l) => <p key={l}>{l}</p>)}
        <p className="gb-ref">{C.doneRef}: <code>{reference}</code></p>
        <p className="gb-small">{tour.course} · {dateLabel(tour.date, lang)} · {people} {C.golfers.toLowerCase()}{effectiveRenters ? ` · ${C.summaryRental} ×${effectiveRenters}` : ""} · {C.summaryTotal} <b>{yen(money.total)}</b></p>
        <button type="button" className="gb-link" onClick={onBack}>{C.doneAgain}</button>
      </div>
    );
  }
  return (
    <form className="gb-form" onSubmit={submit} id="enquiry">
      <button type="button" className="gb-link gb-back" onClick={onBack}><ChevronLeft size={14} /> {C.back}</button>
      <h3>{C.formH}</h3>
      <p className="gb-chosen"><b>{tour.course}</b> · {dateLabel(tour.date, lang)} · {tour.departure.area}{tour.departure.time ? ` · ${C.departs} ${tour.departure.time}` : ""}</p>
      <div className="gb-fields">
        <label><span>{C.golfers}</span><select name="people" value={people} onChange={(e) => setPeople(Number(e.target.value))}>{Array.from({ length: Math.min(MAX_PEOPLE, tour.seats) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <div className="gb-rental">
          <label className="gb-check"><input type="checkbox" name="rental" checked={rental} onChange={(e) => setRental(e.target.checked)} /> <span>{C.rentalLabel}</span></label>
          {rental && people > 1 && (
            <label className="gb-sub"><span>{C.rentalCount}</span><select name="renters" value={Math.min(Math.max(renters, 1), people)} onChange={(e) => setRenters(Number(e.target.value))}>{Array.from({ length: people }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          )}
          {rental && <small>{C.rentalCountHint}</small>}
        </div>
      </div>
      <dl className="gb-summary" aria-live="polite">
        <dt>{C.summaryPerPerson}</dt><dd>{yen(tour.perPersonYen)} {C.perPerson} × {people} = <b>{yen(money.tours)}</b></dd>
        {effectiveRenters > 0 && <><dt>{C.summaryRental}</dt><dd>{yen(GOLFPAQ_RENTAL_JPY)} {C.perPerson} × {effectiveRenters} = <b>{yen(money.rentals)}</b></dd></>}
        <dt className="gb-total">{C.summaryTotal}</dt><dd className="gb-total"><b>{yen(money.total)}</b> <small>{C.taxIncluded}</small></dd>
      </dl>
      <p className="gb-small">{C.includesLine}. {C.howAvailability}</p>
      <div className="gb-fields">
        <label><span>{C.name}</span><input required name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" /></label>
        <label><span>{C.email}</span><input required type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" /></label>
        <label><span>{C.phone}</span><input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} autoComplete="tel" /></label>
        <label className="gb-full"><span>{C.notes}</span><textarea name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} placeholder={C.notesHint} /></label>
        <label className="gb-hp" aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <label className="gb-check gb-consent"><input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} required /> <span>{C.consent}</span></label>
      <div className="gb-how gb-how-form"><b><ShieldCheck size={16} /> {C.howH}</b><p>{C.howBody}</p></div>
      {error && <p className="gb-error" role="alert">{error}</p>}
      <button type="submit" className="gb-btn gb-btn-big" disabled={status === "sending" || !consent}>{status === "sending" ? C.sending : C.send}</button>
      <p className="gb-nopay"><Check size={13} /> {C.noPayment}</p>
    </form>
  );
}
