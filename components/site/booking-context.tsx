"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { quote, type PricingView, type Quote } from "@/lib/pricing";

/** What the page knows about the product that the request needs. */
export interface BookingExperience {
  slug: string;
  title: string;
  /** Days of notice the venue needs; the date picker starts after them. */
  leadDays: number;
  /** Clock time (Japan) by which a request must be in, e.g. "17:00". */
  cutoffTime: string;
  startTimes?: string[];
  closed?: { from: string; to: string }[];
  minGuests: number;
  /** Largest head count the price covers; above it the group is quoted individually. */
  listedMax: number;
  /** Ceiling of the head-count control (default 15). */
  maxGuests?: number;
}

export const DEFAULT_MAX_GUESTS = 15;

/** Everything the visitor chooses about a request — plan, dates, head count,
 *  extras — lives here so the booking card beside the page and the request
 *  form at the bottom show the same choice and the same estimate. */
export interface BookingState {
  plan: string;
  date: string; time: string;
  altDate: string; altTime: string;
  guests: string;
  addOns: string[];
  /** Interpreter guide language: "en" | "es" | "fr" | "none". Included in the price. */
  interpreter: string;
  /** Geiko / maiko preference: "any" | "maiko" | "geiko". Passed on, never guaranteed. */
  hostPref: string;
}

interface Booking extends BookingState {
  set: (patch: Partial<BookingState>) => void;
  toggleAddOn: (id: string) => void;
  experience: BookingExperience;
  pricing?: PricingView;
  /** Earliest selectable date (ISO), known after mount. */
  minDate?: string;
  /** Estimate for the current choice, or null when it must be quoted. */
  estimate: Quote | null;
  guestsNumber: number;
  /** True when the head count is above what the price covers (quoted individually). */
  largeParty: boolean;
}

const Ctx = createContext<Booking | null>(null);

/** True when the month-day of `iso` falls inside a closed window (windows may wrap the year end). */
export function isClosed(iso: string, windows?: { from: string; to: string }[]) {
  if (!windows?.length) return false;
  const md = iso.slice(5);
  return windows.some((w) => (w.from <= w.to ? md >= w.from && md <= w.to : md >= w.from || md <= w.to));
}

export function BookingProvider({ experience, pricing, lang, children }: { experience: BookingExperience; pricing?: PricingView; lang?: string; children: ReactNode }) {
  const times = experience.startTimes;
  // Pre-select the typical dinner slot so the example reads 18:00, not the last slot.
  const defaultTime = times?.includes("18:00") ? "18:00" : times?.[0] ?? "";
  const [state, setState] = useState<BookingState>({
    plan: pricing?.plans?.find((p) => p.recommended)?.id ?? pricing?.plans?.[0]?.id ?? "",
    date: "", time: defaultTime, altDate: "", altTime: defaultTime,
    guests: String(experience.minGuests), addOns: [],
    interpreter: lang === "es" || lang === "fr" ? lang : "en",
    hostPref: "any",
  });

  // Earliest selectable date — computed after mount so the server and the
  // browser never disagree about "today". "3 days before, by 17:00 Japan
  // time": count from today in Japan; once the cutoff hour has passed there,
  // today no longer counts.
  const [minDate, setMinDate] = useState<string>();
  useEffect(() => {
    const [ch, cm] = experience.cutoffTime.split(":").map(Number);
    const jst = new Date(Date.now() + 9 * 3600 * 1000);
    const past = jst.getUTCHours() * 60 + jst.getUTCMinutes() >= ch * 60 + cm;
    jst.setUTCDate(jst.getUTCDate() + experience.leadDays + (past ? 1 : 0));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depends on the clock, so it cannot be an initial state
    setMinDate(jst.toISOString().slice(0, 10));
  }, [experience.leadDays, experience.cutoffTime]);

  const value = useMemo<Booking>(() => {
    const guestsNumber = Number(state.guests) || experience.minGuests;
    const largeParty = guestsNumber > experience.listedMax;
    return {
      ...state,
      set: (patch) => setState((s) => ({ ...s, ...patch })),
      toggleAddOn: (id) => setState((s) => ({ ...s, addOns: s.addOns.includes(id) ? s.addOns.filter((x) => x !== id) : [...s.addOns, id] })),
      experience, pricing, minDate,
      estimate: pricing && !largeParty ? quote(pricing, state.plan, guestsNumber, state.date || undefined) : null,
      guestsNumber, largeParty,
    };
  }, [state, pricing, experience, minDate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Null outside an experience page (the contact and trade forms). */
export const useBooking = () => useContext(Ctx);
