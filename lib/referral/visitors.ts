/** Approximate visitors, kept separate from the 30-day referral attribution. */
import { randomId, type SqlDb } from "./db";

export const VISITOR_COOKIE = "kh_visitor";
export const VISITOR_WINDOW_MS = 7 * 86400000;

export async function visitorWindow(db: SqlDb, prior: string | undefined, scope: string, now: number, secure: boolean) {
  const known = prior && /^[A-Za-z0-9_-]{22}$/.test(prior)
    ? await db.first<{ browser_id: string }>(`SELECT browser_id FROM referral_visitor_windows WHERE browser_id = ? LIMIT 1`, [prior]) : null;
  const browserId = known?.browser_id ?? randomId();
  const at = new Date(now).toISOString();
  // Atomic rollover: concurrent returns cannot create two active windows.
  // A return does not extend the window; day 7 starts a new count.
  await db.run(`INSERT INTO referral_visitor_windows (browser_id, scope_id, window_id, started_at, expires_at)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(browser_id, scope_id) DO UPDATE SET
    window_id = excluded.window_id, started_at = excluded.started_at, expires_at = excluded.expires_at
    WHERE referral_visitor_windows.expires_at <= excluded.started_at`,
    [browserId, scope, randomId(), at, new Date(now + VISITOR_WINDOW_MS).toISOString()]);
  const row = await db.first<{ window_id: string }>(`SELECT window_id FROM referral_visitor_windows WHERE browser_id = ? AND scope_id = ?`, [browserId, scope]);
  if (!row) throw new Error("visitor_window_missing");
  return { id: row.window_id, cookie: `${VISITOR_COOKIE}=${browserId}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}` };
}
