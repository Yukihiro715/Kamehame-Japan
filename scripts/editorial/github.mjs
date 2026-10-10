// Runs only from trusted main code, never executes a generated branch's code.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { slugOK } from './core.mjs';

const { EDITORIAL_SLUG: slug, EDITORIAL_ACTION: action, GITHUB_ACTOR: actor } = process.env;
if (!slugOK(slug) || !['generate', 'approve'].includes(action)) throw new Error('Invalid workflow input');
const run = (program, args) => execFileSync(program, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const file = `content/journal/${slug}.json`;
const branch = `${action === 'generate' ? 'editorial' : 'editorial-publish'}/${slug}`;
if (process.argv[2] === 'prepare') {
  if (run('git', ['ls-remote', '--heads', 'origin', `refs/heads/${branch}`])) throw new Error(`Branch ${branch} exists. Review its PR before creating another.`);
  if (action === 'generate') {
    const topics = JSON.parse(readFileSync('content/editorial-topics.json', 'utf8'));
    if (!topics.some((t) => t.slug === slug)) throw new Error('Choose a slug from the reviewed queue');
  } else {
    if (process.env.EDITORIAL_CONFIRMED !== 'true') throw new Error('Human content and image-rights confirmation required');
    // Fetch JSON data only. Do not check out or run scripts from this branch.
    run('git', ['fetch', 'origin', `refs/heads/editorial/${slug}`]);
    const raw = run('git', ['show', `FETCH_HEAD:${file}`]);
    if (raw.length > 150000) throw new Error('Draft too large');
    const entry = JSON.parse(raw);
    if (entry.slug !== slug || entry.status !== 'draft') throw new Error('Expected draft');
    mkdirSync('content/journal', { recursive: true }); writeFileSync(file, raw + '\n');
  }
  run('git', ['checkout', '-b', branch]);
} else if (process.argv[2] === 'pr') {
  run('git', ['config', 'user.name', 'github-actions[bot]']);
  run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  run('git', ['add', '--', file]);
  run('git', ['commit', '-m', `${action === 'generate' ? 'Draft' : 'Approve'} journal article: ${slug}`]);
  run('git', ['push', 'origin', `HEAD:refs/heads/${branch}`]);
  const report = readFileSync(`outputs/editorial/${slug}/review.md`, 'utf8');
  const body = `${action === 'generate' ? '未公開の下書きです。本文確認後、Editorial workflow の approve を実行してください。このPRのマージだけでは記事は公開されません。' : `人による確認: ${actor}。このPRをmainにマージすると既存のCloudflareデプロイが記事を公開します。差分とテスト結果を確認してください。`}\n\n本文プレビューはこの実行のArtifactsから取得できます。\n\n${report}`;
  writeFileSync('outputs/editorial/pr-body.md', body);
  console.log(run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--draft', '--title', `${action === 'generate' ? '記事案' : '公開確認'}: ${slug}`, '--body-file', 'outputs/editorial/pr-body.md']));
} else throw new Error('Expected prepare or pr');
