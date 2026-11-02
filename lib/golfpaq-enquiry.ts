/** Receiving a shared-bus golf tour enquiry: validate against the fresh
 *  feed, price it on the server, keep it (D1), mail the customer (total
 *  only), staff and the travel partner (with the breakdown), alert Slack.
 *  No payment, no seat is taken here (要件 2, 4). */
import { d1Db, isD1Like, randomId } from "@/lib/referral/db";
import { recipientAllowed, type PortalMailEnv } from "@/lib/portal/mail";
import { notifySlack } from "@/lib/slack";
import { GOLFPAQ_FEE_JPY, enquiryTotal, firstPublicDay, readGolfpaqSnapshot, snapshotIsFresh, toPublicTour, type GolfpaqKv } from "./golfpaq";
import { customerConfirmation, partnerHandover, staffNotification, type InternalFacts } from "./golfpaq-mail";

export interface GolfpaqEnquiryEnv extends PortalMailEnv {
  READY_STATE?: GolfpaqKv; DB?: unknown; CONTACT_TO?: string; SLACK_WEBHOOK_URL?: string;
  /** The travel partner's hand-over address (a secret; never public). */
  GOLFPAQ_PARTNER_TO?: string;
}
const headers = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
const clean = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/[\r\n\x00-\x1f]+/g, " ").trim().slice(0, n) : "");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REF_ALPHABET = "23456789BCDFGHJKMNPQRSTVWXZ";
export const newReference = () => "GP-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
export const MAX_PEOPLE = 8;

export async function sendGolfpaqMail(env: GolfpaqEnquiryEnv, mail: { from: string; to: string; replyTo?: string; subject: string; text: string }): Promise<"sent" | "blocked" | "failed" | "unconfigured"> {
  if (!env.RESEND_API_KEY) return "unconfigured";
  if (!recipientAllowed(env, mail.to)) return "blocked";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ from: mail.from, to: [mail.to], ...(mail.replyTo ? { reply_to: mail.replyTo } : {}), subject: mail.subject, text: mail.text, tags: [{ name: "kind", value: "bus_tour" }] }),
    });
    return res.ok ? "sent" : "failed";
  } catch { return "failed"; }
}

export async function handleGolfpaqEnquiry(request: Request, env: GolfpaqEnquiryEnv, now = new Date()): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ ok: false, error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ ok: false, error: "content_type" }, 415);
  const bodyText = await request.text();
  if (bodyText.length > 8000) return json({ ok: false }, 413);
  let b: Record<string, unknown>;
  try { b = JSON.parse(bodyText); } catch { return json({ ok: false, error: "invalid" }, 400); }
  const id = clean(b.id, 80), date = clean(b.date, 12), name = clean(b.name, 120), email = clean(b.email, 200).toLowerCase(), phone = clean(b.phone, 40), note = typeof b.note === "string" ? b.note.trim().slice(0, 1000) : "";
  const lang = ["en", "ja", "es", "fr", "zh-tw"].includes(String(b.lang)) ? String(b.lang) : "en";
  const people = Number(b.people), renters = b.rental === true ? Number(b.renters ?? people) : 0;
  const requestId = typeof b.request_id === "string" && UUID.test(b.request_id) ? b.request_id.toLowerCase() : null;
  if (b.website) return json({ ok: true, reference: newReference() }); // honeypot: pretend
  if (!/^\d+-\d+-\d+$/.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < firstPublicDay(now) || !Number.isInteger(people) || people < 1 || people > MAX_PEOPLE || !Number.isInteger(renters) || renters < 0 || renters > people || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || b.consent !== true || !requestId) {
    return json({ ok: false, error: "invalid" }, 400);
  }
  const snapshot = await readGolfpaqSnapshot(env.READY_STATE);
  if (!snapshotIsFresh(snapshot, now.getTime())) return json({ ok: false, error: "availability_unavailable" }, 503);
  const tour = snapshot!.tours.find((t) => t.id === id && t.date === date);
  const pub = tour ? toPublicTour(tour, now) : null;
  if (!tour || !pub || pub.soldOut || pub.seats < people) return json({ ok: false, error: "availability_changed" }, 409);
  const money = enquiryTotal(tour.perPersonYen, people, renters);
  const db = isD1Like(env.DB) ? d1Db(env.DB) : null;

  // Idempotent on the browser's request id.
  if (db) {
    const existing = await db.first<{ reference: string; total_yen: number }>(`SELECT reference, total_yen FROM bus_tour_enquiries WHERE request_id = ?`, [requestId]);
    if (existing) return json({ ok: true, reference: existing.reference, total: existing.total_yen, duplicate: true });
  }
  const reference = newReference(), at = now.toISOString();
  const facts: InternalFacts = {
    reference, tour: pub, people, renters, perPersonYen: tour.perPersonYen, toursYen: money.tours, rentalsYen: money.rentals, totalYen: money.total,
    name, email, phone: phone || undefined, note: note || undefined, lang, sourceYen: tour.sourceYen, feeYen: GOLFPAQ_FEE_JPY, seatsShown: pub.seats, snapshotUpdatedAt: snapshot!.updatedAt, tourId: tour.id,
  };
  if (db) {
    await db.run(
      `INSERT INTO bus_tour_enquiries (id, reference, request_id, tour_id, tour_date, course, pickup, departure_area, departure_time, people, renters, source_yen, fee_yen, per_person_yen, tours_yen, rentals_yen, total_yen, seats_shown, snapshot_updated_at, name, email, phone, note, lang, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)`,
      [randomId(), reference, requestId, tour.id, tour.date, tour.course, tour.pickup, pub.departure.area, pub.departure.time ?? null, people, renters, tour.sourceYen, GOLFPAQ_FEE_JPY, tour.perPersonYen, money.tours, money.rentals, money.total, pub.seats, snapshot!.updatedAt, name, email, phone || null, note || null, lang, at, at]);
  }
  const from = "KAMEHAME JAPAN <hello@kamehame-japan.com>";
  const [customerMail, staffMail, partnerMail] = await Promise.all([
    sendGolfpaqMail(env, { from, to: email, replyTo: "hello@kamehame-japan.com", ...customerConfirmation(facts) }),
    env.CONTACT_TO ? sendGolfpaqMail(env, { from, to: env.CONTACT_TO, replyTo: email, ...staffNotification(facts) }) : Promise.resolve("unconfigured" as const),
    env.GOLFPAQ_PARTNER_TO ? sendGolfpaqMail(env, { from, to: env.GOLFPAQ_PARTNER_TO, replyTo: "hello@kamehame-japan.com", ...partnerHandover(facts) }) : Promise.resolve("unconfigured" as const),
  ]);
  if (db) {
    await db.run(`UPDATE bus_tour_enquiries SET customer_mail = ?, staff_mail = ?, partner_mail = ?, status = ?, updated_at = ? WHERE reference = ?`,
      [customerMail, staffMail, partnerMail, partnerMail === "sent" ? "handed_over" : "received", new Date().toISOString(), reference]);
  }
  try { await notifySlack(env.SLACK_WEBHOOK_URL, { text: `⛳ 乗合ゴルフ問い合わせ ${reference}\n${tour.date} ${tour.course} / ${people}名（レンタル${renters}）/ 総額 ¥${money.total.toLocaleString("en-US")}\n顧客メール: ${customerMail} / 提携先: ${partnerMail}` }); } catch { /* best effort */ }
  return json({ ok: true, reference, total: money.total, customerMail });
}
