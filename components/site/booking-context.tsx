"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { quote, type PricingView, type Quote } from "@/lib/pricing";
import { track } from "@/lib/analytics";

/** One alternative on a two-plan page, as the booking state needs it. */
export interface BookingVariant {
  id: string; title: string; short: string;
  /** Whole-group package prices by party size; other sizes are quoted. */
  tiers: { party: number; total: number }[];
  defaultTime?: string;
}

/** What the page knows about the product that the request needs. */
export interface BookingExperience {
  slug: string;
  title: string;
  /** Days of notice the venue needs; the date picker starts after them. */
  leadDays: number;
  /** Clock time (Japan) by which a request must be in, e.g. "17:00". */
  cutoffTime: string;
  startTimes?: string[];
  /** Pre-selected start time (default: 18:00 if offered, else the first). */
  defaultTime?: string;
  closed?: { from: string; to: string }[];
  minGuests: number;
  /** Pre-selected head count (default: two, the usual party). */
  defaultGuests?: number;
  /** Largest head count the price covers; above it the group is quoted individually. */
  listedMax: number;
  /** Ceiling of the head-count control (default 15). */
  maxGuests?: number;
  /** Announced dates only (with each date's start times); every other day is closed. */
  dates?: { date: string; times: string[] }[];
  /** False when no interpreter guide comes with the product. */
  interpreter?: boolean;
  /** Request-form notes field copy, when the product needs something specific. */
  notesLabel?: string;
  notesHint?: string;
  /** Product-specific button text and the trust line under it. */
  ctaLabel?: string;
  ctaNote?: string;
  /** Label of the time control, when the time is not a start time (e.g. departure). */
  timeLabel?: string;
  /** Two-plan pages: the alternatives, the pre-selected one, and whether the
   *  request asks how the course should be chosen. */
  variants?: BookingVariant[];
  defaultVariant?: string;
  coursePreference?: boolean;
  /** Prefix of the choice events pushed for GTM, e.g. "golf" → golf_area_selected. */
  eventPrefix?: string;
}

export const DEFAULT_MAX_GUESTS = 15;

/** Everything the visitor chooses about a request — plan, dates, head count,
 *  extras — lives here so the booking card beside the page and the request
 *  form at the bottom show the same choice and the same estimate. */
export interface BookingState {
  plan: string;
  date: string; time: string;
  guests: string;
  addOns: string[];
  /** Interpreter guide language: "en" | "es" | "fr" | "none". Included in the price. */
  interpreter: string;
  /** Two-plan pages: the chosen variant id. */
  variant: string;
  /** Golf: how the course is chosen — "recommended" (ours, the package price) or "preferred" (the guest's, quoted). */
  coursePref: "recommended" | "preferred";
  courseName: string;
  courseUrl: string;
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
  /** The chosen variant on a two-plan page. */
  variantView?: BookingVariant;
  /** True when the request can only be quoted: a larger party, or a preferred course. */
  customQuote: boolean;
}

const Ctx = createContext<Booking | null>(null);

/** True when a guest can pick `iso`: an announced date for dated products,
 *  otherwise any day outside the closed windows. */
export function isBookable(iso: string, x: Pick<BookingExperience, "dates" | "closed">) {
  if (x.dates) return x.dates.some((d) => d.date === iso);
  return !isClosed(iso, x.closed);
}

/** Earliest date a guest can actually pick: for dated products, the first
 *  announced date on or after the booking cutoff. */
export function firstOpenDate(x: Pick<BookingExperience, "dates">, min?: string): string | undefined {
  if (!x.dates) return min;
  if (!min) return undefined;
  return x.dates.map((d) => d.date).sort().find((d) => d >= min);
}

/** Start times offered on `iso` (all of them when no date is chosen yet). */
export function timesFor(x: Pick<BookingExperience, "dates" | "startTimes">, iso?: string): string[] {
  if (x.dates && iso) return x.dates.find((d) => d.date === iso)?.times ?? [];
  return x.startTimes ?? [];
}

/** True when the month-day of `iso` falls inside a closed window (windows may wrap the year end). */
export function isClosed(iso: string, windows?: { from: string; to: string }[]) {
  if (!windows?.length) return false;
  const md = iso.slice(5);
  return windows.some((w) => (w.from <= w.to ? md >= w.from && md <= w.to : md >= w.from || md <= w.to));
}

/** `pricing` is the product's single price view; two-plan pages pass one view
 *  per variant in `pricings` and the active one follows the choice. */
