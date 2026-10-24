// The team's own copy of an enquiry: the notification email that lands in
// the hello@ mailbox. Written in Japanese whatever language the visitor used,
// since the people reading it work in Japanese; the visitor's free text is
// quoted as typed. The acknowledgement the visitor received is appended so
// the team can see exactly what was promised, without a BCC on every reply.

import { catalogFor } from "@/lib/catalog";
import type { Enquiry } from "@/lib/contact";
import { yen } from "@/lib/pricing";
import { GOLF_ARRANGEMENT_EXTRA_JPY, GOLF_ARRANGEMENT_FEE_JPY, isArrangement } from "@/lib/golf-prices";
import type { TranslatedField } from "@/lib/translate";

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
    ? isArrangement()
      ? `${yen(price.groupTotal)} — ${golfers}名の手配料(${area}・基本料${yen(GOLF_ARRANGEMENT_FEE_JPY)}${golfers > 1 ? `＋追加${yen(GOLF_ARRANGEMENT_EXTRA_JPY)}×${golfers - 1}名` : ""}、税込)。プレー代・カート・レンタル・昼食は現地精算、送迎は提携会社と直接契約、アシスタント同行は別途見積。価格表 ${version}。`
      : `${yen(price.groupTotal)} — ${golfers}名パッケージ(${area}・おすすめコース)。1名あたり${price.approximate ? `約${yen(price.perPersonDisplay)}(端数処理)` : yen(price.perPersonDisplay)}。価格表 ${version}。オプションは別途、最終金額はお支払い前に確定。`
    : isArrangement()
      ? `個別見積もり — ${golfers}名の手配(${area})。5名以上は手配料をグループごとに見積もり(通常2組以上のティータイム)。価格表 ${version}。`
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

function shoesJa(keys: string, areaId?: string): string | undefined {
  const F = golfCopyJa(areaId).form;
  if (!F) return undefined;
  return keys.split(",").map((k, i) => `${F.golferN.replace("{n}", String(i + 1))}: ${k === "own" ? F.shoeOpts.own : k === "unsure" ? F.shoeOpts.unsure : F.shoeSize.replace("{n}", k)}`).join(" · ");
}

function levelJa(key: string, handicap: string | undefined, areaId?: string): string | undefined {
  const F = golfCopyJa(areaId).form;
  if (!F) return undefined;
  const level = F.experienceOpts[key as keyof typeof F.experienceOpts] ?? key;
  return [level, handicap && `${F.handicap.replace(/\s*[(（].*$/, "")}: ${handicap}`].filter(Boolean).join(" · ");
}

/** Plain text, in Japanese. `ack` is the acknowledgement the visitor was sent
 *  in the same batch; null when delivery fell back to a route that sends none. */
export interface NotificationExtras {
  /** The acknowledgement sent to the visitor in the same batch; null when
   *  delivery fell back to a route that sends none. */
  ack?: { subject: string; text: string } | null;
  /** The scheduled personal follow-up: its text and whether scheduling worked. */
  followUp?: {
    text: string;
    scheduled: boolean;
    delayMinutes: number;
    /** True while the follow-up is switched off (lib/contact.ts FOLLOW_UP_ENABLED): nothing was scheduled on purpose. */
    paused?: boolean;
    /** Resend's scheduled email ID, never an ID supplied by the visitor. */
    emailId?: string;
    /** The exact scheduled_at accepted by Resend, in ISO 8601 UTC. */
    scheduledAt?: string;
  } | null;
  /** Japanese translations of what the visitor typed, by field. */
  ja?: Partial<Record<TranslatedField, string>>;
}

