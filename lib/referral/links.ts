/** Referral links: the `/r/<token>` arrival, the session cookie and bot classing.
 *
 *  A hotel's QR code or link points at https://kamehame-japan.com/r/<token>.
 *  The Worker resolves the token here, records the arrival, gives a human
 *  visitor a `kh_ref` session cookie and redirects to the link's own page on
 *  this site. The cookie holds only a random session id: every later use looks
 *  the session up again, so the browser cannot claim a hotel it was not sent
 *  by. Nothing about the visitor (IP, user agent, fingerprint) is stored. */
import { nowIso, randomId, type SqlDb } from "./db";

export const REFERRAL_COOKIE = "kh_ref";
export const REFERRAL_TTL_DAYS = 30;
export const REFERRAL_TTL_MS = REFERRAL_TTL_DAYS * 86400000;
export const REFERRAL_PATH = /^\/r\/([A-Za-z0-9_-]{16,64})\/?$/;
/** Where a link may send people: a page of this site, in one of its languages. */
export const ALLOWED_TARGET = /^\/(en|es|ja|fr|zh-tw)(\/[a-z0-9-]+)*\/?$/;
const DEFAULT_TARGET = "/en/";

export type UaClass = "human" | "bot" | "preview" | "test";

const BOT_UA = /bot|crawl|spider|slurp|headlesschrome|lighthouse|pingdom|uptime|monitor|curl\/|wget\/|python-requests|go-http-client|java\/|okhttp/i;
const PREVIEW_UA = /facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|discordbot|telegrambot|whatsapp|line\/|linespider|skypeuripreview|applebot|google-inspectiontool|preview|embedly|iframely|bitlybot|linkedinbot|pinterest/i;

/** How an arrival is classed for counting. `test` is the operator's own check
 *  (`?kh_test=1`), kept but excluded like bots and link previews. */
export function classifyUserAgent(ua: string | null | undefined, testFlag = false): UaClass {
  if (testFlag) return "test";
  const s = ua ?? "";
  if (!s) return "bot";
  if (PREVIEW_UA.test(s)) return "preview";
  if (BOT_UA.test(s)) return "bot";
  return "human";
}

export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

/** The Set-Cookie value for a referral session (or its removal with an empty id). */
export function referralCookie(sessionId: string, secure = true): string {
  const attrs = ["Path=/", "HttpOnly", "SameSite=Lax", secure ? "Secure" : ""].filter(Boolean).join("; ");
  return sessionId
    ? `${REFERRAL_COOKIE}=${encodeURIComponent(sessionId)}; Max-Age=${REFERRAL_TTL_DAYS * 86400}; ${attrs}`
    : `${REFERRAL_COOKIE}=; Max-Age=0; ${attrs}`;
}

export interface ArrivalInput { token: string; userAgent?: string | null; test?: boolean; now?: number; secure?: boolean }
export interface ArrivalResult { redirect: string; setCookie?: string; recorded: boolean; uaClass: UaClass; linkId?: string }

interface LinkRow { id: string; hotel_id: string | null; chain_profile_id: string | null; target_path: string; medium: string; status: string; hotel_status: string | null }

/** Resolve a token, record the arrival and decide the redirect. A missing
 *  token, a retired link or an ended partnership still sends the visitor to the
 *  site (never an error page), just without a referral session (要件 5.4). */
export async function handleReferralArrival(db: SqlDb, input: ArrivalInput): Promise<ArrivalResult> {
  const now = input.now ?? Date.now();
  const uaClass = classifyUserAgent(input.userAgent, input.test);
  const link = await db.first<LinkRow>(
    `SELECT l.id, l.hotel_id, l.chain_profile_id, l.target_path, l.medium, l.status, h.status AS hotel_status
       FROM referral_links l LEFT JOIN hotels h ON h.id = l.hotel_id WHERE l.token = ?`, [input.token]);
  if (!link) return { redirect: DEFAULT_TARGET, recorded: false, uaClass };
  const target = ALLOWED_TARGET.test(link.target_path) ? link.target_path : DEFAULT_TARGET;
  const live = link.status === "active" && (link.hotel_id === null || link.hotel_status === "active");
  const excluded = uaClass !== "human" || !live;
  const at = new Date(now).toISOString();
  const lang = target.match(/^\/(en|es|ja|fr|zh-tw)/)?.[1] ?? null;
  const sessionId = excluded ? null : randomId();
  const statements = [
    { sql: `INSERT INTO referral_events (id, link_id, hotel_id, session_id, at, ua_class, excluded, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [randomId(), link.id, link.hotel_id, sessionId, at, uaClass, excluded ? 1 : 0, lang] },
  ];
  if (sessionId) {
    statements.push({ sql: `INSERT INTO referral_sessions (id, hotel_id, link_id, created_at, last_seen_at, expires_at, revoked) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      params: [sessionId, link.hotel_id, link.id, at, at, new Date(now + REFERRAL_TTL_MS).toISOString()] });
  }
  await db.batch(statements);
  return { redirect: target, recorded: true, uaClass, linkId: link.id, ...(sessionId ? { setCookie: referralCookie(sessionId, input.secure ?? true) } : {}) };
}

export interface ReferralContext { sessionId: string; hotelId: string | null; linkId: string; chainProfileId: string | null; medium: string }

/** The live referral a request carries, from its cookie: the session must
 *  exist, be unexpired and unrevoked, and its link's hotel must still be a
 *  partner. Touches `last_seen_at`; never extends the expiry (要件 3.3). */
export async function activeReferral(db: SqlDb, cookieHeader: string | null | undefined, now = Date.now()): Promise<ReferralContext | null> {
  const id = readCookie(cookieHeader, REFERRAL_COOKIE);
  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) return null;
  const row = await db.first<{ id: string; hotel_id: string | null; link_id: string; expires_at: string; revoked: number; chain_profile_id: string | null; medium: string; link_status: string; hotel_status: string | null }>(
    `SELECT s.id, s.hotel_id, s.link_id, s.expires_at, s.revoked, l.chain_profile_id, l.medium, l.status AS link_status, h.status AS hotel_status
       FROM referral_sessions s JOIN referral_links l ON l.id = s.link_id LEFT JOIN hotels h ON h.id = s.hotel_id WHERE s.id = ?`, [id]);
  if (!row || row.revoked || Date.parse(row.expires_at) <= now) return null;
  if (row.hotel_id !== null && row.hotel_status !== "active") return null;
  await db.run(`UPDATE referral_sessions SET last_seen_at = ? WHERE id = ?`, [nowIso(), id]);
  return { sessionId: row.id, hotelId: row.hotel_id, linkId: row.link_id, chainProfileId: row.chain_profile_id, medium: row.medium };
}

/** A new public token for a link: 22 characters of base64url (128 bits). */
export const newLinkToken = () => randomId();
