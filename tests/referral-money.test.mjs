// Commission arithmetic (要件 8, 受入テスト T07–T12 の計算部分).
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const m = await vite.ssrLoadModule("/lib/referral/money.ts");

test("roundHalfUp rounds half away from zero and only on integers", () => {
  assert.equal(m.roundHalfUp(1005, 10), 101);   // 100.5 → 101 (T10)
  assert.equal(m.roundHalfUp(1004, 10), 100);
  assert.equal(m.roundHalfUp(-1005, 10), -101);
  assert.equal(m.roundHalfUp(0, 7), 0);
  assert.throws(() => m.roundHalfUp(1.5, 1));
  assert.throws(() => m.roundHalfUp(1, 0));
});

test("T07: ¥10,000 net at 5% is ¥500 commission, ¥50 tax, ¥550 gross", () => {
  assert.equal(m.commissionNet([{ netJpy: 10000, rateBp: 500 }]), 500);
  assert.equal(m.taxOnTotal(500, 1000), 50);
  assert.equal(500 + m.taxOnTotal(500, 1000), 550);
});

test("T09: tax is rounded once on the statement total, not per booking", () => {
  // two bookings of ¥105 each: tax on 210 = 21, not 11 + 11 = 22
  const net = m.commissionNet([{ netJpy: 2100, rateBp: 500 }]) + m.commissionNet([{ netJpy: 2100, rateBp: 500 }]);
  assert.equal(net, 210);
  assert.equal(m.taxOnTotal(net, 1000), 21);
  assert.notEqual(m.taxOnTotal(105, 1000) * 2, 21);
});

test("T10: a commission of 100.5 rounds to 101 and a full reversal returns exactly 0", () => {
  const lines = [{ netJpy: 2010, rateBp: 500 }]; // 2010 × 5% = 100.5
  const original = m.commissionNet(lines);
  assert.equal(original, 101);
  const afterFullRefund = m.commissionNet([{ netJpy: 0, rateBp: 500 }]);
  assert.equal(original + (afterFullRefund - original), 0);
});

test("commission over several rates is summed unrounded, then rounded once", () => {
  // 3333 × 5% = 166.65 and 3333 × 7% = 233.31 → 399.96 → 400 (per-line rounding would give 167 + 233 = 400 here, so check a case that differs)
  assert.equal(m.commissionNet([{ netJpy: 3333, rateBp: 500 }, { netJpy: 3333, rateBp: 700 }]), 400);
  // 1010 × 5% = 50.5 and 1010 × 5% = 50.5 → 101 once; 51 + 51 = 102 per line
  assert.equal(m.commissionNet([{ netJpy: 1010, rateBp: 500 }, { netJpy: 1010, rateBp: 500 }]), 101);
});

test("netFromGross uses the line's own rate and never a blanket 1.1", () => {
  assert.equal(m.netFromGross(11000, 1000), 10000);
  assert.equal(m.netFromGross(19800, 1000), 18000);
  assert.equal(m.netFromGross(10800, 800), 10000);
  assert.equal(m.netFromGross(26500, 1000), 24091); // 24090.9…
});

test("allocateProportionally adds up exactly, largest remainder first, stable on ties", () => {
  assert.deepEqual(m.allocateProportionally(100, [1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(m.allocateProportionally(1000, [19800, 5000]), [798, 202]);
  assert.deepEqual(m.allocateProportionally(5, [0, 10]), [0, 5]);
  assert.deepEqual(m.allocateProportionally(0, [3, 4]), [0, 0]);
  assert.deepEqual(m.allocateProportionally(7, [0, 0]), [0, 0]);
  for (const [amount, weights] of [[12345, [3, 7, 11, 13]], [1, [5, 5]], [99, [1, 2, 3, 4, 5]]]) {
    const shares = m.allocateProportionally(amount, weights);
    assert.equal(shares.reduce((s, x) => s + x, 0), amount);
  }
});

test("T11/T12: minimum payout is judged before the fee; the fee comes off the transfer only", () => {
  assert.equal(m.reachesMinimumPayout(2999, 3000), false);
  assert.equal(m.reachesMinimumPayout(3000, 3000), true);
  assert.equal(m.reachesMinimumPayout(2750 + 550, 3000), true);
  assert.equal(m.transferAmount(3300, 220), 3080);
  assert.throws(() => m.transferAmount(3300, -1));
});
