import { GOLF_ARRANGEMENT_PRICE_VERSION, golfArrangementFee } from "@/lib/golf-prices";

/** Booking-service-only Payment Links, one per party size, supplied by the owner (one golfer
 * on 2026-10-17, two to four on 2026-10-24). Each link charges the whole group's fee once
 * (quantity fixed at 1), not a per-person quantity; the number of golfers is never multiplied
 * into a quantity. Package links remain in their existing, separate payment master.
 *
 * Fee of 2026-10-24: ¥15,000 for the first golfer + ¥5,000 per additional golfer. The links
 * for two to four golfers that charged ¥15,000 × golfers (…AHbD19V83Je0m ¥30,000,
 * …22rc3g3Je0n ¥45,000, …gXlffs3Je0o ¥60,000) are retired here and disabled in Stripe. */
const LINKS: Readonly<Record<1 | 2 | 3 | 4, { readonly amount: number; readonly url: string | null }>> = Object.freeze({
  1: Object.freeze({ amount: 15000, url: "https://book.stripe.com/8x228rcQhejp8qP2sG3Je0l" }),
  2: Object.freeze({ amount: 20000, url: "https://book.stripe.com/dRmeVd03v7V15eD8R43Je0s" }),
  3: Object.freeze({ amount: 25000, url: "https://book.stripe.com/9B67sL7vX3EL6iHebo3Je0t" }),
  4: Object.freeze({ amount: 30000, url: "https://book.stripe.com/eVq00jcQha390Yn8R43Je0u" }),
});

/** True when an approved link for this party size exists at the current fee. */
export function golfArrangementPaymentReady(golfers: number): boolean {
  if (!Number.isInteger(golfers) || golfers < 1 || golfers > 4) return false;
  const link = LINKS[golfers as 1 | 2 | 3 | 4];
  return link.url !== null && link.amount === golfArrangementFee(golfers);
}

export function golfArrangementPayment(golfers: number) {
  if (!Number.isInteger(golfers) || golfers < 1 || golfers > 4)
    throw new Error("A booking service payment needs 1–4 golfers");
  const link = LINKS[golfers as 1 | 2 | 3 | 4];
  // A future change to the fee must not silently reuse an old fixed-price link.
  if (link.amount !== golfArrangementFee(golfers))
    throw new Error("Update the approved Stripe links before changing the booking service fee");
  if (link.url === null)
    throw new Error(`No approved Stripe link for ${golfers} golfers at the current fee (¥${link.amount.toLocaleString("en-US")}); ask the owner to create it before drafting`);
  return { amount: link.amount, url: link.url, currency: "JPY" as const, priceVersion: GOLF_ARRANGEMENT_PRICE_VERSION };
}
