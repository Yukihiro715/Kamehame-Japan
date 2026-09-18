// Legal notice (特定商取引法に基づく表記) and terms of service. The legal notice
// is a Japanese-law disclosure, so Japanese is its binding text; the terms
// bind English-reading guests, so English is theirs. Other locales show the
// English until a native review exists. Prices, cancellation and
// payment mechanics here must match the experience pages and the partner
// sheet — change both together.

import type { Lang } from "@/lib/i18n";

export interface LegalCopy {
  title: string;
  metaDescription: string;
  lead: string;
  rows: [string, string][];
  note?: string;
}

export interface TermsCopy {
  title: string;
  metaDescription: string;
  lead: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

export const LEGAL_UPDATED = "2026-09-15";

const OPERATOR = { ja: "Prosent Inc.", en: "Prosent Inc." };
const ADDRESS_JA = "〒104-0054 東京都中央区勝どき1-3-1 43F";
const ADDRESS_EN = "Kachidoki 1-3-1, 43F, Chuo-ku, Tokyo 104-0054, Japan";
const REP = { ja: "伊藤 千央", en: "Chihiro Ito" };
const EMAIL = "hello@kamehame-japan.com";

const LEGAL_JA: LegalCopy = {
  title: "特定商取引法に基づく表記",
  metaDescription: "KAMEHAME JAPANの販売業者情報、販売価格、支払方法、役務の提供時期、キャンセルに関する特定商取引法に基づく表記。",
  lead: "特定商取引に関する法律第11条に基づき、以下のとおり表示します。",
  rows: [
    ["販売業者", OPERATOR.ja],
    ["運営統括責任者", REP.ja],
    ["所在地", ADDRESS_JA],
    ["電話番号", "ご請求があれば遅滞なく開示します。まずは下記メールアドレスまでご連絡ください。"],
    ["メールアドレス", EMAIL],
    ["サイトURL", "https://kamehame-japan.com/"],
    ["販売価格", "各体験ページに表示する金額(消費税・サービス料込み、日本円)。人数・時期により異なります。"],
    ["商品代金以外に必要な料金", "銀行振込の場合の振込手数料、およびインターネット接続にかかる通信料はお客様のご負担です。上位プラン(三味線の生演奏、出演者2名など)の料金は各体験ページに記載しています。"],
    ["お支払方法", "クレジットカード、または銀行振込"],
    ["お支払時期", "空き状況のご案内に記載の期限内に、ご案内の決済リンクからお支払いください。お支払いをもって条件に同意いただいたものとし、予約が確定します。期限までにお支払いが確認できない場合、お申込みは失効し、費用は発生しません。"],
    ["役務の提供時期", "ご予約確定時に定めた開催日時に、各体験ページ記載の会場にて提供します。"],
    ["申込みの有効期限", "空き状況のお問い合わせは予約の成立ではありません。当社は24時間以内に空き状況・料金・条件をご案内し、ご案内に記載の期限内にお支払いいただいた時点で予約が確定します。芸妓・舞妓など出演者の手配を伴う体験では、予約確定後に受け入れ先が正式な手配を行います(遅くとも開催14日前まで)。"],
    ["キャンセル・返金", "予約確定(お支払い)の時点から、各体験ページに記載のキャンセル規定に基づく取消料を申し受けます(芸妓・舞妓の夕べ:開催14日前まで無料、13〜4日前50%、3日前以降100%。日本時間で起算)。取消料を差し引いた残額は、お支払い時と同じ方法で返金します。受け入れ先の事情(芸妓・舞妓を手配できなかった場合など)により提供できないときは、全額を返金します。"],
    ["最少催行人数・その他の条件", "各体験ページに記載しています(例:2名以上、開催曜日、予約締切)。"],
    ["旅行手配について", "移動・宿泊を伴う手配は、当社の旅行手配パートナーである株式会社ELNX TRAVEL(旅行サービス手配業 東京都知事登録第20922号)が担当します。体験はいずれも現地集合・現地解散で、送迎は含まれません。"],
  ],
};

const LEGAL_EN: LegalCopy = {
  title: "Legal notice",
  metaDescription: "Operator details, prices, payment, timing of service and cancellation, as required under Japan's Act on Specified Commercial Transactions.",
  lead: "Disclosed under Article 11 of Japan's Act on Specified Commercial Transactions. The Japanese version is the binding one.",
  rows: [
    ["Seller", OPERATOR.en],
    ["Person in charge", REP.en],
    ["Address", ADDRESS_EN],
    ["Telephone", "Disclosed without delay on request. Please write to the address below first."],
    ["Email", EMAIL],
    ["Website", "https://kamehame-japan.com/"],
    ["Prices", "As shown on each experience page, in Japanese yen, including consumption tax and service charge. Prices vary by party size and season."],
    ["Costs beyond the price", "Bank transfer fees and your own internet connection costs. Plan upgrades (live shamisen, a second host) are priced on each experience page."],
    ["Payment methods", "Credit card or bank transfer."],
    ["When to pay", "Within the time stated in our availability reply, through the payment link in that reply. Paying is how you accept the conditions and confirm the booking. If payment has not arrived by then, the request lapses and nothing is charged."],
    ["When the service is provided", "At the date and time fixed when the booking was confirmed, at the venue described on the experience page."],
    ["When a booking exists", "An availability request is not a booking. We reply within 24 hours with whether the date is free, the price and the conditions. A booking exists when you accept those conditions by paying through the link we send, within the time stated. Where a performer such as a geiko or maiko must be secured, the house does so after your booking; the formal request is placed no later than 14 days before the date."],
    ["Cancellation and refunds", "Cancellation fees apply from the moment the booking is confirmed (your payment), as stated on each experience page — for the geisha evening: free up to 14 days before the date, 50% from 13 to 4 days before, 100% from 3 days before, counted in Japan time. The balance after fees is refunded by the same method you paid. If the host cannot provide the experience (for example, no geiko or maiko can be secured for your date), you receive a full refund."],
    ["Minimum party and other conditions", "Stated on each experience page (for example: two guests or more, days of operation, booking cutoff)."],
    ["Travel arrangements", "Arrangements involving transport or accommodation are handled by our travel-arrangement partner, ELNX TRAVEL Co., Ltd. (registered travel service arranger, Tokyo Governor No. 20922). Every experience meets and ends on site; transfers are not included."],
  ],
};

const TERMS_JA: TermsCopy = {
  title: "利用規約",
  metaDescription: "KAMEHAME JAPANの体験のお申込み、予約の成立、お支払い、キャンセル、責任の範囲について定めた利用規約。",
  lead: "この規約は、KAMEHAME JAPAN(以下「当サイト」)を通じて体験をお申込みいただく際の条件を定めるものです。お申込みをもって、この規約に同意いただいたものとします。正文は英語版で、この日本語版は参考訳です。",
  updated: "最終更新",
  sections: [
    { heading: "1. 当サイトの役割", body: [
      "当サイトはProsent Inc.(以下「当社」)が運営します。当社は、京都・東京の受け入れ先(料理屋、工房、師匠など。以下「受け入れ先」)が提供する体験を、お客様に代わって手配し、通訳ガイドを同行させます。体験そのものは受け入れ先が提供します。",
      "移動・宿泊を伴う手配は、当社の旅行手配パートナーである株式会社ELNX TRAVELが担当します。体験はいずれも現地集合・現地解散です。",
    ]},
    { heading: "2. お申込みと予約の成立", body: [
      "各体験ページの「空き状況を問い合わせる」からお送りいただく内容は、予約の申込みではなく空き状況の確認依頼です。当社は24時間以内に、空き状況・料金・条件・お支払期限をメールでご案内します。このご案内はまだ予約ではありません。",
      "ご案内に記載の期限内に、ご案内の決済リンクからお支払いいただいた時点で条件に同意したものとして予約が確定し、その時点からキャンセル規定が適用されます。芸妓・舞妓など出演者の手配を伴う体験では、予約確定後に受け入れ先が正式な手配を行います(遅くとも開催14日前まで)。当日の出演者を確保できなかった場合は全額を返金します。",
    ]},
    { heading: "3. 料金とお支払い", body: [
      "料金は各体験ページに表示する日本円の金額で、消費税・サービス料を含みます。人数・時期により異なります。ご案内した金額以外を当日に請求することはありません。",
      "お支払いはクレジットカードまたは銀行振込により、ご案内する期限までにお願いします。お支払いをもって予約が確定します。期限までにお支払いが確認できない場合、お申込みは失効し、費用は発生しません。振込手数料はお客様のご負担です。",
    ]},
    { heading: "4. 変更とキャンセル", body: [
      "予約確定後のお取消し・日程変更・人数の減少には、各体験ページに記載のキャンセル規定に基づく取消料を申し受けます(芸妓・舞妓の夕べ:開催14日前まで無料、13〜4日前50%、3日前以降100%。日本時間で起算)。返金は取消料を差し引いた残額を、お支払い時と同じ方法で行います。",
      "受け入れ先の事情(出演者を手配できない、休業など)や天災・交通機関の運休などにより体験を提供できない場合、当社は代替日程をご提案するか、全額を返金します。それ以上の損害(航空券・宿泊費など)は補償の対象外です。",
    ]},
    { heading: "5. 当日について", body: [
      "集合場所・時刻は予約確定時にご案内します。集合時刻に遅れた場合、体験時間が短縮されることがあり、返金はできません。連絡なく不参加の場合は取消料100%です。",
      "受け入れ先の指示(撮影の可否、飲食、施設内での振る舞いなど)に従ってください。他のお客様や受け入れ先に著しい迷惑を及ぼす行為があった場合、体験を中止することがあり、その場合の返金はありません。",
      "アレルギー・食事制限・移動の制約などは、お申込み時にお知らせください。事前にお知らせのない事項について、当日対応できない場合があります。",
    ]},
    { heading: "6. 責任の範囲", body: [
      "当社は、体験の手配および通訳ガイドの同行について責任を負います。体験中の事故・怪我・物品の破損については、当社または受け入れ先に故意または過失がある場合を除き、責任を負いません。海外旅行保険への加入をおすすめします。",
      "当社の責任は、いかなる場合もお客様が当社に支払った該当体験の料金の額を上限とします。",
    ]},
    { heading: "7. 個人情報", body: [
      "お客様の情報の取り扱いは、当サイトの「プライバシーとCookie」に定めます。",
    ]},
    { heading: "8. 準拠法・管轄", body: [
      "この規約は日本法に準拠します。この規約または体験に関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。",
      "この規約は英語版を正文とし、日本語版を含む他の言語版は参考訳です。内容に相違がある場合は英語版が優先します。",
    ]},
    { heading: "9. 改定", body: [
      "当社はこの規約を改定することがあります。改定後の規約は当サイトに掲載した時点から適用され、下記の日付を更新します。既に確定した予約には、確定時点の規約が適用されます。",
    ]},
  ],
};

const TERMS_EN: TermsCopy = {
  title: "Terms of service",
  metaDescription: "The conditions for requesting and booking an experience through KAMEHAME JAPAN: how a booking comes into being, payment, cancellation and the limits of our responsibility.",
  lead: "These terms govern requests and bookings made through KAMEHAME JAPAN. By sending a request you accept them. This English text is the binding version; other languages are provided for reference.",
  updated: "Last updated",
  sections: [
    { heading: "1. What we do", body: [
      "KAMEHAME JAPAN is operated by Prosent Inc. (\"we\"). We arrange, on your behalf, experiences provided by hosts in Kyoto and Tokyo — dining houses, workshops, masters — and place an interpreter guide at your side. The experience itself is provided by the host.",
      "Arrangements involving transport or accommodation are handled by our travel-arrangement partner, ELNX TRAVEL Co., Ltd. Every experience meets and ends on site.",
    ]},
    { heading: "2. Requests and bookings", body: [
      "What you send through \"Request availability\" is a request to check a date, not a booking. We reply within 24 hours with whether the date is free, the price, the conditions and a payment deadline. That reply is not yet a booking.",
      "A booking exists when you accept those conditions by paying through the link we send, within the time stated, and the cancellation terms apply from that moment. Where a performer such as a geiko or maiko must be secured, the house does so after your booking; the formal request is placed no later than 14 days before the date. If none can be secured for your date, you receive a full refund.",
    ]},
    { heading: "3. Prices and payment", body: [
      "Prices are those shown on each experience page, in Japanese yen, including consumption tax and service charge; they vary by party size and season. Nothing beyond the amount we confirm is charged on the day.",
      "Payment is by credit card or bank transfer, by the deadline we give you. Your payment is what confirms the booking. If payment has not arrived by then, the request lapses and nothing is charged. Bank transfer fees are yours.",
    ]},
    { heading: "4. Changes and cancellation", body: [
      "After confirmation, cancellations, date changes and reductions in party size incur the cancellation fees stated on the experience page (for the geisha evening: free up to 14 days before the date, 50% from 13 to 4 days before, 100% from 3 days before, counted in Japan time). Refunds are made by the same method you paid, less those fees.",
      "If the host cannot provide the experience (no performer available, closure) or it cannot go ahead because of natural disaster or transport suspension, we offer an alternative date or refund you in full. Further losses such as flights or hotels are not covered.",
    ]},
    { heading: "5. On the day", body: [
      "The meeting point and time are given when the booking is confirmed. Arriving late may shorten the experience without refund; not arriving at all, without notice, is a 100% cancellation.",
      "Please follow the host's guidance on photography, food and drink, and conduct in their premises. Behaviour that seriously disturbs other guests or the host may end the experience without refund.",
      "Tell us about allergies, dietary needs and mobility when you request your date; what we do not know in advance may not be accommodated on the day.",
    ]},
    { heading: "6. Our responsibility", body: [
      "We are responsible for arranging the experience and for the interpreter guide. We are not liable for accidents, injury or damage to property during the experience unless caused by our or the host's intent or negligence. Travel insurance is recommended.",
      "In every case our liability is limited to the amount you paid us for the experience concerned.",
    ]},
    { heading: "7. Personal data", body: [
      "How we handle your details is set out in Privacy & cookies on this site.",
    ]},
    { heading: "8. Governing law", body: [
      "These terms are governed by the laws of Japan. The Tokyo District Court has exclusive jurisdiction in the first instance over any dispute arising from them or from an experience.",
      "This English text is authoritative; the Japanese and other language versions are provided for convenience and the English prevails where they differ.",
    ]},
    { heading: "9. Changes to these terms", body: [
      "We may revise these terms. The revised version applies from the moment it is published here, and the date below moves with it. A booking already confirmed stays under the terms in force when it was confirmed.",
    ]},
  ],
};

const TITLES: Record<Lang, { legal: string; terms: string }> = {
  en: { legal: "Legal notice", terms: "Terms of service" },
  ja: { legal: "特定商取引法に基づく表記", terms: "利用規約" },
  es: { legal: "Aviso legal", terms: "Condiciones del servicio" },
  fr: { legal: "Mentions légales", terms: "Conditions d'utilisation" },
  "zh-tw": { legal: "法律聲明", terms: "使用條款" },
};

/** Japanese and English are written; the other locales show the English
 *  text under their own title until a native review exists. */
export function legalFor(lang: Lang): LegalCopy {
  if (lang === "ja") return LEGAL_JA;
  return { ...LEGAL_EN, title: TITLES[lang].legal };
}
export function termsFor(lang: Lang): TermsCopy {
  if (lang === "ja") return TERMS_JA;
  return { ...TERMS_EN, title: TITLES[lang].terms };
}
