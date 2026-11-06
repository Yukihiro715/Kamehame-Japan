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

const yenJa = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("ja-JP")}円`;
const periodJa = (period: string) => { const [y, q] = period.split("-Q"); return `${y}年 第${q}四半期（${(Number(q) - 1) * 3 + 1}〜${Number(q) * 3}月）`; };

/** A statement was issued: the partner's billing contact sees the totals and the dispute window. */
export const statementIssuedMail = (p: { entityName: string; period: string; grossJpy: number; transferJpy: number; carriedOutJpy: number; payDate: string | null; deadline: string | null; url: string }) => ({
  subject: `【KAMEHAME JAPAN】紹介料のお支払い通知書（${periodJa(p.period)}）`,
  text: [
    `${p.entityName} 御中`,
    "",
    `${periodJa(p.period)}の紹介料のお支払い通知書を発行しました。`,
    "",
    `税込合計: ${yenJa(p.grossJpy)}`,
    p.transferJpy > 0 ? `お振込予定額: ${yenJa(p.transferJpy)}（お振込予定日 ${p.payDate ?? "—"}）` : `今回のお振込はありません（${p.carriedOutJpy >= 0 ? "最低お支払額未満のため次回へ繰越" : "返金による差額を次回で相殺"}: ${yenJa(p.carriedOutJpy)}）`,
    "",
    "内容は次の画面でご確認ください（請求担当者の権限でサインイン）。",
    p.url,
    "",
    `内容に相違がある場合は、${p.deadline ?? "期限"}までに画面の「異議を申し立てる」からお知らせください。期限までにご連絡がない場合は、ご確認いただいたものとして手続きを進めます。`,
    "",
    "KAMEHAME JAPAN（株式会社プロセント）",
  ].join("\n"),
});

export const disputeResolvedMail = (p: { entityName: string; period: string; outcome: "upheld" | "rejected"; resolution: string; url: string }) => ({
  subject: `【KAMEHAME JAPAN】異議申立てへの回答（${periodJa(p.period)}）`,
  text: [
    `${p.entityName} 御中`,
    "",
    `${periodJa(p.period)}の支払通知書への異議申立てについて、次のとおり回答します。`,
    "",
    `結果: ${p.outcome === "upheld" ? "お申し出のとおり訂正します（訂正版の通知書を改めて発行します）" : "原案のとおりとさせていただきます"}`,
    `内容: ${p.resolution}`,
    "",
    p.url,
    "",
    "KAMEHAME JAPAN（株式会社プロセント）",
  ].join("\n"),
});

export const payoutPaidMail = (p: { entityName: string; periods: string[]; transferJpy: number; paidAt: string; reference: string | null; url: string }) => ({
  subject: "【KAMEHAME JAPAN】紹介料のお振込を完了しました",
  text: [
    `${p.entityName} 御中`,
    "",
    `${p.periods.map(periodJa).join("、")}の紹介料 ${yenJa(p.transferJpy)} を ${p.paidAt} にお振込しました。${p.reference ? `（参照番号 ${p.reference}）` : ""}`,
    "",
    p.url,
    "",
    "KAMEHAME JAPAN（株式会社プロセント）",
  ].join("\n"),
});
