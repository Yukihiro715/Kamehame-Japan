import { GOLF_EMAIL_VERSION, golfEmailHtml } from "@/lib/golf-email-html";
import type { Enquiry } from "@/lib/contact";
import { GOLF_MODE, GOLF_PRICE_VERSION, isArrangement, golfPackagePrice, isGolfArea, isGolfGolfers } from "@/lib/golf-prices";
import { acknowledgement, followUp, threadSubject } from "@/lib/mail-copy";

import { packagePaymentTemplate } from "@/lib/golf-package-email";
import { arrangementPaymentTemplate, type ArrangementProposal } from "@/lib/golf-arrangement-email";

export interface GolfAutomationEnv { GOLF_AUTOMATION_URL?: string; GOLF_AUTOMATION_TOKEN?: string }
export const automationConfigured = (env: GolfAutomationEnv) => !isArrangement() && !!env.GOLF_AUTOMATION_URL && !!env.GOLF_AUTOMATION_TOKEN;

/** This endpoint stores the request before acknowledging it, deduplicates by
 * requestId, and owns BOTH delayed messages. Never also schedule the old 15m mail. */
export async function submitGolfAutomation(env: GolfAutomationEnv, e: Enquiry, title: string | undefined, teamText: string, ledger: unknown) {
  if (isArrangement()) throw new Error("Package automation is disabled in arrangement mode");
  if (!env.GOLF_AUTOMATION_URL?.startsWith("https://script.google.com/macros/s/") || !env.GOLF_AUTOMATION_TOKEN) throw new Error("Golf automation is not configured");
  const golfers = Number(e.party);
  const price = isGolfArea(e.areaId) && isGolfGolfers(golfers) ? golfPackagePrice(e.areaId, golfers, e.courseMode) : null;
  const res = await fetch(env.GOLF_AUTOMATION_URL, {
    method: "POST", headers: { "content-type": "application/json" }, redirect: "follow", signal: AbortSignal.timeout(25000),
    body: JSON.stringify({ action: "enqueue", token: env.GOLF_AUTOMATION_TOKEN,
      requestId: e.requestId, golfMode: GOLF_MODE, enquiry: e, receivedAt: new Date().toISOString(), priceVersion: GOLF_PRICE_VERSION,
      baseTotal: price?.groupTotal ?? null, ack: acknowledgement(e, title), followUp: photoFollowUp(e, title),
      payment: paymentTemplate(e, title), subject: threadSubject(e, title), teamText, ledger,
    }),
  });
  if (!res.ok) throw new Error("Golf automation did not accept the request");
  const result = await res.json() as { ok?: boolean; id?: string; error?: string; ackSent?: boolean };
  if (!result.ok || !result.id) throw new Error("Golf automation could not persist the request");
  return result;
}

/** A reviewed English template; other languages stay manual until their payment
 * templates have been reviewed. Amount/link placeholders are replaced by the
 * queue from the approved live master, never by customer input or an LLM. */
export function photoFollowUp(e: Enquiry, title?: string) {
  const message = followUp(e, title);
  return e.lang === "en" && ["tokyo", "fuji"].includes(e.areaId ?? "")
    ? { ...message, html: golfEmailHtml(message.text, e.areaId), version: GOLF_EMAIL_VERSION } : message;
}
/** A booking-service payment email needs an individually reviewed course proposal.
 * Never build a payment request just from a new enquiry. */
export function paymentTemplate(e: Enquiry, title?: string, proposal?: ArrangementProposal) {
  return isArrangement()
    ? proposal ? arrangementPaymentTemplate(e, proposal, title) : null
    : packagePaymentTemplate(e, title);
}
