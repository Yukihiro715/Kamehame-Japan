/** Integer money arithmetic for the commission ledger.
 *
 *  Every amount is a JPY integer. Rates are basis points (500 = 5%). Nothing
 *  here touches binary floating point: products are exact integers and the
 *  one rounding step is `roundHalfUp` over an integer numerator/denominator.
 *  The requirement's ROUND_HALF_UP (四捨五入) is defined as "half away from
 *  zero", applied once per reservation (commission) or once per statement and
 *  tax rate (tax), never per line and never on a difference. */

/** `numerator / denominator` rounded half away from zero, as an integer. */
export function roundHalfUp(numerator: number, denominator: number): number {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator <= 0) throw new Error("roundHalfUp: integers only");
  const negative = numerator < 0;
  const n = Math.abs(numerator);
  const q = Math.floor(n / denominator), r = n - q * denominator;
  const rounded = r * 2 >= denominator ? q + 1 : q;
  return negative ? -rounded : rounded;
}

/** A tax-exclusive amount from a tax-inclusive one at `taxRateBp` (1000 = 10%).
 *  Used per line, with the line's own rate; never on a mixed total. */
export function netFromGross(grossJpy: number, taxRateBp: number): number {
  return roundHalfUp(grossJpy * 10000, 10000 + taxRateBp);
}

/** One commissionable line after discounts and refunds, in tax-exclusive yen. */
export interface CommissionLine { netJpy: number; rateBp: number }

/** The commission for one reservation: Σ(net × rate) summed unrounded, then
 *  rounded once (要件 8.2). A reservation with lines under different rates is
 *  still rounded once, on the total. */
export function commissionNet(lines: readonly CommissionLine[]): number {
  let numerator = 0;
  for (const l of lines) {
    if (!Number.isInteger(l.netJpy) || !Number.isInteger(l.rateBp)) throw new Error("commissionNet: integers only");
    numerator += l.netJpy * l.rateBp;
  }
  return roundHalfUp(numerator, 10000);
}

/** Consumption tax on a statement: the net commission of all its lines at one
 *  rate, summed first, taxed and rounded once (要件 8.3, 国税庁 No.6371). */
export function taxOnTotal(netTotalJpy: number, taxRateBp: number): number {
  return roundHalfUp(netTotalJpy * taxRateBp, 10000);
}

/** Split `amount` across `weights` in proportion, as integers that add up
 *  exactly: floor each share, then hand the remainder out one yen at a time to
 *  the largest fractional parts, ties going to the earlier position (largest
 *  remainder method with a stable order, 要件 8.1). Zero weights get nothing. */
export function allocateProportionally(amount: number, weights: readonly number[]): number[] {
  if (!Number.isInteger(amount) || amount < 0) throw new Error("allocateProportionally: non-negative integer amount");
  const total = weights.reduce((s, w) => s + w, 0);
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) throw new Error("allocateProportionally: non-negative integer weights");
  if (total === 0 || amount === 0) return weights.map(() => 0);
  const shares = weights.map((w) => Math.floor((amount * w) / total));
  let left = amount - shares.reduce((s, x) => s + x, 0);
  const order = weights
    .map((w, i) => ({ i, rem: (amount * w) % total }))
    .filter((x) => weights[x.i] > 0)
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length) { shares[order[k].i] += 1; left -= 1; }
  return shares;
}

/** Whether a settlement profile's confirmed, payable, tax-inclusive balance
 *  reaches the minimum payout. Judged before the bank fee is deducted (要件 3.1). */
export function reachesMinimumPayout(payableGrossJpy: number, minPayoutJpy: number): boolean {
  return payableGrossJpy >= minPayoutJpy;
}

/** The amount actually transferred: the payable balance less the bank fee the
 *  hotel bears. The fee never reduces the commission or its tax (要件 9). */
export function transferAmount(payableGrossJpy: number, bankFeeJpy: number): number {
  if (bankFeeJpy < 0) throw new Error("transferAmount: fee must be non-negative");
  return Math.max(0, payableGrossJpy - bankFeeJpy);
}

/** Formats yen for messages: ¥1,234. */
export const yenText = (n: number) => `${n < 0 ? "−" : ""}¥${Math.abs(n).toLocaleString("en-US")}`;
