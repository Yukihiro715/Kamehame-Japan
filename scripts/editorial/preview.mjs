import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function preview(root, entry) {
  const out = join(root, 'outputs/editorial', entry.slug); mkdirSync(out, { recursive: true });
  const blocks = entry.draft.blocks.map((b) => {
    if (b.type === 'heading') return `<h2>${escape(b.text)}</h2>`;
    if (b.type === 'list') return `<ul>${b.items.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>`;
    if (b.type === 'table') return `<table><thead><tr>${b.headers.map((s) => `<th>${escape(s)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((s) => `<td>${escape(s)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    return `<p>${escape(b.text)}</p>`;
  }).join('\n');
  writeFileSync(join(out, 'preview.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>Editorial preview</title><style>body{max-width:780px;margin:40px auto;padding:0 24px;font:18px/1.7 Georgia;color:#20382e;background:#faf8f3}h1{font-size:40px;line-height:1.2}img{width:100%;border-radius:8px}aside{font:15px/1.6 sans-serif;padding:18px;background:#ece8dc}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:10px;text-align:left}a{color:#235f48}</style><body><aside>Editorial preview · ${escape(entry.status)} · 本番には未公開／本文確認用</aside><h1>${escape(entry.draft.title)}</h1><p>${escape(entry.draft.description)}</p><img src="https://kamehame-japan.com${escape(entry.image.src)}" alt="${escape(entry.image.alt)}">${blocks}<p><a href="${escape(entry.product.url)}">View the related experience</a></p><h2>Sources</h2><ul>${entry.sources.map((s) => `<li><a href="${escape(s.url)}">${escape(s.title)}</a> (${escape(s.retrievedAt)})</li>`).join('')}</ul></body></html>`);
  const report = `# 記事レビュー: ${entry.draft.title}\n\n状態: ${entry.status} / 自動レビュー: ${entry.review.verdict}\n\n${entry.draft.summaryJa}\n\n独自の価値: ${entry.draft.uniqueValueJa}\n\n## 自動レビュー\n\n${entry.review.summaryJa}\n\n## 確認事項\n\n${[...entry.draft.questionsJa, ...entry.review.blockersJa, ...entry.review.warningsJa].map((q) => `- ${q}`).join('\n') || '- 自動検査の指摘なし。人の確認は必要です。'}\n\n## 画像\n\n${entry.image.rightsNote}\n\n## 出典\n\n${entry.sources.map((s) => `- ${s.id}: ${s.title} — ${s.url} (${s.retrievedAt})`).join('\n')}\n\n## 主張と根拠\n\n${entry.draft.claims.map((c) => `- ${c.claim}\n  - ${c.sourceIds.join(', ')}: ${c.evidence}`).join('\n')}\n\n記事本文、商品条件、出典、写真の利用権を人が確認してください。AI判定は正確性を保証しません。\n`;
  writeFileSync(join(out, 'review.md'), report);
  console.log(`Preview and Japanese review: outputs/editorial/${entry.slug}/`);
}
