import type { Enquiry } from "@/lib/contact";

/** Staff-only draft content. Never import from public page or automatic mail modules.
 * A quote must be verified for this request; legacy prices/campaigns are not promises. */
export interface ReviewedPrivateQuote {
  totalJpy: number;
  inclusions: string;
  exclusions: string;
  contractingParty: string;
  paymentRecipient: string;
  cancellationTerms: string;
  verifiedForThisRequest: true;
}
export function privateGolfOption(e: Enquiry, quote?: ReviewedPrivateQuote): string {
  const n = Number(e.party);
  if (!Number.isInteger(n) || n < 2 || n > 4 || e.kind !== "guest" || e.experience !== "mt-fuji-golf-day") {
    if (quote) throw new Error("A private group offer requires 2–4 golfers");
    return "";
  }
  const lines = [
    "Option 2 — Private golf day with premium hotel transfers and an English-speaking assistant",
    "If you would prefer a more relaxed day, we can also discuss a private option with return hotel transfers in a premium vehicle and an English-speaking assistant. Would you like us to prepare a personalised quote? Please confirm your hotel or pick-up area.",
  ];
  if (quote) {
    if (quote.verifiedForThisRequest !== true || !Number.isSafeInteger(quote.totalJpy) || quote.totalJpy <= 0) throw new Error("Review the private quote for this request");
    for (const key of ["inclusions", "exclusions", "contractingParty", "paymentRecipient", "cancellationTerms"] as const) {
      if (typeof quote[key] !== "string" || !quote[key].trim() || quote[key].length > 4000) throw new Error(`Private quote needs ${key}`);
    }
    lines.push(`Reviewed total for ${n} golfers: ¥${quote.totalJpy.toLocaleString("en-US")} including tax.`, `Included: ${quote.inclusions}`, `Not included / any local payments: ${quote.exclusions}`, `Contracting party: ${quote.contractingParty}`, `Payment recipient: ${quote.paymentRecipient}`, `Cancellation conditions: ${quote.cancellationTerms}`);
  } else {
    lines.push("The total, included services, any local payments, contracting party, payment recipient and cancellation terms will be confirmed in your individual quote before you decide. No private package is booked or payable at this stage.");
  }
  lines.push("Please tell us which option you prefer. The booking-service payment link below is for Option 1 only; please do not use it to pay for Option 2. Any amount already paid will be reconciled in writing before a switch, so it is not charged twice.");
  return lines.join("\n");
}
