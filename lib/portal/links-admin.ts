/** Creating and listing referral links, and the QR/URL material a hotel downloads. */
import { catalogFor } from "@/lib/catalog";
import { randomId, type SqlDb } from "@/lib/referral/db";
import { ALLOWED_TARGET, newLinkToken } from "@/lib/referral/links";
import { MEDIUM_JA, bad } from "./util";

export type Medium = "brochure" | "room_tv" | "front" | "web" | "other";
export const MEDIUMS: Medium[] = ["brochure", "room_tv", "front", "web", "other"];

export interface LinkRow { id: string; token: string; hotel_id: string | null; chain_profile_id: string | null; experience_slug: string | null; medium: Medium; kind: "qr" | "url"; target_path: string; label: string | null; status: string; created_at: string }

/** The page a link lands on: an experience page in English, or the English home. */
export function targetFor(experienceSlug: string | null): string {
  if (!experienceSlug) return "/en/";
  const x = catalogFor("en").experiences.find((e) => e.slug === experienceSlug && e.status === "live");
  if (!x) throw bad("unknown_experience");
  return `/en/${x.city}/${x.slug}/`;
}

export interface CreateLinkInput { hotelId: string | null; chainProfileId?: string | null; experienceSlug?: string | null; medium: Medium; kind: "qr" | "url"; label?: string | null; by: string }

export async function createLink(db: SqlDb, input: CreateLinkInput, now = Date.now()): Promise<LinkRow> {
  if (!MEDIUMS.includes(input.medium)) throw bad("bad_medium");
  if (!input.hotelId && !input.chainProfileId) throw bad("hotel_or_profile_required");
  const target = targetFor(input.experienceSlug ?? null);
  if (!ALLOWED_TARGET.test(target)) throw bad("bad_target");
  const at = new Date(now).toISOString();
  const row: LinkRow = { id: randomId(), token: newLinkToken(), hotel_id: input.hotelId, chain_profile_id: input.chainProfileId ?? null, experience_slug: input.experienceSlug ?? null, medium: input.medium, kind: input.kind, target_path: target, label: input.label ?? null, status: "active", created_at: at };
  await db.batch([
    { sql: `INSERT INTO referral_links (id, token, hotel_id, chain_profile_id, experience_slug, medium, kind, target_path, label, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      params: [row.id, row.token, row.hotel_id, row.chain_profile_id, row.experience_slug, row.medium, row.kind, row.target_path, row.label, at, at] },
    { sql: `INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, after_json) VALUES (?, ?, ?, 'link.create', 'referral_link', ?, ?)`, params: [randomId(), at, input.by, row.id, JSON.stringify({ hotelId: row.hotel_id, experience: row.experience_slug, medium: row.medium, kind: row.kind })] },
  ]);
  return row;
}

/** The hotel's own material: one QR link and one URL link per target, created on first request. */
export async function materialLinks(db: SqlDb, hotelId: string, experienceSlug: string | null, by: string): Promise<{ qr: LinkRow; url: LinkRow }> {
  const find = (kind: "qr" | "url") => db.first<LinkRow>(
    `SELECT * FROM referral_links WHERE hotel_id = ? AND experience_slug IS ? AND kind = ? AND status = 'active' AND medium = 'other' ORDER BY created_at LIMIT 1`, [hotelId, experienceSlug, kind]);
  const qr = (await find("qr")) ?? (await createLink(db, { hotelId, experienceSlug, medium: "other", kind: "qr", label: experienceSlug ? "体験別QR" : "全体験一覧QR", by }));
  const url = (await find("url")) ?? (await createLink(db, { hotelId, experienceSlug, medium: "other", kind: "url", label: experienceSlug ? "体験別URL" : "全体験一覧URL", by }));
  return { qr, url };
}

export async function linksOfHotel(db: SqlDb, hotelId: string): Promise<LinkRow[]> {
  return db.all<LinkRow>(`SELECT * FROM referral_links WHERE hotel_id = ? ORDER BY created_at DESC`, [hotelId]);
}

export async function setLinkStatus(db: SqlDb, linkId: string, status: "active" | "paused" | "retired", by: string, now = Date.now()): Promise<boolean> {
  const at = new Date(now).toISOString();
  const r = await db.run(`UPDATE referral_links SET status = ?, updated_at = ? WHERE id = ?`, [status, at, linkId]);
  if (r.changes) await db.run(`INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, after_json) VALUES (?, ?, ?, 'link.status', 'referral_link', ?, ?)`, [randomId(), at, by, linkId, JSON.stringify({ status })]);
  return r.changes > 0;
}

export const publicLinkUrl = (origin: string, token: string) => `${origin}/r/${token}`;
export const mediumJa = (m: string) => MEDIUM_JA[m] ?? m;
