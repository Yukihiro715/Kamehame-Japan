"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { DatePicker } from "@/components/site/date-picker";
import { EmailInput } from "@/components/site/email-input";
import { GuestStepper } from "@/components/site/guest-stepper";
import { useOfukuroMenu } from "@/components/site/ofukuro-menu";
import { menuById, OFUKURO, OFUKURO_MENUS, ofukuroQuote, yenOf } from "@/lib/ofukuro-dinner";

/** The Ofukuro Dinner request form, in four steps: date and group, the menu
 *  (carried over from the page), the conditions we check (kitchen,
 *  permission, allergies, dietary needs, special arrangements), then contact
 *  and a summary. Preview only: it is not connected to the enquiry backend,
 *  posts nowhere and says so; it never shows a "request received" state.
 *  The estimate follows the owner's pricing (lib/ofukuro-dinner.ts). */

const TIMES = [["18:00", "Dinner · around 18:00"], ["19:00", "Dinner · around 19:00"], ["11:00", "Lunch · 11:00"], ["flexible", "Flexible"]] as const;
const PERMISSION = [["yes", "Yes, the accommodation allows a visiting cook"], ["will-check", "I will check with the accommodation"], ["unsure", "Not sure"]] as const;
const EQUIPMENT = ["Stove (2+ burners)", "Sink and work space", "Ventilation", "Fridge", "Pots and pans", "Plates, bowls and cutlery", "Not sure — please advise"] as const;
const FACES = [["ok", "We are happy to appear in the photos"], ["no-faces", "Food and cook only, please: keep us out of the frame"]] as const;
const DIETS = [["none", "No restrictions"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["pescatarian", "Pescatarian"], ["halal", "Halal-related request"], ["no-pork-alcohol", "No pork, no alcohol in cooking"], ["gluten-free", "Gluten-free request"], ["other", "Other (describe below)"]] as const;

type Row = { label: string; value: string };

export interface OfukuroOffer { discount: number; label: string }

export function OfukuroForm({ fallbackEmail, offer }: { fallbackEmail: string; offer?: OfukuroOffer }) {
  const { selected, select } = useOfukuroMenu();
  const menu = menuById(selected);
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [summary, setSummary] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const min = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); }, []);
  const kids = Number(children) || 0;
  const regular = ofukuroQuote(Number(adults) || 0, kids);
  const total = offer ? ofukuroQuote(Number(adults) || 0, kids, offer.discount) : regular;
  const track = useRef<HTMLDivElement>(null);
  const slide = (dir: 1 | -1) => { const t = track.current; if (!t) return; const w = (t.firstElementChild as HTMLElement | null)?.offsetWidth ?? 280; t.scrollBy({ left: dir * (w + 12), behavior: "smooth" }); };

  function preview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!menu) { setError("Choose a menu first (step 2)."); document.getElementById("ofk-step-menu")?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    setError(null);
    const fd = new FormData(e.currentTarget);
    const one = (k: string) => String(fd.get(k) ?? "").trim();
    const many = (k: string) => fd.getAll(k).map(String).join(", ");
    const label = <T extends readonly (readonly [string, string])[]>(list: T, v: string) => list.find(([k]) => k === v)?.[1] ?? v;
    setSummary([
      { label: "Date and time", value: `${one("date") || "—"} · ${label(TIMES, one("time"))}` },
      { label: "Area", value: one("area") || "—" },
      { label: "Group", value: `${adults} adult(s)${kids ? `, ${kids} child(ren) under 10 (ages: ${one("ages") || "—"})` : ""}` },
      { label: "Estimated total", value: `${yenOf(total)}${offer ? ` (${offer.label}; regular ${yenOf(regular)})` : ""} · tax and ingredients included · confirmed before payment` },
      ...(offer ? [{ label: "Photos", value: `${label(FACES, one("faces"))}; permission given for our website and social media` }] : []),
      { label: "Menu", value: menu.name },
      { label: "Visiting cook allowed", value: label(PERMISSION, one("permission")) },
      { label: "Kitchen equipment", value: many("equipment") || "Not stated" },
      { label: "Dietary needs", value: label(DIETS, one("diet")) },
      { label: "Allergens to avoid", value: one("allergens") || "None named" },
      { label: "Arrangements to discuss", value: one("arrangements") || "—" },
      { label: "Name", value: one("name") },
      { label: "E-mail", value: one("email") },
      { label: "Phone / WhatsApp", value: one("phone") || "—" },
    ]);
    document.getElementById("ofk-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <form className="enquiry-form golf-form hd-form" onSubmit={preview} data-clarity-mask="True">
        {error && <p className="form-error" role="alert"><Mail size={14} /> {error}</p>}

        <fieldset className="form-step">
          <legend>1 · Date and group</legend>
          <div className="form-row two">
            <div className="field">
              <label htmlFor="ofk-date"><span>Preferred date</span></label>
              <DatePicker id="ofk-date" name="date" lang="en" min={min} required />
              <small className="form-hint">A preference, not a confirmed slot: we check the date with a cook.</small>
            </div>
            <label><span>Preferred start time</span>
              <select name="time" defaultValue="18:00">{TIMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <small className="form-hint">Dinner from 18:00 or 19:00, or one lunch slot at 11:00.</small>
            </label>
          </div>
          <label className="form-row"><span>Area of your accommodation</span><input name="area" type="text" required maxLength={120} placeholder="e.g. Shinjuku, Tokyo — nearest station if you know it" /></label>
          <div className="form-row two">
            <div className="field">
              <label htmlFor="ofk-adults"><span>Adults</span></label>
              <GuestStepper id="ofk-adults" value={adults} min={1} max={12} onChange={setAdults} label={(n) => `${n} adult${n === 1 ? "" : "s"}`} decLabel="Fewer adults" incLabel="More adults" />
            </div>
            <div className="field">
              <label htmlFor="ofk-children"><span>Children under 10</span></label>
              <GuestStepper id="ofk-children" value={children} min={0} max={8} onChange={setChildren} label={(n) => `${n} child${n === 1 ? "" : "ren"}`} decLabel="Fewer children" incLabel="More children" />
            </div>
          </div>
          {kids > 0 && (
            <label className="form-row"><span>Children&apos;s ages</span>
              <input name="ages" type="text" required maxLength={80} placeholder="e.g. 4 and 9" />
              <small className="form-hint">Children aged 10 and over count as adults. Portions are confirmed with you before payment.</small>
            </label>
          )}
          <p className="form-estimate"><span>Estimated total for your group</span><b>{yenOf(total)}{offer && <s className="ofk-regular">{yenOf(regular)}</s>}</b><small>{offer ? `${offer.label} · tax and ingredients included · confirmed with your request, before any payment` : "Tax and ingredients included · confirmed with your request, before any payment"}</small></p>
        </fieldset>

        <fieldset className="form-step" id="ofk-step-menu">
          <legend>2 · Your menu</legend>
          <div className="form-row">
            <span>One menu for the whole group</span>
            <div className="ofk-slider">
              <div className="ofk-track ofk-slider-track" ref={track} role="radiogroup" aria-label="Your menu">
                {OFUKURO_MENUS.map((m) => {
                  const sel = selected === m.id;
                  return (
                    <label key={m.id} className={`ofk-menu ofk-slide${sel ? " sel" : ""}`}>
                      <input type="radio" name="menu" value={m.id} checked={sel} onChange={() => select(m.id)} required />
                      {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, as the detail pages use */}
                      <img src={m.img} alt={m.alt} loading="lazy" width={1000} height={750} />
                      <span className="ofk-menu-body">
                        <b>{m.name}</b>
                        <small className="ofk-menu-set">{m.set}</small>
                      </span>
                      <span className="ofk-menu-state" aria-hidden="true">{sel ? <><Check size={14} /> Selected</> : "Select"}</span>
                    </label>
                  );
                })}
              </div>
              <div className="ofk-nav">
                <button type="button" onClick={() => slide(-1)} aria-label="Previous menus"><ChevronLeft size={18} /></button>
                <button type="button" onClick={() => slide(1)} aria-label="Next menus"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
          {menu
            ? <p className="xp-note ofk-chosen"><Check size={14} /> {menu.name}: {menu.set}</p>
            : <p className="xp-note ofk-chosen">Swipe through the seven menus and tap one. <a href="#menus">Read about them above</a>.</p>}
          <small className="form-hint">{OFUKURO.menuNote}</small>
        </fieldset>

        <fieldset className="form-step">
          <legend>3 · What we check before booking</legend>
          <div className="form-row two">
            <label><span>Does your accommodation allow a visiting cook?</span>
              <select name="permission" defaultValue="will-check">{PERMISSION.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
            <label><span>Dietary needs</span>
              <select name="diet" defaultValue="none">{DIETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
          </div>
          <label className="form-row"><span>Allergens to avoid (optional)</span>
            <input name="allergens" type="text" maxLength={200} placeholder="e.g. peanuts (severe), shellfish, egg" />
          </label>
          <div className="form-row">
            <span>Kitchen equipment you know is there (optional)</span>
            <div className="ofk-chips">
              {EQUIPMENT.map((q) => <label key={q} className="form-check"><input type="checkbox" name="equipment" value={q} /><span><b>{q}</b></span></label>)}
            </div>
            <small className="form-hint">Not sure? Tick “Not sure — please advise” and we go through it with you. Photos of the kitchen are only ever requested through a secure link later, never here.</small>
          </div>
          <label className="form-row"><span>Anything to arrange or ask about (optional)</span>
            <textarea name="arrangements" rows={2} maxLength={1500} placeholder="e.g. a special occasion; how you would like to communicate with the cook" />
          </label>
        </fieldset>

        {offer && (
          <fieldset className="form-step">
            <legend>4 · Photos</legend>
            <div className="form-row">
              <span>Can we show you in the photos?</span>
              <div className="hd-options">
                {FACES.map(([v, l], i) => <label key={v} className="form-check"><input type="radio" name="faces" value={v} defaultChecked={i === 0} /><span><b>{l}</b></span></label>)}
              </div>
            </div>
            <label className="form-check">
              <input type="checkbox" name="photo-consent" required />
              <span><b>I agree that a member of KAMEHAME JAPAN photographs the dinner for about 20 minutes and uses the photos on its website and social media, and that this is what the 30% founding-guest price is for.</b></span>
            </label>
          </fieldset>
        )}

        <fieldset className="form-step">
          <legend>{offer ? "5" : "4"} · Contact</legend>
          <div className="form-row two">
            <label><span>Name</span><input name="name" type="text" required autoComplete="name" maxLength={120} /></label>
            <label><span>E-mail</span><EmailInput lang="en" required /></label>
          </div>
          <label className="form-row"><span>Phone or WhatsApp (optional)</span><input name="phone" type="tel" maxLength={60} autoComplete="tel" inputMode="tel" /></label>
          <label className="form-check">
            <input type="checkbox" name="consent" required />
            <span><b>I understand this is a request, not a booking: the price, the conditions and whether the dinner can be arranged are confirmed with me before any payment.</b></span>
          </label>
        </fieldset>

        <div className="enquiry-actions">
          <button type="submit" className="contact-cta">Preview my request <ArrowRight size={15} /></button>
        </div>
        <p className="form-after">Preview build: this form is not connected yet. The button shows what the live form would send; nothing is sent, stored or e-mailed. <span className="form-privacy">If you want to reach us now, write to {fallbackEmail}.</span></p>
      </form>

      {summary && (
        <div className="form-done" role="status" id="ofk-summary">
          <Check size={22} />
          <div>
            <b>Request preview — not sent</b>
            <p>This preview is not connected to our booking system, so nothing has been transmitted. In the live version you would now see: “{OFUKURO.received}”</p>
            <ul className="know-list">{summary.map((r) => <li key={r.label}><b>{r.label}:</b> {r.value}</li>)}</ul>
            <p className="xp-note" style={{ marginTop: 12 }}>A live request then moves through: {OFUKURO.states.join(" → ")}; or “{OFUKURO.unable}”, with a full refund of anything paid.</p>
          </div>
        </div>
      )}
    </>
  );
}
