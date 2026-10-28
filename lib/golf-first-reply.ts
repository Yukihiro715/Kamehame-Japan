import type { Enquiry } from "@/lib/contact";
import { golfArrangementFee } from "@/lib/golf-prices";
import { threadSubject } from "@/lib/mail-copy";
import { golfPlanningCopy } from "@/lib/golf-planning-copy";

/** Staff-reviewed English draft only. No sending, holds, checkout or changes to agreed terms. */
export function golfFirstReplyTemplate(e: Enquiry, review: {
  recommendation: string;
  missingQuestions: string[];
}) {
  const n = Number(e.party);
  if (e.kind !== "guest" || e.experience !== "mt-fuji-golf-day" || e.lang !== "en" || !Number.isInteger(n) || n < 1 || n > 4)
    throw Error("Use a reviewed individual quote for larger groups or other languages");
  if (!review.recommendation.trim() || review.recommendation.length > 1500 || review.missingQuestions.length > 3 || review.missingQuestions.some(q => !q.trim() || q.length > 500))
    throw Error("Provide one reviewed recommendation and at most three unanswered questions");
  return {
    subject: threadSubject(e, "Your golf day in Japan"),
    text: [
      `Hi ${e.name},`, "",
      `Thank you for your enquiry for ${n} golfer${n === 1 ? "" : "s"}${e.dates ? ` on ${e.dates} (Japan time)` : ""}.`, "",
      review.recommendation.trim(), "",
      `Our booking service fee is ¥${golfArrangementFee(n).toLocaleString("en-US")} for your whole group, including tax. This is not the full cost of your golf day. Club charges, rentals and transport are separate.`,
      golfPlanningCopy.en.support, "",
      ...(review.missingQuestions.length ? ["To help us suggest a realistic plan, please confirm only the following:", ...review.missingQuestions.map((q, i) => `${i + 1}. ${q.trim()}`), ""] : []),
      "We will discuss an indicative total cost and journey time before you decide. Estimates do not secure availability. Enquiring is free; no payment is needed now. We agree essential requirements, budget and applicable refund terms before payment, and seek your approval before booking.", "",
      "If you are unsure about equipment, tell us what you know; US, UK or EU shoe sizes are welcome with the sizing system and golfer indicated.", "",
      "Best regards,", "KAMEHAME JAPAN | Prosent Inc.", "hello@kamehame-japan.com",
    ].join("\n"),
  };
}
