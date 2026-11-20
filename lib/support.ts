// Travel support: services that sit beside the experiences rather than among
// them — babysitting at the guest's hotel (taking requests), private and
// airport transfers, interpreter guides and a travel planner (coming soon).
//
// Babysitting is sold as KAMEHAME JAPAN's own product and arranged with
// vetted local agencies; no agency name, logo, contact or booking link appears
// on the page, and nothing below describes one agency's materials, prices or
// conditions. The fee is quoted per request.

import type { Lang } from "@/lib/i18n";

export type SupportSlug = "babysitter" | "transfer" | "interpreter" | "planner";

export interface SupportService {
  slug: SupportSlug;
  /** Only live services link to a page and take requests; the rest show "Coming soon". */
  live: boolean;
  img: string;
}

export const SUPPORT_SERVICES: SupportService[] = [
  { slug: "babysitter", live: true, img: "/images/support-babysitter.webp" },
  { slug: "transfer", live: false, img: "/images/support-transfer.webp" },
  { slug: "interpreter", live: false, img: "/images/support-interpreter.webp" },
  { slug: "planner", live: false, img: "/images/support-planner.webp" },
];

/** Licensed stock photos (PIXTA, standard licence). More follow once chosen. */
export const BABYSITTER_PHOTOS = [
  { img: "/images/support-babysitter.webp" },
  { img: "/images/support-babysitter-2.webp" },
  { img: "/images/support-babysitter-3.webp" },
  { img: "/images/support-babysitter-4.webp" },
  { img: "/images/support-babysitter-5.webp" },
];

export interface SupportCopy {
  nav: string;
  /** Section and index page */
  eyebrow: string;
  title: [string, string];
  lead: string;
  indexLead: string;
  all: string;
  comingSoon: string;
  comingSoonBody: string;
  category: string;
  services: Record<SupportSlug, { title: string; line: string; alt: string; facts: string[] }>;
  /** The banner on experience pages */
  banner: { kicker: string; title: string; body: string; cta: string };
  /** The babysitter page */
  baby: {
    h1: string;
    tagline: string;
    conditions: string[];
    photoAlts: string[];
    aboutH: string;
    about: string[];
    scenesH: string;
    scenes: { title: string; body: string }[];
    careH: string;
    careLead: string;
    care: string[];
    notCare: string;
    priceH: string;
    priceLead: string;
    /** Labels for the fee table; figures come from lib/support-fees.ts. */
    fee: { perHour: string; english: string; japanese: string; minimum: (h: number) => string; night: string; weekend: string; peak: string; bath: string; perTime: string; second: (pct: number, older: number) => string; third: string; notice2: string; notice1: string; transport: string; transportNote: string; cancelH: string; cancel: string[]; note: string };
    price: string[];
    flowH: string;
    flow: { title: string; body: string }[];
    faqH: string;
    faq: { q: string; a: string }[];
    /** The request card beside the page */
    card: { eyebrow: string; title: string; body: string; cta: string; points: string[] };
    requestH: string;
    requestLead: string;
  };
  form: {
    date: string; place: string; placeOpts: Record<"hotel" | "apartment" | "venue" | "other", string>; placeDetail: string; placeDetailHint: string;
    start: string; end: string; children: string; ages: string; agesHint: string;
    language: string; languageOpts: Record<"en" | "ja" | "zh" | "other", string>;
    golf: string; golfVenue: string; golfVenueHint: string; travel: string;
    name: string; email: string; whatsapp: string; notes: string; notesHint: string;
    send: string; sending: string; after: string; privacy: string; failed: string;
    /** Labels echoed in the acknowledgement and the team's record */
    labels: { service: string; date: string; place: string; hours: string; children: string; ages: string; language: string; golfVenue: string; travel: string; travelYes: string; notes: string };
    thanksNote: string;
  };
  mail: { subject: (d?: string) => string; thanks: string; next: string };
}

