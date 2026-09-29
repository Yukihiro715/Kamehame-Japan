"use client";

import { useState } from "react";
import { useBooking } from "@/components/site/booking-context";

const SHOWN = 8;

/** The announced class dates. Once the page knows today (Japan time), dates
 *  past their booking deadline drop out; the first few show, the rest open
 *  on request so a three-month list does not fill a phone screen. */
export function DateList({ items, more, less }: {
  items: { date: string; label: string; times: string }[];
  /** "Show all dates ({n})": {n} becomes the number of upcoming dates. */
  more: string;
  less: string;
}) {
  const b = useBooking();
  const [open, setOpen] = useState(false);
  const upcoming = b?.minDate ? items.filter((d) => d.date >= b.minDate!) : items;
  const shown = open ? upcoming : upcoming.slice(0, SHOWN);

  return (
    <>
      <ul className="xp-dates">
        {shown.map((d) => <li key={d.date}><b>{d.label}</b><span>{d.times}</span></li>)}
      </ul>
      {upcoming.length > SHOWN && (
        <button type="button" className="xp-dates-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? less : more.replace("{n}", String(upcoming.length))}
        </button>
      )}
    </>
  );
}
