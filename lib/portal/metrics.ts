/** What the hotel portal shows: the funnel for a period, the confirmed
 *  results, the experiences with their terms, and the referred bookings.
 *  Everything is scoped by hotel id on the server (要件 5.1, 5.2, 5.3). */
import { catalogFor, type Experience } from "@/lib/catalog";
import { listPrice } from "@/lib/pricing";
import { type SqlDb } from "@/lib/referral/db";
import { commissionNet, netFromGross, taxOnTotal } from "@/lib/referral/money";
import { ENTRY_STATUS_JA, HOLD_JA, PAYMENT_STATUS_JA, RESERVATION_STATUS_JA, periodBounds } from "./util";
import { effectiveRate } from "@/lib/referral/rates";
import { paidTotalForHotel } from "./settlement";

export interface Period { from: string; to: string }

export interface HotelDashboard {
  period: Period;
  updatedAt: string;
  visitorCountPartial: boolean;
  funnel: { accesses: number; visits: number | null; provisional: number; confirmed: number; paid: number; fullyRefunded: number; cancelled: number; estimatedCommissionNet: number };
  confirmed: { count: number; baseNet: number; commissionNet: number; commissionTaxRef: number };
  balance: { unpaidNet: number; unpaidTaxRef: number; paid: number };
}

const n = (v: { n: number | null } | null) => Number(v?.n ?? 0);

