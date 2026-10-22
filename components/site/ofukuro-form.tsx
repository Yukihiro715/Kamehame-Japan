"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import { DatePicker } from "@/components/site/date-picker";
import { EmailInput } from "@/components/site/email-input";
import { GuestStepper } from "@/components/site/guest-stepper";
import { useOfukuroMenu } from "@/components/site/ofukuro-menu";
import { menuById, OFUKURO, OFUKURO_MENUS } from "@/lib/ofukuro-dinner";

/** The Ofukuro Dinner request form, in four steps: date and group, the menu
 *  (carried over from the page), the conditions we check (kitchen,
 *  permission, allergies, dietary needs, special arrangements), then contact
 *  and a summary. Preview only: it is not connected to the enquiry backend,
 *  posts nowhere and says so; it never shows a "request received" state.
 *  No price is shown or computed, because none is agreed. */

const TIMES = [["18:00", "Dinner · around 18:00"], ["19:00", "Dinner · around 19:00"], ["12:00", "Lunch · around 12:00"], ["flexible", "Flexible"]] as const;
const PERMISSION = [["yes", "Yes, the accommodation allows a visiting cook"], ["will-check", "I will check with the accommodation"], ["unsure", "Not sure"]] as const;
const EQUIPMENT = ["Stove (2+ burners)", "Sink and work space", "Ventilation", "Fridge", "Pots and pans", "Plates, bowls and cutlery", "Not sure — please advise"] as const;
const DIETS = [["none", "No restrictions"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["pescatarian", "Pescatarian"], ["halal", "Halal-related request"], ["no-pork-alcohol", "No pork, no alcohol in cooking"], ["gluten-free", "Gluten-free request"], ["other", "Other (describe below)"]] as const;
const ALLERGENS = ["Wheat / gluten", "Egg", "Dairy", "Soy", "Nuts", "Fish", "Shellfish", "Sesame"] as const;

type Row = { label: string; value: string };

export function OfukuroForm({ fallbackEmail }: { fallbackEmail: string }) {
  const { selected, select } = useOfukuroMenu();
  const menu = menuById(selected);
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [summary, setSummary] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const min = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); }, []);
  const kids = Number(children) || 0;

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
      { label: "Group", value: `${adults} adult(s)${kids ? `, ${kids} child(ren) (ages: ${one("ages") || "—"})` : ""}` },
      { label: "Menu", value: menu.name },
      { label: "Visiting cook allowed", value: label(PERMISSION, one("permission")) },
      { label: "Kitchen equipment", value: many("equipment") || "Not stated" },
      { label: "Dietary needs", value: label(DIETS, one("diet")) },
      { label: "Allergens to avoid", value: many("allergens") || "None named" },
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
            </label>
          </div>
          <label className="form-row"><span>Area of your accommodation</span><input name="area" type="text" required maxLength={120} placeholder="e.g. Shinjuku, Tokyo — nearest station if you know it" /></label>
          <div className="form-row two">
            <div className="field">
              <label htmlFor="ofk-adults"><span>Adults</span></label>
              <GuestStepper id="ofk-adults" value={adults} min={1} max={12} onChange={setAdults} label={(n) => `${n} adult${n === 1 ? "" : "s"}`} decLabel="Fewer adults" incLabel="More adults" />
            </div>
            <div className="field">
              <label htmlFor="ofk-children"><span>Children</span></label>
              <GuestStepper id="ofk-children" value={children} min={0} max={8} onChange={setChildren} label={(n) => `${n} child${n === 1 ? "" : "ren"}`} decLabel="Fewer children" incLabel="More children" />
            </div>
          </div>
          {kids > 0 && (
            <label className="form-row"><span>Children&apos;s ages</span>
              <input name="ages" type="text" required maxLength={80} placeholder="e.g. 4 and 9" />
              <small className="form-hint">Portions and any children&apos;s pricing are confirmed with you before payment.</small>
            </label>
          )}
        </fieldset>

        <fieldset className="form-step" id="ofk-step-menu">
          <legend>2 · Your menu</legend>
          <label className="form-row"><span>One menu for the whole group</span>
            <select name="menu" value={selected ?? ""} onChange={(e) => select(e.target.value || null)} required>
              <option value="">Choose a menu</option>
              {OFUKURO_MENUS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          {menu
            ? <p className="xp-note ofk-chosen"><Check size={14} /> {menu.name}: {menu.set}. <a href="#menus">See the menus again</a></p>
            : <p className="xp-note ofk-chosen">Nothing chosen yet. <a href="#menus">Pick one from the seven menus above</a> or use the list here.</p>}
          <small className="form-hint">{OFUKURO.menuNote}</small>
        </fieldset>

        <fieldset className="form-step">
          <legend>3 · What we check before booking</legend>
          <div className="form-row">
            <span>Does your accommodation allow a visiting cook?</span>
            <div className="hd-options">
              {PERMISSION.map(([v, l], i) => <label key={v} className="form-check"><input type="radio" name="permission" value={v} defaultChecked={i === 1} /><span><b>{l}</b></span></label>)}
            </div>
          </div>
          <div className="form-row">
            <span>Kitchen equipment you know is there (select all that apply)</span>
            <div className="hd-options">
              {EQUIPMENT.map((q) => <label key={q} className="form-check"><input type="checkbox" name="equipment" value={q} /><span><b>{q}</b></span></label>)}
            </div>
            <small className="form-hint">Not sure? Choose “Not sure — please advise” and we go through it with you. Photos of the kitchen are only ever requested through a secure link later, never here.</small>
          </div>
          <div className="form-row">
            <span>Dietary needs</span>
            <div className="hd-options">
              {DIETS.map(([v, l], i) => <label key={v} className="form-check"><input type="radio" name="diet" value={v} defaultChecked={i === 0} /><span><b>{l}</b></span></label>)}
            </div>
          </div>
          <div className="form-row">
            <span>Allergens to avoid (select all that apply)</span>
            <div className="hd-options">
              {ALLERGENS.map((a) => <label key={a} className="form-check"><input type="checkbox" name="allergens" value={a} /><span><b>{a}</b></span></label>)}
            </div>
          </div>
          <label className="form-row"><span>Anything to arrange or ask about (optional)</span>
            <textarea name="arrangements" rows={3} maxLength={1500} placeholder="e.g. a severe allergy and cross-contact; children's portions; a special occasion; how you would like to communicate with the cook" />
            <small className="form-hint">Children, dietary needs and special arrangements are handled here, in the same request: we check them with the cook and confirm what is possible, and any applicable pricing, before you pay.</small>
          </label>
        </fieldset>

        <fieldset className="form-step">
          <legend>4 · Contact</legend>
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
