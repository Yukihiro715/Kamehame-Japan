/** Mail from the portals (sign-in codes, invitations, later statement notices).
 *
 *  Sent through Resend with the existing key. On the staging Worker nothing
 *  leaves unless the recipient is on NOTIFY_ALLOWLIST (addresses or domains,
 *  comma separated), so a test never reaches a real hotel. */
export interface PortalMailEnv { RESEND_API_KEY?: string; KH_ENV?: string; NOTIFY_ALLOWLIST?: string; /** The first operator: this e-mail may sign in as ops_admin while no operator exists yet. */ PORTAL_BOOTSTRAP_ADMIN?: string }

export const PORTAL_MAIL_FROM = "KAMEHAME JAPAN <hello@kamehame-japan.com>";

export type MailOutcome = "sent" | "unconfigured" | "blocked" | "failed";

export function recipientAllowed(env: PortalMailEnv, to: string): boolean {
  if (env.KH_ENV !== "staging") return true;
  const list = (env.NOTIFY_ALLOWLIST ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const email = to.toLowerCase();
  return list.some((entry) => (entry.startsWith("@") ? email.endsWith(entry) : entry === email));
}

export async function sendPortalMail(env: PortalMailEnv, mail: { to: string; subject: string; text: string }, fetchImpl: typeof fetch = fetch): Promise<MailOutcome> {
  if (!env.RESEND_API_KEY) return "unconfigured";
  if (!recipientAllowed(env, mail.to)) return "blocked";
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ from: PORTAL_MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, tags: [{ name: "kind", value: "portal" }] }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export const loginCodeMail = (code: string, kind: "hotel" | "ops") => ({
  subject: `【KAMEHAME JAPAN】${kind === "ops" ? "運営画面" : "ホテル向け画面"}のサインインコード: ${code}`,
  text: [
    `サインインコード: ${code}`,
    "",
    "有効期限は10分です。サインイン画面に戻り、このコードを入力してください。",
    "このメールに心当たりがない場合は、何もせずに破棄してください。コードを他の人に伝えないでください。",
    "",
    "KAMEHAME JAPAN（株式会社プロセント）",
  ].join("\n"),
});

export const inviteMail = (p: { name: string | null; loginUrl: string; scopeLabel: string; roleLabel: string }) => ({
  subject: "【KAMEHAME JAPAN】紹介管理画面へのご招待",
  text: [
    `${p.name ? `${p.name} 様` : "ご担当者様"}`,
    "",
    `KAMEHAME JAPAN の紹介管理画面（${p.scopeLabel}）に、${p.roleLabel}として登録しました。`,
    "",
    "サインインの手順:",
    `1. ${p.loginUrl} を開く`,
    "2. このメールアドレスを入力する",
    "3. 届いた6桁のコードを入力する",
    "",
    "パスワードはありません。毎回メールのコードでサインインします。",
    "ご不明な点は hello@kamehame-japan.com までご連絡ください。",
    "",
    "KAMEHAME JAPAN（株式会社プロセント）",
  ].join("\n"),
});
