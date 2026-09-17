"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

/** A small calendar that simply does not offer dates the venue cannot take:
 *  anything before `min` and any `closed` date is drawn but not selectable.
 *  The native <input type="date"> on iOS shows every day regardless of `min`
 *  and only complains after the fact, which is what this replaces. The
 *  chosen date sits in a real text input (name, required) so the form's
 *  own validation and FormData still work; typing is suppressed.
 *
 *  Keep it out of a wrapping <label>: iOS Safari forwards a tap on a button
 *  inside a label to the label's input as a second click, which re-opened
 *  the calendar right after a day was picked. Label it with `htmlFor`. */
export function DatePicker({
  id, name, lang, min, required, closed, defaultOpenMonth, value: controlled, onChange, compact,
}: {
  id?: string; name: string; lang: Lang; min?: string; required?: boolean; closed?: (iso: string) => boolean; defaultOpenMonth?: string;
  /** Controlled value (ISO date or ""); leave undefined to let the picker keep its own. */
  value?: string; onChange?: (iso: string) => void;
  /** Shorter display format for narrow slots (the booking card). */
  compact?: boolean;
}) {
  const F = t(lang).form;
  const locale = { en: "en-GB", es: "es-ES", ja: "ja-JP", fr: "fr-FR", "zh-tw": "zh-TW" }[lang];
  const mondayFirst = lang === "es" || lang === "fr";
  const [own, setOwn] = useState("");
  const value = controlled ?? own;
  const setValue = (v: string) => { setOwn(v); onChange?.(v); };
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (defaultOpenMonth ?? min ?? new Date().toISOString().slice(0, 10)).slice(0, 7));
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Once the earliest date is known, open the calendar on that month.
  useEffect(() => { if (min && !value) setMonth(min.slice(0, 7)); }, [min, value]);

  useEffect(() => {
    if (!open) return;
    // pointerdown rather than mousedown: iOS only synthesises mouse events for
    // elements it considers clickable, so a tap on plain page text never closed it.
    const onDoc = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); input.current?.blur(); } };
    document.addEventListener("pointerdown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const fmtLong = useMemo(() => new Intl.DateTimeFormat(locale, compact
    ? { year: "numeric", month: "short", day: "numeric", weekday: "short", timeZone: "UTC" }
    : { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "UTC" }), [locale, compact]);
  const fmtMonth = useMemo(() => new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", timeZone: "UTC" }), [locale]);
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
    // 2024-01-07 is a Sunday.
    const days = Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 7 + i))));
    return mondayFirst ? [...days.slice(1), days[0]] : days;
  }, [locale, mondayFirst]);

  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let lead = first.getUTCDay(); if (mondayFirst) lead = (lead + 6) % 7;
  const iso = (d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const disabled = (d: string) => (!!min && d < min) || (closed ? closed(d) : false);
  const shift = (n: number) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(d.toISOString().slice(0, 7)); };
  const canGoBack = !min || month > min.slice(0, 7);

  // Picking a day (or clearing) closes the calendar and drops focus, so the
  // next tap on the field is a fresh open rather than a no-op on a focused input.
  const choose = (d: string) => { setValue(d); setOpen(false); input.current?.blur(); };

  return (
    <div className={`dp ${open ? "open" : ""}`} ref={root}>
      <input
        ref={input} id={id}
        name={name} type="text" required={required} value={value} inputMode="none" autoComplete="off"
        placeholder={F.pickDate} aria-haspopup="dialog" aria-expanded={open}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Backspace" || e.key === "Delete") setValue("");
          else if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); setOpen(true); }
          else if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault();
        }}
        onChange={() => { /* value is set from the calendar only */ }}
      />
      {value && <span className="dp-display" aria-hidden="true">{fmtLong.format(new Date(`${value}T00:00:00Z`))}</span>}
      {open && (
        // preventDefault on the popover's clicks stops any surrounding label
        // from treating them as clicks on the input.
        <div className="dp-pop" role="dialog" aria-label={F.pickDate} onClick={(e) => e.preventDefault()}>
          <div className="dp-head">
            <button type="button" aria-label="Previous month" disabled={!canGoBack} onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
            <b>{fmtMonth.format(first)}</b>
            <button type="button" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={18} /></button>
          </div>
          <div className="dp-grid">
            {weekdays.map((w, i) => <span key={i} className="dp-wd">{w}</span>)}
            {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = iso(i + 1); const off = disabled(d);
              return (
                <button
                  type="button" key={d} disabled={off} aria-disabled={off}
                  className={`dp-day ${value === d ? "sel" : ""}`}
                  onClick={() => choose(d)}
                >{i + 1}</button>
              );
            })}
          </div>
          <div className="dp-foot">
            {min && <small>{F.earliestShort(fmtLong.format(new Date(`${min}T00:00:00Z`)))}</small>}
            <button type="button" className="dp-clear" onClick={() => choose("")}>{F.clear}</button>
          </div>
        </div>
      )}
    </div>
  );
}