const en: SupportCopy = {
  nav: "Travel support",
  eyebrow: "Travel support",
  title: ["Help around", "the experience."],
  lead: "A babysitter while you are at an experience in Japan, transfers between your hotel and the venue or a private car for the day, an interpreter guide for a day, planning for the whole trip. One contact for all of it: KAMEHAME JAPAN.",
  indexLead: "A babysitter while you are at an experience in Japan, transfers between your hotel and the venue or a private car for the day, an interpreter guide for a day, planning for the whole trip. One contact for all of it: KAMEHAME JAPAN. Babysitting takes requests now; the others open soon.",
  all: "All travel support",
  comingSoon: "Coming soon",
  comingSoonBody: "Not open for requests yet. We will list it here as soon as it is ready.",
  category: "Travel support",
  services: {
    babysitter: { title: "Babysitting during your experience", line: "An English-speaking, screened sitter looks after the children at your hotel or apartment while you are at an experience or out for the evening.", alt: "A babysitter reading a picture book with a young child", facts: ["Tokyo · Yokohama · Kyoto · Osaka", "Ages 0–12", "Quoted per request"] },
    transfer: { title: "Transfers & private car", line: "Airport pick-up, a return transfer between your hotel and the experience venue, or a car with driver for the whole day.", alt: "A driver holding the door of a private car", facts: ["Airport · hotel ↔ venue · full day", "Driver included"] },
    interpreter: { title: "Interpreter guide for the day", line: "A licensed guide-interpreter beside you for a day of experiences, shopping, sightseeing or meetings.", alt: "A guide explaining a sight to visitors", facts: ["English · Chinese · more on request", "Half day · full day"] },
    planner: { title: "Travel planner", line: "From the shape of your days in Japan to the bookings behind them: experiences, restaurants, transport, in one plan.", alt: "A group of visitors with a map and a Tokyo guidebook in the street", facts: ["Whole-trip planning", "Bookings handled"] },
  },
  banner: { kicker: "Travel support", title: "Support during your trip, from KAMEHAME JAPAN", body: "A babysitter while you are at this experience, an interpreter guide, transfers, planning for the rest of your days in Japan. One contact for all of it.", cta: "See travel support" },
  baby: {
    h1: "Babysitting at your hotel, in English",
    tagline: "A screened, English-speaking babysitter comes to your hotel or apartment while you play golf, go to dinner or take an experience that is not for children. Arranged by KAMEHAME JAPAN with vetted local agencies, quoted per request, with one contact throughout: us.",
    conditions: ["Tokyo · Yokohama · Kyoto · Osaka (other cities on request)", "Ages 0–12", "English-speaking sitters", "Quoted per request"],
    photoAlts: ["A babysitter reading a picture book with a toddler on her lap", "A sitter reading to four children of different backgrounds", "A sitter and a girl reading together on a sofa", "A sitter playing with a girl in a bright bedroom", "A boy reading a picture book on a bed"],
    aboutH: "How it works",
    about: [
      "Tell us the date, where the children will be, the hours, their ages and the language you would like. We check a sitter's availability with our partner agencies and send you a quote, usually within one business day. Nothing is paid until you confirm.",
      "The sitter comes to you: your hotel room, a serviced apartment, or in some cases the venue of your experience. They bring what they need to play, read and keep the children's routine; meals and bedtimes follow your instructions. You receive a short written note of how the hours went.",
      "Sitters are screened, trained and insured by the agencies we work with, and they speak English; Japanese is always possible and other languages can sometimes be arranged. KAMEHAME JAPAN stays your single point of contact before, during and after.",
    ],
    scenesH: "When guests use it",
    scenes: [
      { title: "A golf day", body: "An early start and a long day away from the hotel. The sitter arrives before your transfer and stays until you are back; travel time to and from the course can be included in the care hours." },
      { title: "Dinner and evenings", body: "A geiko evening in Kyoto, an omakase counter, a late izakaya. Evening care in the room, with bedtime handled the way you do it at home." },
      { title: "Adults-only experiences", body: "Sake and whisky tastings, clinic appointments, a spa afternoon. The children keep their day while you keep yours." },
      { title: "A quiet half day", body: "Shopping, a museum, or simply a few hours of rest on a long trip." },
    ],
    careH: "What a sitter can do",
    careLead: "Tell us what matters to you and we brief the sitter before the day.",
    care: ["Play and read in English, indoors or in the hotel's play area", "Meals and snacks you have prepared or ordered, and feeding for infants", "Naps, bath time and the bedtime routine", "Short walks nearby, with your permission", "Simple homework or quiet activities for older children", "A written note of the hours at the end"],
    notCare: "Sitters do not drive, give medication other than what you have left clear written instructions for, or care for a child who is unwell with a fever; tell us about allergies and medical needs when you request so we can say in advance what is possible.",
        priceH: "Fees",
    priceLead: "Guide prices, tax included. Your quote confirms the exact amount for your dates before anything is booked.",
    fee: { perHour: "per hour", english: "English-speaking sitter", japanese: "Japanese-speaking sitter", minimum: (h) => `Minimum ${h} hours per booking, then in 30-minute steps`, night: "Night and early morning (20:00–8:00)", weekend: "Weekends and public holidays", peak: "Golden Week, Obon, New Year", bath: "Bath assistance", perTime: "per time", second: (pct, older) => `Second child: +${pct}% of the hourly fee (+${older}% when either child is four or older)`, third: "Third child at the same time: no extra charge", notice2: "Requests after 18:00 two business days before", notice1: "Requests after 18:00 one business day before", transport: "Sitter's transport", transportNote: "at cost", cancelH: "Cancellation", cancel: ["Free until 18:00 two business days before", "50% of the fee after that", "100% after 18:00 one business day before"], note: "Weekday 8:00–20:00 is the standard rate. Payment by card link once you confirm the quote; nothing is charged before." },
    price: ["An hourly rate for the hours you book, with a minimum booking length", "Early mornings, late evenings, weekends and public holidays carry a surcharge", "A second child usually costs a reduced additional rate", "The sitter's transport to your hotel is added at cost", "Short notice (under a week) may not be available or may carry a surcharge", "Payment by card link once you confirm; cancellation terms come with the quote"],
    flowH: "From request to the day",
    flow: [
      { title: "Send the request", body: "Date, place, hours, children's ages, language and how to reach you. It costs nothing." },
      { title: "Quote and availability", body: "We check with our partner agencies and reply with the fee and a sitter's availability, usually within one business day." },
      { title: "Confirm and pay", body: "You confirm by card link. We send the sitter's profile and a short introduction before the day." },
      { title: "The day", body: "The sitter arrives at the agreed time with ID. You leave your instructions and go. We are reachable throughout." },
    ],
    faqH: "Questions",
    faq: [
      { q: "Which languages do sitters speak?", a: "English is standard. Japanese is always available, and Chinese or other languages can sometimes be arranged; tell us when you request." },
      { q: "How are sitters screened?", a: "Through the agencies we work with: identity and background checks, interviews, training and insurance. We only work with agencies whose screening we have reviewed ourselves." },
      { q: "Can the sitter come to the golf club or the restaurant?", a: "Usually the sitter cares for the children at your hotel, which is calmer for them. Care at a venue is possible when the venue agrees and has a suitable room; ask us and we check." },
      { q: "How much notice do you need?", a: "A week or more is ideal. We can often arrange shorter notice, sometimes with a surcharge; it is always worth asking." },
      { q: "Can one sitter look after two children?", a: "Yes, for most ages. For three or more children, or more than one infant, we may propose two sitters." },
      { q: "What about a baby under one?", a: "Yes, from newborn in most cities. Tell us feeding and sleeping routines and we brief the sitter." },
      { q: "What if my child is ill on the day?", a: "Sitters do not care for a child with a fever or a contagious illness. Tell us as early as you can; the cancellation terms in your quote apply, and we do what we can." },
      { q: "Who do I talk to on the day?", a: "Us. You get a number for the day with your confirmation, and the sitter's agency is reachable through us at any time." },
    ],
    card: { eyebrow: "Travel support", title: "Request a quote", body: "Tell us the date, the place and the hours. We reply with the fee and a sitter's availability, usually within one business day.", cta: "Request a quote", points: ["No payment now", "Reply within one business day", "One contact: KAMEHAME JAPAN"] },
    requestH: "Request a babysitting quote",
    requestLead: "The more you tell us, the faster the quote. Nothing is booked or charged until you confirm.",
  },
  form: {
    date: "Date", place: "Where the children will be", placeOpts: { hotel: "Our hotel", apartment: "Serviced apartment / rental", venue: "At the venue of our experience", other: "Somewhere else" }, placeDetail: "Hotel or address", placeDetailHint: "e.g. Park Hyatt Tokyo, or the area if not booked yet",
    start: "Care starts", end: "Care ends", children: "Number of children", ages: "Ages", agesHint: "e.g. 2 and 5",
    language: "Preferred language of the sitter", languageOpts: { en: "English", ja: "Japanese", zh: "Chinese", other: "Other (tell us in the notes)" },
    golf: "We will be playing golf (or at a venue away from the hotel)", golfVenue: "Where you will be", golfVenueHint: "e.g. the golf course or the restaurant", travel: "Please include our travel time to and from the venue in the care hours",
    name: "Your name", email: "Email", whatsapp: "WhatsApp (optional)", notes: "Allergies, medical needs, routines, anything else (optional)", notesHint: "e.g. the youngest naps 13:00–15:00; nut allergy",
    send: "Request a quote", sending: "Sending…", after: "Sending this request does not book anything. We reply with the fee and availability; you confirm afterwards.", privacy: "We use what you send only to answer you.", failed: "The request could not be sent. Please email us at",
    labels: { service: "Service", date: "Date", place: "Place", hours: "Hours", children: "Children", ages: "Ages", language: "Language", golfVenue: "Venue", travel: "Travel time", travelYes: "Include travel to and from the venue", notes: "Notes" },
    thanksNote: "We check a sitter's availability and send you the fee, usually within one business day.",
  },
  mail: { subject: (d) => `Your babysitting request${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`, thanks: "Thank you for your babysitting request. We are checking a sitter's availability with our partner agencies and will send you the fee, usually within one business day, Japan time.", next: "This is not a confirmation yet. Nothing is booked or charged until you have seen the quote and chosen to go ahead." },
};

