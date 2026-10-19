// Offline draft builder: never sends mail, changes Sheets, or calls Stripe.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const [input, output = "outputs/golf-arrangement-draft"] = process.argv.slice(2);
if (!input) throw new Error("Usage: npm run golf:email -- proposal.json [output-directory]");
const root = fileURLToPath(new URL("..", import.meta.url));
const data = JSON.parse(await readFile(resolve(input), "utf8"));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
try {
  const { arrangementPaymentTemplate } = await vite.ssrLoadModule("/lib/golf-arrangement-email.ts");
  const { isArrangement } = await vite.ssrLoadModule("/lib/golf-prices.ts");
  if (!isArrangement()) throw new Error("The site is in package mode; use the package workflow for new enquiries");
  const { CASE_ID } = await vite.ssrLoadModule("/lib/mail-queue.ts");
  if (typeof data.caseId !== "string" || !CASE_ID.test(data.caseId)) throw new Error("An existing ledger caseId is required");
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(data.enquiry?.email ?? "")) throw new Error("Check the customer email");
  const message = arrangementPaymentTemplate(data.enquiry, data.proposal);
  const draft = {
    "案件ID": data.caseId, "種別": "決済案内", "宛先": data.enquiry.email,
    "件名": message.subject, "本文（英語・テキスト）": message.text, "本文HTML（任意）": message.html,
    "承認": "", "状態": "下書き", "作成経路": message.version,
    "日本語訳（確認用）": `手配料のみ ${message.amount.toLocaleString("ja-JP")} 円。返金規定 ${message.policyVersion}／適用確認 ${message.eligibility}。条件・予算・返金規定の書面同意と入金が揃ってから調査開始。提案前は全額、適合提案後は1名10,000円返金、承認済み予約確定＋書面通知後はお客様都合の手配料返金なし。既存の個別合意を必ず確認。2名以上は個別メールで送迎・アシスタント付き案も提案（このリンクは手配料のみ）。私設プランは契約先・決済先・含有費用を案件ごとに確認。`,
  };
  await mkdir(resolve(output), { recursive: true, mode: 0o700 });
  // Refuse to overwrite a prior approved draft or its review files.
  for (const [name, value] of [["email.html", message.html], ["email.txt", message.text], ["queue-draft.json", JSON.stringify(draft, null, 2)]]) {
    await writeFile(resolve(output, name), value, { flag: "wx", mode: 0o600 });
  }
  console.log(`Draft saved to ${resolve(output)}. Not sent or approved. Review it in the existing mail-queue workflow.`);
} finally { await vite.close(); }
