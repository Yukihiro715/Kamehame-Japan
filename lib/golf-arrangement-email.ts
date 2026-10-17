import type { Enquiry } from "@/lib/contact";
import { GOLF_ARRANGEMENT_FEE_JPY, GOLF_ARRANGEMENT_PRICE_VERSION, isGolfArea } from "@/lib/golf-prices";
import { escapeEmailHtml, golfEmailHtml } from "@/lib/golf-email-html";
import { SIGN, threadSubject } from "@/lib/mail-copy";
import { arrangementMailCopy } from "@/lib/golf-arrangement-mail-copy";

export const ARRANGEMENT_EMAIL_VERSION = "arrangement-photo-2026-10-17";

/** Staff-reviewed proposal, never populated from the public enquiry form.
 * Verification means checking the actual Stripe link in the merchant dashboard;
 * this renderer does not have a Stripe API key and cannot verify it remotely. */
export interface ArrangementProposal {
  courseName: string;
  date: string;
  teeTime: string;
  courseCharges: string;
  courseCancellation: string;
  validUntil: string;
  payment: {
    url: string;
    amount: number;
    currency: "JPY";
    priceVersion: typeof GOLF_ARRANGEMENT_PRICE_VERSION;
    verified: true;
  };
}

/** Creates a draft only. New booking-service payments always follow a reviewed
 * course proposal; the old ten-minute package queue is deliberately not used. */
export function arrangementPaymentTemplate(e: Enquiry, p: ArrangementProposal, title?: string, now = Date.now()) {
  const n = Number(e.party);
  if (e.kind !== "guest" || e.experience !== "mt-fuji-golf-day" || e.lang !== "en" || !isGolfArea(e.areaId) || !Number.isInteger(n) || n < 1 || n > 4)
    throw new Error("An English golf enquiry for 1–4 golfers is required; other languages need a reviewed translation");
  const clean = (value: unknown, max: number) => {
    if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("The course proposal is incomplete");
    return value.trim().replace(/\{\{/g, "{ {");
  };
  const course = clean(p.courseName, 200), charges = clean(p.courseCharges, 3000), cancellation = clean(p.courseCancellation, 3000);
  const day = new Date(`${p.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== p.date || e.dates?.slice(0, 10) !== p.date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.teeTime))
    throw new Error("Check the proposed date and tee time against the enquiry");
  const expires = Date.parse(p.validUntil), teeAt = Date.parse(`${p.date}T${p.teeTime}:00+09:00`);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(p.validUntil) || !Number.isFinite(expires) || expires <= now || expires >= teeAt)
    throw new Error("A future proposal deadline with a timezone, before tee-off, is required");
  const total = GOLF_ARRANGEMENT_FEE_JPY * n;
  if (!p.payment || p.payment.verified !== true || p.payment.priceVersion !== GOLF_ARRANGEMENT_PRICE_VERSION || p.payment.currency !== "JPY" || p.payment.amount !== total)
    throw new Error("Verify a booking-service-only Stripe link for the exact fee and currency; package links cannot be used");
  if (!/^https:\/\/(book|buy)\.stripe\.com\/[A-Za-z0-9]+$/.test(p.payment.url))
    throw new Error("A verified live Stripe Payment Link without query parameters is required");
  const fmt = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const before = (days: number) => fmt(new Date(day.getTime() - days * 86400000));
  const deadline = new Date(expires).toLocaleString("en-GB", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const text = [
    `Hello ${clean(e.name, 120)},`, "",
    "Please review the course proposal below. This is a booking service; your reservation is not confirmed yet.", "",
    "Your golf day", `• Proposed course: ${course}`, `• Date: ${fmt(day)}`, `• Proposed tee time: ${p.teeTime} JST`, `• Golfers: ${n}`,
    "• Please travel to the course independently. No hotel pick-up is included.", `• Proposal valid until: ${deadline} JST. Availability will be rechecked before the reservation is confirmed.`, "",
    "Price", `Booking service fee payable to KAMEHAME JAPAN / Prosent Inc.: ¥{{TOTAL}} including tax (¥${GOLF_ARRANGEMENT_FEE_JPY.toLocaleString("en-US")} × ${n} golfers).`,
    arrangementMailCopy.en.paymentSplit,
    "Bringing your own clubs does not change our booking service fee. Any optional assistant is quoted and agreed separately; that fee is not collected by this payment link.", "",
    "Payment", "If you agree to the proposed course, tee time, charges and conditions, pay the booking service fee only using this link:", "{{PAYMENT_URL}}",
    "After payment, we will secure the tee time in your name and send written confirmation and your arrival briefing. If we cannot arrange the proposed course and tee time, we will offer an alternative for your approval or refund the booking service fee in full. Please do not pay after the proposal deadline without contacting us.", "",
    "Course charges — paid directly to the club", charges, "",
    "Your course, arranged by our team", `This proposal is for ${course}. The photos below are examples of courses in the region; they do not confirm a reservation.`, "",
    "Cancellation — all dates and times are Japan time", `These charges apply only to our booking service fee of ¥{{TOTAL}}:`,
    `• Free cancellation until 6:00 pm JST on ${before(7)}.`,
    `• After that deadline through ${before(3)}: 50% of the booking service fee.`,
    `• From ${before(2)}, including no-shows: 100% of the booking service fee.`,
    "If the free-cancellation deadline has already passed, review the applicable charge before paying. If the club closes the course due to weather, our booking service fee is refunded in full.", "",
    "The club's separate cancellation conditions", cancellation,
    "The club's cancellation fees are separate from our booking service fee. Any transfer or optional assistant has its own agreed conditions.", "",
    "A few details to complete your arrangements", "Please confirm each golfer's full name and any rental requirements. Rentals and any course caddie are subject to the club's availability and charged by the club. Please bring your own golf wear and gloves.", "",
    SIGN.en,
  ].join("\n");
  const html = golfEmailHtml(text, e.areaId, true, "Pay booking service fee");
  const values: Record<string, string> = { TOTAL: total.toLocaleString("en-US"), PAYMENT_URL: p.payment.url };
  const fill = (value: string, html: boolean) => value.replace(/\{\{(TOTAL|PAYMENT_URL)\}\}/g, (_, key: string) => html ? escapeEmailHtml(values[key]) : values[key]);
  return { subject: threadSubject(e, title ?? "Japan Golf Course Booking Service"), text: fill(text, false), html: fill(html, true), version: ARRANGEMENT_EMAIL_VERSION, golfMode: "arrangement" as const, priceVersion: GOLF_ARRANGEMENT_PRICE_VERSION, amount: total };
}
