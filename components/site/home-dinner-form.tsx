"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { DatePicker } from "@/components/site/date-picker";
import { EmailInput } from "@/components/site/email-input";
import { GuestStepper } from "@/components/site/guest-stepper";
import { Fx, FxNote } from "@/components/site/money";
import { yen } from "@/lib/pricing";
import { HOME_DINNER, homeDinnerTotal } from "@/lib/home-dinner-preview";

/** Demo enquiry form for the home-cooked dinner concept. It shares the
 *  site's form markup and widgets (date picker, e-mail field, guest stepper,
 *  form steps) but posts nowhere: pressing the button shows a summary of the
 *  entries and the sample estimate in this browser tab only. Nothing is sent,
 *  stored or e-mailed, and no booking is created. */

const TIMES = [["12:00", "Lunch · around 12:00"], ["18:00", "Dinner · around 18:00"], ["19:00", "Dinner · around 19:00"], ["flexible", "Flexible"]] as const;
const DIETS = [["regular", "No restrictions"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["pescatarian", "Pescatarian"], ["halal", "Halal-related request"], ["no-pork-alcohol", "No pork, no alcohol (incl. mirin and sake in cooking)"], ["gluten-free", "Gluten-free request"], ["other", "Other (describe below)"]] as const;
const ALLERGENS = ["Wheat / gluten", "Egg", "Dairy", "Soy", "Nuts", "Fish", "Shellfish", "Sesame"] as const;
const STAYS = [["airbnb", "Airbnb / vacation rental"], ["apartment-hotel", "Apartment hotel"], ["other", "Other (describe below)"]] as const;
const EQUIPMENT = ["Stove (2+ burners)", "Fridge", "Pots and pans", "Knife and chopping board", "Plates and bowls", "Dining table", "Not sure"] as const;
const PERMISSION = [["yes", "Yes, the property allows a visiting cook"], ["will-check", "I will check with the property"], ["unsure", "Not sure"]] as const;

type Summary = { label: string; value: string }[];

export function HomeDinnerForm() {
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [summary, setSummary] = useState<Summary | null>(null);
  const total = useMemo(() => homeDinnerTotal(Number(adults) || 0, Number(children) || 0), [adults, children]);
  const guests = (Number(adults) || 0) + (Number(children) || 0);
  const tooMany = guests > HOME_DINNER.price.maxGuests;
  const min = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); }, []);

  function preview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const one = (k: string) => String(fd.get(k) ?? "").trim();
    const many = (k: string) => fd.getAll(k).map(String).join(", ");
    const label = <T extends readonly (readonly [string, string])[]>(list: T, v: string) => list.find(([k]) => k === v)?.[1] ?? v;
    const host = HOME_DINNER.hosts.find((h) => h.id === one("host"));
    const rows: Summary = [
      { label: "Name", value: one("name") },
      { label: "E-mail", value: one("email") },
      { label: "Date and time", value: `${one("date") || "—"} · ${label(TIMES, one("time"))}` },
      { label: "Guests", value: `${adults} adult(s)${Number(children) ? `, ${children} child(ren) under 12` : ""}${one("ages") ? ` (ages: ${one("ages")})` : ""}` },
      { label: "Where you stay", value: [one("area"), one("stayName")].filter(Boolean).join(" · ") || "—" },
      { label: "Preferred host", value: host ? `${host.name} (sample)` : "No preference" },
      { label: "Diet", value: label(DIETS, one("diet")) },
      { label: "Allergens to avoid", value: many("allergens") || "None named" },
      { label: "Severity / cross-contact", value: one("severity") || "—" },
      { label: "Accommodation", value: `${label(STAYS, one("stay"))}${one("kitchen") ? ` · kitchen: ${one("kitchen")}` : ""}` },
      { label: "Equipment", value: many("equipment") || "Not stated" },
      { label: "Visiting cook allowed", value: label(PERMISSION, one("permission")) },
      { label: "Other requests", value: one("notes") || "—" },
      { label: "Sample estimate", value: `${yen(total)} for the group (illustrative)` },
    ];
    setSummary(rows);
    document.getElementById("hd-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <form className="enquiry-form golf-form hd-form" onSubmit={preview} data-clarity-mask="True" noValidate={false}>
        <fieldset className="form-step">
          <legend>1 · Date, group and where you stay</legend>
          <div className="form-row two">
            <label><span>Name</span><input name="name" type="text" required autoComplete="name" maxLength={120} /></label>
            <label><span>E-mail</span><EmailInput lang="en" required /></label>
          </div>
          <div className="form-row two">
            <div className="field">
              <label htmlFor="hd-date"><span>Preferred date</span></label>
              <DatePicker id="hd-date" name="date" lang="en" min={min} required />
              <small className="form-hint">Requests close 3 days before the dinner (sample rule).</small>
            </div>
            <label><span>Start time</span>
              <select name="time" defaultValue="18:00">{TIMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
          </div>
          <div className="form-row two">
            <div className="field">
              <label htmlFor="hd-adults"><span>Adults</span></label>
              <GuestStepper id="hd-adults" value={adults} min={1} max={8} onChange={setAdults} label={(n) => `${n} adult${n === 1 ? "" : "s"}`} decLabel="Fewer adults" incLabel="More adults" />
            </div>
            <div className="field">
              <label htmlFor="hd-children"><span>Children (under 12)</span></label>
              <GuestStepper id="hd-children" value={children} min={0} max={6} onChange={setChildren} label={(n) => `${n} child${n === 1 ? "" : "ren"}`} decLabel="Fewer children" incLabel="More children" />
            </div>
          </div>
          {tooMany && <small className="form-hint">Groups of more than {HOME_DINNER.price.maxGuests} are quoted individually.</small>}
          <label className="form-row"><span>Children&apos;s ages (if any)</span><input name="ages" type="text" maxLength={60} placeholder="e.g. 4 and 9" /></label>
          <div className="form-row two">
            <label><span>Area in Tokyo / nearest station</span><input name="area" type="text" maxLength={120} placeholder="e.g. Shinjuku, near Shin-Okubo station" /></label>
            <label><span>Preferred host</span>
              <select name="host" defaultValue="">
                <option value="">No preference — match me with a host</option>
                {HOME_DINNER.hosts.map((h) => <option key={h.id} value={h.id}>{h.name} (sample host)</option>)}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="form-step">
          <legend>2 · What you can and cannot eat</legend>
          <div className="form-row">
            <span>Dietary preference</span>
            <div className="hd-options">
              {DIETS.map(([v, l], i) => (
                <label key={v} className="form-check"><input type="radio" name="diet" value={v} defaultChecked={i === 0} /><span><b>{l}</b></span></label>
              ))}
            </div>
          </div>
          <div className="form-row">
            <span>Allergens to avoid (select all that apply)</span>
            <div className="hd-options">
              {ALLERGENS.map((a) => (
                <label key={a} className="form-check"><input type="checkbox" name="allergens" value={a} /><span><b>{a}</b></span></label>
              ))}
            </div>
          </div>
          <label className="form-row"><span>Severity, cross-contact, or anything else about food (optional)</span>
            <textarea name="severity" rows={3} maxLength={1000} placeholder="e.g. a severe nut allergy — please avoid any cross-contact; or: we eat everything but prefer less fried food" />
          </label>
          <small className="form-hint">Dashi, soy sauce and many Japanese sauces contain fish, wheat or soy. The host confirms every ingredient with you before the day; an allergen-free kitchen cannot be guaranteed.</small>
        </fieldset>

        <fieldset className="form-step">
          <legend>3 · Your accommodation and kitchen</legend>
          <div className="form-row two">
            <label><span>Type of accommodation</span>
              <select name="stay" required defaultValue="">
                <option value="" disabled>Select</option>
                {STAYS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label><span>Name of the property (optional)</span><input name="stayName" type="text" maxLength={120} /></label>
          </div>
          <div className="form-row two">
            <label><span>Is there a kitchen?</span>
              <select name="kitchen" defaultValue="yes">
                <option value="yes">Yes</option><option value="kitchenette">A small kitchenette</option><option value="no">No</option>
              </select>
            </label>
            <span />
          </div>
          <div className="form-row">
            <span>Equipment you know is there (select all that apply)</span>
            <div className="hd-options">
              {EQUIPMENT.map((q) => (
                <label key={q} className="form-check"><input type="checkbox" name="equipment" value={q} /><span><b>{q}</b></span></label>
              ))}
            </div>
          </div>
          <div className="form-row">
            <span>Does the property allow a visiting cook?</span>
            <div className="hd-options">
              {PERMISSION.map(([v, l], i) => (
                <label key={v} className="form-check"><input type="radio" name="permission" value={v} defaultChecked={i === 1} /><span><b>{l}</b></span></label>
              ))}
            </div>
          </div>
          <label className="form-row"><span>Anything else (optional)</span>
            <textarea name="notes" rows={3} maxLength={2000} placeholder="A special occasion, a dish you want to try, access notes for the host" />
          </label>
          <small className="form-hint">Room numbers and door codes are not needed now: they are shared securely only once a host is confirmed.</small>
        </fieldset>

        <div className="form-estimate" aria-live="polite">
          <small>Sample estimate for {adults} adult(s){Number(children) ? ` and ${children} child(ren)` : ""}</small>
          <b><Fx>{yen(total)}</Fx></b>
          <small>Illustrative only: {yen(HOME_DINNER.price.base)} for two, +{yen(HOME_DINNER.price.extraAdult)} per further adult, +{yen(HOME_DINNER.price.extraChild)} per child under 12. Groceries included. Nothing is charged.</small>
          <FxNote lang="en" short />
        </div>

        <label className="form-check">
          <input type="checkbox" name="consent" required />
          <span><b>I understand this is a concept demo with sample hosts and prices, and that no booking is created and nothing is sent.</b></span>
        </label>

        <div className="enquiry-actions">
          <button type="submit" className="contact-cta">Preview my enquiry <ArrowRight size={15} /></button>
        </div>
        <p className="form-after">Demo only: your entries stay in this browser tab. The live version will send a request to our team and reply within 24 hours. <span className="form-privacy">No data is transmitted or stored by this preview.</span></p>
      </form>

      {summary && (
        <div className="form-done" role="status" id="hd-summary">
          <Check size={22} />
          <div>
            <b>Your enquiry preview (not sent)</b>
            <p>These are the fields the live form would send to our team. Nothing has been transmitted or stored.</p>
            <ul className="know-list">
              {summary.map((r) => <li key={r.label}><b>{r.label}:</b> {r.value}</li>)}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