const ja: SupportCopy = {
  nav: "旅行サポート",
  eyebrow: "旅行サポート",
  title: ["体験のまわりを、", "ととのえる。"],
  lead: "日本でのアクティビティ体験中のシッターサービス、ホテルや体験施設までの往復送迎・1日貸切車両、1日の通訳ガイド、旅行全体のプランニング。窓口はKAMEHAME JAPANひとつで可能です。",
  indexLead: "日本でのアクティビティ体験中のシッターサービス、ホテルや体験施設までの往復送迎・1日貸切車両、1日の通訳ガイド、旅行全体のプランニング。窓口はKAMEHAME JAPANひとつで可能です。ベビーシッターは受付中、ほかは順次開始します。",
  all: "旅行サポート一覧",
  comingSoon: "準備中",
  comingSoonBody: "まだ受付を開始していません。準備ができ次第ここに掲載します。",
  category: "旅行サポート",
  services: {
    babysitter: { title: "体験中のベビーシッター", line: "体験や夜の外出の間、英語の話せる審査済みシッターがホテルや滞在先でお子さまをお預かりします。", alt: "絵本を読み聞かせるベビーシッターと子ども", facts: ["東京・横浜・京都・大阪", "0〜12歳", "個別見積もり"] },
    transfer: { title: "往復送迎・1日貸切車両", line: "空港送迎、ホテルと体験施設の往復送迎、1日貸切のドライバー付き車両。", alt: "送迎車のドアを開けるドライバー", facts: ["空港・ホテル⇄体験施設・1日貸切", "ドライバー付き"] },
    interpreter: { title: "1日の通訳ガイド", line: "体験、買い物、観光、商談に1日同行する通訳案内士。", alt: "来訪者に名所を説明するガイド", facts: ["英語・中国語ほか", "半日・1日"] },
    planner: { title: "旅行プランナー", line: "日本での滞在日程の組み立てから、体験・レストラン・移動の手配まで、旅全体をひとつのプランに。", alt: "地図と東京のガイドブックを広げる外国人旅行者のグループ", facts: ["旅全体のプランニング", "手配込み"] },
  },
  banner: { kicker: "旅行サポート", title: "旅行中のサポートはKAMEHAME JAPANへ", body: "体験中のベビーシッター、通訳ガイド、送迎、旅全体のプランニング。旅行中の困りごとはひとつの窓口でご相談ください。", cta: "旅行サポートを見る" },
  baby: {
    h1: "ホテルで受けられる英語ベビーシッター",
    tagline: "ゴルフ、夕食、お子さま向けではない体験の間、審査済みの英語が話せるシッターがホテルや滞在先に伺います。KAMEHAME JAPANが提携する保育事業者と手配し、料金は都度お見積もり。窓口は最後までKAMEHAME JAPANです。",
    conditions: ["東京・横浜・京都・大阪（他都市は応相談）", "0〜12歳", "英語の話せるシッター", "個別見積もり"],
    photoAlts: ["膝の上の幼児に絵本を読み聞かせるベビーシッター", "さまざまな国の4人の子どもに絵本を読むシッター", "ソファで一緒に絵本を読むシッターと女の子", "明るい寝室で女の子と遊ぶシッター", "ベッドで絵本を読む男の子"],
    aboutH: "仕組み",
    about: [
      "日程、お子さまが過ごす場所、時間帯、年齢、希望の言語をお知らせください。提携事業者にシッターの空きを確認し、通常1営業日以内にお見積もりをお送りします。確定までお支払いはありません。",
      "シッターはお客様のもとへ伺います。ホテルの客室、サービスアパートメント、場合によっては体験の会場へ。遊びや読み聞かせの道具を持参し、食事や就寝はご指示どおりに。終了時に簡単な報告をお渡しします。",
      "シッターは提携事業者が審査・研修・保険加入のうえで派遣し、英語を話します。日本語は常に可能で、他の言語も手配できる場合があります。前後のご連絡はすべてKAMEHAME JAPANが窓口です。",
    ],
    scenesH: "こんな場面で",
    scenes: [
      { title: "ゴルフの日", body: "朝が早く、ホテルを長く離れる日。送迎の出発前にシッターが到着し、戻るまで滞在します。ゴルフ場との往復の移動時間も保育時間に含められます。" },
      { title: "夕食と夜", body: "京都の芸妓の夕べ、おまかせのカウンター、遅い時間の居酒屋。客室での夜の保育と、ご家庭と同じ流れの寝かしつけ。" },
      { title: "大人向けの体験", body: "日本酒やウイスキーのテイスティング、クリニックの予約、スパの午後。お子さまはお子さまの1日を、ご夫婦はご自分の時間を。" },
      { title: "静かな半日", body: "買い物、美術館、あるいは長旅の途中の数時間の休息に。" },
    ],
    careH: "シッターにお願いできること",
    careLead: "大切にしていることをお知らせください。当日前にシッターへ伝えます。",
    care: ["室内やホテルのキッズスペースでの英語での遊び・読み聞かせ", "ご用意いただいた食事・おやつ、乳児の授乳", "お昼寝、入浴、寝かしつけ", "許可をいただいた近くの散歩", "年長のお子さまの簡単な宿題や静かな活動", "終了時の簡単な報告"],
    notCare: "運転、書面の指示がない投薬、発熱など体調の悪いお子さまの保育はお受けできません。アレルギーや医療上の配慮はお申し込み時にお知らせください。事前に可否をお伝えします。",
        priceH: "料金",
    priceLead: "税込の目安料金です。手配前にお見積もりで日程ごとの正確な金額を確認いただきます。",
    fee: { perHour: "／時間", english: "英語の話せるシッター", japanese: "日本語のシッター", minimum: (h) => `1回あたり最低${h}時間、以降30分単位`, night: "夜間・早朝（20:00〜8:00）", weekend: "土日祝", peak: "GW・お盆・年末年始", bath: "入浴補助", perTime: "／回", second: (pct, older) => `2人目のお子さま：時間料金の+${pct}%（どちらかが4歳以上なら+${older}%）`, third: "3人同時：3人目は無料", notice2: "2営業日前18:00以降のご依頼", notice1: "1営業日前18:00以降のご依頼", transport: "シッターの交通費", transportNote: "実費", cancelH: "取消規定", cancel: ["2営業日前18:00まで無料", "以降は料金の50%", "1営業日前18:00以降は100%"], note: "平日8:00〜20:00が基準料金です。お支払いはお見積もり確定後にカード決済リンクで。それまで請求はありません。" },
    price: ["ご予約時間に対する時間料金。最低利用時間があります", "早朝・夜間・週末・祝日は割増", "2人目のお子さまは通常、割安な追加料金", "シッターの交通費は実費", "1週間を切るご依頼は手配できない、または割増となる場合があります", "確定後にカード決済リンクでお支払い。取消規定はお見積もりに記載"],
    flowH: "お申し込みから当日まで",
    flow: [
      { title: "リクエストを送る", body: "日程、場所、時間帯、お子さまの年齢、言語、連絡先。費用はかかりません。" },
      { title: "見積もりと空き確認", body: "提携事業者に確認し、料金とシッターの空きを通常1営業日以内にご返信します。" },
      { title: "確定とお支払い", body: "カード決済リンクで確定。当日前にシッターのプロフィールと簡単な紹介をお送りします。" },
      { title: "当日", body: "シッターが身分証を持って約束の時間に到着。ご指示を残してお出かけください。KAMEHAME JAPANに終日連絡がつきます。" },
    ],
    faqH: "よくある質問",
    faq: [
      { q: "シッターは何語を話しますか？", a: "英語が標準です。日本語は常に可能、中国語などは手配できる場合があります。お申し込み時にお知らせください。" },
      { q: "シッターの審査は？", a: "提携事業者が身元確認、面接、研修、保険加入を行います。審査内容を私たち自身で確認した事業者とだけ提携しています。" },
      { q: "ゴルフ場やレストランまで来てもらえますか？", a: "通常はホテルでお預かりします。お子さまにとって落ち着いて過ごせるためです。会場側の了承と適した部屋があれば会場での保育も可能です。ご相談ください。" },
      { q: "どのくらい前に申し込めばいいですか？", a: "1週間以上前が理想です。それより短くても手配できることが多く、割増になる場合があります。まずはお問い合わせください。" },
      { q: "1人のシッターで2人見てもらえますか？", a: "多くの年齢で可能です。3人以上、または乳児が複数の場合は2人のシッターをご提案することがあります。" },
      { q: "1歳未満の赤ちゃんも？", a: "多くの都市で新生児からお受けします。授乳と睡眠のリズムをお知らせください。" },
      { q: "当日、子どもが体調を崩したら？", a: "発熱や感染症の疑いがある場合はお預かりできません。できるだけ早くお知らせください。お見積もりの取消規定に従い、できる限り対応します。" },
      { q: "当日の連絡先は？", a: "KAMEHAME JAPANです。確定時に当日の連絡先をお伝えし、事業者へもいつでも私たちを通じて連絡できます。" },
    ],
    card: { eyebrow: "旅行サポート", title: "見積もりを依頼", body: "日程、場所、時間帯をお知らせください。料金とシッターの空きを通常1営業日以内にご返信します。", cta: "見積もりを依頼する", points: ["今はお支払い不要", "1営業日以内に返信", "窓口はKAMEHAME JAPAN"] },
    requestH: "ベビーシッターの見積もりを依頼",
    requestLead: "詳しくお知らせいただくほど早くお見積もりできます。確定までは手配もお支払いも発生しません。",
  },
  form: {
    date: "日付", place: "お子さまが過ごす場所", placeOpts: { hotel: "宿泊ホテル", apartment: "サービスアパートメント・民泊", venue: "体験の会場", other: "その他" }, placeDetail: "ホテル名または住所", placeDetailHint: "例：パーク ハイアット 東京。未定ならエリアだけでも",
    start: "保育開始", end: "保育終了", children: "お子さまの人数", ages: "年齢", agesHint: "例：2歳と5歳",
    language: "シッターの希望言語", languageOpts: { en: "英語", ja: "日本語", zh: "中国語", other: "その他（備考欄に）" },
    golf: "ゴルフなど、ホテルから離れた場所に行きます", golfVenue: "行き先", golfVenueHint: "例：ゴルフ場名、レストラン名", travel: "行き先との往復の移動時間も保育時間に含めてほしい",
    name: "お名前", email: "メールアドレス", whatsapp: "WhatsApp（任意）", notes: "アレルギー、医療上の配慮、生活リズム、その他（任意）", notesHint: "例：下の子は13〜15時にお昼寝。ナッツアレルギーあり",
    send: "見積もりを依頼する", sending: "送信中…", after: "送信しても手配は確定しません。料金と空きをご返信した後にご確認いただきます。", privacy: "いただいた内容はご返信のためだけに使います。", failed: "送信できませんでした。メールでご連絡ください：",
    labels: { service: "サービス", date: "日付", place: "場所", hours: "時間", children: "お子さま", ages: "年齢", language: "言語", golfVenue: "行き先", travel: "移動時間", travelYes: "行き先との往復を含める", notes: "備考" },
    thanksNote: "シッターの空きを確認し、通常1営業日以内に料金をお送りします。",
  },
  mail: { subject: (d) => `ベビーシッターのお見積もり依頼${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`, thanks: "ベビーシッターのご依頼ありがとうございます。提携事業者にシッターの空きを確認し、通常1営業日以内（日本時間）に料金をお送りします。", next: "まだ確定ではありません。お見積もりをご覧になり、進めると決めていただくまで、手配もお支払いも発生しません。" },
};

