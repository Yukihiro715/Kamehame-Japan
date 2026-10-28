/** Operations: partners, settlement profiles, policies, reservation actions,
 *  exceptions, export. Every change is reasoned and logged; original data is
 *  never deleted to correct something (要件 6). */
import { catalogFor } from "@/lib/catalog";
import { jstDate, randomId, type SqlDb, type SqlStatement } from "@/lib/referral/db";
import { netFromGross, taxOnTotal } from "@/lib/referral/money";
import { allocateRefund, applyPayment, confirmAttendance, policyFor, recomputeCommission, setReservationOutcome } from "@/lib/referral/reservations";
import { bad, int, isoDate, notFound, periodBounds, str, toCsv, ENTRY_STATUS_JA, HOLD_JA, PAYMENT_STATUS_JA, RESERVATION_STATUS_JA } from "./util";

const now_ = (now?: number) => new Date(now ?? Date.now()).toISOString();
const audit = (actor: string, action: string, targetType: string, targetId: string, reason: string | null, after?: unknown, at = now_()): SqlStatement => ({
  sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, reason, after_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  params: [randomId(), at, actor, action, targetType, targetId, reason, after === undefined ? null : JSON.stringify(after)],
});

// ---- partners --------------------------------------------------------------

export async function createLegalEntity(db: SqlDb, input: { name: unknown; address?: unknown; registrationNumber?: unknown; by: string }) {
  const name = str(input.name, 200);
  if (!name) throw bad("name_required");
  const id = randomId(), at = now_();
  const reg = str(input.registrationNumber, 20) || null;
  await db.batch([
    { sql: `INSERT INTO partner_legal_entities (id, name, address, registration_status, registration_number, created_at, updated_at) VALUES (?, ?, ?, 'unverified', ?, ?, ?)`, params: [id, name, str(input.address, 400) || null, reg, at, at] },
    audit(input.by, "legal_entity.create", "legal_entity", id, null, { name }),
  ]);
  return { id };
}

export async function createHotel(db: SqlDb, input: { legalEntityId: unknown; name: unknown; publicId?: unknown; by: string; withProfile?: boolean }) {
  const legalEntityId = str(input.legalEntityId, 64), name = str(input.name, 200);
  if (!legalEntityId || !name) throw bad("fields_required");
  const le = await db.first<{ id: string }>(`SELECT id FROM partner_legal_entities WHERE id = ?`, [legalEntityId]);
  if (!le) throw bad("unknown_legal_entity");
  const id = randomId(), at = now_();
  const seq = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM hotels`);
  const publicId = str(input.publicId, 20) || `HP-${String((seq?.n ?? 0) + 1).padStart(4, "0")}`;
  const statements: SqlStatement[] = [
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)`, params: [id, legalEntityId, publicId, name, at, at] },
    audit(input.by, "hotel.create", "hotel", id, null, { name, publicId }),
  ];
  // One settlement profile per hotel by default (要件 3.6).
  if (input.withProfile !== false) {
    const pid = randomId();
    statements.push(
      { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, params: [pid, legalEntityId, `${name} 精算`, jstDate(), at, at] },
      { sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES (?, ?, ?)`, params: [pid, id, jstDate()] },
    );
  }
  await db.batch(statements);
  return { id, publicId };
}

export async function updateHotel(db: SqlDb, hotelId: string, input: { status?: unknown; brochureUrl?: unknown; notes?: unknown; name?: unknown; by: string; reason?: unknown }) {
  const h = await db.first<{ id: string; status: string }>(`SELECT id, status FROM hotels WHERE id = ?`, [hotelId]);
  if (!h) throw notFound();
  const sets: string[] = [], params: unknown[] = [];
  if (input.status !== undefined) { const s = str(input.status, 20); if (!["active", "suspended", "terminated"].includes(s)) throw bad("bad_status"); sets.push("status = ?"); params.push(s); }
  if (input.brochureUrl !== undefined) { const u = str(input.brochureUrl, 500); if (u && !/^https:\/\//.test(u)) throw bad("bad_url"); sets.push("brochure_url = ?"); params.push(u || null); }
  if (input.notes !== undefined) { sets.push("notes = ?"); params.push(str(input.notes, 2000) || null); }
  if (input.name !== undefined) { const n = str(input.name, 200); if (!n) throw bad("name_required"); sets.push("name = ?"); params.push(n); }
  if (!sets.length) return;
  const at = now_();
  await db.batch([
    { sql: `UPDATE hotels SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`, params: [...params, at, hotelId] },
    audit(input.by, "hotel.update", "hotel", hotelId, str(input.reason, 500) || null, { status: input.status, brochureUrl: input.brochureUrl, notes: input.notes !== undefined, name: input.name }),
  ]);
}

export async function createProfile(db: SqlDb, input: { legalEntityId: unknown; name: unknown; hotelIds: unknown; validFrom?: unknown; by: string }) {
  const legalEntityId = str(input.legalEntityId, 64), name = str(input.name, 200);
  const hotelIds = Array.isArray(input.hotelIds) ? input.hotelIds.filter((x): x is string => typeof x === "string") : [];
  const validFrom = isoDate(input.validFrom) ?? jstDate();
  if (!legalEntityId || !name || !hotelIds.length) throw bad("fields_required");
  // Every hotel must belong to the same legal entity (要件 3.6).
  const hotels = await db.all<{ id: string; legal_entity_id: string }>(`SELECT id, legal_entity_id FROM hotels WHERE id IN (${hotelIds.map(() => "?").join(",")})`, hotelIds);
  if (hotels.length !== hotelIds.length || hotels.some((h) => h.legal_entity_id !== legalEntityId)) throw bad("hotels_not_in_entity");
  // No hotel may have two live profiles for the same period: close the current assignment first.
  const id = randomId(), at = now_();
  const statements: SqlStatement[] = [
    { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, params: [id, legalEntityId, name, validFrom, at, at] },
  ];
  for (const hid of hotelIds) {
    statements.push({ sql: `UPDATE settlement_profile_hotels SET valid_to = ? WHERE hotel_id = ? AND (valid_to IS NULL OR valid_to > ?)`, params: [validFrom, hid, validFrom] });
    statements.push({ sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES (?, ?, ?)`, params: [id, hid, validFrom] });
  }
  statements.push(audit(input.by, "profile.create", "settlement_profile", id, null, { name, hotelIds, validFrom }));
  await db.batch(statements);
  return { id };
}

