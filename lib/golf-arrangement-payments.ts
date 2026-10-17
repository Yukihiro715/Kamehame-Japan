import { GOLF_ARRANGEMENT_FEE_JPY, GOLF_ARRANGEMENT_PRICE_VERSION } from "@/lib/golf-prices";

/** Booking-service-only Payment Links supplied by the owner on 2026-10-17.
 * Each link charges the whole group's fee once, not a per-person quantity.
 * Package links remain in their existing, separate payment master. */
const LINKS = Object.freeze({
  1: Object.freeze({ amount: 15000, url: "https://book.stripe.com/8x228rcQhejp8qP2sG3Je0l" }),
  2: Object.freeze({ amount: 30000, url: "https://book.stripe.com/8x2bJ16rT2AHbD19V83Je0m" }),
  3: Object.freeze({ amount: 45000, url: "https://book.stripe.com/7sYeVd3fHcbh22rc3g3Je0n" }),
  4: Object.freeze({ amount: 60000, url: "https://book.stripe.com/3cI3cvcQh5MTgXlffs3Je0o" }),
});

export function golfArrangementPayment(golfers: number) {
  if (!Number.isInteger(golfers) || golfers < 1 || golfers > 4)
    throw new Error("A booking service payment needs 1–4 golfers");
  const link = LINKS[golfers as keyof typeof LINKS];
  // A future change to the fee must not silently reuse an old fixed-price link.
  if (link.amount !== GOLF_ARRANGEMENT_FEE_JPY * golfers)
    throw new Error("Update the approved Stripe links before changing the booking service fee");
  return { ...link, currency: "JPY" as const, priceVersion: GOLF_ARRANGEMENT_PRICE_VERSION };
}
