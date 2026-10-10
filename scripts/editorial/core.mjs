import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assertSchema, draftSchema, reviewSchema } from './schema.mjs';

export const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const slugOK = (s) => typeof s === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 90;
export const day = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
export function publicUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port &&
      !u.search && !u.hash && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) &&
      !/(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname);
  } catch { return false; }
}
export function readEntries(root) {
  const dir = join(root, 'content/journal');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const e = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (!slugOK(e.slug) || f !== `${e.slug}.json`) throw new Error(`Invalid article filename: ${f}`);
    return e;
  });
}
export function approvalHash(entry) {
  const { approval, status, ...payload } = entry;
  return hash(payload);
}
export function prose(entry) {
  return [entry.draft.title, entry.draft.description, ...entry.draft.blocks.flatMap((b) => [b.text, ...b.items, ...b.headers, ...b.rows.flat()])].join(' ');
}
const words = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
export function overlap(a, b, size = 10) {
  const aa = words(a), bb = words(b);
  const grams = new Set(bb.map((_, i) => bb.slice(i, i + size).join(' ')).filter((s) => s.split(' ').length === size));
  return aa.some((_, i) => i + size <= aa.length && grams.has(aa.slice(i, i + size).join(' ')));
}

export function validate(entry, { root, currentFacts, existing = [], requireApproval = false } = {}) {
  const errors = [], warnings = [];
  try { assertSchema(entry.draft, draftSchema); assertSchema(entry.review, reviewSchema); }
  catch (e) { return { errors: [e.message], warnings }; }
  if (entry.version !== 1 || !slugOK(entry.slug) || entry.language !== 'en') errors.push('Unsupported version, slug, or language');
  if (!['draft', 'published'].includes(entry.status)) errors.push('Invalid status');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.updatedAt) || Number.isNaN(Date.parse(entry.updatedAt))) errors.push('Invalid update date');
  if (!entry.product || !slugOK(entry.product.slug) || !publicUrl(entry.product.url)) errors.push('Invalid product');
  if (entry.product?.url !== `https://kamehame-japan.com/en/${entry.product?.facts?.city}/${entry.product?.slug}/` || entry.product?.facts?.slug !== entry.product?.slug) errors.push('Product URL must match its catalog identity');
  if (!entry.product?.factsHash || hash(entry.product?.facts) !== entry.product.factsHash) errors.push('Fact snapshot was modified');
  if (currentFacts && hash(currentFacts) !== entry.product.factsHash) errors.push('Product conditions changed: regenerate and review');
  if (!entry.image || !/^\/images\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(entry.image.src) || !entry.image.alt || !entry.image.rightsNote) errors.push('Image and rights note required');
  if (root && entry.image && !existsSync(join(root, 'public', entry.image.src))) errors.push('Image file missing');
  const ids = new Set();
  for (const source of entry.sources ?? []) {
    if (ids.has(source.id) || !/^s[0-9]+$/.test(source.id)) errors.push('Invalid or duplicate source id');
    ids.add(source.id);
    if (!publicUrl(source.url) || !source.title || !/^\d{4}-\d{2}-\d{2}$/.test(source.retrievedAt) || Number.isNaN(Date.parse(source.retrievedAt)) || !/^[a-f0-9]{64}$/.test(source.contentHash)) errors.push(`Invalid source ${source.id}`);
    if (!['own', 'official', 'reference'].includes(source.kind)) errors.push(`Invalid source kind: ${source.id}`);
  }
  if (!ids.size || !(entry.sources ?? []).some((s) => s.kind === 'own')) errors.push('Own product source required');
  const own = (entry.sources ?? []).find((s) => s.id === 's0');
  if (own?.kind !== 'own' || own?.url !== entry.product?.url || own?.contentHash !== hash(JSON.stringify(entry.product?.facts))) errors.push('Own source must match the product snapshot');
  if (!entry.draft.blocks.length) errors.push('Article body required');
  for (const block of entry.draft.blocks) {
    if (block.type === 'heading' && !block.text) errors.push('Empty heading');
    if (block.type === 'paragraph' && !block.text) errors.push('Empty paragraph');
    if (block.type === 'list' && !block.items.length) errors.push('Empty list');
    if (block.type === 'table' && (!block.headers.length || !block.rows.length || block.rows.some((r) => r.length !== block.headers.length))) errors.push('Malformed table');
    if (block.type !== 'heading' && !block.sourceIds.length) errors.push('Every factual block needs source references');
    if (block.sourceIds.some((id) => !ids.has(id))) errors.push('Unknown block source');
  }
  if (!entry.draft.claims.length || entry.draft.claims.some((c) => !c.sourceIds.length || c.sourceIds.some((id) => !ids.has(id)) || !c.evidence)) errors.push('Claim evidence required');
  const content = prose(entry);
  if (content.length > 30000 || entry.draft.blocks.length > 35) errors.push('Article exceeds review size limit');
  if (/<\/?[a-z]|https?:\/\/|\]\(|\bTODO\b|\bTBD\b/i.test(content)) errors.push('Use plain text blocks; links belong in sources and product CTA');
  if (/\b(?:sk-[a-zA-Z0-9_-]{15,}|gh[pousr]_[a-zA-Z0-9]+|fc-[a-zA-Z0-9-]{20,})\b/.test(JSON.stringify(entry))) errors.push('Possible credential detected');
  for (const other of existing.filter((e) => e.slug !== entry.slug)) {
    if (other.title?.toLowerCase() === entry.draft.title.toLowerCase()) errors.push(`Duplicate title: ${other.slug}`);
    if (other.text && overlap(content, other.text, 18)) errors.push(`Repeated passage in existing article: ${other.slug}`);
  }
  if (entry.draft.title.length < 15 || entry.draft.title.length > 100 || !entry.draft.description.trim()) errors.push('Title / description missing or excessive');
  if (entry.draft.description.length > 180) warnings.push('説明文が長めです。検索結果で省略される可能性があります。');
  if (words(content).length < 350) warnings.push('短い記事です。読者の疑問に十分答えているか確認してください。');
  if (entry.draft.questionsJa.length) warnings.push(...entry.draft.questionsJa);
  if (entry.review.verdict !== 'pass' || entry.review.blockersJa.length) warnings.push(...entry.review.blockersJa);
  if (requireApproval || entry.status === 'published') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.publishedAt) || Number.isNaN(Date.parse(entry.publishedAt))) errors.push('Publication date required');
    if (entry.review.verdict !== 'pass' || entry.review.blockersJa.length || entry.draft.questionsJa.length) errors.push('Unresolved editorial questions / review blockers');
    if (!entry.approval?.reviewer || !entry.approval?.reviewedAt || !entry.approval?.imageRightsConfirmed || entry.approval?.contentHash !== approvalHash(entry)) errors.push('Human approval missing or invalidated by edits');
  }
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

export function toArticle(entry) {
  return {
    slug: entry.slug, date: entry.publishedAt, minutes: Math.max(1, Math.ceil(words(prose(entry)).length / 200)),
    experiences: [entry.product.slug], img: entry.image.src, alt: entry.image.alt,
    copy: { en: { title: entry.draft.title, standfirst: entry.draft.description, body: [], blocks: entry.draft.blocks } },
    editorial: { updatedAt: entry.updatedAt, author: 'KAMEHAME JAPAN editorial team', sources: entry.sources.map(({ id, url, title, retrievedAt }) => ({ id, url, title, retrievedAt })), imageCredit: entry.image.credit ?? '' },
  };
}
