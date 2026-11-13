import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType: 'custom', configFile: false, root, server: { middlewareMode: true }, logLevel: 'silent' });
after(() => vite.close());
const { partnerAccess } = await vite.ssrLoadModule('/components/portal/partner-access.ts');
const site = { id: 'a', features: { refer: true, cases: true, settlement: true, members: false } };
const membership = (role, scopeId = 'a', scopeType = 'hotel') => ({ role, scopeId, scopeType });
test('navigation does not advertise relay access to viewers, other sites, or operations roles', () => {
  for (const memberships of [[], [membership('hotel_viewer')], [membership('partner_manager', 'b')], [membership('ops_admin', null, 'ops')]]) {
    assert.equal(partnerAccess(site, memberships).cases, false);
  }
  assert.equal(partnerAccess(site, [membership('partner_agent')]).cases, true);
  assert.equal(partnerAccess(site, [membership('partner_manager')]).cases, true);
});
test('turning a feature off hides its actions even for the site manager; missing data is not permission', () => {
  assert.deepEqual(partnerAccess({ id: 'a', features: { refer: false, cases: false, settlement: false, members: true } }, [membership('partner_manager')]), { refer: false, cases: false, settlement: false });
  assert.deepEqual(partnerAccess(null), { refer: false, cases: false, settlement: false });
  assert.equal(partnerAccess({ id: 'a' }, [membership('partner_manager')]).cases, false);
});
