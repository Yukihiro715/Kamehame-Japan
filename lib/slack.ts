// New-enquiry alert for the team's Slack channel.
//
// Sent through a Slack Incoming Webhook whose URL is the SLACK_WEBHOOK_URL
// Worker secret (never in the repo). The alert is a heads-up, not the record:
// it carries what staff need to see at a glance — experience, dates, party,
// estimate, first name — but not the guest's email address or free-text notes
// (which can hold health information such as allergies). Those stay in the
// hello@ mailbox, where the reply is written.

import type { Enquiry } from "@/lib/contact";

/** Slack mrkdwn treats &, < and > as markup; escape anything a visitor typed. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function slackMessage(e: Enquiry, experienceTitle: string | undefined, delivered: boolean) {
  const trade = e.kind === "trade";
  const rows: [string, string | undefined][] = trade
    ? [["会社", e.company], ["国", e.country], ["名前", e.name], ["言語", e.lang]]
    : [
        ["体験", experienceTitle ?? e.experience ?? "一般のお問い合わせ"],
        ["プラン", e.plan],
        ["日程", e.dates],
        ["人数", e.party],
        ["通訳", e.interpreter],
        ["概算", e.estimate],
        ["名前", e.name],
        ["言語", e.lang],
      ];
  const fields = rows
    .filter((r): r is [string, string] => !!r[1])
    .map(([k, v]) => ({ type: "mrkdwn", text: `*${k}*\n${esc(v).slice(0, 300)}` }));
  const title = trade ? "🤝 取引先からの問い合わせ" : "🆕 新しい問い合わせ";
  const note = delivered
    ? "メールアドレスと備考は hello@ の受信箱で確認し、そこから返信してください。"
    : "⚠️ メール配送に失敗しました。お客様にはフォームでメールアドレスを案内済みです。至急 Cloudflare のログを確認してください。";
  return {
    text: `${title}: ${experienceTitle ?? e.experience ?? e.company ?? ""} — ${e.name}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: title } },
      // Slack allows at most ten fields per section.
      { type: "section", fields: fields.slice(0, 10) },
      { type: "context", elements: [{ type: "mrkdwn", text: note }] },
    ],
  };
}

/** Post the alert; never throws and never holds the visitor up for long. */
export async function notifySlack(url: string | undefined, payload: unknown): Promise<void> {
  if (!url || !url.startsWith("https://hooks.slack.com/")) return;
  try {
    const res = await Promise.race([
      fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (res && !res.ok) console.error("slack: webhook answered", res.status);
  } catch (err) {
    console.error("slack: webhook failed", err);
  }
}
