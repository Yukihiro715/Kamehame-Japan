/** Where the booking routes hand a new reservation to the commission ledger.
 *
 *  Both `/api/contact` and `/api/experience-checkout` call in here once the
 *  request is validated and before anything is sent out. The ledger is best
 *  effort for the visitor (a database problem never blocks a booking) but
 *  atomic for the attribution: the reservation and its referral are one batch.
 *  Nothing runs unless the `DB` binding exists. */
import type { Enquiry } from "@/lib/contact";
import type { ExperienceOrder } from "@/lib/experience-checkout";
import { GOLF_FIXED_FEE_MAX, golfArrangementFee, isArrangement } from "@/lib/golf-prices";
import { clubRentalTotal } from "@/lib/golf-club-rental";
import { d1Db, isD1Like, type SqlDb } from "./db";
import { activeReferral, type ReferralContext } from "./links";
import { createReservation, type NewLine } from "./reservations";

export interface ReferralEnv { DB?: unknown }

export const referralDb = (env: ReferralEnv | null | undefined): SqlDb | null => (env && isD1Like(env.DB) ? d1Db(env.DB) : null);

/** The experience reference the Apps Script ledger assigns (docs/experience-checkout.gs). */
export const experienceExternalRef = (requestId: string) => `KJ-E-${requestId.replace(/-/g, "")}`;

export interface AttachResult { reservationId: string; hotelId: string | null; hotelPublicId: string | null; hotelName: string | null; status?: string }

async function hotelOf(db: SqlDb, ctx: ReferralContext | null) {
  if (!ctx?.hotelId) return { hotelPublicId: null, hotelName: null };
  const h = await db.first<{ public_id: string; name: string }>(`SELECT public_id, name FROM hotels WHERE id = ?`, [ctx.hotelId]);
  return { hotelPublicId: h?.public_id ?? null, hotelName: h?.name ?? null };
}

/** The lines the site can state for an enquiry. Golf's booking fee is known
 *  for one to four golfers; a chosen-set rental is an add-on (not
 *  commissionable); green fees are paid at the club. Anything quoted later is
 *  amount-pending until operations enter it. */
export function enquiryLines(e: Enquiry): { lines: NewLine[]; amountPending: boolean } {
  if (e.areaId && isArrangement()) {
    const golfers = Number(e.party);
    const lines: NewLine[] = [];
    if (Number.isInteger(golfers) && golfers >= 1 && golfers <= GOLF_FIXED_FEE_MAX) {
      lines.push({ kind: "arrangement", description: `Golf booking fee (${golfers} golfer${golfers > 1 ? "s" : ""})`, commissionable: true, grossJpy: golfArrangementFee(golfers) });
    }
    if (e.clubRentalCount) lines.push({ kind: "addon", description: `Chosen-set club rental × ${e.clubRentalCount}`, commissionable: false, quantity: e.clubRentalCount, grossJpy: clubRentalTotal(e.clubRentalCount) });
    lines.push({ kind: "onsite", description: "Green fees, cart and rentals paid at the club", commissionable: false, grossJpy: 0 });
    return { lines, amountPending: lines.every((l) => l.kind === "onsite") };
  }
  return { lines: [], amountPending: true };
}

/** An enquiry (contact form) as a reservation. Trade and general messages are not bookings. */
export async function attachEnquiry(env: ReferralEnv | null | undefined, request: Request, e: Enquiry): Promise<AttachResult | null> {
  const db = referralDb(env);
  if (!db || e.kind !== "guest" || !e.experience || !e.requestId) return null;
  try {
    const ctx = await activeReferral(db, request.headers.get("cookie"));
    const { lines, amountPending } = enquiryLines(e);
    const r = await createReservation(db, {
      requestId: e.requestId, flow: e.areaId ? "golf" : "contact", experienceSlug: e.experience,
      experienceDate: e.dates?.match(/\d{4}-\d{2}-\d{2}/)?.[0], guests: /^\d+$/.test(e.party ?? "") ? Number(e.party) : undefined, lang: e.lang,
      lines, amountPending,
    }, ctx);
    return { reservationId: r.id, hotelId: ctx?.hotelId ?? null, ...(await hotelOf(db, ctx)), status: r.referral };
  } catch (err) {
    console.error("referral: enquiry not recorded", err instanceof Error ? err.message : err);
    return null;
  }
}

/** A pre-paid experience order as a reservation, before the Stripe session is opened. */
export async function attachExperienceOrder(env: ReferralEnv | null | undefined, request: Request, order: ExperienceOrder): Promise<AttachResult | null> {
  const db = referralDb(env);
  if (!db) return null;
  try {
    const ctx = await activeReferral(db, request.headers.get("cookie"));
    const r = await createReservation(db, {
      requestId: order.requestId, externalRef: experienceExternalRef(order.requestId), flow: "experience", experienceSlug: order.slug,
      experienceDate: order.date, guests: order.guests, lang: order.lang,
      lines: [{ kind: "base", description: order.title, commissionable: true, quantity: order.quantity, grossJpy: order.amount }],
    }, ctx);
    return { reservationId: r.id, hotelId: ctx?.hotelId ?? null, ...(await hotelOf(db, ctx)), status: r.referral };
  } catch (err) {
    console.error("referral: order not recorded", err instanceof Error ? err.message : err);
    return null;
  }
}
