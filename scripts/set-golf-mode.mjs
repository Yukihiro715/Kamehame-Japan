import { readFile, writeFile } from "node:fs/promises";
const mode = process.argv[2];
if (!["package", "arrangement"].includes(mode) || process.argv.length !== 3)
  throw new Error("Usage: npm run golf:mode -- arrangement|package");
const file = new URL("../lib/golf-prices.ts", import.meta.url);
const source = await readFile(file, "utf8");
const pattern = /export const GOLF_MODE: GolfMode = "(package|arrangement)";/g;
if ([...source.matchAll(pattern)].length !== 1) throw new Error("Mode setting has changed; inspect before switching");
await writeFile(file, source.replace(pattern, `export const GOLF_MODE: GolfMode = "${mode}";`));
console.log(`Golf mode: ${mode}. This is a source change only. Test, commit and deploy to apply it. Existing queued emails are unchanged.`);