const es: SupportCopy = {
  nav: "Apoyo al viaje",
  eyebrow: "Apoyo al viaje",
  title: ["Todo lo que rodea", "a la experiencia."],
  lead: "Una canguro mientras estás en una experiencia en Japón, traslados entre tu hotel y el lugar o un coche privado para el día, un guía intérprete por un día, la planificación de todo el viaje. Un solo contacto para todo: KAMEHAME JAPAN.",
  indexLead: "Una canguro mientras estás en una experiencia en Japón, traslados entre tu hotel y el lugar o un coche privado para el día, un guía intérprete por un día, la planificación de todo el viaje. Un solo contacto para todo: KAMEHAME JAPAN. El servicio de canguro ya acepta solicitudes; los demás abrirán pronto.",
  all: "Todo el apoyo al viaje",
  comingSoon: "Próximamente",
  comingSoonBody: "Aún no acepta solicitudes. Lo publicaremos aquí en cuanto esté listo.",
  category: "Apoyo al viaje",
  services: {
    babysitter: { title: "Canguro durante tu experiencia", line: "Una canguro seleccionada que habla inglés cuida a los niños en tu hotel o apartamento mientras estás en una experiencia o sales por la noche.", alt: "Una canguro leyendo un cuento con una niña", facts: ["Tokio · Yokohama · Kioto · Osaka", "De 0 a 12 años", "Presupuesto por solicitud"] },
    transfer: { title: "Traslados y coche privado", line: "Recogida en el aeropuerto, traslado de ida y vuelta entre tu hotel y el lugar de la experiencia, o un coche con conductor para todo el día.", alt: "Un conductor sosteniendo la puerta de un coche privado", facts: ["Aeropuerto · hotel ↔ lugar · día completo", "Conductor incluido"] },
    interpreter: { title: "Guía intérprete por un día", line: "Un guía intérprete titulado a tu lado durante un día de experiencias, compras, visitas o reuniones.", alt: "Un guía explicando un lugar a visitantes", facts: ["Inglés · chino · otros bajo petición", "Medio día · día completo"] },
    planner: { title: "Planificador de viaje", line: "De la forma de tus días en Japón a las reservas que hay detrás: experiencias, restaurantes, transporte, en un solo plan.", alt: "Un grupo de visitantes con un mapa y una guía de Tokio en la calle", facts: ["Planificación de todo el viaje", "Reservas gestionadas"] },
  },
  banner: { kicker: "Apoyo al viaje", title: "Apoyo durante tu viaje, de KAMEHAME JAPAN", body: "Una canguro durante esta experiencia, un guía intérprete, traslados, la planificación del resto de tus días en Japón. Un solo contacto para todo.", cta: "Ver el apoyo al viaje" },
  baby: {
    h1: "Canguro en tu hotel, en inglés",
    tagline: "Una canguro seleccionada que habla inglés acude a tu hotel o apartamento mientras juegas al golf, sales a cenar o haces una experiencia que no es para niños. Organizado por KAMEHAME JAPAN con agencias locales verificadas, con presupuesto por solicitud y un solo contacto de principio a fin: nosotros.",
    conditions: ["Tokio · Yokohama · Kioto · Osaka (otras ciudades bajo petición)", "De 0 a 12 años", "Canguros que hablan inglés", "Presupuesto por solicitud"],
    photoAlts: ["Una canguro leyendo un cuento con un niño pequeño en el regazo", "Una canguro leyendo a cuatro niños de distintos orígenes", "Una canguro y una niña leyendo juntas en el sofá", "Una canguro jugando con una niña en un dormitorio luminoso", "Un niño leyendo un cuento en la cama"],
    aboutH: "Cómo funciona",
    about: [
      "Dinos la fecha, dónde estarán los niños, el horario, sus edades y el idioma que prefieres. Consultamos la disponibilidad de una canguro con nuestras agencias asociadas y te enviamos un presupuesto, normalmente en un día laborable. No se paga nada hasta que confirmes.",
      "La canguro va a donde estés: tu habitación de hotel, un apartamento con servicios o, en algunos casos, el lugar de tu experiencia. Lleva lo necesario para jugar, leer y mantener la rutina de los niños; comidas y hora de dormir según tus instrucciones. Recibes una breve nota escrita de cómo fueron las horas.",
      "Las canguros están seleccionadas, formadas y aseguradas por las agencias con las que trabajamos, y hablan inglés; el japonés siempre es posible y a veces se pueden organizar otros idiomas. KAMEHAME JAPAN sigue siendo tu único contacto antes, durante y después.",
    ],
    scenesH: "Cuándo lo usan nuestros huéspedes",
    scenes: [
      { title: "Un día de golf", body: "Salida temprana y un día largo lejos del hotel. La canguro llega antes de tu traslado y se queda hasta que vuelves; el tiempo de ida y vuelta al campo puede incluirse en las horas de cuidado." },
      { title: "Cenas y noches", body: "Una velada con geiko en Kioto, una barra omakase, una izakaya tardía. Cuidado nocturno en la habitación, con la hora de dormir como en casa." },
      { title: "Experiencias solo para adultos", body: "Catas de sake y whisky, citas en clínicas, una tarde de spa. Los niños siguen con su día mientras tú sigues con el tuyo." },
      { title: "Media jornada tranquila", body: "Compras, un museo o simplemente unas horas de descanso en un viaje largo." },
    ],
    careH: "Qué puede hacer una canguro",
    careLead: "Dinos qué es importante para ti y se lo explicamos a la canguro antes del día.",
    care: ["Jugar y leer en inglés, en la habitación o en la zona infantil del hotel", "Comidas y meriendas que hayas preparado o pedido, y alimentación de bebés", "Siestas, baño y rutina de dormir", "Paseos cortos cerca, con tu permiso", "Deberes sencillos o actividades tranquilas para los mayores", "Una nota escrita de las horas al final"],
    notCare: "Las canguros no conducen, no administran medicamentos salvo con tus instrucciones claras por escrito, ni cuidan a un niño con fiebre; indícanos alergias y necesidades médicas al solicitar para que podamos decirte de antemano qué es posible.",
        priceH: "Tarifas",
    priceLead: "Precios orientativos, impuestos incluidos. Tu presupuesto confirma el importe exacto para tus fechas antes de reservar nada.",
    fee: { perHour: "por hora", english: "Canguro que habla inglés", japanese: "Canguro que habla japonés", minimum: (h) => `Mínimo ${h} horas por reserva, luego en tramos de 30 minutos`, night: "Noche y madrugada (20:00–8:00)", weekend: "Fines de semana y festivos", peak: "Golden Week, Obon, Año Nuevo", bath: "Ayuda con el baño", perTime: "por vez", second: (pct, older) => `Segundo niño: +${pct}% de la tarifa por hora (+${older}% si alguno tiene cuatro años o más)`, third: "Tercer niño al mismo tiempo: sin cargo adicional", notice2: "Solicitudes después de las 18:00 dos días laborables antes", notice1: "Solicitudes después de las 18:00 un día laborable antes", transport: "Transporte de la canguro", transportNote: "a su coste", cancelH: "Cancelación", cancel: ["Gratis hasta las 18:00 dos días laborables antes", "50% de la tarifa después", "100% después de las 18:00 un día laborable antes"], note: "La tarifa estándar es de lunes a viernes de 8:00 a 20:00. Pago con enlace de tarjeta al confirmar el presupuesto; no se cobra nada antes." },
    price: ["Una tarifa por hora para las horas reservadas, con una duración mínima", "Madrugadas, noches, fines de semana y festivos tienen recargo", "Un segundo niño suele tener una tarifa adicional reducida", "El transporte de la canguro a tu hotel se añade a su coste", "Con poca antelación (menos de una semana) puede no haber disponibilidad o haber recargo", "Pago con enlace de tarjeta al confirmar; las condiciones de cancelación llegan con el presupuesto"],
    flowH: "De la solicitud al día",
    flow: [
      { title: "Envía la solicitud", body: "Fecha, lugar, horario, edades de los niños, idioma y cómo contactarte. No cuesta nada." },
      { title: "Presupuesto y disponibilidad", body: "Consultamos a nuestras agencias asociadas y respondemos con la tarifa y la disponibilidad de una canguro, normalmente en un día laborable." },
      { title: "Confirma y paga", body: "Confirmas con un enlace de tarjeta. Te enviamos el perfil de la canguro y una breve presentación antes del día." },
      { title: "El día", body: "La canguro llega a la hora acordada con identificación. Dejas tus instrucciones y te vas. Estamos localizables todo el tiempo." },
    ],
    faqH: "Preguntas",
    faq: [
      { q: "¿Qué idiomas hablan las canguros?", a: "El inglés es lo habitual. El japonés siempre está disponible, y el chino u otros idiomas a veces pueden organizarse; dínoslo al solicitar." },
      { q: "¿Cómo se seleccionan las canguros?", a: "A través de las agencias con las que trabajamos: verificación de identidad y antecedentes, entrevistas, formación y seguro. Solo trabajamos con agencias cuya selección hemos revisado nosotros mismos." },
      { q: "¿Puede la canguro venir al club de golf o al restaurante?", a: "Normalmente cuida a los niños en tu hotel, que es más tranquilo para ellos. El cuidado en el lugar es posible cuando el lugar lo acepta y tiene una sala adecuada; pregúntanos y lo comprobamos." },
      { q: "¿Con cuánta antelación hay que avisar?", a: "Una semana o más es lo ideal. A menudo podemos organizarlo con menos tiempo, a veces con recargo; siempre vale la pena preguntar." },
      { q: "¿Puede una canguro cuidar a dos niños?", a: "Sí, en la mayoría de edades. Para tres o más niños, o más de un bebé, podemos proponer dos canguros." },
      { q: "¿Y un bebé de menos de un año?", a: "Sí, desde recién nacido en la mayoría de ciudades. Dinos las rutinas de alimentación y sueño y se lo explicamos a la canguro." },
      { q: "¿Y si mi hijo está enfermo ese día?", a: "Las canguros no cuidan a un niño con fiebre o una enfermedad contagiosa. Avísanos lo antes posible; se aplican las condiciones de cancelación de tu presupuesto y hacemos lo que podemos." },
      { q: "¿Con quién hablo ese día?", a: "Con nosotros. Recibes un número para el día con tu confirmación, y la agencia de la canguro está localizable a través de nosotros en todo momento." },
    ],
    card: { eyebrow: "Apoyo al viaje", title: "Solicitar presupuesto", body: "Dinos la fecha, el lugar y el horario. Respondemos con la tarifa y la disponibilidad de una canguro, normalmente en un día laborable.", cta: "Solicitar presupuesto", points: ["Sin pago ahora", "Respuesta en un día laborable", "Un contacto: KAMEHAME JAPAN"] },
    requestH: "Solicitar un presupuesto de canguro",
    requestLead: "Cuanto más nos cuentes, más rápido el presupuesto. No se reserva ni se cobra nada hasta que confirmes.",
  },
  form: {
    date: "Fecha", place: "Dónde estarán los niños", placeOpts: { hotel: "Nuestro hotel", apartment: "Apartamento con servicios / alquiler", venue: "En el lugar de nuestra experiencia", other: "Otro lugar" }, placeDetail: "Hotel o dirección", placeDetailHint: "p. ej. Park Hyatt Tokyo, o la zona si aún no está reservado",
    start: "Inicio del cuidado", end: "Fin del cuidado", children: "Número de niños", ages: "Edades", agesHint: "p. ej. 2 y 5",
    language: "Idioma preferido de la canguro", languageOpts: { en: "Inglés", ja: "Japonés", zh: "Chino", other: "Otro (indícalo en las notas)" },
    golf: "Jugaremos al golf (o estaremos en un lugar lejos del hotel)", golfVenue: "Dónde estaréis", golfVenueHint: "p. ej. el campo de golf o el restaurante", travel: "Incluir nuestro tiempo de ida y vuelta al lugar en las horas de cuidado",
    name: "Tu nombre", email: "Correo electrónico", whatsapp: "WhatsApp (opcional)", notes: "Alergias, necesidades médicas, rutinas, cualquier otra cosa (opcional)", notesHint: "p. ej. el pequeño duerme siesta de 13:00 a 15:00; alergia a los frutos secos",
    send: "Solicitar presupuesto", sending: "Enviando…", after: "Enviar esta solicitud no reserva nada. Respondemos con la tarifa y la disponibilidad; tú confirmas después.", privacy: "Usamos lo que envías solo para responderte.", failed: "No se pudo enviar la solicitud. Escríbenos a",
    labels: { service: "Servicio", date: "Fecha", place: "Lugar", hours: "Horario", children: "Niños", ages: "Edades", language: "Idioma", golfVenue: "Lugar", travel: "Tiempo de viaje", travelYes: "Incluir ida y vuelta al lugar", notes: "Notas" },
    thanksNote: "Consultamos la disponibilidad de una canguro y te enviamos la tarifa, normalmente en un día laborable.",
  },
  mail: { subject: (d) => `Tu solicitud de canguro${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`, thanks: "Gracias por tu solicitud de canguro. Estamos consultando la disponibilidad con nuestras agencias asociadas y te enviaremos la tarifa, normalmente en un día laborable, hora de Japón.", next: "Esto aún no es una confirmación. No se reserva ni se cobra nada hasta que hayas visto el presupuesto y decidas seguir adelante." },
};

