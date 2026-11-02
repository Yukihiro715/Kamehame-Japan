"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bus, Check, ChevronLeft, ChevronRight, ShieldCheck, Users, UtensilsCrossed } from "lucide-react";
import { GOLFPAQ_RENTAL_JPY, enquiryTotal, yen, type PublicTour } from "@/lib/golfpaq";
import type { BusCopy } from "@/lib/golfpaq-copy";
import type { Lang } from "@/lib/i18n";
import { track } from "@/lib/analytics";

const seatsText = (tpl: string, n: number) => { const [one, many] = tpl.split("|"); return (n === 1 || !many ? one : many).replace("{n}", String(n)); };
const FALLBACK_IMG = "/images/golf-gallery-10-golf-course.webp";
const MAX_PEOPLE = 8;
/** The course name for the page's language: English names on the English pages. */
const courseName = (t: PublicTour, lang: Lang) => (lang === "ja" ? t.course : t.courseEn || t.course);

const dateLabel = (d: string, lang: Lang) => {
  const x = new Date(`${d}T00:00:00Z`);
  return lang === "ja" ? `${x.getUTCMonth() + 1}月${x.getUTCDate()}日（${"日月火水木金土"[x.getUTCDay()]}）` : x.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
};
const monthLabel = (m: string, lang: Lang) => { const [y, mm] = m.split("-").map(Number); return lang === "ja" ? `${y}年${mm}月` : new Date(Date.UTC(y, mm - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }); };

function Lunch({ t, C }: { t: PublicTour; C: BusCopy }) {
  const label = t.departure.lunch === "included" ? C.lunchIncluded : t.departure.lunch === "subsidy" ? C.lunchSubsidy : C.lunchNot;
  return <span className="gb-tag"><UtensilsCrossed size={12} /> {label}</span>;
}

