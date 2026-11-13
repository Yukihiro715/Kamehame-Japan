import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { openTestDb } from './helpers/sqlite-db.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType: 'custom', configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true }, logLevel: 'silent' });
after(() => vite.close());
const { sortExperiences } = await vite.ssrLoadModule('/lib/portal/experience-sort.ts');
const { experiencePopularity } = await vite.ssrLoadModule('/lib/portal/metrics.ts');

test('experience sorts use numeric commission, keep unknowns last and preserve tied order', () => {
  const row = (slug, amount, rank, referable = true) => ({ slug, commissionExampleNet: amount, popularityRank: rank, referable });
  const rows = [row('unknown', null, null), row('small', 900, 2), row('large', 10000, 1), row('tie', 10000, 1), row('disabled', 20000, null, false), row('zero', 0, null)];
  const slugs = xs => xs.map(x => x.slug);
  assert.deepEqual(slugs(sortExperiences(rows, 'commission')), ['large','tie','small','zero','unknown','disabled']);
  assert.deepEqual(slugs(sortExperiences(rows, 'popular')), ['large','tie','small','unknown','disabled','zero']);
  assert.deepEqual(sortExperiences(rows, 'default'), rows);
  assert.equal(rows[0].slug, 'unknown', 'sorting does not mutate API data');
  assert.deepEqual(slugs(sortExperiences(rows.filter(x => x.slug === 'small' || x.slug === 'large'), 'commission')), ['large','small']);
});

test('popularity includes only eligible recent bookings, returns ranks, and demo stays fictional', async () => {
  const db = openTestDb(), now = Date.parse('2026-11-13T03:00:00Z'), day = 86400000;
  const fixtures = [
    ['a','confirmed','paid',now], ['a','completed','paid',now - 90 * day],
    ['b','confirmed','partially_refunded',now - day], ['c','completed','paid',now - day],
    ['b','cancelled','paid',now], ['b','provisional','unpaid',now], ['b','arranging','unpaid',now],
    ['b','no_show','paid',now], ['b','confirmed','refunded',now], ['b','confirmed','disputed',now],
    ['b','confirmed','paid',now - 90 * day - 1], ['b','confirmed','paid',now + 1],
  ];
  for (const [i, [slug, status, payment, at]] of fixtures.entries()) {
    await db.run(`INSERT INTO reservations (id,request_id,flow,experience_slug,status,payment_status,created_at,updated_at) VALUES (?,?,'experience',?,?,?,?,?)`, [`rank-${i}`,`rank-request-${i}`,slug,status,payment,new Date(at).toISOString(),new Date(at).toISOString()]);
  }
  const ranks = await experiencePopularity(db, now);
  assert.deepEqual([...ranks], [['a',1],['b',2],['c',2]]);
  const { demoPopularity } = await vite.ssrLoadModule('/lib/portal/demo-data.ts');
  const demo = demoPopularity();
  assert.equal(demo.has('a'), false);
  assert.equal(demo.size, 3);
  assert.ok([...demo.values()].every(rank => rank === 1));
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM reservations')).n, fixtures.length);
});
