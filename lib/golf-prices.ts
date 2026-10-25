// Golf price master — the one source of the package prices on the golf page.
//
// Group totals in yen for our recommended-course packages, by area and party
// size (v4 brief, 2026-10-10). Every display (the options panel, the sticky
// bar, the form summary, the price table) and the server-side reference price
// derive from this table; nothing else hard-codes a golf price. A specific
// course requested by the guest is quoted individually and has no price here.

/** "other": anywhere else in Japan, booking service only (owner, 2026-10-25); the package has no price for it. */
export type GolfArea = "tokyo" | "fuji" | "other";
export type GolfGolfers = 1 | 2 | 3 | 4;
export type GolfCourseMode = "recommended" | "specific";

/** How the golf page sells, 2026-10-17 (owner's decision, temporary):
 *  - "package": the private golf day — transfers, green fees, cart, rentals, lunch and
 *    an assistant in one group price (GOLF_PRICES_JPY). The full implementation stays
 *    in the code and in git (tag golf-package-2026-10-16).
 *  - "arrangement": a course-booking service — a base fee for the first golfer plus a
 *    smaller amount for each additional golfer (golfArrangementFee); green fees and
 *    everything at the club are paid there,
 *    transfers through a partner contracted directly, an assistant quoted separately.
 *  Switch back to "package" to restore the previous page; nothing else needs to change. */
export type GolfMode = "package" | "arrangement";
export const GOLF_MODE: GolfMode = "arrangement";
/** The booking-service fee (owner, 2026-10-24): ¥15,000 covers the first golfer and each
 *  additional golfer adds ¥5,000, so a party of two pays ¥20,000 and a party of four ¥30,000.
 *  Before 2026-10-24 the fee was ¥15,000 for every golfer. */
export const GOLF_ARRANGEMENT_FEE_JPY = 15000;
export const GOLF_ARRANGEMENT_EXTRA_JPY = 5000;
/** The whole group's fee for `golfers` (1 or more): base + extra × (golfers − 1). */
export const golfArrangementFee = (golfers: number) => GOLF_ARRANGEMENT_FEE_JPY + GOLF_ARRANGEMENT_EXTRA_JPY * Math.max(0, golfers - 1);
/** The part of the fee that pays for research and a suitable proposal: one amount per group,
 *  retained when the customer cancels after that proposal (lib/golf-arrangement-policy.ts). */
export const GOLF_ARRANGEMENT_RESEARCH_JPY = 5000;
export const isArrangement = () => GOLF_MODE === "arrangement";

/** Version stamped on every request, so a stored reference price can be read against the list it came from. */
export const GOLF_PACKAGE_PRICE_VERSION = "2026-10-10";
export const GOLF_ARRANGEMENT_PRICE_VERSION = "arrangement-2026-10-24";
export const GOLF_PRICE_VERSION = isArrangement() ? GOLF_ARRANGEMENT_PRICE_VERSION : GOLF_PACKAGE_PRICE_VERSION;

/** Party sizes with a published fee: the package needs a car-load of two to four; the booking service takes a single golfer too. */
export const GOLF_GOLFERS: GolfGolfers[] = GOLF_MODE === "arrangement" ? [1, 2, 3, 4] : [2, 3, 4];
/** The booking service also takes larger groups (owner, 2026-10-23): from five golfers the
 *  fee is quoted for the group — the club usually needs two or more tee times — up to this size. */
export const GOLF_FIXED_FEE_MAX = 4;
export const GOLF_MAX_GOLFERS = 12;
export const golfPartySize = () => GOLF_MODE === "arrangement" ? { min: 1, max: GOLF_MAX_GOLFERS, default: 2 } : { min: 2, max: 4, default: 4 };

export const GOLF_PRICES_JPY: Record<"tokyo" | "fuji", Record<2 | 3 | 4, number>> = {
  tokyo: { 2: 250000, 3: 290000, 4: 330000 },
  fuji: { 2: 270000, 3: 310000, 4: 350000 },
};

export const isGolfArea = (s: unknown): s is GolfArea => s === "tokyo" || s === "fuji" || (s === "other" && GOLF_MODE === "arrangement");
/** A party size the request endpoint accepts: 1–12 for the booking service (5+ quoted), the priced sizes for the package. */
export const isGolfGolfers = (n: unknown): n is number =>
  GOLF_MODE === "arrangement" ? Number.isInteger(n) && (n as number) >= 1 && (n as number) <= GOLF_MAX_GOLFERS : (GOLF_GOLFERS as unknown[]).includes(n);

export interface GolfPackagePrice {
  currency: "JPY";
  /** The package price — the amount a quote and a payment are based on. */
  groupTotal: number;
  /** Per-person figure for display only; rounded, so never multiplied back. */
  perPersonDisplay: number;
  /** True when the per-person figure is rounded (three golfers in either mode). */
  approximate: boolean;
}

/** Null means "quoted individually" (a specific course in the package; five golfers or more in the booking service), never free. */
export function golfPackagePrice(area: GolfArea, golfers: number, mode: GolfCourseMode = "recommended"): GolfPackagePrice | null {
  // The booking service charges the same fee whichever course is played, so a named course is not a custom quote;
  // a group beyond the published sizes is.
  if (GOLF_MODE === "arrangement") {
    if (golfers > GOLF_FIXED_FEE_MAX) return null;
    const groupTotal = golfArrangementFee(golfers);
    return { currency: "JPY", groupTotal, perPersonDisplay: Math.round(groupTotal / golfers), approximate: groupTotal % golfers !== 0 };
  }
  if (mode === "specific" || area === "other") return null;
  const groupTotal = GOLF_PRICES_JPY[area][golfers as 2 | 3 | 4];
  return { currency: "JPY", groupTotal, perPersonDisplay: Math.round(groupTotal / golfers), approximate: groupTotal % golfers !== 0 };
}

/** Rental clubs are priced into every package at this amount per golfer; a golfer who
 *  brings their own clubs pays this much less (owner's rule, 2026-10-16). The same figure
 *  is applied by the payment-link master in the ledger, so the two must move together. */
export const GOLF_OWN_CLUBS_DISCOUNT_JPY = 5000;

/** How many golfers bring their own clubs, from the form's `rental_keys` ("own,required:right,…"). */
export const ownClubsCount = (rentalKeys: string | undefined, golfers: number) =>
  Math.min(golfers, (rentalKeys ?? "").split(",").filter((k) => k.trim() === "own").length);

/** The package price less the own-clubs deduction; never below zero. */
export const golfTotalWithOwnClubs = (groupTotal: number, ownClubs: number) =>
  GOLF_MODE === "arrangement" ? groupTotal : Math.max(0, groupTotal - GOLF_OWN_CLUBS_DISCOUNT_JPY * Math.max(0, ownClubs));

/** The area's table in the catalog's tier shape. */
export const golfTiers = (area: GolfArea) => GOLF_GOLFERS.map((party) => ({ party, total: GOLF_MODE === "arrangement" ? golfArrangementFee(party) : GOLF_PRICES_JPY[area as "tokyo" | "fuji"][party as 2 | 3 | 4] }));