export async function partnerList(db: SqlDb) {
  const [entities, hotels, profiles, assignments, counts] = await Promise.all([
    db.all<{ id: string; name: string; registration_status: string; registration_number: string | null }>(`SELECT id, name, registration_status, registration_number FROM partner_legal_entities ORDER BY name`),
    db.all<{ id: string; legal_entity_id: string; public_id: string; name: string; status: string; brochure_url: string | null }>(`SELECT id, legal_entity_id, public_id, name, status, brochure_url FROM hotels ORDER BY name`),
    db.all<{ id: string; legal_entity_id: string; name: string; valid_from: string; valid_to: string | null; min_payout_jpy: number }>(`SELECT id, legal_entity_id, name, valid_from, valid_to, min_payout_jpy FROM settlement_profiles ORDER BY name`),
    db.all<{ profile_id: string; hotel_id: string; valid_from: string; valid_to: string | null }>(`SELECT profile_id, hotel_id, valid_from, valid_to FROM settlement_profile_hotels`),
    db.all<{ hotel_id: string; n: number }>(`SELECT hotel_id, COUNT(*) AS n FROM reservation_referrals WHERE status != 'removed' GROUP BY hotel_id`),
  ]);
  const byHotel = new Map(counts.map((c) => [c.hotel_id, Number(c.n)]));
  const today = jstDate();
  return {
    entities,
    hotels: hotels.map((h) => ({ ...h, referrals: byHotel.get(h.id) ?? 0, profileId: assignments.find((a) => a.hotel_id === h.id && a.valid_from <= today && (!a.valid_to || a.valid_to > today))?.profile_id ?? null })),
    profiles: profiles.map((p) => ({ ...p, hotelIds: assignments.filter((a) => a.profile_id === p.id && (!a.valid_to || a.valid_to > today)).map((a) => a.hotel_id) })),
  };
}

export async function hotelDetail(db: SqlDb, hotelId: string) {
  const hotel = await db.first<{ id: string; legal_entity_id: string; public_id: string; name: string; status: string; brochure_url: string | null; notes: string | null; created_at: string }>(`SELECT id, legal_entity_id, public_id, name, status, brochure_url, notes, created_at FROM hotels WHERE id = ?`, [hotelId]);
  if (!hotel) throw notFound();
  const [entity, members, links, profiles] = await Promise.all([
    db.first<{ id: string; name: string; registration_status: string; registration_number: string | null; address: string | null }>(`SELECT id, name, registration_status, registration_number, address FROM partner_legal_entities WHERE id = ?`, [hotel.legal_entity_id]),
    db.all<{ membership_id: string; user_id: string; email: string; name: string | null; role: string; user_status: string; last_login_at: string | null }>(
      `SELECT m.id AS membership_id, u.id AS user_id, u.email, u.name, m.role, u.status AS user_status, u.last_login_at FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.scope_type = 'hotel' AND m.scope_id = ? AND m.revoked_at IS NULL ORDER BY u.email`, [hotelId]),
    db.all<{ id: string; token: string; experience_slug: string | null; medium: string; kind: string; label: string | null; status: string; created_at: string; target_path: string }>(`SELECT id, token, experience_slug, medium, kind, label, status, created_at, target_path FROM referral_links WHERE hotel_id = ? ORDER BY created_at DESC`, [hotelId]),
    db.all<{ id: string; name: string; valid_from: string; valid_to: string | null }>(`SELECT p.id, p.name, ph.valid_from, ph.valid_to FROM settlement_profile_hotels ph JOIN settlement_profiles p ON p.id = ph.profile_id WHERE ph.hotel_id = ? ORDER BY ph.valid_from DESC`, [hotelId]),
  ]);
  const accessCounts = await db.all<{ link_id: string; n: number }>(`SELECT link_id, COUNT(*) AS n FROM referral_events WHERE hotel_id = ? AND excluded = 0 GROUP BY link_id`, [hotelId]);
  const byLink = new Map(accessCounts.map((c) => [c.link_id, Number(c.n)]));
  return { hotel, entity, members, links: links.map((l) => ({ ...l, accesses: byLink.get(l.id) ?? 0 })), profiles };
}

