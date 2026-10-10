// The team's own copy of an enquiry: the notification email that lands in
// the hello@ mailbox. Written in Japanese whatever language the visitor used,
// since the people reading it work in Japanese; the visitor's free text is
// quoted as typed. The acknowledgement the visitor received is appended so
// the team can see exactly what was promised, without a BCC on every reply.

import { catalogFor } from "@/lib/catalog";
import type { Enquiry } from "@/lib/contact";
import { yen } from "@/lib/pricing";

const LANG_JA: Record<string, string> = { en: "英語", ja: "日本語", es: "スペイン語", fr: "フランス語", "zh-tw": "繁体字中国語" };

/** The Japanese golf copy, for turning the form's option keys back into words. */
function golfCopyJa(areaId?: string) {
  const golf = catalogFor("ja").experiences.find((x) => x.variants?.some((v) => v.id === areaId) || (!areaId && x.variantCopy));
  return { form: golf?.variantCopy?.form, area: golf?.variants?.find((v) => v.id === areaId) };
}

/** Japanese name of a golf area id ("東京近郊"), falling back to the id. */
export function golfAreaJa(areaId: string): string {
  return golfCopyJa(areaId).area?.short ?? areaId;
}

/** The team's reading of the price master for a golf request, in Japanese. */
export function golfPriceNoteJa(areaId: string, golfers: number, price: { groupTotal: number; perPersonDisplay: number; approximate: boolean } | null, version: string): string {
  const area = golfAreaJa(areaId);
  return price
    ? `${yen(price.groupTotal)} — ${golfers}名パッケージ(${area}・おすすめコース)。1名あたり${price.approximate ? `約${yen(price.perPersonDisplay)}(端数処理)` : yen(price.perPersonDisplay)}。価格表 ${version}。オプションは別途、最終金額はお支払い前に確定。`
    : `個別見積もり — 希望コース指定(${golfers}名・${area})。パッケージ料金は適用なし。価格表 ${version}。`;
}

/** "ゴルファー1: 必要(右利き) · ゴルファー2: 持参する" from the keys the form sent. */
function rentalJa(keys: string, areaId?: string): string | undefined {
  const F = golfCopyJa(areaId).form;
  if (!F) return undefined;
  return keys.split(",").map((k, i) => {
    const [rental, handed] = k.split(":") as [keyof typeof F.rentalOpts, keyof typeof F.handedOpts | undefined];
    const who = F.golferN.replace("{n}", String(i + 1));
    return `${who}: ${F.rentalOpts[rental] ?? rental}${handed ? `(${F.handedOpts[handed] ?? handed})` : ""}`;
  }).join(" · ");
}

function levelJa(key: string, handicap: string | undefined, areaId?: string): string | undefined {
  const F = golfCopyJa(areaId).form;
  if (!F) return undefined;
  const level = F.experienceOpts[key as keyof typeof F.experienceOpts] ?? key;
  return [level, handicap && `${F.handicap.replace(/\s*[(（].*$/, "")}: ${handicap}`].filter(Boolean).join(" · ");
}

export function notificationSubject(e: Enquiry, jaTitle?: string): string {
  if (e.kind === "trade") return `【取引先】${e.company ?? e.name}${e.country ? ` — ${e.country}` : ""}`;
  const what = jaTitle ?? e.experience;
  return `【予約リクエスト】${what ? `${what}${e.areaId ? ` · ${golfAreaJa(e.areaId)}` : ""} — ` : ""}${e.name}${e.dates ? ` — ${e.dates}` : ""}`;
}

/** Plain text, in Japanese. `ack` is the acknowledgement the visitor was sent
 *  in the same batch; null when delivery fell back to a route that sends none. */
export function notificationBody(e: Enquiry, jaTitle?: string, ack?: { subject: string; text: string } | null): string {
  const trade = e.kind === "trade";
  const lang = `${e.lang}${LANG_JA[e.lang] ? `(${LANG_JA[e.lang]})` : ""}`;
  const course = e.courseMode && `${e.courseMode === "specific" ? "希望コース指定(個別見積もり)" : "おすすめコース(標準料金)"}${e.course ? ` — ${e.course}` : ""}${e.courseUrl ? ` (${e.courseUrl})` : ""}`;
  const level = e.levelKey ? levelJa(e.levelKey, e.handicap, e.areaId) ?? e.level : e.level;
  const rental = e.rentalKeys ? rentalJa(e.rentalKeys, e.areaId) ?? e.rental : e.rental;
  const rows: [string, string | undefined][] = [
    ["種別", trade ? "取引先からの問い合わせ" : "お客様からの予約リクエスト"],
    ["体験", e.experience && `${jaTitle ?? e.experience}${jaTitle ? ` (${e.experience})` : ""}`],
    ["お名前", e.name],
    ["メール", e.email],
    ["会社名", e.company],
    ["国", e.country],
    ["プラン", e.plan],
    ["エリア", e.area && `${e.areaId ? `${golfAreaJa(e.areaId)} — ` : ""}${e.area}${e.areaId ? ` (${e.areaId})` : ""}`],
    ["コース", course || undefined],
    ["日程", e.dates],
    ["人数", e.party],
    ["ゴルフ経験", level],
    ["レンタルクラブ", rental],
    ["クラブの希望", e.clubs],
    ["お迎え場所", e.pickup],
    ["WhatsApp", e.whatsapp],
    ["通訳", e.interpreter],
    ["オプション", e.addons],
    ["概算", e.estimate],
    ["料金メモ", e.priceNote],
    ["言語", lang],
    ["自動返信", ack ? `送信済み(${LANG_JA[e.lang] ?? e.lang}、下に全文)` : "⚠️ 未送信 — 予備ルートで配送したため、お客様へ手動で返信してください"],
  ];
  const lines = rows.filter((r): r is [string, string] => !!r[1]).map(([k, v]) => `${k}: ${v}`);
  const out = [...lines, "", "備考:", e.message || "(なし)"];
  if (ack) out.push("", "────────", "お客様への自動返信:", `件名: ${ack.subject}`, "", ack.text);
  return out.join("\n");
}
