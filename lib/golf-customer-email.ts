import type { Enquiry } from "@/lib/contact";
import { acknowledgement, followUp } from "@/lib/mail-copy";
import { isArrangement, isGolfArea } from "@/lib/golf-prices";
import { escapeEmailHtml, golfEmailHtml } from "@/lib/golf-email-html";
import { isLang } from "@/lib/i18n";

function simpleHtml(text: string, lang: string) {
  return `<!doctype html><html lang="${isLang(lang) ? lang : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fff"><table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="640" style="width:100%;max-width:640px"><tr><td style="padding:28px 24px;font:16px/1.7 Arial,sans-serif;color:#252b28">${text.split("\n\n").map(p => `<p style="margin:0 0 18px">${escapeEmailHtml(p).replace(/\n/g, "<br>")}</p>`).join("")}</td></tr></table></td></tr></table></body></html>`;
}

/** The default Resend route. Package/other-experience messages keep their original
 * text-only payload. The new golf mode adds HTML without changing the text fallback. */
export function golfCustomerEmail(kind: "ack" | "follow-up", e: Enquiry, title?: string): { subject: string; text: string; html?: string } {
  const message = kind === "ack" ? acknowledgement(e, title) : followUp(e, title);
  if (!isArrangement() || e.kind !== "guest" || e.experience !== "mt-fuji-golf-day") return message;
  return { ...message, html: kind === "follow-up" && e.lang === "en" && isGolfArea(e.areaId)
    ? golfEmailHtml(message.text, e.areaId) : simpleHtml(message.text, e.lang) };
}
