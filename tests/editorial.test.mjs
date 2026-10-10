import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate, approvalHash, hash, publicUrl, overlap } from '../scripts/editorial/core.mjs';
import { generate } from '../scripts/editorial/pipeline.mjs';
import { providers } from '../scripts/editorial/providers.mjs';
import { draftSchema } from '../scripts/editorial/schema.mjs';
import { loadData, factsFor } from '../scripts/editorial/catalog.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const seed = () => JSON.parse(readFileSync(join(root, 'examples/editorial/choosing-kanji-for-your-name.json'), 'utf8'));
const ready = () => { const e = seed(); e.draft.questionsJa = []; e.review = { verdict: 'pass', summaryJa: 'TEST ONLY', blockersJa: [], warningsJa: [] }; return e; };
const approved = () => { const e = ready(); e.status = 'published'; e.publishedAt = e.updatedAt; e.approval = { reviewer: 'test-fixture', reviewedAt: e.updatedAt, imageRightsConfirmed: true, contentHash: approvalHash(e) }; return e; };

test('unresolved questions and missing human approval block publication', () => {
  const e = seed(); e.status = 'published';
  assert.match(validate(e).errors.join(' '), /Unresolved/);
  assert.match(validate(e).errors.join(' '), /Human approval/);
  assert.deepEqual(validate(approved(), { root }).errors, []);
});
test('edits invalidate approval; changed product facts block new approval', () => {
  const e = approved(); e.draft.description += ' Changed.';
  assert.match(validate(e).errors.join(' '), /invalidated/);
  const fresh = approved();
  assert.match(validate(fresh, { currentFacts: { ...fresh.product.facts, duration: 'changed' } }).errors.join(' '), /conditions changed/);
  fresh.product.facts.duration = 'modified snapshot';
  assert.match(validate(fresh).errors.join(' '), /snapshot was modified/);
});
test('schema, evidence, raw HTML, duplicate title and malformed tables fail closed', () => {
  const e = ready(); e.draft.blocks[0].sourceIds = ['unknown'];
  assert.match(validate(e).errors.join(' '), /Unknown block source/);
  e.draft.blocks[0].text = '<script>alert(1)</script>';
  assert.match(validate(e).errors.join(' '), /plain text/);
  e.draft.blocks.push({ type: 'table', text: '', items: [], headers: ['a'], rows: [['a', 'b']], sourceIds: ['s0'] });
  assert.match(validate(e).errors.join(' '), /Malformed table/);
  assert.match(validate(ready(), { existing: [{ slug: 'other', title: e.draft.title }] }).errors.join(' '), /Duplicate title/);
  e.draft.execute = 'unexpected';
  assert.match(validate(e).errors.join(' '), /unexpected field/);
});
test('research URLs reject secrets, local targets and unsupported protocols', () => {
  for (const url of ['http://example.com', 'https://localhost', 'https://127.0.0.1/a', 'https://example.com/?token=secret', 'https://user:pass@example.com/a', 'file:///etc/passwd']) assert.equal(publicUrl(url), false);
  assert.equal(publicUrl('https://www.japan.travel/en/au/story/art-calligraphy/'), true);
  assert.equal(overlap('one two three four five', 'zero one two three four five six', 5), true);
});
test('provider rejects incomplete/refused output and does not retry failed requests', async () => {
  for (const result of [{ status: 'incomplete' }, { status: 'completed', output: [{ content: [{ type: 'refusal' }] }] }]) {
    let calls = 0;
    const p = providers({ openaiKey: 'test', firecrawlKey: 'test', model: 'test', fetcher: async () => { calls++; return { ok: true, json: async () => result }; } });
    await assert.rejects(p.complete('article_draft', draftSchema, 'test', {})); assert.equal(calls, 1);
  }
  let calls = 0;
  const p = providers({ openaiKey: 'test', firecrawlKey: 'test', model: 'test', fetcher: async () => { calls++; return { ok: false, status: 429 }; } });
  await assert.rejects(p.scrape('https://example.com/article'), /429/); assert.equal(calls, 1);
  assert.throws(() => providers({}), /Set OPENAI_API_KEY/);
});
test('provider reads the main heading after long navigation and enforces request caps', async () => {
  const p = providers({ openaiKey: 'test', firecrawlKey: 'test', model: 'test', fetcher: async () => ({ ok: true, json: async () => ({ success: true, data: { markdown: 'menu '.repeat(3000) + '\n# Main\nReal source body', metadata: { statusCode: 200 } } }) }) });
  assert.match((await p.scrape('https://example.com/a')).text, /^# Main/);
  await p.scrape('https://example.com/b'); await p.scrape('https://example.com/c');
  await assert.rejects(p.scrape('https://example.com/d'), /budget/);
});
test('generation uses two separate model calls and leaves the article unapproved', async () => {
  const e = ready(); const calls = [];
  const experience = { ...e.product.facts, img: e.image.src, alt: e.image.alt };
  const provider = {
    scrape: async () => ({ title: 'Source', text: 'Independent source information for editorial review.' }),
    complete: async (name, schema, instructions, input) => { calls.push({ name, instructions, input }); return { value: name === 'article_draft' ? e.draft : e.review, model: 'test-only', usage: {} }; },
  };
  const topic = { slug: e.slug, sources: [{ url: e.sources[1].url, kind: 'official' }], imageRightsNote: e.image.rightsNote };
  const output = await generate({ topic, experience, existing: [], provider });
  assert.equal(output.status, 'draft'); assert.equal(output.approval, null);
  assert.deepEqual(calls.map((c) => c.name), ['article_draft', 'article_review']);
  assert.match(calls[0].instructions, /UNTRUSTED DATA/);
  assert.equal(calls[1].input.draft, e.draft);
  await assert.rejects(generate({ topic, experience, existing: [{ slug: e.slug }], provider }), /already exists/);
});
test('drafts stay out of runtime and sitemap; approved articles enter both with real dates', async () => {
  mkdirSync(join(root, 'outputs'), { recursive: true });
  const temp = mkdtempSync(join(root, 'outputs/editorial-test-'));
  try {
    cpSync(join(root, 'lib'), join(temp, 'lib'), { recursive: true });
    cpSync(join(root, 'scripts/editorial'), join(temp, 'scripts/editorial'), { recursive: true });
    cpSync(join(root, 'scripts/generate-sitemap.mjs'), join(temp, 'scripts/generate-sitemap.mjs'));
    cpSync(join(root, 'scripts/sitemap-content.mjs'), join(temp, 'scripts/sitemap-content.mjs'));
    writeFileSync(join(temp, 'package.json'), '{"type":"module"}');
    mkdirSync(join(temp, 'content/journal'), { recursive: true });
    mkdirSync(join(temp, 'public/images'), { recursive: true });
    const e = ready(); writeFileSync(join(temp, 'public', e.image.src), 'image fixture');
    const file = join(temp, 'content/journal', `${e.slug}.json`);
    writeFileSync(file, JSON.stringify(e));
    const command = (...args) => execFileSync(process.execPath, ['scripts/editorial/cli.mjs', ...args], { cwd: temp, stdio: 'pipe' });
    const sitemap = () => execFileSync(process.execPath, ['scripts/generate-sitemap.mjs'], { cwd: temp, stdio: 'pipe' });
    command('compile'); sitemap();
    assert.deepEqual(JSON.parse(readFileSync(join(temp, 'lib/journal.generated.json'), 'utf8')), []);
    assert.ok(!readFileSync(join(temp, 'public/sitemap.xml'), 'utf8').includes(e.slug));
    // Refresh the test's public product snapshot, so normal future catalog updates do not break the fixture.
    const catalog = (await loadData(temp)).catalogFor('en').experiences;
    e.product.facts = factsFor(catalog.find((p) => p.slug === e.product.slug)); e.product.factsHash = hash(e.product.facts);
    e.sources[0].contentHash = hash(JSON.stringify(e.product.facts));
    writeFileSync(file, JSON.stringify(e));
    assert.throws(() => command('approve', e.slug), /Human reviewer/);
    command('approve', e.slug, '--reviewer=test-fixture', '--confirm-content-and-image-rights');
    command('compile'); sitemap();
    const generated = JSON.parse(readFileSync(join(temp, 'lib/journal.generated.json'), 'utf8'));
    assert.equal(generated.length, 1); assert.equal(generated[0].slug, e.slug);
    assert.deepEqual(Object.keys(generated[0].copy), ['en']);
    const xml = readFileSync(join(temp, 'public/sitemap.xml'), 'utf8');
    assert.match(xml, new RegExp(`/en/journal/${e.slug}/</loc>\\s*<lastmod>${generated[0].editorial.updatedAt}</lastmod>`));
    const runtime = await loadData(temp, 'lib/articles.ts');
    assert.ok(runtime.articlesFor('en').some((a) => a.slug === e.slug));
    assert.ok(!runtime.articlesFor('ja').some((a) => a.slug === e.slug));
    const edited = JSON.parse(readFileSync(file, 'utf8')); edited.image.alt = 'Edited without approval'; writeFileSync(file, JSON.stringify(edited));
    assert.throws(() => command('compile'), /invalidated/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
