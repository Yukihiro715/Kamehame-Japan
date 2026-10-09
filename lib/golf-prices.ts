// Golf price master — the one source of the package prices on the golf page.
//
// Group totals in yen for our recommended-course packages, by area and party
// size (v4 brief, 2026-10-10). Every display (the options panel, the sticky
// bar, the form summary, the price table) and the server-side reference price
// derive from this table; nothing else hard-codes a golf price. A specific
// course requested by the guest is quoted individually and has no price here.

export type GolfArea = "tokyo" | "fuji";
export type GolfGolfers = 2 | 3 | 4;
export type GolfCourseMode = "recommended" | "specific";

/** Version stamped on every request, so a stored reference price can be read against the list it came from. */
export const GOLF_PRICE_VERSION = "2026-10-10";

export const GOLF_GOLFERS: GolfGolfers[] = [2, 3, 4];

export const GOLF_PRICES_JPY: Record<GolfArea, Record<GolfGolfers, number>> = {
  tokyo: { 2: 250000, 3: 290000, 4: 330000 },
  fuji: { 2: 270000, 3: 310000, 4: 350000 },
};

export const isGolfArea = (s: unknown): s is GolfArea => s === "tokyo" || s === "fuji";
export const isGolfGolfers = (n: unknown): n is GolfGolfers => n === 2 || n === 3 || n === 4;

export interface GolfPackagePrice {
  currency: "JPY";
  /** The package price — the amount a quote and a payment are based on. */
  groupTotal: number;
  /** Per-person figure for display only; rounded, so never multiplied back. */
  perPersonDisplay: number;
  /** True when the per-person figure is rounded (three golfers). */
  approximate: boolean;
}

/** Null means "quoted individually" (a specific course), never free. */
export function golfPackagePrice(area: GolfArea, golfers: GolfGolfers, mode: GolfCourseMode = "recommended"): GolfPackagePrice | null {
  if (mode === "specific") return null;
  const groupTotal = GOLF_PRICES_JPY[area][golfers];
  return { currency: "JPY", groupTotal, perPersonDisplay: Math.round(groupTotal / golfers), approximate: groupTotal % golfers !== 0 };
}

/** The area's table in the catalog's tier shape. */
export const golfTiers = (area: GolfArea) => GOLF_GOLFERS.map((party) => ({ party, total: GOLF_PRICES_JPY[area][party] }));
