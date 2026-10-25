// New-enquiry alert for the team's Slack channel.
//
// Sent through a Slack Incoming Webhook whose URL is the SLACK_WEBHOOK_URL
// Worker secret (never in the repo). The alert is one short Japanese block,
// one line per answer (owner, 2026-10-25); the mailbox copy keeps the full
// record with the automatic replies. The channel is internal; keep it that
// way, since notes can hold health information such as allergies.

import type { Enquiry } from "@/lib/contact";

/** Slack mrkdwn treats &, < and > as markup; escape anything a visitor typed. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Slack allows 3000 characters per section; split the record on line breaks. */
function chunks(text: string, max = 2900): string[] {
  const out: string[] = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if (cur.length + line.length + 1 > max && cur) { out.push(cur); cur = ""; }
    cur = cur ? `${cur}\n${line}` : line;
  }
  if (cur) out.push(cur);
  return out.slice(0, 10);
}

/** One short block: the heading, then one line per answer (lib/notification.ts slackSummary).
 *  A delivery failure is the only footer; the mailbox copy keeps the full record. */
export function slackMessage(e: Enquiry, experienceTitle: string | undefined, delivered: boolean, summary: string) {
  const trade = e.kind === "trade";
  const title = trade ? "🤝 取引先からの問い合わせ" : "🆕 新しい問い合わせ";
  return {
    text: `${title}: ${experienceTitle ?? e.experience ?? e.company ?? ""} — ${e.name}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: title } },
      ...chunks(summary).map((t) => ({ type: "section", text: { type: "mrkdwn", text: esc(t) } })),
      ...(delivered ? [] : [{ type: "context", elements: [{ type: "mrkdwn", text: "⚠️ メール配送に失敗しました。お客様にはフォームでメールアドレスを案内済みです。至急 Cloudflare のログを確認してください。" }] }]),
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
