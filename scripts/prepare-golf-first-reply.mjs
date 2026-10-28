// Offline, reviewable first-reply draft. Never sends mail or changes a ledger.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('Usage: node scripts/prepare-golf-first-reply.mjs input.json output-directory');
const data = JSON.parse(await readFile(resolve(input), 'utf8'));
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType: 'custom', configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true } });
try {
  const { golfFirstReplyTemplate } = await vite.ssrLoadModule('/lib/golf-first-reply.ts');
  const draft = golfFirstReplyTemplate(data.enquiry, data.review);
  await mkdir(resolve(output), { recursive: true, mode: 0o700 });
  await writeFile(resolve(output, 'first-reply.txt'), `Subject: ${draft.subject}\n\n${draft.text}`, { flag: 'wx', mode: 0o600 });
  console.log('First-reply draft created. Review before sending; nothing has been sent.');
} finally { await vite.close(); }