export async function hotelDashboard(db: SqlDb, hotelId: string, period: Period, now = Date.now()): Promise<HotelDashboard> {
  const { start, end } = periodBounds(period.from, period.to);
  const [accesses, visits, provisional, confirmed, paid, refunded, cancelled, estimated, done, unpaid] = await Promise.all([
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM referral_events WHERE hotel_id = ? AND excluded = 0 AND at >= ? AND at < ?`, [hotelId, start, end]),
    db.first<{ n: number; legacy: number }>(`SELECT COUNT(DISTINCT visitor_window_id) AS n, SUM(CASE WHEN visitor_window_id IS NULL THEN 1 ELSE 0 END) AS legacy FROM referral_events WHERE hotel_id = ? AND excluded = 0 AND at >= ? AND at < ?`, [hotelId, start, end]),
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM reservations r JOIN reservation_referrals rr ON rr.reservation_id = r.id WHERE rr.hotel_id = ? AND rr.status != 'removed' AND r.status IN ('provisional','arranging') AND r.created_at >= ? AND r.created_at < ?`, [hotelId, start, end]),
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM reservations r JOIN reservation_referrals rr ON rr.reservation_id = r.id WHERE rr.hotel_id = ? AND rr.status != 'removed' AND r.status IN ('confirmed','completed') AND r.created_at >= ? AND r.created_at < ?`, [hotelId, start, end]),
    db.first<{ n: number }>(`SELECT COUNT(DISTINCT p.reservation_id) AS n FROM payments p JOIN reservation_referrals rr ON rr.reservation_id = p.reservation_id WHERE rr.hotel_id = ? AND rr.status != 'removed' AND p.payment_status = 'paid' AND p.occurred_at >= ? AND p.occurred_at < ?`, [hotelId, start, end]),
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM reservations r JOIN reservation_referrals rr ON rr.reservation_id = r.id WHERE rr.hotel_id = ? AND rr.status != 'removed' AND r.payment_status = 'refunded' AND r.updated_at >= ? AND r.updated_at < ?`, [hotelId, start, end]),
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM reservations r JOIN reservation_referrals rr ON rr.reservation_id = r.id WHERE rr.hotel_id = ? AND rr.status != 'removed' AND r.status IN ('cancelled','no_show') AND r.updated_at >= ? AND r.updated_at < ?`, [hotelId, start, end]),
    db.first<{ n: number }>(`SELECT SUM(e.commission_net_jpy) AS n FROM commission_entries e JOIN reservations r ON r.id = e.reservation_id JOIN reservation_referrals rr ON rr.reservation_id = r.id WHERE e.hotel_id = ? AND rr.status != 'removed' AND e.status = 'estimated' AND e.performed_on_jst IS NULL AND r.status IN ('provisional','arranging','confirmed') AND r.created_at >= ? AND r.created_at < ?`, [hotelId, start, end]),
    db.first<{ c: number; base: number | null; net: number | null }>(`SELECT COUNT(*) AS c, SUM(base_net_jpy) AS base, SUM(commission_net_jpy) AS net FROM commission_entries WHERE hotel_id = ? AND status IN ('confirmed','adjusted') AND performed_on_jst >= ? AND performed_on_jst <= ?`, [hotelId, period.from, period.to]),
    db.first<{ n: number }>(`SELECT SUM(commission_net_jpy) AS n FROM commission_entries WHERE hotel_id = ? AND status IN ('confirmed','adjusted') AND statement_id IS NULL`, [hotelId]),
  ]);
  const confirmedNet = Number(done?.net ?? 0), unpaidNet = n(unpaid);
  return {
    period, updatedAt: new Date(now).toISOString(), visitorCountPartial: (visits?.legacy ?? 0) > 0,
    funnel: { accesses: n(accesses), visits: n(visits) === 0 && (visits?.legacy ?? 0) > 0 ? null : n(visits), provisional: n(provisional), confirmed: n(confirmed), paid: n(paid), fullyRefunded: n(refunded), cancelled: n(cancelled), estimatedCommissionNet: n(estimated) },
    confirmed: { count: Number(done?.c ?? 0), baseNet: Number(done?.base ?? 0), commissionNet: confirmedNet, commissionTaxRef: taxOnTotal(confirmedNet, 1000) },
    balance: { unpaidNet, unpaidTaxRef: taxOnTotal(unpaidNet, 1000), paid: await paidTotalForHotel(db, hotelId) },
  };
}

export interface ExperienceTerms {
  slug: string; title: string; titleEn: string; tagline: string; city: string; area: string; areaEn: string; duration: string; durationEn: string; group: string; groupEn: string; img: string;
  basePrice: string; priceUnit: "person" | "group"; priceNote?: string;
  referable: boolean; rateBp: number | null; referenceAvgJpy: number | null; referenceNote: string | null; referenceIsEstimate: boolean;
  commissionExampleNet: number | null; policyFrom: string | null; siteStatus: string;
}

/** Live experiences inherit the common/partner rate unless explicitly disabled by an experience policy. */
export async function experienceTerms(db: SqlDb, now = Date.now(), hotelId: string | null = null): Promise<ExperienceTerms[]> {
  const policies = await db.all<{ experience_slug: string; rate_bp: number; tax_rate_bp: number; reference_avg_jpy: number | null; reference_note: string | null; referral_enabled: number; valid_from: string; unit_price_excl_tax_jpy: number | null }>(
    `SELECT p.experience_slug, p.rate_bp, p.tax_rate_bp, p.reference_avg_jpy, p.reference_note, p.referral_enabled, p.valid_from, p.unit_price_excl_tax_jpy FROM experience_referral_policies p
      WHERE p.valid_from <= ? AND p.id = (SELECT q.id FROM experience_referral_policies q WHERE q.experience_slug = p.experience_slug AND q.valid_from <= ? ORDER BY q.valid_from DESC, q.version DESC LIMIT 1)`,
    [new Date(now).toISOString(), new Date(now).toISOString()]);
  const rate = await effectiveRate(db, hotelId, now);
  const bySlug = new Map(policies.map((p) => [p.experience_slug, { ...p, rate_bp: rate?.rate_bp ?? p.rate_bp }]));
  const enBySlug = new Map(catalogFor("en").experiences.map((x) => [x.slug, x]));
  return catalogFor("ja").experiences.filter((x) => x.status === "live").map((x: Experience) => {
    const p = bySlug.get(x.slug) ?? (rate?.rate_bp != null ? { rate_bp: rate.rate_bp, tax_rate_bp: 1000, referral_enabled: 1, unit_price_excl_tax_jpy: null, reference_avg_jpy: null, reference_note: null, valid_from: rate.valid_from } : undefined);
    const xe = enBySlug.get(x.slug) ?? x;
    const lp = listPrice(x, "ja");
    const referable = !!p && !!p.referral_enabled;
    const base = p?.unit_price_excl_tax_jpy ?? (p && /^¥[\d,]+$/.test(lp.price) ? netFromGross(Number(lp.price.replace(/[¥,]/g, "")), p.tax_rate_bp) : null);
    return {
      slug: x.slug, title: x.title, titleEn: xe.title, tagline: x.tagline, city: x.city, area: x.area, areaEn: xe.area, duration: x.duration, durationEn: xe.duration, group: x.group, groupEn: xe.group, img: x.img,
      basePrice: lp.price, priceUnit: lp.unit, priceNote: lp.note,
      referable, rateBp: referable ? p!.rate_bp : null,
      referenceAvgJpy: p?.reference_avg_jpy ?? null, referenceNote: p?.reference_note ?? null, referenceIsEstimate: true,
      commissionExampleNet: referable && base !== null ? commissionNet([{ netJpy: base, rateBp: p!.rate_bp }]) : null,
      policyFrom: p?.valid_from ?? null, siteStatus: x.status ?? "live",
    };
  });
}

export interface HotelReservationRow {
  hotelRef: string; createdAt: string; experience: string; experienceSlug: string; experienceDate: string | null; guests: number | null;
  status: string; statusJa: string; paymentStatus: string; paymentJa: string;
  bookingGross: number | null; baseNet: number | null; rateBp: number | null; commissionNet: number | null; commissionGrossRef: number | null; entryStatus: string | null; entryJa: string; hold: string | null; holdCodes: string[]; performedOn: string | null;
}

export const RESERVATION_SORT_KEYS = ["created", "date", "amount", "rate", "commission", "status", "entry"] as const;
export type ReservationSort = typeof RESERVATION_SORT_KEYS[number];
export const reservationSort = (key?: string): ReservationSort => RESERVATION_SORT_KEYS.includes(key as ReservationSort) ? key as ReservationSort : "created";
export interface ReservationSummary { estimatedNet: number; pendingNet: number; confirmedNet: number; unknownCount: number }
export interface ReservationFilters { from?: string; to?: string; experience?: string; status?: string; ref?: string; q?: string; sort?: string; direction?: string; experienceFrom?: string; experienceTo?: string; limit?: number; offset?: number }
export interface ReservationList { rows: HotelReservationRow[]; total: number; summary: ReservationSummary }

/** The bookings referred by a hotel: no names, e-mails, phone numbers, notes or payment details (要件 5.3). */
export async function hotelReservations(db: SqlDb, hotelId: string, f: ReservationFilters = {}): Promise<ReservationList> {
  const where: string[] = ["rr.hotel_id = ?", "rr.status != 'removed'"], params: unknown[] = [hotelId];
  if (f.from) { where.push("r.created_at >= ?"); params.push(periodBounds(f.from, f.from).start); }
  if (f.to) { where.push("r.created_at < ?"); params.push(periodBounds(f.to, f.to).end); }
  if (f.experienceFrom) { where.push("r.experience_date >= ?"); params.push(f.experienceFrom); }
  if (f.experienceTo) { where.push("r.experience_date <= ?"); params.push(f.experienceTo); }
  if (f.experience) { where.push("r.experience_slug = ?"); params.push(f.experience); }
  if (f.status) { where.push("r.status = ?"); params.push(f.status); }
  if (f.ref) { where.push("r.hotel_ref = ?"); params.push(f.ref.toUpperCase()); }
  const titles = new Map(catalogFor("ja").experiences.map((x) => [x.slug, x.title]));
  const query = f.q?.trim().slice(0, 100).toLowerCase();
  if (query) {
    const slugs = [...new Set([...catalogFor("ja").experiences, ...catalogFor("en").experiences].filter(x => `${x.title} ${x.slug}`.toLowerCase().includes(query)).map(x => x.slug))];
    where.push(`(instr(lower(r.hotel_ref), ?) > 0 OR instr(lower(r.experience_slug), ?) > 0${slugs.length ? ` OR r.experience_slug IN (${slugs.map(() => "?").join(",")})` : ""})`);
    params.push(query, query, ...slugs);
  }
  const w = where.join(" AND ");
  const gross = "CASE WHEN r.amount_status = 'known' THEN (SELECT SUM(MAX(0, l.gross_jpy - l.discount_jpy - l.refunded_gross_jpy)) FROM reservation_lines l WHERE l.reservation_id = r.id) ELSE NULL END";
  const sorts: Record<ReservationSort, string> = { created: "r.created_at", date: "r.experience_date", amount: gross, rate: "e.rate_bp", commission: "e.commission_net_jpy", status: "CASE r.status WHEN 'provisional' THEN 0 WHEN 'arranging' THEN 1 WHEN 'confirmed' THEN 2 WHEN 'completed' THEN 3 WHEN 'cancelled' THEN 4 ELSE 5 END", entry: "CASE e.status WHEN 'estimated' THEN 0 WHEN 'pending' THEN 1 WHEN 'confirmed' THEN 2 WHEN 'adjusted' THEN 3 WHEN 'voided' THEN 4 ELSE NULL END" };
  const order = sorts[reservationSort(f.sort)], direction = f.direction === "asc" ? "ASC" : "DESC";
  const joins = "FROM reservations r JOIN reservation_referrals rr ON rr.reservation_id = r.id LEFT JOIN commission_entries e ON e.reservation_id = r.id";
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 500), offset = Math.max(f.offset ?? 0, 0);
  const [rows, total] = await Promise.all([
    db.all<{ hotel_ref: string; created_at: string; experience_slug: string; experience_date: string | null; guests: number | null; booking_gross: number | null; status: string; payment_status: string; base_net_jpy: number | null; rate_bp: number | null; commission_net_jpy: number | null; entry_status: string | null; hold_reason: string | null; performed_on_jst: string | null }>(
      `SELECT r.hotel_ref, r.created_at, r.experience_slug, r.experience_date, r.guests, r.status, r.payment_status, e.base_net_jpy, e.rate_bp, e.commission_net_jpy, e.status AS entry_status, e.hold_reason, e.performed_on_jst, ${gross} AS booking_gross
         ${joins} WHERE ${w} ORDER BY (${order}) IS NULL ASC, ${order} ${direction}, r.hotel_ref ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    db.first<{ n: number; estimated: number; pending: number; confirmed: number; unknown: number }>(`SELECT COUNT(*) AS n,
      SUM(CASE WHEN e.status = 'estimated' AND e.rate_bp IS NOT NULL THEN e.commission_net_jpy ELSE 0 END) AS estimated,
      SUM(CASE WHEN e.status = 'pending' AND e.rate_bp IS NOT NULL THEN e.commission_net_jpy ELSE 0 END) AS pending,
      SUM(CASE WHEN e.status IN ('confirmed','adjusted') AND e.rate_bp IS NOT NULL THEN e.commission_net_jpy ELSE 0 END) AS confirmed,
      SUM(CASE WHEN e.rate_bp IS NULL OR e.commission_net_jpy IS NULL THEN 1 ELSE 0 END) AS unknown
      ${joins} WHERE ${w}`, params),
  ]);
  return {
    total: n(total),
    summary: { estimatedNet: Number(total?.estimated ?? 0), pendingNet: Number(total?.pending ?? 0), confirmedNet: Number(total?.confirmed ?? 0), unknownCount: Number(total?.unknown ?? 0) },
    rows: rows.map((r) => ({
      hotelRef: r.hotel_ref, createdAt: r.created_at, experience: titles.get(r.experience_slug) ?? r.experience_slug, experienceSlug: r.experience_slug, experienceDate: r.experience_date, guests: r.guests,
      status: r.status, statusJa: RESERVATION_STATUS_JA[r.status] ?? r.status, paymentStatus: r.payment_status, paymentJa: PAYMENT_STATUS_JA[r.payment_status] ?? r.payment_status,
      bookingGross: r.booking_gross, baseNet: r.base_net_jpy, rateBp: r.rate_bp, commissionNet: r.commission_net_jpy,
      commissionGrossRef: r.commission_net_jpy === null ? null : r.commission_net_jpy + taxOnTotal(r.commission_net_jpy, 1000),
      entryStatus: r.entry_status, entryJa: r.entry_status ? ENTRY_STATUS_JA[r.entry_status] ?? r.entry_status : "—",
      hold: r.hold_reason ? r.hold_reason.split(",").map((h) => HOLD_JA[h] ?? h).join("、") : null, holdCodes: r.hold_reason ? r.hold_reason.split(",") : [], performedOn: r.performed_on_jst,
    })),
  };
}
