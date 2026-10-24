import type { Enquiry } from "@/lib/contact";
import { GOLF_ARRANGEMENT_EXTRA_JPY, GOLF_ARRANGEMENT_FEE_JPY, GOLF_ARRANGEMENT_PRICE_VERSION, GOLF_ARRANGEMENT_RESEARCH_JPY, golfArrangementFee, isGolfArea } from "@/lib/golf-prices";
import { escapeEmailHtml, golfEmailHtml } from "@/lib/golf-email-html";
import { SIGN, threadSubject } from "@/lib/mail-copy";
import { arrangementMailCopy } from "@/lib/golf-arrangement-mail-copy";
import { golfArrangementPayment } from "@/lib/golf-arrangement-payments";
import { arrangementPolicy, GOLF_ARRANGEMENT_POLICY_VERSION } from "@/lib/golf-arrangement-policy";
import { privateGolfOption, type ReviewedPrivateQuote } from "@/lib/golf-individual-offer";

export const ARRANGEMENT_EMAIL_VERSION = "arrangement-staged-2026-10-24";

/** Staff-reviewed requirements, before detailed research. Never from the public form.
 * Older proposal JSON cannot silently opt an existing customer into new terms. */
export interface ArrangementProposal {
  policyVersion: typeof GOLF_ARRANGEMENT_POLICY_VERSION;
  eligibility: "new-enquiry-no-prior-terms" | "customer-agreed-change-before-work";
  /** Evidence reference for the latter; never infer agreement from payment alone. */
  changedTermsAgreement?: string;
  date: string;
  preferredTeeTime: string;
  essentialRequirements: string;
  preferences: string;
  budget: { totalJpy: number | null; scope: string; noCeilingConfirmed?: true };
  rentalRequirements: string;
  validUntil: string;
  privateQuote?: ReviewedPrivateQuote;
  /** Optional compatibility check, never overrides the approved master. */
  payment?: { url: string; amount: number; currency: "JPY"; priceVersion: typeof GOLF_ARRANGEMENT_PRICE_VERSION; verified: true };
}