/** The calendar, the filters, the catalogue, the enquiry form and the thank-you screen. */
export function BusTours({ tours, updatedAt, lang, C }: { tours: PublicTour[]; updatedAt: string | null; lang: Lang; C: BusCopy }) {
  const [day, setDay] = useState(""), [people, setPeople] = useState(1), [area, setArea] = useState("");
  const [chosen, setChosen] = useState<PublicTour | null>(null);
  const [open, setOpen] = useState<PublicTour | null>(null);
  const [flash, setFlash] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const months = useMemo(() => [...new Set(tours.map((t) => t.date.slice(0, 7)))].sort(), [tours]);
  const areas = useMemo(() => [...new Set(tours.map((t) => t.departure.area))].sort(), [tours]);
  // The golfers filter never offers more than the largest open tour can take.
  const maxSeats = useMemo(() => Math.min(MAX_PEOPLE, Math.max(1, ...tours.filter((t) => !t.soldOut).map((t) => t.seats))), [tours]);
  const filtered = useMemo(() => tours.filter((t) => (!day || t.date === day) && (!area || t.departure.area === area) && (t.soldOut || t.seats >= people)), [tours, day, area, people]);
  /** Cards bundled per date, each date a horizontally scrolling row. */
  const groups = useMemo(() => { const m = new Map<string, PublicTour[]>(); for (const t of filtered) { (m.get(t.date) ?? m.set(t.date, []).get(t.date)!).push(t); } return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([d, list]) => [d, [...list].sort((a, b) => Number(a.soldOut) - Number(b.soldOut))] as [string, PublicTour[]]); }, [filtered]);
  useEffect(() => { if (chosen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [chosen]);
  useEffect(() => { if (!flash) return; const id = setTimeout(() => setFlash(0), 700); return () => clearTimeout(id); }, [flash]);
  const updatedText = updatedAt ? new Date(updatedAt).toLocaleString(lang === "ja" ? "ja-JP" : "en-GB", { timeZone: "Asia/Tokyo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " JST" : null;
  /** A tap on the calendar: filter, then make the change visible (scroll to the list and flash it). */
  const pick = (d: string, scroll = false) => {
    setDay(d);
    if (scroll) { setFlash(Date.now()); listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  };

  return (
    <section className="gb-tours" id="tours" aria-labelledby="gb-tours-h">
      <div className="gb-wrap">
        <h2 id="gb-tours-h">{C.toursH}</h2>
        <p className="gb-lede">{C.toursLede}</p>
        <div className="gb-pick">
        {tours.length > 0 && <Calendar tours={tours} months={months} day={day} people={people} area={area} onPick={pick} lang={lang} C={C} />}
        <div className="gb-filters">
          <label><span>{C.filterGolfers}</span><select value={people} onChange={(e) => setPeople(Number(e.target.value))}>{Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <label><span>{C.filterDeparture}</span><select value={area} onChange={(e) => setArea(e.target.value)}><option value="">{C.allDepartures}</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
          {updatedText && <span className="gb-updated">{C.updated}: {updatedText}</span>}
        </div>
        </div>
        <div className="gb-how">
          <b><ShieldCheck size={16} /> {C.howH}</b>
          <p>{C.howBody} {C.howAvailability}</p>
        </div>
        <div ref={listRef} className={`gb-results${flash ? " flash" : ""}`} aria-live="polite">
          {day && <p className="gb-showing">{C.calShowing} <b>{dateLabel(day, lang)}</b> · <button type="button" className="gb-link" onClick={() => pick("")}>{C.calAny}</button></p>}
          {tours.length === 0 ? <p className="gb-empty">{C.unavailable}</p> : filtered.length === 0 ? <p className="gb-empty">{C.noMatch}</p> : (
            <div className="gb-days">
              {groups.map(([d, list]) => (
                <section key={d} className="gb-day-group" aria-label={dateLabel(d, lang)}>
                  <h3 className="gb-day-h">{dateLabel(d, lang)} <span>{C.dayCount.replace("{n}", String(list.length)).replace("{open}", String(list.filter((t) => !t.soldOut).length))}</span></h3>
                  <ul className="gb-row">
                    {list.map((t) => (
                      <li key={t.id} className={`gb-card${chosen?.id === t.id ? " on" : ""}${t.soldOut ? " sold" : ""}`}>
                        <div className="gb-photo"><img src={t.imageUrl ?? FALLBACK_IMG} alt="" loading="lazy" decoding="async" /><span className="gb-date">{dateLabel(t.date, lang)}</span>{t.soldOut ? <span className="gb-seats gb-seats-sold">{C.soldOut}</span> : <span className="gb-seats"><Users size={13} /> {seatsText(C.seatsLeft, t.seats)}</span>}</div>
                        <div className="gb-body">
                          <h3>{courseName(t, lang)}</h3>
                          {lang !== "ja" && t.area && <p className="gb-area">{t.area}</p>}
                          <p className="gb-meta"><Bus size={14} /> {t.departure.area}{t.departure.via ? ` · ${t.departure.via}` : ""}{t.departure.time ? ` · ${C.departs} ${t.departure.time}` : ""}</p>
                          <div className="gb-tags"><Lunch t={t} C={C} />{t.departure.throughPlay && <span className="gb-tag">{C.throughPlay}</span>}</div>
                          <p className="gb-price"><b>{yen(t.perPersonYen)}</b> <span>{C.perPerson}</span></p>
                          <p className="gb-incl">{C.includesLine}</p>
                          {t.soldOut ? <button type="button" className="gb-btn gb-btn-sold" disabled aria-disabled="true">{C.soldOut}</button> : <button type="button" className="gb-btn" onClick={() => { setChosen(t); track("bus_tour_select", { tour_id: t.id, date: t.date }); }}>{C.enquireBtn}</button>}
                          <p className="gb-nopay">{t.soldOut ? " " : C.noPayment}</p>
                          {(t.highlights || t.schedule) && <button type="button" className="gb-link" onClick={() => setOpen(t)}>{C.details}</button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
        <div ref={formRef}>
          {chosen && <Enquiry key={chosen.id} tour={chosen} initialPeople={people} lang={lang} C={C} onBack={() => setChosen(null)} />}
        </div>
      </div>
      {open && <TourSheet tour={open} lang={lang} C={C} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** A month grid of the published dates: green when seats are available, grey
 *  when every tour that day is sold out. A tap selects the day; the button
 *  under the grid says how many tours that is and jumps to the list. */
function Calendar({ tours, months, day, people, area, onPick, lang, C }: { tours: PublicTour[]; months: string[]; day: string; people: number; area: string; onPick: (d: string, scroll?: boolean) => void; lang: Lang; C: BusCopy }) {
  const [month, setMonth] = useState(() => (day ? day.slice(0, 7) : months[0]));
  const byDay = useMemo(() => {
    const m = new Map<string, { open: number; sold: number }>();
    for (const t of tours) { const e = m.get(t.date) ?? { open: 0, sold: 0 }; if (t.soldOut) e.sold++; else e.open++; m.set(t.date, e); }
    return m;
  }, [tours]);
  const idx = months.indexOf(month);
  const [y, mm] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, mm - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  while (cells.length % 7) cells.push(null);
  const matching = day ? tours.filter((t) => t.date === day && (!area || t.departure.area === area) && (t.soldOut || t.seats >= people)).length : 0;
  return (
    <div className="gb-cal" role="group" aria-label={C.calH}>
      <div className="gb-cal-head">
        <button type="button" className="gb-cal-nav" onClick={() => setMonth(months[idx - 1])} disabled={idx <= 0} aria-label={C.calPrev}><ChevronLeft size={18} /></button>
        <b>{monthLabel(month, lang)}</b>
        <button type="button" className="gb-cal-nav" onClick={() => setMonth(months[idx + 1])} disabled={idx < 0 || idx >= months.length - 1} aria-label={C.calNext}><ChevronRight size={18} /></button>
      </div>
      <div className="gb-cal-grid">
        {C.weekdays.map((w) => <span key={w} className="gb-cal-wd">{w}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} className="gb-cal-empty" />;
          const e = byDay.get(d);
          const cls = !e ? "gb-cal-day none" : e.open > 0 ? "gb-cal-day open" : "gb-cal-day sold";
          const label = e ? `${dateLabel(d, lang)}: ${e.open > 0 ? `${e.open} ${C.calLegendOpen.toLowerCase()}` : C.calLegendSold}` : dateLabel(d, lang);
          return <button key={d} type="button" className={`${cls}${day === d ? " on" : ""}`} disabled={!e} aria-pressed={day === d} aria-label={label} onClick={() => onPick(day === d ? "" : d)}><span>{Number(d.slice(8))}</span>{e && <i>{e.open > 0 ? e.open : ""}</i>}</button>;
        })}
      </div>
      <div className="gb-cal-legend">
        <span><i className="open" /> {C.calLegendOpen}</span><span><i className="sold" /> {C.calLegendSold}</span>
      </div>
      <div className="gb-cal-action">
        {day
          ? <button type="button" className="gb-btn gb-btn-small" onClick={() => onPick(day, true)}>{seatsText(C.calShow, matching).replace("{d}", dateLabel(day, lang))} ↓</button>
          : <span className="gb-small">{C.calNone} · {C.calHint}</span>}
        {day && <button type="button" className="gb-chip" onClick={() => onPick("")}>{C.calAny}</button>}
      </div>
    </div>
  );
}

function TourSheet({ tour, lang, C, onClose }: { tour: PublicTour; lang: Lang; C: BusCopy; onClose: () => void }) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [onClose]);
  return (
    <div className="gb-sheet" role="dialog" aria-modal="true" aria-label={courseName(tour, lang)} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gb-sheet-box">
        <button type="button" className="gb-close" onClick={onClose} aria-label="Close">×</button>
        <img src={tour.imageUrl ?? FALLBACK_IMG} alt="" />
        <h3>{courseName(tour, lang)}</h3>
        <p className="gb-meta">{dateLabel(tour.date, lang)} · {tour.departure.area}{tour.departure.time ? ` · ${C.departs} ${tour.departure.time}` : ""} · <b>{yen(tour.perPersonYen)}</b> {C.perPerson}</p>
        {tour.highlights && <><h4>{C.highlightsH}</h4><p className="gb-pre">{tour.highlights}</p></>}
        {tour.schedule && <><h4>{C.scheduleH}</h4><p className="gb-pre">{tour.schedule}</p></>}
        {tour.notes?.length ? <><h4>{C.notesH}</h4><ul>{tour.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></> : null}
      </div>
    </div>
  );
}

interface GolferRow { name: string; clubs: boolean; hand: "right" | "left"; shoes: boolean; shoeSize: string }
const emptyGolfer = (): GolferRow => ({ name: "", clubs: false, hand: "right", shoes: false, shoeSize: "" });

function Enquiry({ tour, initialPeople, lang, C, onBack }: { tour: PublicTour; initialPeople: number; lang: Lang; C: BusCopy; onBack: () => void }) {
  const maxPeople = Math.max(1, Math.min(MAX_PEOPLE, tour.seats));
  const [people, setPeople] = useState(Math.min(Math.max(initialPeople, 1), maxPeople));
  const [golfers, setGolfers] = useState<GolferRow[]>(() => Array.from({ length: MAX_PEOPLE }, emptyGolfer));
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [phone, setPhone] = useState(""), [note, setNote] = useState(""), [consent, setConsent] = useState(false), [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle"), [error, setError] = useState<string | null>(null), [reference, setReference] = useState("");
  const [requestId] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : ""));
  // The party is the first `people` rows; the lead golfer's name is the contact name.
  const party = golfers.slice(0, people).map((g, i) => (i === 0 ? { ...g, name: name } : g));
  const renters = party.filter((g) => g.clubs).length;
  const money = enquiryTotal(tour.perPersonYen, people, renters);
  const setGolfer = (i: number, patch: Partial<GolferRow>) => setGolfers((rows) => rows.map((g, k) => (k === i ? { ...g, ...patch } : g)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || status === "sending") return;
    setStatus("sending"); setError(null);
    try {
      const payload = {
        id: tour.id, date: tour.date, people, rental: renters > 0, renters, name, email, phone, note, lang, consent, request_id: requestId, website,
        golfers: party.map((g) => ({ name: g.name.trim(), clubs: g.clubs, hand: g.hand, shoes: g.shoes, shoeSize: g.shoes ? g.shoeSize.trim() : "" })),
      };
      const r = await fetch("/api/golfpaq/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; reference?: string; error?: string };
      if (!r.ok || !j.ok) { setError(C.errors[j.error ?? ""] ?? C.errors.default); setStatus("idle"); return; }
      setReference(j.reference ?? ""); setStatus("done");
      track("bus_tour_enquiry", { tour_id: tour.id, date: tour.date, golfers: people, rentals: renters, value: money.total, currency: "JPY" });
    } catch { setError(C.errors.default); setStatus("idle"); }
  }

  if (status === "done") {
    return (
      <div className="gb-form gb-done" role="status">
        <h3>{C.doneH}</h3>
        {C.doneLines.map((l) => <p key={l}>{l}</p>)}
        <p className="gb-ref">{C.doneRef}: <code>{reference}</code></p>
        <p className="gb-small">{courseName(tour, lang)} · {dateLabel(tour.date, lang)} · {people} {C.golfers.toLowerCase()}{renters ? ` · ${C.summaryRental} ×${renters}` : ""} · {C.summaryTotal} <b>{yen(money.total)}</b></p>
        <button type="button" className="gb-link" onClick={onBack}>{C.doneAgain}</button>
      </div>
    );
  }
  return (
    <form className="gb-form" onSubmit={submit} id="enquiry">
      <button type="button" className="gb-link gb-back" onClick={onBack}><ChevronLeft size={14} /> {C.back}</button>
      <h3>{C.formH}</h3>
      <p className="gb-chosen"><b>{courseName(tour, lang)}</b> · {dateLabel(tour.date, lang)} · {tour.departure.area}{tour.departure.time ? ` · ${C.departs} ${tour.departure.time}` : ""}</p>
      <div className="gb-fields">
        <label><span>{C.golfers}</span><select name="people" value={people} onChange={(e) => setPeople(Number(e.target.value))}>{Array.from({ length: maxPeople }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select><small>{C.golfersMax.replace("{n}", String(tour.seats))}</small></label>
      </div>

      <div className="gb-party">
        <h4>{C.partyH}</h4>
        <p className="gb-small">{C.partyLede}</p>
        <div className="gb-party-rows">
          {party.map((g, i) => (
            <div key={i} className="gb-golfer">
              <div className="gb-golfer-head"><b>{C.golferN.replace("{n}", String(i + 1))}</b>{i === 0 && <span className="gb-tag">{C.golferLead}</span>}</div>
              <div className="gb-golfer-fields">
                <label className="gb-golfer-name"><span>{C.golferName}</span>{i === 0
                  ? <input required name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
                  : <input name={`golfer_${i}_name`} value={g.name} onChange={(e) => setGolfer(i, { name: e.target.value })} maxLength={80} />}</label>
                <label className="gb-check"><input type="checkbox" name={`golfer_${i}_clubs`} checked={g.clubs} onChange={(e) => setGolfer(i, { clubs: e.target.checked })} /> <span>{C.golferClubs}</span></label>
                {g.clubs && <label className="gb-golfer-hand"><span>{C.golferHand}</span><select name={`golfer_${i}_hand`} value={g.hand} onChange={(e) => setGolfer(i, { hand: e.target.value === "left" ? "left" : "right" })}><option value="right">{C.handRight}</option><option value="left">{C.handLeft}</option></select></label>}
                <label className="gb-check"><input type="checkbox" name={`golfer_${i}_shoes`} checked={g.shoes} onChange={(e) => setGolfer(i, { shoes: e.target.checked })} /> <span>{C.golferShoes}</span></label>
                {g.shoes && <label className="gb-golfer-size"><span>{C.golferShoeSize}</span><input name={`golfer_${i}_shoe_size`} value={g.shoeSize} onChange={(e) => setGolfer(i, { shoeSize: e.target.value })} maxLength={12} placeholder={C.shoeSizeHint} /></label>}
              </div>
            </div>
          ))}
        </div>
        {party.some((g) => g.shoes) && <p className="gb-small">{C.shoesNote}</p>}
      </div>

      <dl className="gb-summary" aria-live="polite">
        <dt>{C.summaryPerPerson}</dt><dd>{yen(tour.perPersonYen)} {C.perPerson} × {people} = <b>{yen(money.tours)}</b></dd>
        {renters > 0 && <><dt>{C.summaryRental}</dt><dd>{yen(GOLFPAQ_RENTAL_JPY)} {C.perPerson} × {renters} = <b>{yen(money.rentals)}</b></dd></>}
        <dt className="gb-total">{C.summaryTotal}</dt><dd className="gb-total"><b>{yen(money.total)}</b> <small>{C.taxIncluded}</small></dd>
      </dl>
      <p className="gb-small">{C.includesLine}. {C.howAvailability}</p>
      <div className="gb-fields">
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
