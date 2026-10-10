import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData, factsFor } from './catalog.mjs';
import { readEntries, validate, hash, approvalHash, toArticle, day, slugOK, prose } from './core.mjs';
import { providers } from './providers.mjs';
import { generate } from './pipeline.mjs';
import { preview } from './preview.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const [command, slug, ...args] = process.argv.slice(2);
const save = (file, value) => { mkdirSync(resolve(file, '..'), { recursive: true }); writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); };
const catalog = (await loadData(root)).catalogFor('en').experiences;
const entries = readEntries(root);
const current = (entry) => {
  const experience = catalog.find((e) => e.slug === entry.product.slug);
  if (!experience) throw new Error('Related product is no longer published');
  return factsFor(experience);
};
function checked(entry, strict = false) {
  const result = validate(entry, { root, ...(strict ? { currentFacts: current(entry) } : {}) });
  if (result.errors.length) throw new Error(`${entry.slug}: ${result.errors.join('; ')}`);
  return result;
}
async function main() {
  if (command === 'compile' || command === 'check') {
    const published = [];
    for (const entry of entries) {
      const result = checked(entry);
      let drift = false;
      try { drift = hash(current(entry)) !== entry.product.factsHash; } catch { drift = true; }
      if (drift) console.warn(`${entry.slug}: 商品条件が変わったか公開が停止されています。再確認が必要です。`);
      for (const warning of result.warnings) console.warn(`${entry.slug}: ${warning}`);
      if (entry.status === 'published') published.push(toArticle(entry));
    }
    if (command === 'compile') save(join(root, 'lib/journal.generated.json'), published);
    console.log(`${entries.length} editorial records; ${published.length} published`);
    return;
  }
  if (!slugOK(slug)) throw new Error('Supply a valid article/topic slug');
  if (command === 'sample') {
    const entry = JSON.parse(readFileSync(join(root, 'examples/editorial', `${slug}.json`), 'utf8'));
    checked(entry); preview(root, entry); return;
  }
  const file = join(root, 'content/journal', `${slug}.json`);
  if (command === 'generate') {
    if (existsSync(file)) throw new Error('Draft exists; refusing to overwrite it');
    const topics = JSON.parse(readFileSync(join(root, 'content/editorial-topics.json'), 'utf8'));
    const topic = topics.find((t) => t.slug === slug);
    if (!topic) throw new Error('Topic not in the reviewed queue');
    const experience = catalog.find((e) => e.slug === topic.productSlug);
    if (!experience) throw new Error('Product is not published');
    const legacy = await loadData(root, 'lib/articles.ts');
    const existing = [...legacy.articlesFor('en').map((a) => ({ slug: a.slug, title: a.copy.en.title, text: a.copy.en.body.join(' ') })), ...entries.map((e) => ({ slug: e.slug, title: e.draft.title, text: prose(e) }))];
    const provider = providers({ openaiKey: process.env.OPENAI_API_KEY, firecrawlKey: process.env.FIRECRAWL_API_KEY, model: process.env.OPENAI_MODEL });
    const entry = await generate({ topic, experience, existing, provider });
    checked(entry, true); save(file, entry); preview(root, entry);
    console.log(`Draft saved: ${slug}. Human review required.`);
    return;
  }
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) throw new Error('Draft not found');
  if (command === 'preview') { checked(entry); preview(root, entry); return; }
  if (command === 'approve') {
    const reviewer = args.find((a) => a.startsWith('--reviewer='))?.slice(11);
    if (!reviewer || !args.includes('--confirm-content-and-image-rights')) throw new Error('Human reviewer and --confirm-content-and-image-rights are required');
    checked(entry, true);
    if (entry.review.verdict !== 'pass' || entry.review.blockersJa.length || entry.draft.questionsJa.length) throw new Error('Resolve questions/blockers with evidence before approving');
    entry.status = 'published'; entry.publishedAt ||= day(); entry.updatedAt = day();
    entry.approval = { reviewer, reviewedAt: new Date().toISOString(), imageRightsConfirmed: true, contentHash: approvalHash(entry) };
    checked(entry, true); save(file, entry); preview(root, entry);
    console.log('Approved locally. Publication requires merging the reviewed PR into main.');
    return;
  }
  throw new Error('Commands: generate | preview | approve | compile | check | sample');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
