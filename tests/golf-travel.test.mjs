import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType: 'custom', configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { golfBusHref, golfReturnHref, readGolfTravelQuery, travelRange, GOLF_TRAVEL_COPY, FUJI_TRANSFER_JPY, SHARED_BUS_BUDGET_JPY } = await vite.ssrLoadModule('/lib/golf-travel.ts');

test('bus detour and return preserve party, preferred date and private-transfer intent in every language', () => {
  for (const lang of Object.keys(GOLF_TRAVEL_COPY)) {
    for (const golfers of [1, 2]) {
      for (const transfer of ['introduce', 'none', 'unsure']) {
        const bus = new URL(golfBusHref(lang, golfers, '2026-12-08', transfer), 'https://example.test');
        assert.equal(bus.pathname, `/${lang}/golf-bus/`);
        assert.equal(bus.hash, '#tours');
        const state = readGolfTravelQuery(bus.searchParams);
        assert.deepEqual(state, { golfers, date: '2026-12-08', transfer, fromFuji: true });
        const back = new URL(golfReturnHref(lang, state.golfers, state.date, state.transfer), bus);
        assert.equal(back.searchParams.get('area'), 'fuji');
        assert.equal(back.searchParams.get('golfers'), String(golfers));
        assert.equal(back.searchParams.get('date'), '2026-12-08');
        assert.equal(back.searchParams.get('transfer'), transfer);
      }
    }
  }
});
test('malformed URL parameters cannot create impossible dates or unsupported party sizes', () => {
  for (const date of ['2026-02-30', '2026-13-01', 'tomorrow', '2026-1-1']) {
    assert.equal(readGolfTravelQuery(new URLSearchParams({ date })).date, '');
  }
  for (const golfers of ['0', '-1', '2.5', '99', 'Infinity', 'bad']) {
    assert.equal(readGolfTravelQuery(new URLSearchParams({ golfers })).golfers, undefined);
  }
  assert.equal(readGolfTravelQuery(new URLSearchParams('transfer=free')).transfer, undefined);
  assert.ok(!golfBusHref('en', 2, '', 'unsure').includes('date='));
});
test('two-person comparison uses a split vehicle price and an inclusive bus group total', () => {
  assert.equal(travelRange(FUJI_TRANSFER_JPY.min / 2, FUJI_TRANSFER_JPY.max / 2), '¥50,000–¥60,000');
  assert.equal(travelRange(SHARED_BUS_BUDGET_JPY.min * 2, SHARED_BUS_BUDGET_JPY.max * 2), '¥60,000–¥80,000');
  assert.match(GOLF_TRAVEL_COPY.en.busIncludes, /Booking fee.*round-trip bus.*golf/);
  assert.match(GOLF_TRAVEL_COPY.en.excludes, /Transfer only/);
  assert.match(GOLF_TRAVEL_COPY.en.busArea, /do not visit the Mt. Fuji area/);
  for (const copy of Object.values(GOLF_TRAVEL_COPY)) {
    assert.equal(Object.keys(copy.choices).length, 3);
    assert.ok(copy.busPrice.includes('{price}'));
    assert.ok(copy.busTotal.includes('{n}') && copy.busTotal.includes('{price}'));
  }
});
