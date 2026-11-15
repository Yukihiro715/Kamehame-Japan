import { z } from "zod";

export const PRICE_TYPES = { per_person: "1名あたり・一律", tiered: "人数別の1名単価", private: "1組・貸切", base_plus: "基本料金＋追加人数分", quote: "個別見積もり" } as const;
export const DOCUMENT_KINDS = { retail: "一般向け価格", wholesale: "卸価格・貴社受取額", both: "一般価格と卸価格の両方" } as const;
export const EXTRA_LABELS = { children: "子ども料金・対象年齢", seasonal: "土日祝・繁忙期の料金", options: "通訳・送迎・レンタル等", minimum: "最低請求人数・最低料金", other: "その他の料金条件" } as const;
export const MAX_PLANS = 8, MAX_TIERS = 12;
const text = (max: number) => z.string().trim().max(max).refine(s => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s));
const amount = text(9), count = text(5);
const tierSchema = z.object({ minPeople: count, maxPeople: count, retail: amount, wholesale: amount });
const planSchema = z.object({
  name: text(160), type: z.enum(["", "per_person", "tiered", "private", "base_plus", "quote"]),
  minPeople: count, maxPeople: count, includedPeople: count,
  retail: amount, wholesale: amount, extraRetail: amount, extraWholesale: amount,
  retailUnavailable: z.boolean(), negotiable: z.boolean(), conditions: text(1500),
  tiers: z.array(tierSchema).max(MAX_TIERS),
});
export const pricingDraftSchema = z.object({
  version: z.literal(1), mode: z.enum(["plans", "document"]), plans: z.array(planSchema).max(MAX_PLANS),
  document: z.object({ url: text(1000), priceKind: z.enum(["", "retail", "wholesale", "both"]), negotiable: z.boolean(), receiptNotes: text(2000) }),
  extras: z.object({ children: text(1500), seasonal: text(1500), options: text(2000), minimum: text(1000), other: text(2000) }),
});
export type SupplierPricing = z.infer<typeof pricingDraftSchema>;
export type SupplierPlan = SupplierPricing["plans"][number];
export type SupplierTier = SupplierPlan["tiers"][number];
export const emptyTier = (): SupplierTier => ({ minPeople: "", maxPeople: "", retail: "", wholesale: "" });
export const emptyPlan = (name = "基本プラン"): SupplierPlan => ({ name, type: "", minPeople: "", maxPeople: "", includedPeople: "", retail: "", wholesale: "", extraRetail: "", extraWholesale: "", retailUnavailable: false, negotiable: false, conditions: "", tiers: [emptyTier()] });
export const emptyPricing = (): SupplierPricing => ({ version: 1, mode: "plans", plans: [emptyPlan()], document: { url: "", priceKind: "", negotiable: false, receiptNotes: "" }, extras: { children: "", seasonal: "", options: "", minimum: "", other: "" } });
const integer = (s: string, min: number, max: number) => /^\d+$/.test(s) && Number(s) >= min && Number(s) <= max;
const money = (s: string, zero = false) => integer(s, zero ? 0 : 1, 100_000_000);
const people = (s: string) => integer(s, 1, 10000);

