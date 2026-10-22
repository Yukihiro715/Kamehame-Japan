"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { StickyRequestBar } from "@/components/site/sticky-request-bar";
import { menuById, OFUKURO_MENUS, OFUKURO_PRICE, yenOf } from "@/lib/ofukuro-dinner";

/** One menu per group, chosen on the page and carried into the request form.
 *  The choice lives in this context and in sessionStorage, so going back to
 *  the page, or between the picker and the form, never loses it. */

const KEY = "kh-ofukuro-menu";
const Ctx = createContext<{ selected: string | null; select: (id: string | null) => void } | null>(null);

export function OfukuroMenuProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session storage is only readable in the browser, after hydration
    try { const v = sessionStorage.getItem(KEY); if (menuById(v)) setSelected(v); } catch { /* storage blocked */ }
  }, []);
  const select = (id: string | null) => {
    setSelected(id);
    try { if (id) sessionStorage.setItem(KEY, id); else sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
  };
  return <Ctx.Provider value={{ selected, select }}>{children}</Ctx.Provider>;
}

export const useOfukuroMenu = () => useContext(Ctx) ?? { selected: null, select: () => {} };

/** Seven cards, radio semantics: one choice, keyboard-changeable, selected state shown by frame, tick and the word "Selected". */
export function OfukuroMenuPicker() {
  const { selected, select } = useOfukuroMenu();
  return (
    <div className="ofk-menus" role="radiogroup" aria-label="Choose your menu">
      {OFUKURO_MENUS.map((m) => {
        const sel = selected === m.id;
        return (
          <label key={m.id} className={`ofk-menu${sel ? " sel" : ""}`}>
            <input type="radio" name="menu-pick" value={m.id} checked={sel} onChange={() => select(m.id)} />
            {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, as the detail pages use */}
            <img src={m.img} alt={m.alt} loading="lazy" width={1000} height={750} />
            <span className="ofk-menu-body">
              <b>{m.name}</b>
              <small className="ofk-menu-set">{m.set}</small>
              <span className="ofk-menu-blurb">{m.blurb}</span>
            </span>
            <span className="ofk-menu-state" aria-hidden="true">{sel ? <><Check size={14} /> Selected</> : "Select"}</span>
          </label>
        );
      })}
    </div>
  );
}

/** The first-view button: "Choose your menu" until one is chosen, then "Continue to request". */
export function OfukuroHeroCta({ className = "bk-cta" }: { className?: string }) {
  const { selected } = useOfukuroMenu();
  const menu = menuById(selected);
  return (
    <>
      <a className={className} href={menu ? "#request-form" : "#menus"}>{menu ? "Continue to request" : "Choose your menu"}</a>
      {menu && <p className="xp-note ofk-chosen">Selected: <b>{menu.name}</b> · <a href="#menus">change</a></p>}
    </>
  );
}

/** The phone's bottom bar follows the same choice and shows the base price. */
export function OfukuroSticky() {
  const { selected } = useOfukuroMenu();
  const menu = menuById(selected);
  return (
    <StickyRequestBar
      price={`${yenOf(OFUKURO_PRICE.base)}`}
      condition={menu ? `Up to 2 guests · ${menu.name}` : "Up to 2 guests · choose one of seven menus"}
      label={menu ? "Continue to request" : "Choose your menu"}
      lang="en" watchHero="#booking" watchTarget={menu ? "#request-form" : "#menus"}
    />
  );
}