const fr: SupportCopy = {
  nav: "Services voyage",
  eyebrow: "Services voyage",
  title: ["Tout ce qui entoure", "l'expérience."],
  lead: "Une baby-sitter pendant que vous vivez une expérience au Japon, des transferts entre votre hôtel et le lieu ou une voiture privée pour la journée, un guide-interprète pour une journée, la planification de tout le séjour. Un seul interlocuteur pour tout : KAMEHAME JAPAN.",
  indexLead: "Une baby-sitter pendant que vous vivez une expérience au Japon, des transferts entre votre hôtel et le lieu ou une voiture privée pour la journée, un guide-interprète pour une journée, la planification de tout le séjour. Un seul interlocuteur pour tout : KAMEHAME JAPAN. La garde d'enfants prend les demandes dès maintenant ; les autres ouvrent bientôt.",
  all: "Tous les services voyage",
  comingSoon: "Bientôt disponible",
  comingSoonBody: "Pas encore ouvert aux demandes. Nous l'afficherons ici dès qu'il sera prêt.",
  category: "Services voyage",
  services: {
    babysitter: { title: "Garde d'enfants pendant votre expérience", line: "Une garde anglophone et sélectionnée s'occupe des enfants à votre hôtel ou appartement pendant que vous êtes à une expérience ou sortez le soir.", alt: "Une baby-sitter lisant un album avec une petite fille", facts: ["Tokyo · Yokohama · Kyoto · Osaka", "De 0 à 12 ans", "Devis sur demande"] },
    transfer: { title: "Transferts et voiture privée", line: "Accueil à l'aéroport, aller-retour entre votre hôtel et le lieu de l'expérience, ou une voiture avec chauffeur pour la journée.", alt: "Un chauffeur tenant la portière d'une voiture privée", facts: ["Aéroport · hôtel ↔ lieu · journée entière", "Chauffeur compris"] },
    interpreter: { title: "Guide-interprète pour la journée", line: "Un guide-interprète agréé à vos côtés pour une journée d'expériences, de shopping, de visites ou de rendez-vous.", alt: "Un guide présentant un site à des visiteurs", facts: ["Anglais · chinois · autres sur demande", "Demi-journée · journée"] },
    planner: { title: "Planificateur de voyage", line: "De l'organisation de vos journées au Japon aux réservations qui vont avec : expériences, restaurants, transports, en un seul plan.", alt: "Un groupe de visiteurs avec une carte et un guide de Tokyo dans la rue", facts: ["Planification du séjour entier", "Réservations prises en charge"] },
  },
  banner: { kicker: "Services voyage", title: "Un soutien pendant votre voyage, par KAMEHAME JAPAN", body: "Une baby-sitter pendant cette expérience, un guide-interprète, des transferts, la planification du reste de vos journées au Japon. Un seul interlocuteur pour tout.", cta: "Voir les services voyage" },
  baby: {
    h1: "Garde d'enfants à votre hôtel, en anglais",
    tagline: "Une baby-sitter sélectionnée et anglophone vient à votre hôtel ou appartement pendant que vous jouez au golf, dînez ou vivez une expérience qui n'est pas pour les enfants. Organisé par KAMEHAME JAPAN avec des agences locales vérifiées, sur devis, avec un seul interlocuteur du début à la fin : nous.",
    conditions: ["Tokyo · Yokohama · Kyoto · Osaka (autres villes sur demande)", "De 0 à 12 ans", "Gardes anglophones", "Devis sur demande"],
    photoAlts: ["Une baby-sitter lisant un album à un tout-petit sur ses genoux", "Une garde lisant à quatre enfants d'origines différentes", "Une garde et une fillette lisant ensemble sur un canapé", "Une garde jouant avec une fillette dans une chambre lumineuse", "Un garçon lisant un album sur un lit"],
    aboutH: "Comment ça marche",
    about: [
      "Indiquez-nous la date, où seront les enfants, les horaires, leur âge et la langue souhaitée. Nous vérifions la disponibilité d'une garde auprès de nos agences partenaires et vous envoyons un devis, généralement sous un jour ouvré. Rien n'est payé avant votre confirmation.",
      "La garde vient à vous : votre chambre d'hôtel, un appartement avec services ou, dans certains cas, le lieu de votre expérience. Elle apporte de quoi jouer, lire et garder le rythme des enfants ; repas et coucher suivent vos consignes. Vous recevez un court compte rendu écrit des heures passées.",
      "Les gardes sont sélectionnées, formées et assurées par les agences avec lesquelles nous travaillons, et parlent anglais ; le japonais est toujours possible et d'autres langues peuvent parfois être organisées. KAMEHAME JAPAN reste votre interlocuteur unique avant, pendant et après.",
    ],
    scenesH: "Quand nos hôtes y font appel",
    scenes: [
      { title: "Une journée de golf", body: "Un départ tôt et une longue journée loin de l'hôtel. La garde arrive avant votre transfert et reste jusqu'à votre retour ; le temps de trajet aller-retour vers le parcours peut être compris dans les heures de garde." },
      { title: "Dîners et soirées", body: "Une soirée avec une geiko à Kyoto, un comptoir omakase, une izakaya tardive. Garde du soir en chambre, avec le coucher comme à la maison." },
      { title: "Expériences réservées aux adultes", body: "Dégustations de saké et de whisky, rendez-vous en clinique, un après-midi au spa. Les enfants gardent leur journée, vous gardez la vôtre." },
      { title: "Une demi-journée calme", body: "Du shopping, un musée, ou simplement quelques heures de repos au cours d'un long voyage." },
    ],
    careH: "Ce qu'une garde peut faire",
    careLead: "Dites-nous ce qui compte pour vous : nous le transmettons à la garde avant le jour J.",
    care: ["Jouer et lire en anglais, en chambre ou dans l'espace enfants de l'hôtel", "Repas et goûters que vous avez préparés ou commandés, et biberons pour les bébés", "Siestes, bain et rituel du coucher", "Courtes promenades à proximité, avec votre accord", "Devoirs simples ou activités calmes pour les plus grands", "Un compte rendu écrit des heures à la fin"],
    notCare: "Les gardes ne conduisent pas, ne donnent pas de médicaments sans vos consignes écrites claires et ne gardent pas un enfant fiévreux ; signalez allergies et besoins médicaux lors de la demande pour que nous puissions dire à l'avance ce qui est possible.",
        priceH: "Tarifs",
    priceLead: "Prix indicatifs, taxes comprises. Votre devis confirme le montant exact pour vos dates avant toute réservation.",
    fee: { perHour: "de l'heure", english: "Garde anglophone", japanese: "Garde japonophone", minimum: (h) => `Minimum ${h} heures par réservation, puis par tranches de 30 minutes`, night: "Nuit et tôt le matin (20 h–8 h)", weekend: "Week-ends et jours fériés", peak: "Golden Week, Obon, Nouvel An", bath: "Aide au bain", perTime: "par fois", second: (pct, older) => `Deuxième enfant : +${pct} % du tarif horaire (+${older} % si l'un des deux a quatre ans ou plus)`, third: "Troisième enfant en même temps : sans supplément", notice2: "Demandes après 18 h deux jours ouvrés avant", notice1: "Demandes après 18 h un jour ouvré avant", transport: "Transport de la garde", transportNote: "au coût réel", cancelH: "Annulation", cancel: ["Gratuite jusqu'à 18 h deux jours ouvrés avant", "50 % du tarif ensuite", "100 % après 18 h un jour ouvré avant"], note: "Le tarif de base s'applique en semaine de 8 h à 20 h. Paiement par lien carte à la confirmation du devis ; rien n'est débité avant." },
    price: ["Un tarif horaire pour les heures réservées, avec une durée minimale", "Tôt le matin, tard le soir, week-ends et jours fériés : majoration", "Un deuxième enfant coûte généralement un supplément réduit", "Le transport de la garde jusqu'à votre hôtel est ajouté au coût réel", "À moins d'une semaine, la garde peut être indisponible ou majorée", "Paiement par lien carte à la confirmation ; les conditions d'annulation accompagnent le devis"],
    flowH: "De la demande au jour J",
    flow: [
      { title: "Envoyez la demande", body: "Date, lieu, horaires, âge des enfants, langue et comment vous joindre. C'est gratuit." },
      { title: "Devis et disponibilité", body: "Nous vérifions auprès de nos agences partenaires et répondons avec le tarif et la disponibilité d'une garde, généralement sous un jour ouvré." },
      { title: "Confirmation et paiement", body: "Vous confirmez par lien carte. Nous envoyons le profil de la garde et une courte présentation avant le jour J." },
      { title: "Le jour J", body: "La garde arrive à l'heure convenue avec une pièce d'identité. Vous laissez vos consignes et partez. Nous restons joignables tout du long." },
    ],
    faqH: "Questions",
    faq: [
      { q: "Quelles langues parlent les gardes ?", a: "L'anglais est la norme. Le japonais est toujours possible, et le chinois ou d'autres langues peuvent parfois être organisés ; dites-le-nous lors de la demande." },
      { q: "Comment les gardes sont-elles sélectionnées ?", a: "Par les agences avec lesquelles nous travaillons : vérification d'identité et d'antécédents, entretiens, formation et assurance. Nous ne travaillons qu'avec des agences dont nous avons nous-mêmes examiné la sélection." },
      { q: "La garde peut-elle venir au golf ou au restaurant ?", a: "En général, la garde s'occupe des enfants à votre hôtel, plus calme pour eux. Une garde sur place est possible si le lieu l'accepte et dispose d'une pièce adaptée ; demandez-nous, nous vérifions." },
      { q: "Quel délai faut-il prévoir ?", a: "Une semaine ou plus, idéalement. Nous pouvons souvent organiser plus court, parfois avec majoration ; cela vaut toujours la peine de demander." },
      { q: "Une garde peut-elle s'occuper de deux enfants ?", a: "Oui, pour la plupart des âges. Pour trois enfants ou plus, ou plus d'un bébé, nous pouvons proposer deux gardes." },
      { q: "Et un bébé de moins d'un an ?", a: "Oui, dès la naissance dans la plupart des villes. Indiquez-nous les rythmes de repas et de sommeil et nous les transmettons à la garde." },
      { q: "Et si mon enfant est malade ce jour-là ?", a: "Les gardes ne s'occupent pas d'un enfant fiévreux ou contagieux. Prévenez-nous au plus tôt ; les conditions d'annulation de votre devis s'appliquent et nous faisons notre possible." },
      { q: "À qui m'adresser le jour J ?", a: "À nous. Vous recevez un numéro pour la journée avec votre confirmation, et l'agence de la garde est joignable par notre intermédiaire à tout moment." },
    ],
    card: { eyebrow: "Services voyage", title: "Demander un devis", body: "Indiquez la date, le lieu et les horaires. Nous répondons avec le tarif et la disponibilité d'une garde, généralement sous un jour ouvré.", cta: "Demander un devis", points: ["Aucun paiement maintenant", "Réponse sous un jour ouvré", "Un interlocuteur : KAMEHAME JAPAN"] },
    requestH: "Demander un devis de garde d'enfants",
    requestLead: "Plus vous nous en dites, plus le devis est rapide. Rien n'est réservé ni débité avant votre confirmation.",
  },
  form: {
    date: "Date", place: "Où seront les enfants", placeOpts: { hotel: "Notre hôtel", apartment: "Appartement avec services / location", venue: "Sur le lieu de notre expérience", other: "Ailleurs" }, placeDetail: "Hôtel ou adresse", placeDetailHint: "ex. Park Hyatt Tokyo, ou le quartier si pas encore réservé",
    start: "Début de la garde", end: "Fin de la garde", children: "Nombre d'enfants", ages: "Âges", agesHint: "ex. 2 et 5 ans",
    language: "Langue souhaitée de la garde", languageOpts: { en: "Anglais", ja: "Japonais", zh: "Chinois", other: "Autre (précisez dans les notes)" },
    golf: "Nous jouerons au golf (ou serons loin de l'hôtel)", golfVenue: "Où vous serez", golfVenueHint: "ex. le parcours de golf ou le restaurant", travel: "Inclure notre temps de trajet aller-retour dans les heures de garde",
    name: "Votre nom", email: "E-mail", whatsapp: "WhatsApp (facultatif)", notes: "Allergies, besoins médicaux, rythmes, autre (facultatif)", notesHint: "ex. le plus jeune fait la sieste de 13 h à 15 h ; allergie aux noix",
    send: "Demander un devis", sending: "Envoi…", after: "Envoyer cette demande ne réserve rien. Nous répondons avec le tarif et la disponibilité ; vous confirmez ensuite.", privacy: "Nous utilisons ce que vous envoyez uniquement pour vous répondre.", failed: "La demande n'a pas pu être envoyée. Écrivez-nous à",
    labels: { service: "Service", date: "Date", place: "Lieu", hours: "Horaires", children: "Enfants", ages: "Âges", language: "Langue", golfVenue: "Lieu de sortie", travel: "Temps de trajet", travelYes: "Inclure l'aller-retour", notes: "Notes" },
    thanksNote: "Nous vérifions la disponibilité d'une garde et vous envoyons le tarif, généralement sous un jour ouvré.",
  },
  mail: { subject: (d) => `Votre demande de garde d'enfants${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`, thanks: "Merci pour votre demande de garde d'enfants. Nous vérifions la disponibilité auprès de nos agences partenaires et vous enverrons le tarif, généralement sous un jour ouvré, heure du Japon.", next: "Ce n'est pas encore une confirmation. Rien n'est réservé ni débité avant que vous ayez vu le devis et choisi de poursuivre." },
};

