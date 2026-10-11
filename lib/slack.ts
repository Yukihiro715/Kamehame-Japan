// New-enquiry alert for the team's Slack channel.
//
// Sent through a Slack Incoming Webhook whose URL is the SLACK_WEBHOOK_URL
// Worker secret (never in the repo). The fields at the top are the glance
// view; below them the alert carries the same Japanese record the mailbox
// gets (every field, the visitor's notes and their translation), so the
// channel is a complete log of enquiries on its own. The channel is internal;
// keep it that way, since notes can hold health information such as allergies.

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

export function slackMessage(e: Enquiry, experienceTitle: string | undefined, delivered: boolean, record?: string) {
  const trade = e.kind === "trade";
  const rows: [string, string | undefined][] = trade
    ? [["会社", e.company], ["国", e.country], ["名前", e.name], ["言語", e.lang]]
    : [
        ["体験", experienceTitle ?? e.experience ?? "一般のお問い合わせ"],
        ["プラン", e.plan],
        ["エリア", e.area],
        ["コース", e.courseMode ? (e.courseMode === "specific" ? `希望コース指定(個別見積もり)${e.course ? ` — ${e.course}` : ""}` : "おすすめコース(標準料金)") : undefined],
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
    ? "返信は hello@ の受信箱から(同じ件名で返信するとお客様側で1本のスレッドになります)。"
    : "⚠️ メール配送に失敗しました。お客様にはフォームでメールアドレスを案内済みです。至急 Cloudflare のログを確認してください。";
  return {
    text: `${title}: ${experienceTitle ?? e.experience ?? e.company ?? ""} — ${e.name}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: title } },
      // Slack allows at most ten fields per section.
      { type: "section", fields: fields.slice(0, 10) },
      ...(record ? [{ type: "divider" }, ...chunks(record).map((t) => ({ type: "section", text: { type: "mrkdwn", text: esc(t) } }))] : []),
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
