// Babysitting fees shown on the travel-support page. The partner agency's
// published rates (tax included, internal: never printed) carry our
// arrangement margin and are rounded up to the next ¥50. The page shows only
// the resulting figures; the quote confirms the final amount.
import { yen } from "@/lib/pricing";

const MARGIN = 1.30;
const BASE = {
  hourEn: 3960, hourJa: 2970,
  night: 550, weekend: 330, peak: 550, bath: 1100,
  notice2: 1650, notice1: 3300,
} as const;

const up50 = (n: number) => Math.ceil((n * MARGIN) / 50) * 50;

export const BABYSITTER_FEES = {
  hourEn: up50(BASE.hourEn), hourJa: up50(BASE.hourJa),
  night: up50(BASE.night), weekend: up50(BASE.weekend), peak: up50(BASE.peak), bath: up50(BASE.bath),
  notice2: up50(BASE.notice2), notice1: up50(BASE.notice1),
  minHours: 3,
  /** The lowest booking: the minimum hours with an English-speaking sitter on a weekday. */
  fromTotal: up50(BASE.hourEn) * 3,
  /** Second child: this share of the second child's hourly fee; lower when either child is four or older. Third child free. */
  secondPct: 50, secondOlderPct: 30,
};

export const feeYen = (n: number) => yen(n);