export function BookingProvider({ experience, pricing, pricings, lang, children }: {
  experience: BookingExperience; pricing?: PricingView; pricings?: Record<string, PricingView>; lang?: string; children: ReactNode;
}) {
  const times = experience.startTimes;
  const initialVariant = experience.defaultVariant ?? experience.variants?.[0]?.id ?? "";
  const variantTime = (id: string) => experience.variants?.find((v) => v.id === id)?.defaultTime;
  // Pre-select the typical dinner slot so the example reads 18:00, not the last slot.
  const pickDefault = (preferred?: string) =>
    preferred && times?.includes(preferred) ? preferred : experience.defaultTime && times?.includes(experience.defaultTime) ? experience.defaultTime : times?.includes("18:00") ? "18:00" : times?.[0] ?? "";
  const firstPricing = pricings?.[initialVariant] ?? pricing;
  const maxGuests = experience.maxGuests ?? DEFAULT_MAX_GUESTS;
  const [state, setState] = useState<BookingState>({
    plan: firstPricing?.plans?.find((p) => p.recommended)?.id ?? firstPricing?.plans?.[0]?.id ?? "",
    date: "", time: pickDefault(variantTime(initialVariant)),
    // Start at two (the usual party) even where one guest may book, unless the product says otherwise.
    guests: String(Math.min(Math.max(experience.minGuests, experience.defaultGuests ?? 2), maxGuests)), addOns: [],
    interpreter: lang === "es" || lang === "fr" ? lang : "en",
    variant: initialVariant, coursePref: "recommended", courseName: "", courseUrl: "",
  });
  // Until the guest picks a time, switching variant moves to that variant's usual departure.
  const [timeTouched, setTimeTouched] = useState(false);

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

  // Two-plan pages: an advert may pre-select the area and party size with
  // ?area=tokyo&golfers=3. Read once after mount (the server render cannot
  // see the query); anything unknown keeps the default, and this is not a
  // choice the visitor made, so no choice event is pushed.
  useEffect(() => {
    if (!experience.variants?.length) return;
    const q = new URLSearchParams(window.location.search);
    const area = q.get("area");
    const golfers = Number(q.get("golfers"));
    const patch: Partial<BookingState> = {};
    if (area && experience.variants.some((v) => v.id === area) && area !== initialVariant) {
      patch.variant = area;
      patch.time = pickDefault(variantTime(area));
    }
    if (Number.isInteger(golfers) && golfers >= experience.minGuests && golfers <= maxGuests) patch.guests = String(golfers);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the query string is only known in the browser
    if (Object.keys(patch).length) setState((s) => ({ ...s, ...patch }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  const value = useMemo<Booking>(() => {
    const activePricing = pricings?.[state.variant] ?? pricing;
    const guestsNumber = Number(state.guests) || experience.minGuests;
    const largeParty = guestsNumber > experience.listedMax;
    const variantView = experience.variants?.find((v) => v.id === state.variant);
    const customQuote = !!experience.variants && (largeParty || state.coursePref === "preferred");
    const prefix = experience.eventPrefix ?? "experience";
    return {
      ...state,
      set: (patch) => {
        // Choice events for GTM (area, party size, course preference), once per actual change.
        if (patch.variant !== undefined && patch.variant !== state.variant) {
          track(`${prefix}_area_selected`, { area: patch.variant, experience: experience.slug });
        }
        if (experience.variants && patch.guests !== undefined && patch.guests !== state.guests) {
          track(`${prefix}_group_size_selected`, { golfers: Number(patch.guests), area: state.variant, experience: experience.slug });
        }
        if (patch.coursePref !== undefined && patch.coursePref !== state.coursePref) {
          track(`${prefix}_course_preference_selected`, { preference: patch.coursePref, experience: experience.slug });
        }
        if (patch.time !== undefined) setTimeTouched(true);
        setState((s) => {
          const next = { ...s, ...patch };
          // On dated products a date carries its own start times: keep the chosen
          // time when that date offers it, otherwise move to the date's first slot.
          if (experience.dates) {
            if (patch.date !== undefined && patch.date) {
              const ts = timesFor(experience, patch.date);
              if (ts.length && !ts.includes(next.time)) next.time = ts[0];
            }
          }
          // Date and head count carry over between variants; only the untouched
          // default time follows the variant (a nearer course leaves later).
          if (patch.variant !== undefined && patch.variant !== s.variant && !timeTouched && patch.time === undefined) {
            next.time = pickDefault(variantTime(patch.variant));
          }
          return next;
        });
      },
      toggleAddOn: (id) => setState((s) => ({ ...s, addOns: s.addOns.includes(id) ? s.addOns.filter((x) => x !== id) : [...s.addOns, id] })),
      experience, pricing: activePricing, minDate,
      estimate: activePricing && !largeParty && !customQuote ? quote(activePricing, state.plan, guestsNumber, state.date || undefined) : null,
      guestsNumber, largeParty, variantView, customQuote,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pickDefault/variantTime derive from `experience`
  }, [state, pricing, pricings, experience, minDate, timeTouched]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Null outside an experience page (the contact and trade forms). */
export const useBooking = () => useContext(Ctx);