export function notificationBody(e: Enquiry, jaTitle: string | undefined, extras: NotificationExtras = {}): string {
  const { ack = null, followUp = null, ja = {} } = extras;
  const trade = e.kind === "trade";
  const lang = `${e.lang}${LANG_JA[e.lang] ? `(${LANG_JA[e.lang]})` : ""}`;
  const course = e.courseMode && `${e.courseMode === "specific" ? "希望コース指定(個別見積もり)" : "おすすめコース(標準料金)"}${e.course ? ` — ${e.course}` : ""}${e.courseUrl ? ` (${e.courseUrl})` : ""}`;
  const level = e.levelKey ? levelJa(e.levelKey, e.handicap, e.areaId) ?? e.level : e.level;
  const rental = e.rentalKeys ? rentalJa(e.rentalKeys, e.areaId) ?? e.rental : e.rental;
  // The visitor's own words, followed by their machine translation when the
  // page was not Japanese. The original always stays: the translation is an aid.
  const needsJa = e.lang !== "ja";
  const t = (label: string, field: TranslatedField, value: string | undefined): [string, string | undefined][] =>
    value ? [[label, value], ...(needsJa ? [[`${label}(日本語訳)`, ja[field] ?? "(自動翻訳できませんでした)"] as [string, string]] : [])] : [[label, undefined]];
  const rows: [string, string | undefined][] = [
    ["お名前", e.name],
    ["種別", trade ? "取引先からの問い合わせ" : "お客様からの予約リクエスト"],
    ["体験", e.experience && `${jaTitle ?? e.experience}${jaTitle ? ` (${e.experience})` : ""}`],
    ["メール", e.email],
    ["会社名", e.company],
    ["国", e.country],
    ...t("プラン", "plan", e.plan),
    ["エリア", e.area && `${e.areaId ? `${golfAreaJa(e.areaId)} — ` : ""}${e.area}${e.areaId ? ` (${e.areaId})` : ""}`],
    ...(e.courseMode === "specific" && e.course ? t("コース", "course", course || undefined) : [["コース", course || undefined] as [string, string | undefined]]),
    ...(trade ? t("日程", "dates", e.dates) : [["日程", e.dates] as [string, string | undefined]]),
    ...(trade ? t("人数", "party", e.party) : [["人数", e.party] as [string, string | undefined]]),
    ...(e.levelKey ? [["ゴルフ経験", level] as [string, string | undefined]] : t("ゴルフ経験", "level", level)),
    ...(e.rentalKeys ? [["レンタルクラブ", rental] as [string, string | undefined]] : t("レンタルクラブ", "rental", rental)),
    ["レンタルシューズ", e.shoeKeys ? shoesJa(e.shoeKeys, e.areaId) ?? e.shoes : e.shoes],
    ...t("クラブの希望", "clubs", e.clubs),
    ...t("お迎え場所", "pickup", e.pickup),
    ["送迎都県", e.pickupRegion],
    ["キャディ", e.areaId ? (e.caddie === "required" ? "あり希望" : e.caddie === "none" ? "なし" : "未確認") : undefined],
    ["アシスタント同行", e.assistant ? (e.assistant === "required" ? "希望あり(別途見積)" : e.assistant === "none" ? "不要" : "相談したい") : undefined],
    ["送迎(提携会社紹介)", e.transfer ? (e.transfer === "introduce" ? "紹介を希望 → 提携会社へ直接つなぐ" : e.transfer === "none" ? "不要(自力で移動)" : "相談したい") : undefined],
    ["WhatsApp", e.whatsapp],
    ...t("通訳", "interpreter", e.interpreter),
    ...t("オプション", "addons", e.addons),
    ...(e.areaId ? [["概算", e.estimate] as [string, string | undefined]] : t("概算", "estimate", e.estimate)),
    ["料金メモ", e.priceNote],
    ["個別提案方針", !trade && isArrangement() && e.experience === "mt-fuji-golf-day" && Number(e.party) >= 2 ? "手配のみ／プレミアム車両往復送迎・英語アシスタント付きの2案を個別メールで提案。送迎不要の意向は尊重。後者はサイト掲載・自動決済案内の対象外。日程・人数・ホテル・レンタル・契約先・決済先・総額・取消条件を確認して個別見積もり。既存のキャンペーン額は自動適用しない。" : undefined],
    ...t("備考", "message", e.message || undefined),
    ...(e.message ? [] : [["備考", "(なし)"] as [string, string]]),
    ["言語", lang],
    ["自動返信", ack ? `送信済み(${LANG_JA[e.lang] ?? e.lang}、下に全文)` : "⚠️ 未送信 — 予備ルートで配送したため、お客様へ手動で返信してください"],
    ["フォローアップ", trade ? undefined : followUp?.paused ? "一時停止中(文面を改善中のため自動送信なし) — 担当者からの最初のメールを手動で送ってください" : followUp?.scheduled ? `${followUp.delayMinutes}分後にゆきひろ名義で自動送信(予約済み、下に全文)` : "⚠️ 自動送信できていません — 担当者からの最初のメールを手動で送ってください"],
  ];
  const lines = rows.filter((r): r is [string, string] => !!r[1]).map(([k, v]) => `${k}: ${v}`);
  const out = [...lines];
  // An authenticated provider link, not a public cancellation endpoint. Opening
  // it does not change the schedule (including when a mail scanner follows it).
  // This section belongs only to the internal notification, never customer copy.
  if (!trade && followUp?.scheduled && followUp.emailId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(followUp.emailId)) {
    const time = followUp.scheduledAt ? new Date(followUp.scheduledAt) : null;
    const scheduledJst = time && Number.isFinite(time.getTime())
      ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(time)
      : null;
    out.push(
      "", "────────", "【社内用】手動でメールを送ったら、15分後メールを停止",
      `対象: ${e.name} <${e.email}>${e.dates ? ` / ${e.dates}` : ""}`,
      ...(scheduledJst ? [`自動フォロー送信予定: ${scheduledJst}（日本時間）※予約時点の予定`] : []),
      `停止・状況確認: https://resend.com/emails/${followUp.emailId}`,
      "操作: Resendにログイン → 宛先・件名を確認 → 右上の「…」(More actions) →「Cancel schedule」→ 確認画面が出たら確定。",
      "停止後は「Canceled」の表示を確認してください。リンクを開くだけでは停止しません。",
      "Gmailで返信しても自動停止しません。上記の送信予定時刻より前に操作してください。送信済みのメールは取り消せません。",
      `フォローアップ管理ID: ${followUp.emailId}`,
    );
  }
  if (ack) out.push("", "────────", "お客様への自動返信:", `件名: ${ack.subject}`, "", ack.text);
  if (followUp?.scheduled) out.push("", "────────", `${followUp.delayMinutes}分後の自動フォローアップ(同じ件名):`, "", followUp.text);
  return out.join("\n");
}
