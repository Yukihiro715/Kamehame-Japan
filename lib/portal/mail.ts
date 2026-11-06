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

// ---- the booking relay (docs/PARTNER_PLATFORM_STAGE1.md 4.5, E-8) -----------

const SIGN = "KAMEHAME JAPAN（株式会社プロセント）";
/** To operations: a partner opened a case. */
export const caseCreatedMail = (p: { publicRef: string; siteName: string; experienceTitle: string; preferredDate: string | null; guests: number | null; url: string }) => ({
  subject: `【取り次ぎ】新しい案件 ${p.publicRef}（${p.siteName}）`,
  text: [`${p.siteName} から取り次ぎ案件が登録されました。`, "", `案件: ${p.publicRef}`, `体験: ${p.experienceTitle}`, `希望日: ${p.preferredDate ?? "未定"}　人数: ${p.guests ?? "未定"}`, "", p.url, "", SIGN].join("\n"),
});
/** To the partner: operations shared a quote; the customer link is on the case page. */
export const quoteSharedMail = (p: { publicRef: string; experienceTitle: string; totalJpy: number; validUntil: string | null; paymentMode: string; url: string }) => ({
  subject: `【KAMEHAME JAPAN】見積もりを共有しました ${p.publicRef}`,
  text: [`案件 ${p.publicRef}（${p.experienceTitle}）の見積もりをお客様向けに用意しました。`, "", `総額: ${yenJa(p.totalJpy)}（税込）`, `有効期限: ${p.validUntil ?? "—"}`, `お支払い: ${p.paymentMode}`, "", "案件ページからお客様向け URL をコピーしてお渡しください。", p.url, "", SIGN].join("\n"),
});
/** To the customer, in their language (English otherwise): the quote link. Nothing about the partner or the commission. */
export const quoteCustomerMail = (p: { lang: string; customerName: string; experienceTitle: string; totalJpy: number; validUntil: string | null; url: string }) => p.lang === "ja" ? ({
  subject: `【KAMEHAME JAPAN】お見積もり: ${p.experienceTitle}`,
  text: [`${p.customerName} 様`, "", `${p.experienceTitle} のお見積もりをご用意しました。内容のご確認とお支払いは、以下のページからお進みください。`, "", p.url, "", `総額: ${yenJa(p.totalJpy)}（税込）`, `有効期限: ${p.validUntil ?? "—"}`, "", "ご不明な点はこのメールへの返信でお知らせください。", "", SIGN].join("\n"),
}) : ({
  subject: `Your quote from KAMEHAME JAPAN: ${p.experienceTitle}`,
  text: [`Dear ${p.customerName},`, "", `Your quote for ${p.experienceTitle} is ready. Please review the details and, if you are happy with them, pay from the page below.`, "", p.url, "", `Total: ¥${p.totalJpy.toLocaleString("en-US")} (tax included)`, `Valid until: ${p.validUntil ?? "—"}`, "", "Reply to this e-mail with any question.", "", "KAMEHAME JAPAN (Prosent Inc.)"].join("\n"),
});
/** To the partner and to operations: the customer paid. */
export const casePaidMail = (p: { publicRef: string; experienceTitle: string; totalJpy: number; url: string; forOps: boolean }) => ({
  subject: `【KAMEHAME JAPAN】決済が完了しました ${p.publicRef}`,
  text: [`案件 ${p.publicRef}（${p.experienceTitle}）のお支払い ${yenJa(p.totalJpy)} を確認しました。`, "", p.forOps ? "空き枠を確保し、案件ページで「予約確定」を登録してください。" : "予約確定は運営が空き枠を確保したうえで登録します。確定後にあらためてお知らせします。", "", p.url, "", SIGN].join("\n"),
});
/** To the partner: the booking is confirmed. */
export const caseConfirmedMail = (p: { publicRef: string; experienceTitle: string; date: string | null; url: string }) => ({
  subject: `【KAMEHAME JAPAN】予約が確定しました ${p.publicRef}`,
  text: [`案件 ${p.publicRef}（${p.experienceTitle}${p.date ? `、${p.date}` : ""}）の予約が確定しました。`, "", "集合場所や当日のご案内は案件ページの連絡欄に掲載します。", p.url, "", SIGN].join("\n"),
});
/** To the other side of a case: a new comment or file. */
export const caseMessageMail = (p: { publicRef: string; from: "ops" | "partner"; excerpt: string; attachmentName: string | null; url: string }) => ({
  subject: `【KAMEHAME JAPAN】案件 ${p.publicRef} に${p.from === "ops" ? "運営から" : "パートナーから"}連絡があります`,
  text: [`案件 ${p.publicRef} に新しい連絡があります。`, "", p.excerpt, p.attachmentName ? `添付: ${p.attachmentName}` : "", "", p.url, "", SIGN].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n"),
});