/** Shared client/server validation. Inactive form branches are discarded before delivery. */
export function validateSupplierPricing(raw: unknown, attachmentCount = 0): { data: SupplierPricing; error?: never } | { data?: never; error: string } {
  const parsed = pricingDraftSchema.safeParse(raw);
  if (!parsed.success) return { error: "料金の入力内容・文字数をご確認ください。" };
  const p = parsed.data;
  if (p.mode === "document") {
    p.plans = [];
    if (!p.document.priceKind) return { error: "料金表に記載されている価格の種類を選んでください。" };
    if (!p.document.url && !attachmentCount) return { error: "料金表を添付するか、共有URLを入力してください。" };
    if (p.document.url) {
      try { const u = new URL(p.document.url); if (!["https:", "http:"].includes(u.protocol) || u.username || u.password) throw new Error(); }
      catch { return { error: "料金表の共有URLは、httpまたはhttpsで始まるURLを入力してください。" }; }
    }
    if (p.document.priceKind === "retail" && !p.document.negotiable && !p.document.receiptNotes) return { error: "希望受取額を記入するか、「相談して決めたい」を選んでください。" };
    return { data: p };
  }
  p.document = emptyPricing().document;
  if (!p.plans.length) return { error: "料金プランを1つ以上追加してください。" };
  for (const [i, plan] of p.plans.entries()) {
    const fail = (message: string) => ({ error: `プラン${i + 1}：${message}` });
    if (!plan.name) return fail("プラン名を入力してください。");
    if (!plan.type) return fail("料金の決まり方を選んでください。");
    if (plan.type === "quote") {
      if (!plan.conditions) return fail("見積もりに必要な条件を入力してください。");
      Object.assign(plan, { ...emptyPlan(plan.name), type: "quote", conditions: plan.conditions, tiers: [] });
      continue;
    }
    const priceError = (r: string, w: string, zero = false) => !plan.retailUnavailable && !money(r, zero) ? "一般価格を整数の円で入力するか、「一般向け価格なし」を選んでください。" : !plan.negotiable && !money(w, zero) ? "希望受取額を整数の円で入力するか、「相談して決めたい」を選んでください。" : "";
    if (plan.type === "tiered") {
      if (!plan.tiers.length) return fail("人数別料金を1つ以上追加してください。");
      plan.tiers.sort((a, b) => Number(a.minPeople) - Number(b.minPeople));
      for (const [j, tier] of plan.tiers.entries()) {
        if (!people(tier.minPeople) || !people(tier.maxPeople) || Number(tier.minPeople) > Number(tier.maxPeople)) return fail(`人数帯${j + 1}の最少・最大人数をご確認ください。`);
        if (j && Number(tier.minPeople) <= Number(plan.tiers[j - 1].maxPeople)) return fail("人数帯が重複しています。範囲を分けてください。");
        const error = priceError(tier.retail, tier.wholesale); if (error) return fail(`人数帯${j + 1}：${error}`);
        if (plan.retailUnavailable) tier.retail = "";
        if (plan.negotiable) tier.wholesale = "";
      }
      plan.minPeople = plan.tiers[0].minPeople; plan.maxPeople = plan.tiers.at(-1)!.maxPeople;
      plan.retail = ""; plan.wholesale = "";
    } else {
      plan.tiers = [];
      if (!people(plan.minPeople) || !people(plan.maxPeople) || Number(plan.minPeople) > Number(plan.maxPeople)) return fail("申込可能人数の最少・最大をご確認ください。");
      const error = priceError(plan.retail, plan.wholesale); if (error) return fail(error);
      if (plan.retailUnavailable) plan.retail = "";
      if (plan.negotiable) plan.wholesale = "";
    }
    if (plan.type === "base_plus") {
      if (!integer(plan.includedPeople, 0, 10000) || Number(plan.includedPeople) > Number(plan.maxPeople)) return fail("基本料金に含む人数は、0名から申込可能な最大人数までで入力してください。");
      const error = priceError(plan.extraRetail, plan.extraWholesale, true); if (error) return fail(`追加1名の料金：${error}`);
      if (plan.retailUnavailable) plan.extraRetail = "";
      if (plan.negotiable) plan.extraWholesale = "";
    } else { plan.includedPeople = ""; plan.extraRetail = ""; plan.extraWholesale = ""; }
  }
  return { data: p };
}

const yen = (s: string) => `${Number(s).toLocaleString("ja-JP")}円`;
const range = (min: string, max: string) => min === max ? `${min}名` : `${min}〜${max}名`;
/** Explicit units prevent staff from treating group totals as per-person costs. */
export function formatSupplierPricing(p: SupplierPricing): string {
  const lines = ["【料金条件（税込）】"];
  if (p.mode === "document") {
    lines.push("提出方法：料金表", `資料の価格：${DOCUMENT_KINDS[p.document.priceKind as keyof typeof DOCUMENT_KINDS] || "未選択"}`);
    if (p.document.url) lines.push(`共有URL：${p.document.url}`);
    if (p.document.negotiable) lines.push("希望受取額：相談して決めたい");
    if (p.document.receiptNotes) lines.push(`希望受取額・補足：${p.document.receiptNotes}`);
  } else for (const [i, plan] of p.plans.entries()) {
    lines.push("", `プラン${i + 1}：${plan.name}（${PRICE_TYPES[plan.type as keyof typeof PRICE_TYPES]}）`);
    const prices = (r: string, w: string, unit: string) => `一般価格：${plan.retailUnavailable ? "設定なし" : yen(r) + unit} ／ 希望受取額：${plan.negotiable ? "相談して決めたい" : yen(w) + unit}`;
    if (plan.type === "tiered") {
      lines.push("予約人数に応じて、参加者全員に該当する1名単価を適用。記載のない人数は要確認。");
      for (const tier of plan.tiers) lines.push(`${range(tier.minPeople, tier.maxPeople)}で申込 → ${prices(tier.retail, tier.wholesale, "／名")}`);
    } else if (plan.type !== "quote") {
      lines.push(`申込可能人数：${range(plan.minPeople, plan.maxPeople)}`, prices(plan.retail, plan.wholesale, plan.type === "per_person" ? "／名" : "／組"));
      if (plan.type === "private") lines.push(`上記は${plan.maxPeople}名までの1組の合計料金。`);
      if (plan.type === "base_plus") lines.push(`基本料金に${plan.includedPeople}名を含む。超過人数分のみ加算。`, `追加料金：${prices(plan.extraRetail, plan.extraWholesale, "／追加1名")}`);
    }
    if (plan.conditions) lines.push(`条件：${plan.conditions}`);
  }
  for (const key of Object.keys(EXTRA_LABELS) as (keyof typeof EXTRA_LABELS)[]) if (p.extras[key]) lines.push(`${EXTRA_LABELS[key]}：${p.extras[key]}`);
  return lines.join("\n");
}
