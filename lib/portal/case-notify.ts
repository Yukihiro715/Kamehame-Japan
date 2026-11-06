/** Who hears about a case event, and the mail that goes out (E-8). Partners'
 *  recipients are the case's creator and assignee; operations' recipient is
 *  the `ops_notify_email` setting, else CONTACT_TO. Everything goes through
 *  sendPortalMail, so staging never reaches an address off the allow-list. */
import type { SqlDb } from "@/lib/referral/db";
import { experienceTitle, getCase, type CaseRow } from "./cases";
import { caseConfirmedMail, caseCreatedMail, caseMessageMail, casePaidMail, quoteCustomerMail, quoteSharedMail, sendPortalMail, type MailOutcome, type PortalMailEnv } from "./mail";

export type NotifyEnv = PortalMailEnv & { CONTACT_TO?: string };

async function partnerRecipients(db: SqlDb, c: CaseRow): Promise<string[]> {
  const ids = [c.created_by_user_id, c.assignee_user_id].filter((x): x is string => !!x);
  const rows = await db.all<{ email: string }>(`SELECT DISTINCT u.email FROM users u WHERE u.id IN (${ids.map(() => "?").join(",")}) AND u.status != 'disabled'`, ids);
  return rows.map((r) => r.email);
}
async function opsRecipient(db: SqlDb, env: NotifyEnv): Promise<string | null> {
  const row = await db.first<{ value: string }>(`SELECT value FROM portal_settings WHERE key = 'ops_notify_email'`);
  const v = (row?.value ?? env.CONTACT_TO ?? "").trim();
  return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}
const partnerUrl = (origin: string, id: string) => `${origin}/hotel/cases/${id}/`;
const opsUrl = (origin: string, id: string) => `${origin}/ops/cases/${id}/`;

export type CaseEvent =
  | { kind: "created" }
  | { kind: "quote_shared"; totalJpy: number; validUntil: string | null; paymentModeJa: string; shareUrl: string; toCustomer: boolean }
  | { kind: "paid"; totalJpy: number }
  | { kind: "confirmed" }
  | { kind: "message"; from: "ops" | "partner"; excerpt: string; attachmentName: string | null };

export async function notifyCase(db: SqlDb, env: NotifyEnv, caseId: string, origin: string, ev: CaseEvent): Promise<{ to: string; outcome: MailOutcome }[]> {
  const c = await getCase(db, caseId);
  const title = experienceTitle(c.experience_slug);
  const out: { to: string; outcome: MailOutcome }[] = [];
  const send = async (to: string | null, mail: { subject: string; text: string }) => { if (to) out.push({ to, outcome: await sendPortalMail(env, { to, ...mail }) }); };
  const partners = await partnerRecipients(db, c);
  const ops = await opsRecipient(db, env);
  switch (ev.kind) {
    case "created":
      await send(ops, caseCreatedMail({ publicRef: c.public_ref, siteName: (await db.first<{ name: string }>(`SELECT name FROM hotels WHERE id = ?`, [c.site_id]))?.name ?? "", experienceTitle: title, preferredDate: c.preferred_date, guests: c.guests, url: opsUrl(origin, c.id) }));
      break;
    case "quote_shared":
      for (const to of partners) await send(to, quoteSharedMail({ publicRef: c.public_ref, experienceTitle: title, totalJpy: ev.totalJpy, validUntil: ev.validUntil, paymentMode: ev.paymentModeJa, url: partnerUrl(origin, c.id) }));
      if (ev.toCustomer && c.customer_email) await send(c.customer_email, quoteCustomerMail({ lang: c.lang ?? "en", customerName: c.customer_name, experienceTitle: experienceTitle(c.experience_slug, c.lang === "ja" ? "ja" : "en"), totalJpy: ev.totalJpy, validUntil: ev.validUntil, url: ev.shareUrl }));
      break;
    case "paid":
      for (const to of partners) await send(to, casePaidMail({ publicRef: c.public_ref, experienceTitle: title, totalJpy: ev.totalJpy, url: partnerUrl(origin, c.id), forOps: false }));
      await send(ops, casePaidMail({ publicRef: c.public_ref, experienceTitle: title, totalJpy: ev.totalJpy, url: opsUrl(origin, c.id), forOps: true }));
      break;
    case "confirmed":
      for (const to of partners) await send(to, caseConfirmedMail({ publicRef: c.public_ref, experienceTitle: title, date: c.preferred_date, url: partnerUrl(origin, c.id) }));
      break;
    case "message":
      if (ev.from === "ops") for (const to of partners) await send(to, caseMessageMail({ publicRef: c.public_ref, from: "ops", excerpt: ev.excerpt, attachmentName: ev.attachmentName, url: partnerUrl(origin, c.id) }));
      else await send(ops, caseMessageMail({ publicRef: c.public_ref, from: "partner", excerpt: ev.excerpt, attachmentName: ev.attachmentName, url: opsUrl(origin, c.id) }));
      break;
  }
  return out;
}