// ---- policies --------------------------------------------------------------

export async function policyList(db: SqlDb) {
  const rows = await db.all<{ id: string; experience_slug: string; rate_bp: number; tax_rate_bp: number; unit_price_excl_tax_jpy: number | null; reference_avg_jpy: number | null; reference_note: string | null; referral_enabled: number; valid_from: string; version: number; created_at: string; created_by: string | null }>(
    `SELECT * FROM experience_referral_policies ORDER BY experience_slug, valid_from DESC, version DESC`);
  const titles = new Map(catalogFor("ja").experiences.map((x) => [x.slug, { title: x.title, status: x.status ?? "live", price: x.price }]));
  const experiences = catalogFor("ja").experiences.filter((x) => x.status === "live").map((x) => ({ slug: x.slug, title: x.title, price: x.price, priceUnit: x.priceUnit ?? "person" }));
  return { experiences, policies: rows.map((r) => ({ ...r, title: titles.get(r.experience_slug)?.title ?? r.experience_slug })) };
}

export async function createPolicy(db: SqlDb, input: { experienceSlug: unknown; rateBp: unknown; taxRateBp?: unknown; unitPriceExclTax?: unknown; referenceAvg?: unknown; referenceNote?: unknown; enabled?: unknown; validFrom?: unknown; by: string }) {
  const slug = str(input.experienceSlug, 80);
  if (!catalogFor("en").experiences.some((x) => x.slug === slug)) throw bad("unknown_experience");
  const rate = int(input.rateBp), tax = int(input.taxRateBp) ?? 1000;
  if (rate === null || rate < 0 || rate > 10000) throw bad("bad_rate");
  if (tax < 0 || tax > 10000) throw bad("bad_tax_rate");
  const validFrom = typeof input.validFrom === "string" && !Number.isNaN(Date.parse(input.validFrom)) ? new Date(input.validFrom).toISOString() : now_();
  const prev = await db.first<{ v: number | null }>(`SELECT MAX(version) AS v FROM experience_referral_policies WHERE experience_slug = ?`, [slug]);
  const id = randomId(), version = Number(prev?.v ?? 0) + 1, at = now_();
  await db.batch([
    { sql: `INSERT INTO experience_referral_policies (id, experience_slug, rate_bp, tax_rate_bp, price_basis, unit_price_excl_tax_jpy, reference_avg_jpy, reference_note, referral_enabled, valid_from, version, created_by, created_at) VALUES (?, ?, ?, ?, 'tax_inclusive', ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [id, slug, rate, tax, int(input.unitPriceExclTax), int(input.referenceAvg), str(input.referenceNote, 400) || null, input.enabled === false ? 0 : 1, validFrom, version, input.by, at] },
    audit(input.by, "policy.create", "policy", id, null, { slug, rate, tax, validFrom, version, enabled: input.enabled !== false }),
  ]);
  return { id, version };
}

// ---- reservations ----------------------------------------------------------

export interface OpsReservationFilters { from?: string; to?: string; hotel?: string; status?: string; q?: string; exception?: string; limit?: number; offset?: number }

export async function reservationList(db: SqlDb, f: OpsReservationFilters) {
  const where: string[] = ["1=1"], params: unknown[] = [];
  if (f.from && f.to) { const b = periodBounds(f.from, f.to); where.push("r.created_at >= ?", "r.created_at < ?"); params.push(b.start, b.end); }
  if (f.hotel) { where.push("rr.hotel_id = ?"); params.push(f.hotel); }
  if (f.status) { where.push("r.status = ?"); params.push(f.status); }
  if (f.q) { where.push("(r.hotel_ref = ? OR r.external_ref = ? OR r.request_id = ?)"); params.push(f.q.toUpperCase(), f.q, f.q.toLowerCase()); }
  const w = where.join(" AND ");
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 500), offset = Math.max(f.offset ?? 0, 0);
  const titles = new Map(catalogFor("ja").experiences.map((x) => [x.slug, x.title]));
  const rows = await db.all<Record<string, unknown>>(
    `SELECT r.id, r.hotel_ref, r.external_ref, r.flow, r.experience_slug, r.experience_date, r.guests, r.status, r.payment_status, r.amount_status, r.created_at,
            rr.hotel_id, rr.status AS referral_status, h.name AS hotel_name, e.status AS entry_status, e.hold_reason, e.commission_net_jpy, e.base_net_jpy, e.rate_bp
       FROM reservations r LEFT JOIN reservation_referrals rr ON rr.reservation_id = r.id LEFT JOIN hotels h ON h.id = rr.hotel_id LEFT JOIN commission_entries e ON e.reservation_id = r.id
      WHERE ${w} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return rows.map((r) => ({ ...r, experience: titles.get(String(r.experience_slug)) ?? r.experience_slug, statusJa: RESERVATION_STATUS_JA[String(r.status)] ?? r.status, paymentJa: PAYMENT_STATUS_JA[String(r.payment_status)] ?? r.payment_status, entryJa: r.entry_status ? ENTRY_STATUS_JA[String(r.entry_status)] : "—", holdJa: r.hold_reason ? String(r.hold_reason).split(",").map((h) => HOLD_JA[h] ?? h).join("、") : null }));
}

export async function reservationDetail(db: SqlDb, id: string) {
  const r = await db.first<Record<string, unknown>>(`SELECT * FROM reservations WHERE id = ?`, [id]);
  if (!r) throw notFound();
  const [lines, referral, entry, payments, refunds, disputes, attendance, adjustments, logs, hotels] = await Promise.all([
    db.all(`SELECT * FROM reservation_lines WHERE reservation_id = ? ORDER BY position`, [id]),
    db.first<Record<string, unknown>>(`SELECT rr.*, h.name AS hotel_name, h.public_id FROM reservation_referrals rr LEFT JOIN hotels h ON h.id = rr.hotel_id WHERE rr.reservation_id = ?`, [id]),
    db.first<Record<string, unknown>>(`SELECT * FROM commission_entries WHERE reservation_id = ?`, [id]),
    db.all(`SELECT * FROM payments WHERE reservation_id = ? ORDER BY occurred_at`, [id]),
    db.all(`SELECT * FROM refunds WHERE reservation_id = ? ORDER BY occurred_at`, [id]),
    db.all(`SELECT * FROM disputes WHERE reservation_id = ? ORDER BY opened_at`, [id]),
    db.first(`SELECT * FROM attendances WHERE reservation_id = ?`, [id]),
    db.all(`SELECT a.* FROM commission_adjustments a JOIN commission_entries e ON e.id = a.entry_id WHERE e.reservation_id = ? ORDER BY a.created_at`, [id]),
    db.all(`SELECT * FROM audit_logs WHERE target_type = 'reservation' AND target_id = ? ORDER BY at DESC LIMIT 50`, [id]),
    db.all<{ id: string; name: string; public_id: string }>(`SELECT id, name, public_id FROM hotels WHERE status = 'active' ORDER BY name`),
  ]);
  const title = catalogFor("ja").experiences.find((x) => x.slug === r.experience_slug)?.title ?? r.experience_slug;
  return { reservation: { ...r, experience: title, statusJa: RESERVATION_STATUS_JA[String(r.status)], paymentJa: PAYMENT_STATUS_JA[String(r.payment_status)] }, lines, referral, entry: entry ? { ...entry, statusJa: ENTRY_STATUS_JA[String(entry.status)], holdJa: entry.hold_reason ? String(entry.hold_reason).split(",").map((h) => HOLD_JA[h] ?? h).join("、") : null } : null, payments, refunds, disputes, attendance, adjustments, logs, hotels };
}

export async function markAttendance(db: SqlDb, id: string, input: { performedAt: unknown; note?: unknown; by: string }) {
  const performedAt = typeof input.performedAt === "string" && !Number.isNaN(Date.parse(input.performedAt)) ? new Date(input.performedAt).toISOString() : null;
  if (!performedAt) throw bad("bad_datetime");
  if (!(await db.first(`SELECT id FROM reservations WHERE id = ?`, [id]))) throw notFound();
  return confirmAttendance(db, id, { performedAt, by: input.by, note: str(input.note, 500) || undefined });
}

export async function setOutcome(db: SqlDb, id: string, input: { outcome: unknown; reason: unknown; by: string }) {
  const outcome = str(input.outcome, 20), reason = str(input.reason, 500);
  if (!reason) throw bad("reason_required");
  if (!(await db.first(`SELECT id FROM reservations WHERE id = ?`, [id]))) throw notFound();
  if (outcome === "cancelled" || outcome === "no_show") return setReservationOutcome(db, id, outcome, input.by, reason);
  if (outcome === "confirmed" || outcome === "arranging" || outcome === "provisional") {
    const at = now_();
    await db.batch([
      { sql: `UPDATE reservations SET status = ?, updated_at = ? WHERE id = ? AND status NOT IN ('completed')`, params: [outcome, at, id] },
      audit(input.by, `reservation.${outcome}`, "reservation", id, reason),
    ]);
    return recomputeCommission(db, id, input.by);
  }
  throw bad("bad_outcome");
}

/** Change (or remove) the attributed hotel, with a reason. Keeps the previous hotel and the actor (要件 7). */
export async function correctReferral(db: SqlDb, id: string, input: { hotelId: unknown; reason: unknown; by: string }, now = Date.now()) {
  const reason = str(input.reason, 500);
  if (!reason) throw bad("reason_required");
  const r = await db.first<{ id: string; experience_slug: string; created_at: string }>(`SELECT id, experience_slug, created_at FROM reservations WHERE id = ?`, [id]);
  if (!r) throw notFound();
  const hotelId = input.hotelId === null || input.hotelId === "" ? null : str(input.hotelId, 64);
  if (hotelId && !(await db.first(`SELECT id FROM hotels WHERE id = ?`, [hotelId]))) throw bad("unknown_hotel");
  const existing = await db.first<{ hotel_id: string | null; status: string }>(`SELECT hotel_id, status FROM reservation_referrals WHERE reservation_id = ?`, [id]);
  const entry = await db.first<{ id: string; status: string }>(`SELECT id, status FROM commission_entries WHERE reservation_id = ?`, [id]);
  if (entry && ["confirmed", "adjusted"].includes(entry.status) && entry) {
    // Settled or confirmed amounts are reversed and re-created rather than moved silently (要件 7).
    const paidOut = await db.first<{ statement_id: string | null }>(`SELECT statement_id FROM commission_entries WHERE id = ?`, [entry.id]);
    if (paidOut?.statement_id) throw bad("already_settled", "精算済みの紹介料は差分台帳で処理します（段階4）");
  }
  const at = new Date(now).toISOString();
  const policy = await policyFor(db, r.experience_slug, Date.parse(r.created_at));
  const status = hotelId === null ? "removed" : policy ? "corrected" : "rate_missing";
  const statements: SqlStatement[] = [];
  if (existing) {
    statements.push({ sql: `UPDATE reservation_referrals SET previous_hotel_id = hotel_id, hotel_id = ?, basis = 'manual', status = ?, policy_id = COALESCE(policy_id, ?), policy_version = COALESCE(policy_version, ?), rate_bp = COALESCE(rate_bp, ?), correction_reason = ?, corrected_by = ?, corrected_at = ? WHERE reservation_id = ?`,
      params: [hotelId, status, policy?.id ?? null, policy?.version ?? null, policy?.rate_bp ?? null, reason, input.by, at, id] });
  } else if (hotelId) {
    statements.push({ sql: `INSERT INTO reservation_referrals (reservation_id, hotel_id, link_id, session_id, medium, basis, fixed_at, policy_id, policy_version, rate_bp, status, correction_reason, corrected_by, corrected_at) VALUES (?, ?, NULL, NULL, NULL, 'manual', ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [id, hotelId, at, policy?.id ?? null, policy?.version ?? null, policy?.rate_bp ?? null, status, reason, input.by, at] });
  } else return reservationDetail(db, id);
  if (entry) statements.push({ sql: `UPDATE commission_entries SET hotel_id = ?, settlement_profile_id = NULL, updated_at = ? WHERE id = ?`, params: [hotelId, at, entry.id] });
  else statements.push({ sql: `INSERT INTO commission_entries (id, reservation_id, hotel_id, settlement_profile_id, rate_bp, base_net_jpy, commission_net_jpy, tax_rate_bp, status, hold_reason, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, 0, 0, ?, 'estimated', NULL, ?, ?)`, params: [randomId(), id, hotelId, policy?.rate_bp ?? null, policy?.tax_rate_bp ?? 1000, at, at] });
  statements.push(audit(input.by, "referral.correct", "reservation", id, reason, { from: existing?.hotel_id ?? null, to: hotelId }, at));
  await db.batch(statements);
  await recomputeCommission(db, id, input.by, now);
  return reservationDetail(db, id);
}

/** Enter or replace the chargeable lines of a booking whose amount the site could not state. */
export async function setLines(db: SqlDb, id: string, input: { lines: unknown; reason: unknown; by: string }) {
  const reason = str(input.reason, 500);
  if (!reason) throw bad("reason_required");
  if (!(await db.first(`SELECT id FROM reservations WHERE id = ?`, [id]))) throw notFound();
  const raw = Array.isArray(input.lines) ? input.lines : [];
  const lines = raw.map((l) => {
    const o = (l && typeof l === "object" ? l : {}) as Record<string, unknown>;
    const kind = str(o.kind, 20), gross = int(o.grossJpy), tax = int(o.taxRateBp) ?? 1000, discount = int(o.discountJpy) ?? 0;
    if (!["base", "addon", "arrangement", "onsite"].includes(kind) || gross === null || gross < 0 || discount < 0) throw bad("bad_line");
    return { kind, description: str(o.description, 200) || kind, commissionable: o.commissionable === true, taxRateBp: tax, quantity: int(o.quantity) ?? 1, gross, discount };
  });
  if (!lines.length) throw bad("lines_required");
  const at = now_();
  const statements: SqlStatement[] = [{ sql: `DELETE FROM reservation_lines WHERE reservation_id = ?`, params: [id] }];
  lines.forEach((l, i) => statements.push({
    sql: `INSERT INTO reservation_lines (id, reservation_id, position, kind, description, commissionable, tax_rate_bp, quantity, gross_jpy, discount_jpy, refunded_gross_jpy, net_jpy, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'manual')`,
    params: [randomId(), id, i, l.kind, l.description, l.commissionable ? 1 : 0, l.taxRateBp, l.quantity, l.gross, l.discount, netFromGross(l.gross - l.discount, l.taxRateBp)],
  }));
  statements.push({ sql: `UPDATE reservations SET amount_status = 'known', updated_at = ? WHERE id = ?`, params: [at, id] });
  statements.push(audit(input.by, "reservation.lines", "reservation", id, reason, lines, at));
  await db.batch(statements);
  await recomputeCommission(db, id, input.by);
  return reservationDetail(db, id);
}

/** A payment the site did not see through Stripe (the golf Payment Links carry no reference). */
export async function recordManualPayment(db: SqlDb, id: string, input: { amountJpy: unknown; occurredAt?: unknown; reference?: unknown; reason: unknown; by: string }) {
  const amount = int(input.amountJpy), reason = str(input.reason, 500);
  if (amount === null || amount <= 0) throw bad("bad_amount");
  if (!reason) throw bad("reason_required");
  if (!(await db.first(`SELECT id FROM reservations WHERE id = ?`, [id]))) throw notFound();
  const occurredAt = typeof input.occurredAt === "string" && !Number.isNaN(Date.parse(input.occurredAt)) ? new Date(input.occurredAt).toISOString() : now_();
  const ref = str(input.reference, 120) || null;
  await applyPayment(db, id, { eventId: `manual:${randomId()}`, clientReferenceId: ref, amountTotal: amount, amountSubtotal: amount, paymentStatus: "paid", livemode: true, occurredAt });
  await db.run(audit(input.by, "payment.manual", "reservation", id, reason, { amount, reference: ref, occurredAt }).sql, audit(input.by, "payment.manual", "reservation", id, reason, { amount, reference: ref, occurredAt }).params as unknown[]);
  return reservationDetail(db, id);
}

/** Operations say which lines a refund belongs to (要件 8.4). */
export async function allocateRefundManually(db: SqlDb, id: string, input: { refundId: unknown; allocations: unknown; reason: unknown; by: string }) {
  const refundId = str(input.refundId, 64), reason = str(input.reason, 500);
  if (!reason) throw bad("reason_required");
  const refund = await db.first<{ id: string; amount_delta_jpy: number; allocation_status: string }>(`SELECT id, amount_delta_jpy, allocation_status FROM refunds WHERE id = ? AND reservation_id = ?`, [refundId, id]);
  if (!refund) throw notFound();
  if (refund.allocation_status !== "pending") throw bad("already_allocated");
  const raw = Array.isArray(input.allocations) ? input.allocations : [];
  const allocations = raw.map((a) => { const o = (a && typeof a === "object" ? a : {}) as Record<string, unknown>; const amount = int(o.amountJpy); if (!str(o.lineId, 64) || amount === null || amount < 0) throw bad("bad_allocation"); return { lineId: str(o.lineId, 64), amount }; });
  if (allocations.reduce((s, a) => s + a.amount, 0) !== refund.amount_delta_jpy) throw bad("allocation_total_mismatch");
  const lines = await db.all<{ id: string; gross_jpy: number; discount_jpy: number; refunded_gross_jpy: number }>(`SELECT id, gross_jpy, discount_jpy, refunded_gross_jpy FROM reservation_lines WHERE reservation_id = ?`, [id]);
  const at = now_();
  const statements: SqlStatement[] = [];
  for (const a of allocations) {
    const l = lines.find((x) => x.id === a.lineId);
    if (!l) throw bad("unknown_line");
    if (l.refunded_gross_jpy + a.amount > l.gross_jpy - l.discount_jpy) throw bad("over_refund");
    statements.push({ sql: `UPDATE reservation_lines SET refunded_gross_jpy = refunded_gross_jpy + ? WHERE id = ?`, params: [a.amount, a.lineId] });
  }
  statements.push({ sql: `UPDATE refunds SET allocation_status = 'allocated', allocated_by = ?, allocated_at = ? WHERE id = ?`, params: [input.by, at, refundId] });
  statements.push(audit(input.by, "refund.allocate", "reservation", id, reason, allocations, at));
  await db.batch(statements);
  const charged = lines.reduce((s, l) => s + l.gross_jpy - l.discount_jpy, 0), refunded = lines.reduce((s, l) => s + l.refunded_gross_jpy, 0) + refund.amount_delta_jpy;
  await db.run(`UPDATE reservations SET payment_status = ?, updated_at = ? WHERE id = ?`, [refunded >= charged ? "refunded" : "partially_refunded", at, id]);
  await recomputeCommission(db, id, input.by);
  return reservationDetail(db, id);
}

// Keep the automatic allocator reachable for the API (single-line refunds).
export { allocateRefund };

// ---- exceptions and export -------------------------------------------------

export async function exceptions(db: SqlDb, now = Date.now()) {
  const today = jstDate(now);
  const titles = new Map(catalogFor("ja").experiences.map((x) => [x.slug, x.title]));
  const q = (sql: string, params: unknown[] = []) => db.all<Record<string, unknown>>(sql, params);
  const base = `SELECT r.id, r.hotel_ref, r.experience_slug, r.experience_date, r.status, r.payment_status, r.amount_status, r.created_at, h.name AS hotel_name, e.hold_reason, e.status AS entry_status
                  FROM reservations r LEFT JOIN reservation_referrals rr ON rr.reservation_id = r.id LEFT JOIN hotels h ON h.id = rr.hotel_id LEFT JOIN commission_entries e ON e.reservation_id = r.id`;
  const [rateMissing, payeeMissing, amountPending, awaitingAttendance, refundAllocation, disputes, unmatched] = await Promise.all([
    q(`${base} WHERE rr.status = 'rate_missing' AND r.status NOT IN ('cancelled','no_show') ORDER BY r.created_at DESC LIMIT 200`),
    q(`${base} WHERE rr.status = 'payee_missing' AND r.status NOT IN ('cancelled','no_show') ORDER BY r.created_at DESC LIMIT 200`),
    q(`${base} WHERE r.amount_status = 'pending' AND rr.reservation_id IS NOT NULL AND r.status NOT IN ('cancelled','no_show') ORDER BY r.created_at DESC LIMIT 200`),
    q(`${base} WHERE rr.reservation_id IS NOT NULL AND r.experience_date IS NOT NULL AND r.experience_date < ? AND r.status NOT IN ('completed','cancelled','no_show') AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.reservation_id = r.id AND a.revoked_at IS NULL) ORDER BY r.experience_date LIMIT 200`, [today]),
    q(`${base} WHERE EXISTS (SELECT 1 FROM refunds f WHERE f.reservation_id = r.id AND f.allocation_status = 'pending') ORDER BY r.created_at DESC LIMIT 200`),
    q(`${base} WHERE EXISTS (SELECT 1 FROM disputes d WHERE d.reservation_id = r.id AND d.closed_at IS NULL) ORDER BY r.created_at DESC LIMIT 200`),
    db.all<Record<string, unknown>>(`SELECT provider, event_id, event_type, occurred_at, status, note FROM integration_events WHERE status = 'error' OR note LIKE '%not seen yet%' OR note = 'no reservation for session' ORDER BY received_at DESC LIMIT 100`),
  ]);
  const decorate = (rows: Record<string, unknown>[]) => rows.map((r) => ({ ...r, experience: titles.get(String(r.experience_slug)) ?? r.experience_slug }));
  return { rateMissing: decorate(rateMissing), payeeMissing: decorate(payeeMissing), amountPending: decorate(amountPending), awaitingAttendance: decorate(awaitingAttendance), refundAllocation: decorate(refundAllocation), disputes: decorate(disputes), unmatched };
}

export async function overview(db: SqlDb, now = Date.now()) {
  const ex = await exceptions(db, now);
  const [hotels, entries, recent] = await Promise.all([
    db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM hotels WHERE status = 'active'`),
    db.all<{ status: string; n: number; net: number | null }>(`SELECT status, COUNT(*) AS n, SUM(commission_net_jpy) AS net FROM commission_entries GROUP BY status`),
    reservationList(db, { limit: 10 }),
  ]);
  return {
    activeHotels: Number(hotels?.n ?? 0),
    entries: Object.fromEntries(entries.map((e) => [e.status, { count: Number(e.n), net: Number(e.net ?? 0) }])),
    exceptions: Object.fromEntries(Object.entries(ex).map(([k, v]) => [k, (v as unknown[]).length])),
    recent,
  };
}

export async function auditList(db: SqlDb, f: { limit?: number; offset?: number; targetType?: string; q?: string }) {
  const where: string[] = ["1=1"], params: unknown[] = [];
  if (f.targetType) { where.push("target_type = ?"); params.push(f.targetType); }
  if (f.q) { where.push("(target_id = ? OR actor = ? OR action LIKE ?)"); params.push(f.q, f.q.toLowerCase(), `%${f.q}%`); }
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 500), offset = Math.max(f.offset ?? 0, 0);
  return db.all(`SELECT * FROM audit_logs WHERE ${where.join(" AND ")} ORDER BY at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
}

/** Commission ledger CSV for a period of booking creation (or of performance when `basis = performed`). */
export async function exportCsv(db: SqlDb, f: { from: string; to: string; basis?: string }): Promise<string> {
  const titles = new Map(catalogFor("ja").experiences.map((x) => [x.slug, x.title]));
  const byPerformed = f.basis === "performed";
  const b = periodBounds(f.from, f.to);
  const rows = await db.all<Record<string, unknown>>(
    `SELECT r.hotel_ref, r.external_ref, r.created_at, r.experience_slug, r.experience_date, r.guests, r.status, r.payment_status, r.amount_status,
            h.public_id AS hotel_public_id, h.name AS hotel_name, rr.medium, rr.basis, rr.status AS referral_status,
            e.base_net_jpy, e.rate_bp, e.commission_net_jpy, e.status AS entry_status, e.hold_reason, e.performed_on_jst, e.confirmed_at, e.settlement_profile_id
       FROM reservations r JOIN reservation_referrals rr ON rr.reservation_id = r.id LEFT JOIN hotels h ON h.id = rr.hotel_id LEFT JOIN commission_entries e ON e.reservation_id = r.id
      WHERE ${byPerformed ? "e.performed_on_jst >= ? AND e.performed_on_jst <= ?" : "r.created_at >= ? AND r.created_at < ?"} ORDER BY r.created_at`,
    byPerformed ? [f.from, f.to] : [b.start, b.end]);
  const header = ["照合番号", "外部参照", "予約日時(UTC)", "体験", "体験日", "人数", "予約状況", "決済状況", "金額確定", "施設ID", "施設名", "媒体", "帰属根拠", "帰属状態", "税抜対象額", "料率(bp)", "税抜紹介料", "税込参考", "紹介料状態", "保留理由", "実施日(JST)", "確定日時", "精算設定ID"];
  return toCsv(header, rows.map((r) => {
    const net = r.commission_net_jpy === null || r.commission_net_jpy === undefined ? null : Number(r.commission_net_jpy);
    return [String(r.hotel_ref ?? ""), String(r.external_ref ?? ""), String(r.created_at), titles.get(String(r.experience_slug)) ?? String(r.experience_slug), String(r.experience_date ?? ""), r.guests as number | null, RESERVATION_STATUS_JA[String(r.status)] ?? String(r.status), PAYMENT_STATUS_JA[String(r.payment_status)] ?? String(r.payment_status), String(r.amount_status), String(r.hotel_public_id ?? ""), String(r.hotel_name ?? ""), String(r.medium ?? ""), String(r.basis ?? ""), String(r.referral_status ?? ""), r.base_net_jpy as number | null, r.rate_bp as number | null, net, net === null ? null : net + taxOnTotal(net, 1000), r.entry_status ? ENTRY_STATUS_JA[String(r.entry_status)] ?? String(r.entry_status) : "", r.hold_reason ? String(r.hold_reason).split(",").map((h) => HOLD_JA[h] ?? h).join("、") : "", String(r.performed_on_jst ?? ""), String(r.confirmed_at ?? ""), String(r.settlement_profile_id ?? "")];
  }));
}

export async function settingsGet(db: SqlDb) {
  const rows = await db.all<{ key: string; value: string; updated_at: string }>(`SELECT key, value, updated_at FROM portal_settings`);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
export async function settingsSet(db: SqlDb, input: { values: unknown; by: string }) {
  const values = input.values && typeof input.values === "object" ? input.values as Record<string, unknown> : {};
  const allowed = ["public_origin", "visit_window_minutes", "min_payout_jpy", "settlement_note"];
  const at = now_();
  const statements: SqlStatement[] = [];
  for (const [k, v] of Object.entries(values)) {
    if (!allowed.includes(k)) throw bad("unknown_setting", k);
    statements.push({ sql: `INSERT INTO portal_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`, params: [k, str(v, 500), at, input.by] });
  }
  statements.push(audit(input.by, "settings.update", "settings", "portal", null, values, at));
  await db.batch(statements);
}
