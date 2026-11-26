import { randomId, type SqlDb } from "@/lib/referral/db";
import { bad, str } from "./util";
import { experienceTitle, isCaseFileKeyFor } from "./cases";
import { sendPortalMail, type PortalMailEnv } from "./mail";

interface GuideRow {
  case_id: string;
  send_mode: "default" | "auto" | "manual";
  instructions: string | null;
  file_key: string | null;
  token: string | null;
  send_status: string | null;
  sent_at: string | null;
  attempt_at: string | null;
  auto_guest_guide: number;
  customer_email: string | null;
  lang: string | null;
  experience_slug: string | null;
  preferred_date: string | null;
  experience_date: string | null;
  time_pref: string | null;
  status: string | null;
  payment_status: string | null;
  case_status: string;
}
function read(db: SqlDb, id: string, token = false) {
  return db.first<GuideRow>(
    `SELECT g.*,h.auto_guest_guide,c.customer_email,c.lang,c.experience_slug,c.preferred_date,r.experience_date,c.time_pref,
    r.status,r.payment_status,c.status AS case_status FROM case_guest_guides g JOIN partner_cases c ON c.id=g.case_id
    JOIN hotels h ON h.id=c.site_id LEFT JOIN reservations r ON r.id=c.reservation_id WHERE ${token ? "g.token" : "g.case_id"}=?`,
    [id],
  );
}
function canShare(g: GuideRow) {
  return (
    !!g.token &&
    !!(g.instructions || g.file_key) &&
    ["confirmed", "completed"].includes(g.status ?? "") &&
    ["paid", "partially_refunded"].includes(g.payment_status ?? "") &&
    !["cancelled", "unavailable"].includes(g.case_status)
  );
}
export function guideUrl(origin: string, token: string) {
  return `${origin}/api/guest-guide/${token}`;
}
export async function guideSettings(db: SqlDb, id: string, origin: string) {
  const g = await read(db, id);
  const site =
    g ??
    (await db.first<{
      auto_guest_guide: number;
      customer_email: string | null;
    }>(
      "SELECT h.auto_guest_guide,c.customer_email FROM partner_cases c JOIN hotels h ON h.id=c.site_id WHERE c.id=?",
      [id],
    ));
  const share = g && canShare(g);
  return {
    mode: g?.send_mode ?? "default",
    defaultAuto: !!site?.auto_guest_guide,
    instructions: g?.instructions ?? "",
    fileKey: g?.file_key ?? "",
    url: share ? guideUrl(origin, g.token!) : null,
    hasGuestEmail: !!site?.customer_email,
    sentAt: g?.sent_at ?? null,
    outcome: g?.send_status ?? null,
  };
}
export async function saveGuide(
  db: SqlDb,
  id: string,
  input: Record<string, unknown>,
  operator: boolean,
) {
  const mode = input.mode;
  if (
    mode !== undefined &&
    mode !== "default" &&
    mode !== "auto" &&
    mode !== "manual"
  )
    throw bad("bad_guide_mode");
  const key = str(input.fileKey, 500);
  if (operator && input.fileKey !== undefined && key) {
    const message = await db.first(
      "SELECT 1 FROM case_messages WHERE case_id=? AND visibility='customer' AND attachment_key=?",
      [id, key],
    );
    if (!message || !isCaseFileKeyFor(key, id)) throw bad("bad_attachment");
  }
  await db.run(
    `INSERT INTO case_guest_guides(case_id,send_mode,instructions,file_key,token)
    VALUES (?,COALESCE(?,'default'),?,?,?)
    ON CONFLICT(case_id) DO UPDATE SET send_mode=COALESCE(?,send_mode), instructions=CASE WHEN ? THEN excluded.instructions ELSE instructions END,
    file_key=CASE WHEN ? THEN excluded.file_key ELSE file_key END`,
    [
      id,
      mode ?? null,
      operator ? str(input.instructions, 5000) || null : null,
      operator ? key || null : null,
      randomId() + randomId().slice(0, 10),
      mode ?? null,
      operator && input.instructions !== undefined ? 1 : 0,
      operator && input.fileKey !== undefined ? 1 : 0,
    ],
  );
}
export async function publicGuide(db: SqlDb, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const g = await read(db, token, true);
  if (!g || !canShare(g)) return null;
  const en = g.lang !== "ja";
  return {
    title: experienceTitle(g.experience_slug, en ? "en" : "ja"),
    en,
    date: g.experience_date ?? g.preferred_date,
    instructions: g.instructions,
    fileKey: g.file_key,
  };
}
export async function sendGuide(
  db: SqlDb,
  env: PortalMailEnv,
  id: string,
  origin: string,
  manual = false,
) {
  const g = await read(db, id);
  if (!g || !canShare(g) || !g.customer_email || g.sent_at) return null;
  if (
    !manual &&
    (g.send_mode === "manual" ||
      (g.send_mode === "default" && !g.auto_guest_guide))
  )
    return null;
  const now = new Date().toISOString(),
    expired = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const claimed = await db.first(
    `UPDATE case_guest_guides SET attempt_at=?,send_status='sending' WHERE case_id=? AND sent_at IS NULL
    AND (send_status IS NULL OR send_status!='sending' OR attempt_at<?) RETURNING case_id`,
    [now, id, expired],
  );
  if (!claimed) return null;
  const en = g.lang !== "ja",
    title = experienceTitle(g.experience_slug, en ? "en" : "ja");
  const outcome = await sendPortalMail(env, {
    to: g.customer_email,
    subject: en
      ? `[KAMEHAME JAPAN] Your booking guide — ${title}`
      : `【KAMEHAME JAPAN】ご予約のご案内｜${title}`,
    text:
      (en
        ? "Your booking is confirmed. Open your guide for directions and any tickets."
        : "ご予約が確定しました。アクセスやチケットは下記のご案内をご確認ください。") +
      "\n\n" +
      guideUrl(origin, g.token!),
    idempotencyKey: "guest-guide/" + id,
  });
  await db.run(
    "UPDATE case_guest_guides SET send_status=?,sent_at=? WHERE case_id=? AND attempt_at=?",
    [outcome, outcome === "sent" ? now : null, id, now],
  );
  return outcome;
}
