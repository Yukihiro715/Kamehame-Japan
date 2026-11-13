import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { openTestDb } from './helpers/sqlite-db.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType: 'custom', configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true }, logLevel: 'silent' });
after(() => vite.close());
const R = await vite.ssrLoadModule('/lib/referral/reservations.ts');
const O = await vite.ssrLoadModule('/lib/portal/ops.ts');
const M = await vite.ssrLoadModule('/lib/portal/metrics.ts');
const T = Date.parse('2027-01-01T00:00:00Z');
const slug = 'kanji-name-calligraphy';
async function seed() {
  const db = openTestDb();
  await db.run(`INSERT INTO experience_referral_policies (id, experience_slug, rate_bp, tax_rate_bp, valid_from, version, created_at) VALUES ('p', ?, 500, 1000, '2026-01-01T00:00:00Z', 1, '2026-01-01T00:00:00Z')`, [slug]);
  await db.run(`INSERT INTO partner_legal_entities (id, name, created_at, updated_at) VALUES ('other', 'Other', '', '')`);
  await db.run(`INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('other-site', 'other', 'HP-OTHER', 'Other', '', '')`);
  return db;
}
async function rate(db, id, entity, bp, date='2026-12-01T00:00:00Z') {
  await db.run(`INSERT INTO partner_commission_rates VALUES (?, ?, ?, ?, ?, 'test')`, [id, entity, bp, date, date]);
}
test('common -> partner -> inherit; future rates and zero; eligibility stays independent', async () => {
  const db = await seed();
  assert.equal((await R.policyFor(db, slug, T, 'site-prosent-demo')).rate_bp, 500);
  await rate(db, 'common', null, 600);
  await rate(db, 'partner', 'le-prosent', 800);
  assert.equal((await R.policyFor(db, slug, T, 'site-prosent-demo')).rate_bp, 800);
  assert.equal((await R.policyFor(db, slug, T, 'other-site')).rate_bp, 600);
  assert.equal((await R.policyFor(db, slug, T, null, 'sp-prosent-demo')).rate_bp, 800);
  await rate(db, 'zero', 'le-prosent', 0, '2027-02-01T00:00:00Z');
  assert.equal((await R.policyFor(db, slug, T, 'site-prosent-demo')).rate_bp, 800);
  assert.equal((await R.policyFor(db, slug, T+40*864e5, 'site-prosent-demo')).rate_bp, 0);
  await rate(db, 'inherit', 'le-prosent', null, '2027-03-01T00:00:00Z');
  assert.equal((await R.policyFor(db, slug, T+70*864e5, 'site-prosent-demo')).rate_bp, 600);
  const terms = (await M.experienceTerms(db, T, 'site-prosent-demo')).find(e => e.slug === slug);
  assert.equal(terms.rateBp, 800);
  assert.equal(await R.policyFor(db, 'not-configured', T, 'site-prosent-demo'), null);
  await db.run(`UPDATE experience_referral_policies SET referral_enabled = 0`);
  assert.equal(await R.policyFor(db, slug, T, 'site-prosent-demo'), null);
});
test('booking snapshots persist through rate changes; reattribution uses destination rate at booking time', async () => {
  const db = await seed(); await rate(db, 'common', null, 600); await rate(db, 'partner', 'le-prosent', 800);
  const r = await R.createReservation(db, { requestId: 'booking', flow: 'experience', experienceSlug: slug, lines: [{ kind: 'base', description: 'Experience', commissionable: true, grossJpy: 11000 }] }, { hotelId: 'site-prosent-demo', chainProfileId: null, linkId: null, sessionId: null, medium: null }, T);
  const snapshot = () => db.first(`SELECT rate_bp, rate_setting_id FROM reservation_referrals WHERE reservation_id = ?`, [r.id]);
  assert.deepEqual(await snapshot(), { rate_bp: 800, rate_setting_id: 'partner' });
  await rate(db, 'later', 'le-prosent', 900, '2027-02-01T00:00:00Z');
  await R.recomputeCommission(db, r.id);
  assert.equal((await snapshot()).rate_bp, 800);
  await O.correctReferral(db, r.id, { hotelId: 'site-prosent-demo', reason: 'same site', by: 'test' }, T+40*864e5);
  assert.equal((await snapshot()).rate_bp, 800);
  await O.correctReferral(db, r.id, { hotelId: 'other-site', reason: 'wrong partner', by: 'test' }, T+40*864e5);
  assert.deepEqual(await snapshot(), { rate_bp: 600, rate_setting_id: 'common' });
  assert.equal((await db.first(`SELECT commission_net_jpy FROM commission_entries WHERE reservation_id = ?`, [r.id])).commission_net_jpy, 600);
});
test('invalid and retroactive settings are rejected; settings are audited; demo remains unique', async () => {
  const db = await seed();
  for (const rateBp of [-1, 10001, 1.5, '', undefined]) await assert.rejects(O.createCommissionRate(db, { legalEntityId: null, rateBp, by: 'test' }));
  await assert.rejects(O.createCommissionRate(db, { legalEntityId: 'missing', rateBp: 500, by: 'test' }));
  await assert.rejects(O.createCommissionRate(db, { legalEntityId: null, rateBp: 500, validFrom: '2020-01-01', by: 'test' }));
  await O.createCommissionRate(db, { legalEntityId: 'le-prosent', rateBp: 0, by: 'test' });
  assert.equal((await db.first(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'commission_rate.create'`)).n, 1);
  assert.equal((await db.first(`SELECT name FROM hotels WHERE public_id = 'HP-DEMO'`)).name, 'デモ用');
});
