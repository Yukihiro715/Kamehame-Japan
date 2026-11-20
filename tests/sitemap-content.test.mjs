import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildEntries, hashOf } from '../scripts/sitemap-content.mjs';
const read = f => { try { return readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'); } catch { return null; } };
const path = '/es/tokyo/nerima-herbal-bath-private-spa/';
const key = r => buildEntries(r).entries.find(e => e.path === path)?.key;

test('approved English-fallback pages have stable source-derived sitemap keys', () => {
  const initial = key(read);
  assert.equal(typeof initial, 'string');
  assert.equal(hashOf(initial), hashOf(key(read)));
  const changed = key(f => {
    const s = read(f);
    return f === 'lib/catalog.ts' ? s.replace('The private bath and tea space of the home spa', 'Revised private bath photo description') : s;
  });
  assert.notEqual(hashOf(initial), hashOf(changed), 'English source changes date key for fallback locale');
  const unauthorised = key(f => {
    const s = read(f);
    if(f !== 'lib/catalog.ts') return s;
    return s.replace(/(const APPROVED_ENGLISH_FALLBACK = new Set\(\[[\s\S]*?)"nerima-herbal-bath-private-spa",/, '$1');
  });
  assert.equal(unauthorised, undefined, 'missing translation is not silently approved as English fallback');
});


test('untranslated, unapproved locales are not advertised as sitemap alternates', () => {
  const {entries} = buildEntries(read);
  const slug = 'kyoto-garden-teahouse-tea-ceremony';
  assert.deepEqual(entries.filter(e=>e.path.includes(slug)).map(e=>e.path), [`/en/kyoto/${slug}/`]);
  assert.deepEqual(Object.keys(entries.find(e=>e.path===`/en/kyoto/${slug}/`).alternates), ['en']);
});

test('shared Bamboo Sky Terrace copy contributes to each locale’s sitemap key', () => {
  const path = '/ja/kyoto/bamboo-sky-terrace/';
  const terraceKey = (readSource) => buildEntries(readSource).entries.find(e => e.path === path)?.key;
  const updated = (file) => file === 'lib/bamboo-sky-terrace.ts'
    ? read(file).replace('Bamboo Sky Terrace', 'Updated venue name')
    : read(file);
  assert.notEqual(hashOf(terraceKey(read)), hashOf(terraceKey(updated)));
});