/** Manual draft only. No email, payment, queue, status or reservation mutations. */
export function arrangementPaymentTemplate(e: Enquiry, p: ArrangementProposal, title?: string, now = Date.now()) {
  const n = Number(e.party);
  if (e.kind !== "guest" || e.experience !== "mt-fuji-golf-day" || e.lang !== "en" || !isGolfArea(e.areaId) || !Number.isInteger(n) || n < 1 || n > 4)
    throw new Error("An English golf enquiry for 1–4 golfers is required; other languages need a reviewed translation");
  const clean = (value: unknown, max = 3000) => {
    if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("The reviewed requirements are incomplete");
    return value.trim().replace(/\{\{/g, "{ {");
  };
  if (p.policyVersion !== GOLF_ARRANGEMENT_POLICY_VERSION || !["new-enquiry-no-prior-terms", "customer-agreed-change-before-work"].includes(p.eligibility))
    throw new Error("Confirm policy version and eligibility; existing terms must not be overwritten");
  if (p.eligibility === "customer-agreed-change-before-work") clean(p.changedTermsAgreement);
  const requirements = clean(p.essentialRequirements), preferences = clean(p.preferences), rentals = clean(p.rentalRequirements), time = clean(p.preferredTeeTime, 200);
  if (!p.budget || !(p.budget.totalJpy === null ? p.budget.noCeilingConfirmed === true : Number.isSafeInteger(p.budget.totalJpy) && p.budget.totalJpy >= golfArrangementFee(n)))
    throw new Error("Agree a realistic total budget ceiling or explicitly confirm no ceiling; unknown is not unlimited");
  const budgetScope = clean(p.budget.scope);
  const day = new Date(`${p.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== p.date || e.dates?.slice(0, 10) !== p.date)
    throw new Error("Check the date against the enquiry");
  const expires = Date.parse(p.validUntil), playDay = Date.parse(`${p.date}T00:00:00+09:00`);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(p.validUntil) || !Number.isFinite(expires) || expires <= now || expires >= playDay)
    throw new Error("A future deadline with timezone, before the playing day, is required");
  const payment = golfArrangementPayment(n), total = payment.amount;
  if (p.payment !== undefined && (!p.payment || p.payment.verified !== true || p.payment.priceVersion !== payment.priceVersion || p.payment.currency !== payment.currency || p.payment.amount !== total || p.payment.url !== payment.url))
    throw new Error("Saved payment details do not match this party's approved booking-service link; package and other-party links cannot be used");
  const fmt = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const deadline = new Date(expires).toLocaleString("en-GB", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const option = privateGolfOption(e, p.privateQuote);
  const text = [
    `Hello ${clean(e.name, 120)},`, "",
    "Thank you for sharing your plans. We would be happy to help you find a suitable round in Japan. Please review the details below so we can make sure the arrangements fit your trip.", "",
    "Your request", `• Date: ${fmt(day)}`, `• Preferred tee-time window: ${time} (Japan time)`, `• Area: ${e.areaId === "fuji" ? "Mt. Fuji region" : "Tokyo area"}`, `• Golfers: ${n}`,
    `• Essential requirements: ${requirements}`, `• Preferences (not guaranteed): ${preferences}`, `• Rental requirements: ${rentals}`,
    `• Total budget ceiling: ${p.budget.totalJpy === null ? "No ceiling, as you confirmed; your approval is still required before any booking" : `¥${p.budget.totalJpy.toLocaleString("en-US")}`}. Budget covers: ${budgetScope}`, "",
    n >= 2 ? "Option 1 — Golf course booking service" : "Golf course booking service",
    `Booking service fee: ¥{{TOTAL}} including tax (${n === 1 ? `¥${GOLF_ARRANGEMENT_FEE_JPY.toLocaleString("en-US")} for one golfer` : `¥${GOLF_ARRANGEMENT_FEE_JPY.toLocaleString("en-US")} for the first golfer + ¥${GOLF_ARRANGEMENT_EXTRA_JPY.toLocaleString("en-US")} × ${n - 1} additional ${n - 1 === 1 ? "golfer" : "golfers"}`}).`,
    arrangementMailCopy.en.paymentSplit,
    "No hotel pick-up or staff accompaniment is included in this booking-service fee. Bringing your own clubs reduces the rental expense at the club, not our service fee.", "",
    ...(option ? [option, ""] : []),
    "How we proceed", arrangementPolicy.en.beforePayment, arrangementPolicy.en.research, arrangementPolicy.en.confirmation, "",
    "Booking-service fee and refunds", arrangementPolicy.en.terms,
    `For your group: before a qualifying proposal, ¥${total.toLocaleString("en-US")} refunded; after a qualifying proposal but before the completed booking and written confirmation, ¥${(total - GOLF_ARRANGEMENT_RESEARCH_JPY).toLocaleString("en-US")} refunded (¥${GOLF_ARRANGEMENT_RESEARCH_JPY.toLocaleString("en-US")} retained). After the completed booking and written confirmation, no service-fee refund for customer-requested cancellation.`, "",
    "Your agreement and payment",
    "Please reply to confirm these essential requirements, budget and refund terms, and that you would like the booking service. Please correct anything that does not match your plans. We begin detailed research only after both your written agreement and payment; payment alone is not a course reservation.",
    `Once you have confirmed, use the link below to pay only the ¥{{TOTAL}} booking service fee. This invitation is valid until ${deadline} JST; contact us before paying after that time.`, "{{PAYMENT_URL}}", "",
    "We will disclose the club's itemised charges and separate cancellation conditions for your approval before reserving. Local cancellation charges can apply even though the playing fees are paid at the club. We will never accept a more expensive alternative without your agreement.", "",
    "If you have any questions, please reply — we are happy to explain the options before you decide.", "",
    "Illustrative courses", "The photographs show examples in the region, not a course proposal or a confirmed reservation.", "",
    SIGN.en,
  ].join("\n");
  const html = golfEmailHtml(text, e.areaId, true, "Pay booking service fee");
  const values: Record<string, string> = { TOTAL: total.toLocaleString("en-US"), PAYMENT_URL: payment.url };
  const fill = (value: string, html: boolean) => value.replace(/\{\{(TOTAL|PAYMENT_URL)\}\}/g, (_, key: string) => html ? escapeEmailHtml(values[key]) : values[key]);
  return { subject: threadSubject(e, title ?? "Your golf options in Japan"), text: fill(text, false), html: fill(html, true), version: ARRANGEMENT_EMAIL_VERSION, policyVersion: p.policyVersion, eligibility: p.eligibility, golfMode: "arrangement" as const, priceVersion: GOLF_ARRANGEMENT_PRICE_VERSION, amount: total, paymentUrl: payment.url };
}
