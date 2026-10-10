import ts from 'typescript';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

// Evaluate the public catalog's DATA, not TS source/comments or private files.
// The same loader handles computed prices and the legacy article inventory.
export async function loadData(root, entry = 'lib/catalog.ts') {
  const out = join(root, 'outputs'); mkdirSync(out, { recursive: true });
  const temp = mkdtempSync(join(out, 'editorial-data-'));
  const seen = new Set();
  function compile(file) {
    if (seen.has(file)) return; seen.add(file);
    let code = ts.transpileModule(readFileSync(join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, resolveJsonModule: true } }).outputText;
    code = code.replace(/from\s+["']@\/([^"']+)["']/g, (_, target) => {
      if (target.endsWith('.json')) {
        const dest = join(temp, `${target}.mjs`); mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, `export default ${readFileSync(join(root, target), 'utf8')};`);
        return `from ${JSON.stringify(pathToFileURL(dest).href)}`;
      }
      compile(`${target}.ts`);
      return `from ${JSON.stringify(pathToFileURL(join(temp, `${target}.mjs`)).href)}`;
    });
    const dest = join(temp, file.replace(/\.ts$/, '.mjs')); mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, code);
  }
  compile(entry);
  return import(pathToFileURL(join(temp, entry.replace(/\.ts$/, '.mjs'))).href);
}
export function factsFor(experience) {
  const keys = ['slug', 'city', 'title', 'tagline', 'overview', 'duration', 'price', 'priceUnit', 'group', 'ages', 'area', 'partySize', 'pricing', 'included', 'notIncluded', 'availability', 'cancellation', 'cancellationTiers', 'faq', 'planText', 'flow', 'interactionNote'];
  const facts = Object.fromEntries(keys.filter((key) => experience[key] !== undefined).map((key) => [key, experience[key]]));
  if (experience.variants) facts.variants = experience.variants.map(({ id, title, tiers, defaultTime }) => ({ id, title, tiers, defaultTime }));
  return facts;
}