const zh: SupportCopy = {
  nav: "旅行支援",
  eyebrow: "旅行支援",
  title: ["體驗之外，", "一併安排。"],
  lead: "在日本參加體驗期間的保母服務、飯店與體驗場地之間的接送或一日包車、一日口譯導遊、整趟旅程的規劃。所有事項只需一個窗口：KAMEHAME JAPAN。",
  indexLead: "在日本參加體驗期間的保母服務、飯店與體驗場地之間的接送或一日包車、一日口譯導遊、整趟旅程的規劃。所有事項只需一個窗口：KAMEHAME JAPAN。保母服務現已受理申請，其餘項目陸續開放。",
  all: "所有旅行支援",
  comingSoon: "即將推出",
  comingSoonBody: "尚未開放申請。準備就緒後會在此刊登。",
  category: "旅行支援",
  services: {
    babysitter: { title: "體驗期間的保母服務", line: "您參加體驗或夜間外出時，會說英語、經審核的保母在飯店或住處照顧孩子。", alt: "為幼兒讀繪本的保母", facts: ["東京 · 橫濱 · 京都 · 大阪", "0 至 12 歲", "個別報價"] },
    transfer: { title: "接送與一日包車", line: "機場接送、飯店與體驗場地之間的來回接送，或含司機的一日包車。", alt: "為私人車輛開門的司機", facts: ["機場 · 飯店⇄場地 · 一日包車", "含司機"] },
    interpreter: { title: "一日口譯導遊", line: "持證口譯導遊全日陪同您的體驗、購物、觀光或洽談。", alt: "向訪客介紹景點的導遊", facts: ["英語 · 中文 · 其他可洽", "半日 · 全日"] },
    planner: { title: "旅行規劃師", line: "從日本行程的安排到背後的預訂：體驗、餐廳、交通，整合成一份計畫。", alt: "在街頭攤開地圖與東京旅遊書的外國旅客", facts: ["整趟行程規劃", "代為預訂"] },
  },
  banner: { kicker: "旅行支援", title: "旅途中的支援，交給 KAMEHAME JAPAN", body: "體驗期間的保母、口譯導遊、接送、其餘行程的規劃。所有事項只需一個窗口。", cta: "查看旅行支援" },
  baby: {
    h1: "到飯店的英語保母服務",
    tagline: "當您打高爾夫、外出用餐或參加不適合孩子的體驗時，經審核、會說英語的保母會到您的飯店或住處。由 KAMEHAME JAPAN 與審核過的在地機構安排，個別報價，自始至終只有一個聯絡窗口：我們。",
    conditions: ["東京 · 橫濱 · 京都 · 大阪（其他城市可洽）", "0 至 12 歲", "會說英語的保母", "個別報價"],
    photoAlts: ["抱著幼兒讀繪本的保母", "為四位不同背景的孩子讀繪本的保母", "與女孩一起在沙發上看書的保母", "在明亮臥室裡與女孩玩耍的保母", "在床上看繪本的男孩"],
    aboutH: "服務方式",
    about: [
      "告訴我們日期、孩子所在地點、時段、年齡與希望的語言。我們向合作機構確認保母檔期，通常在一個工作天內寄出報價。確認前不需付款。",
      "保母會到您身邊：飯店客房、服務式公寓，有時也可到體驗場地。她們會帶來遊戲與閱讀所需的物品，並維持孩子的作息；用餐與就寢依照您的指示。結束時您會收到簡短的書面紀錄。",
      "保母由我們合作的機構審核、培訓並投保，並且會說英語；日語隨時可以，其他語言有時也可安排。事前、當天與事後，KAMEHAME JAPAN 都是您唯一的聯絡窗口。",
    ],
    scenesH: "旅客常用的時機",
    scenes: [
      { title: "高爾夫日", body: "一早出發、長時間離開飯店。保母會在您的接送出發前抵達，待到您回來；往返球場的交通時間也可計入托育時數。" },
      { title: "晚餐與夜晚", body: "京都的藝妓之夜、無菜單板前、深夜居酒屋。在客房的夜間托育，就寢方式和在家一樣。" },
      { title: "僅限成人的體驗", body: "清酒與威士忌品飲、診所預約、SPA 午後。孩子過孩子的一天，您過您的。" },
      { title: "安靜的半天", body: "購物、美術館，或只是長途旅行中幾小時的休息。" },
    ],
    careH: "保母可以做的事",
    careLead: "告訴我們您在意的事，我們會在當天前向保母說明。",
    care: ["在室內或飯店兒童區用英語遊戲、讀繪本", "您準備或訂購的餐點與點心，以及嬰兒餵食", "午睡、洗澡與就寢流程", "經您同意後在附近短暫散步", "較大孩子的簡單作業或安靜活動", "結束時的簡短書面紀錄"],
    notCare: "保母不開車、不在沒有您明確書面指示下給藥，也不照顧發燒等身體不適的孩子；請在申請時告知過敏與醫療需求，我們會事先說明可行範圍。",
        priceH: "費用",
    priceLead: "含稅參考價。安排前會以報價確認您日期的確切金額。",
    fee: { perHour: "／小時", english: "英語保母", japanese: "日語保母", minimum: (h) => `每次最少 ${h} 小時，之後以 30 分鐘為單位`, night: "夜間與清晨（20:00–8:00）", weekend: "週末與假日", peak: "黃金週、盂蘭盆節、新年", bath: "洗澡協助", perTime: "／次", second: (pct, older) => `第二位孩子：時薪的 +${pct}%（其中一位滿四歲則為 +${older}%）`, third: "三位同時：第三位免費", notice2: "兩個工作天前 18:00 之後的申請", notice1: "一個工作天前 18:00 之後的申請", transport: "保母交通費", transportNote: "實報實銷", cancelH: "取消規定", cancel: ["兩個工作天前 18:00 之前免費", "之後為費用的 50%", "一個工作天前 18:00 之後為 100%"], note: "平日 8:00–20:00 為標準費率。確認報價後以信用卡連結付款，在此之前不收費。" },
    price: ["依預訂時數計算的時薪，設有最低時數", "清晨、深夜、週末與假日加價", "第二位孩子通常以較低的加收費用計算", "保母前往您飯店的交通費實報實銷", "一週內的臨時申請可能無法安排或需加價", "確認後以信用卡連結付款；取消規定隨報價附上"],
    flowH: "從申請到當天",
    flow: [
      { title: "送出申請", body: "日期、地點、時段、孩子年齡、語言與聯絡方式。免費。" },
      { title: "報價與檔期", body: "我們向合作機構確認，通常在一個工作天內回覆費用與保母檔期。" },
      { title: "確認並付款", body: "以信用卡連結確認。當天前我們會寄出保母的簡介。" },
      { title: "當天", body: "保母攜帶證件準時抵達。留下您的指示後即可出門。我們全程可聯絡。" },
    ],
    faqH: "常見問題",
    faq: [
      { q: "保母說哪些語言？", a: "英語為標準。日語隨時可以，中文或其他語言有時可安排；請在申請時告知。" },
      { q: "保母如何審核？", a: "由我們合作的機構進行：身分與背景查核、面試、培訓與保險。我們只與審核流程經我們親自確認的機構合作。" },
      { q: "保母可以到球場或餐廳嗎？", a: "通常在您的飯店照顧孩子，對孩子較為安穩。若場地同意並有合適的房間，也可在場地托育；請詢問我們確認。" },
      { q: "需要提前多久申請？", a: "最好一週以上。較短的時間多半也能安排，有時需加價；歡迎先詢問。" },
      { q: "一位保母可以照顧兩個孩子嗎？", a: "多數年齡可以。三位以上，或不只一位嬰兒時，我們可能建議兩位保母。" },
      { q: "未滿一歲的嬰兒可以嗎？", a: "多數城市從新生兒起即可。請告知餵食與睡眠作息，我們會向保母說明。" },
      { q: "當天孩子生病怎麼辦？", a: "保母不照顧發燒或有傳染病的孩子。請盡早告知；依報價中的取消規定處理，我們會盡力協助。" },
      { q: "當天聯絡誰？", a: "我們。確認時會提供當天的聯絡電話，保母所屬機構也可隨時透過我們聯繫。" },
    ],
    card: { eyebrow: "旅行支援", title: "索取報價", body: "告訴我們日期、地點與時段。通常在一個工作天內回覆費用與保母檔期。", cta: "索取報價", points: ["現在無需付款", "一個工作天內回覆", "單一窗口：KAMEHAME JAPAN"] },
    requestH: "索取保母服務報價",
    requestLead: "資訊越完整，報價越快。確認前不會預訂也不會收費。",
  },
  form: {
    date: "日期", place: "孩子所在地點", placeOpts: { hotel: "我們的飯店", apartment: "服務式公寓／民宿", venue: "體驗的場地", other: "其他地點" }, placeDetail: "飯店名稱或地址", placeDetailHint: "例：Park Hyatt Tokyo；尚未預訂可先填區域",
    start: "托育開始", end: "托育結束", children: "孩子人數", ages: "年齡", agesHint: "例：2 歲與 5 歲",
    language: "希望保母使用的語言", languageOpts: { en: "英語", ja: "日語", zh: "中文", other: "其他（請於備註說明）" },
    golf: "我們會去打高爾夫（或前往離飯店較遠的地點）", golfVenue: "前往的地點", golfVenueHint: "例：高爾夫球場或餐廳名稱", travel: "請將我們往返該地點的交通時間計入托育時數",
    name: "姓名", email: "電子郵件", whatsapp: "WhatsApp（選填）", notes: "過敏、醫療需求、作息、其他（選填）", notesHint: "例：老么 13:00–15:00 午睡；堅果過敏",
    send: "索取報價", sending: "傳送中…", after: "送出申請不代表預訂。我們會回覆費用與檔期，之後由您確認。", privacy: "您提供的資訊僅用於回覆您。", failed: "無法送出，請來信：",
    labels: { service: "服務", date: "日期", place: "地點", hours: "時段", children: "孩子", ages: "年齡", language: "語言", golfVenue: "前往地點", travel: "交通時間", travelYes: "計入往返交通", notes: "備註" },
    thanksNote: "我們會確認保母檔期，通常在一個工作天內寄出費用。",
  },
  mail: { subject: (d) => `您的保母服務申請${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`, thanks: "感謝您申請保母服務。我們正向合作機構確認保母檔期，通常會在一個工作天內（日本時間）寄出費用。", next: "這還不是確認。在您看過報價並決定進行之前，不會預訂也不會收費。" },
};

const COPY: Record<Lang, SupportCopy> = { en, ja, es, fr, "zh-tw": zh };

export const supportCopy = (lang: Lang): SupportCopy => COPY[lang] ?? en;

/** Lines echoed in the acknowledgement and the team's record, in the visitor's language. */
export function supportLabels(lang: string) {
  return (COPY[lang as Lang] ?? en).form.labels;
}
