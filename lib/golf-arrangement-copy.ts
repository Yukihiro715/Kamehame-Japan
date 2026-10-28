import { golfPlanningCopy } from "@/lib/golf-planning-copy";
// The golf page as a course-booking service (GOLF_MODE "arrangement", 2026-10-17).
//
// A group fee (¥15,000 for the first golfer, ¥5,000 per additional golfer) for choosing the course, reserving the tee time and handling the
// club in English. Green fees, cart, rentals and lunch are paid at the club; transfers go
// through a partner the guest contracts directly; an assistant for the day is quoted
// separately. Everything below replaces the package page's text while the mode is on,
// in all five languages; the package copy stays untouched in the catalogs, so switching
// GOLF_MODE back to "package" restores the previous page word for word.

import type { Experience, GolfInclusionId, VariantPageCopy } from "@/lib/catalog";
import { GOLF_ARRANGEMENT_EXTRA_JPY, GOLF_ARRANGEMENT_FEE_JPY, golfPartySize, golfTiers } from "@/lib/golf-prices";
import { arrangementPolicy } from "@/lib/golf-arrangement-policy";
import type { Lang } from "@/lib/i18n";
import { yen } from "@/lib/pricing";

/** The lines the booking-process copy (lib/golf-booking-copy.ts) replaces while the mode is on. */
export interface ArrangementProcess {
  received: string; proposal: string; arrange: string; protection: string; steps: string[];
  area: string; caddie: string; caddies: string[]; caddieNote: string; paidH: string; paid: string;
  /** The assistant-for-the-day choice in the form. */
  assistant: string; assistants: string[]; assistantNote: string;
  /** The transfer choice in the form: not part of the service; on request we introduce the transfer partner. */
  transfer: string; transfers: string[]; transferNote: string;
}

interface ArrangementCopy {
  title: string; seoTitle: string; metaDescription: string; tagline: string; overview: [string, string];
  duration: string; group: string; area: string; includedShort: string; cancellation: string;
  included: string[]; notIncluded: string[];
  schedule: { time: string; title: string; body: string }[]; scheduleNote: string; timeLabel: string;
  cta: { label: string; note: string; heading: string; lead: string };
  variants: { tokyo: { title: string; short: string; tagline: string }; fuji: { title: string; short: string; tagline: string }; other: { title: string; short: string; tagline: string } };
  /** The "other area" form field: where in Japan (prefecture, city or course) */
  otherArea: { label: string; hint: string };
  venue: { known: string[]; afterBooking: string[] };
  faq: { q: string; a: string }[];
  benefits: string[]; crumb: string; photoNote: string;
  inclusions: { heading: string; sub: string; includedLabel: string; notIncludedLabel: string; items: Record<GolfInclusionId, { label: string; note: string }>; footnote: string; courseNote: string; alsoNot: string };
  transfer: { heading: string; body: string; points: { title: string; body: string }[]; note: string };
  options: Omit<VariantPageCopy["options"], "from" | "approx" | "fromSuffix">;
  intro: { heading: string; guideNote: string };
  day: { steps: { title: string; body: string }[]; note: string; timingsH: string; bookingH: string };
  prices: VariantPageCopy["prices"];
  form: Pick<VariantPageCopy["form"], "steps" | "departure" | "specificCourse" | "specificCourseNote" | "specificCourseQuote" | "courseName" | "courseUrl" | "pickup" | "pickupHint" | "rentalH" | "rental" | "rentalOpts" | "rentalNote" | "requestsHint" | "confirmNote" | "package" | "perPersonRef" | "recommendedCourse" | "cta">;
  headings: VariantPageCopy["headings"];
  process: ArrangementProcess;
  /** Phones: the short card under the photos (the full panel stays beside them on wide screens), and the three-line check above the form. */
  summary: { lines: string[]; beforeH: string; before: string[] };
}

const FEE = yen(GOLF_ARRANGEMENT_FEE_JPY);
const EXTRA = yen(GOLF_ARRANGEMENT_EXTRA_JPY);
/** No standalone assistant card; driver and lunch are not separate offerings. */
const ITEM_ORDER: GolfInclusionId[] = ["round", "clubs", "shoes", "transfer", "cart", "locker", "bath", "taxes", "wear"];

const en: ArrangementCopy = {
  title: "Japan Golf Course Booking Service",
  seoTitle: "Japan Golf Course Booking Service | Tokyo Area & Mt. Fuji | KAMEHAME JAPAN",
  metaDescription: `We book your tee time at a golf course near Tokyo or in the Mt. Fuji region, in English, for ${FEE} (first golfer) plus ${EXTRA} per additional golfer. Green fees, cart and rentals are paid at the club; private transfers through our partner.`,
  tagline: `We find the course, book the tee time in your name and handle the club in English. One fee from ${FEE} per group; green fees are paid at the course.`,
  overview: [
    "Booking golf in Japan is hard from abroad: Japanese-only sites, member introductions, unwritten rules. Tell us your date, your group and the area, and we propose a course, reserve it in your name and tell you what the club expects.",
    "Meet at the course, or ask us to introduce a private transfer partner. Green fees, cart, rentals and lunch are paid at the club.",
  ],
  duration: "One round, 18 holes", group: "1–12 golfers · 5 or more quoted · meet at the course", area: "Tokyo area or Mt. Fuji region",
  includedShort: "Course selection and tee-time booking · Club liaison in English",
  cancellation: arrangementPolicy["en"].terms,
  included: [
    "Course selection in your chosen area, matched to your date, group size and level",
    "Tee-time reservation in your name, confirmed in writing",
    "All communication with the club in Japanese: rentals, cart or caddie requests, dress code, lunch",
    "A briefing before your day: how to get there, check-in, clubhouse customs and what to bring",
    "Support by email and WhatsApp before and on the day",
    "Tax included",
  ],
  notIncluded: [
    "Green fees, golf cart, locker, lunch and any rentals: paid directly at the club on the day",
    "Transfers: meet at the course, or book a private car through the transfer partner we introduce (contracted and paid directly with them)",
    "An English-speaking assistant for the day: available on request, quoted separately",
    "A course caddie, where the club offers one (paid at the club)",
    "Golf wear and gloves (bring your own)",
  ],
  schedule: [
    { time: "Morning", title: "Arrive at the course", body: "Come to the clubhouse about 45 minutes before your tee time: by car, by train and taxi, or in the private car you booked through our partner." },
    { time: "Check-in", title: "Check in under your name", body: "Your reservation is in your name with the notes the club needs. Pay the green fees and any rentals at the front desk, as every golfer in Japan does." },
    { time: "Tee off", title: "Your round", body: "18 holes at your own pace. On most courses lunch comes between the nines; we tell you in advance." },
    { time: "After the round", title: "Bath and departure", body: "Settle the clubhouse bill, enjoy the bath if the club has one, and head on." },
  ],
  scheduleNote: "A typical day; the tee time and the lunch pattern depend on the course.",
  timeLabel: "Preferred tee time",
  cta: { label: "Check Tee Times", note: "No payment required to enquire.", heading: "Request a Tee Time", lead: "Your date, your golfers, your area. No payment now." },
  variants: { tokyo: { title: "Tokyo Area", short: "Tokyo Area", tagline: "Courses selected around your travel plans" }, fuji: { title: "Mt. Fuji Area", short: "Mt. Fuji Area", tagline: "Courses with Mt. Fuji on the horizon" }, other: { title: "Other Area", short: "Other", tagline: "Anywhere in Japan: tell us where in the form. Same fee." } },
  otherArea: { label: "Where would you like to play?", hint: "Prefecture, city or course name, e.g. Hokkaido, Karuizawa, Miyazaki" },
  venue: {
    known: ["The fee for your group", "Meet at the course, or a transfer through the partner we introduce"],
    afterBooking: ["Written confirmation of your tee time in your name", "Your briefing: address, route, arrival time, dress code, rentals and lunch", "A WhatsApp contact for the day"],
  },
  faq: [
    { q: "What exactly do you do for the fee?", a: "We choose a course for your group and area, reserve the tee time in your name, handle the club in Japanese and brief you before the day. We add nothing to the club's prices." },
    { q: "How much are the green fees?", a: "They vary by course and day. You pay them at the club; we send the club's prices with the proposal." },
    { q: "How do we get to the course?", a: "Drive, take the train and a taxi, or ask us to introduce a private transfer partner, booked and paid directly." },
    { q: "Can someone come with us on the day?", a: "Yes. An English-speaking assistant can meet you at the club and stay on hand, quoted separately. The assistant does not play." },
    { q: "Can I request a specific course?", a: "Yes, for the same fee, subject to availability. Members-only clubs cannot be guaranteed." },
    { q: "Can you arrange for a group of five or more?", a: "Yes, up to twelve. From five golfers we quote the fee for your group with the proposal." },
    { q: "Can I book for one golfer?", a: "Yes. Many clubs pair single players with other guests; we tell you how your course handles it." },
    { q: "Will we see Mt. Fuji?", a: "On many Mt. Fuji-area courses, weather permitting; never guaranteed." },
    { q: "Are rental clubs and shoes available?", a: "At most courses, yes; tell us who needs them and we reserve. Paid at the club. Bring your own wear and gloves." },
    { q: "Is there a dress code?", a: "Most clubs ask for smart clothing on arrival and a collared shirt on the course. We tell you your course's rules." },
    { q: "Is payment required when I send the form?", a: "No. Enquiring is free. Once we have agreed your requirements by email, you pay the fee and we start the research." },
    { q: "What if it rains?", a: arrangementPolicy["en"].weather },
    { q: "What is the cancellation policy?", a: "Before we send a proposal: full refund. After the proposal, before the booking is confirmed: we keep ¥5,000 and refund the rest. After written confirmation: our fee is not refunded. Full terms under Cancellation below." },
    { q: "How far ahead should we book?", a: "Two to four weeks ahead is ideal; requests close at 6:00 pm JST three days before." },
  ],
  benefits: ["Courses anywhere in Japan", `From ${FEE} per group`, "Transfers arranged on request"],
  crumb: "Golf Course Booking",
  photoNote: "Example courses; yours is confirmed with your reservation.",
  inclusions: {
    heading: "What the fee covers",
    sub: "One fee for the group. The day itself is paid at the club, as for every golfer in Japan.",
    includedLabel: "We arrange it", notIncludedLabel: "Not part of the service",
    items: {
      round: { label: "Tee-Time Booking", note: "Course chosen and reserved in your name; green fees paid at the club" },
      clubs: { label: "Rental Clubs", note: "Reserved on request; paid at the club" },
      shoes: { label: "Rental Shoes", note: "Reserved on request; paid at the club" },
      transfer: { label: "Private Transfer", note: "We introduce a licensed transfer company; you book and pay them directly" },
      driver: { label: "Driver", note: "Comes with the partner's car" },
      assistant: { label: "English Assistant", note: "Optional: with you at the club on the day, quoted separately" },
      cart: { label: "Golf Cart", note: "Requested with your booking; paid at the club" },
      locker: { label: "Locker Room", note: "Clubhouse facility, with your green fee" },
      bath: { label: "Bath", note: "At clubhouses that have one" },
      lunch: { label: "Lunch", note: "Order at the clubhouse; paid there" },
      taxes: { label: "Taxes", note: "The fee includes tax; club prices include theirs" },
      wear: { label: "Golf Wear", note: "Bring your own wear and gloves" },
    },
    footnote: "Green fees, cart, rentals, lunch and any caddie are paid at the club; we tell you the amounts in advance.",
    courseNote: "Cart rules, rentals and clubhouse facilities vary by course; details come with your reservation.",
    alsoNot: "Food, drinks and personal purchases are settled at the club.",
  },
  transfer: {
    heading: "Getting There: Your Choice",
    body: "No transfer is built into the fee. Drive, take the train and a taxi, or ask us to introduce a licensed private transfer partner, booked and paid directly with them.",
    points: [
      { title: "Meet at the course", body: "We send the address, route and arrival time. Journey times depend on your accommodation, course and transport; we discuss the estimate before payment." },
      { title: "Private car through our partner", body: "A minivan with a driver, hotel to clubhouse and back. You book and pay the partner directly." },
      { title: "Train and taxi", body: "Some courses are near a station with taxis waiting; we tell you which." },
    ],
    note: "The vehicle shown is an example from our transfer partner.",
  },
  options: {
    heading: "Plan your round", golfersLegend: "Golfers", areaLegend: "Area", golfers: "{n} golfers",
    perPerson: " / golfer", total: "{total} fee · {n} golfers", totalShort: "{total} fee", perPersonRef: "{price} / golfer",
    feeBase: "{base} for one golfer", feeBreakdown: "{base} + {extra} × {n} additional golfer|golfers", feeRule: `${FEE} for the first golfer, then ${EXTRA} for each additional golfer`,
    customQuote: "Custom quote", customQuoteLine: "Specific course · {n} golfers",
    moreGolfers: "5 or more", largePartyQuote: "Quoted individually", largePartyLine: "{n} golfers · fee quoted for your group", largePartyRow: "5 to 12 golfers",
    largePartyNote: "For five or more we quote the fee for your group. Send your number and date; enquiring is free.",
    includes: "Fee only. Green fees, cart and rentals are paid at the club.",
    note: arrangementPolicy["en"].beforePayment,
    assure: { heading: "No payment to enquire", body: "We agree your requirements first. The fee is paid before we research and propose; we book only after you approve the course, tee time and charges." },
    customNote: "A specific course costs the same fee, subject to availability.",
    ctaNote: "No payment required to enquire.",
    allPrices: "Fee for every group size",
  },
  intro: {
    heading: "Your tee time in Japan, arranged.",
    guideNote: "", // dropped from the page (owner, 2026-10-26); the FAQ answers the mark-up question
  },
  day: {
    steps: [
      { title: "Request a tee time", body: "Your date, your golfers, your area. Free." },
      { title: "Agree and pay the fee", body: "We confirm your requirements and budget by email; the fee is paid before we research." },
      { title: "Approve the proposal", body: "We send a course, tee time and the club's prices. We book only after you approve, then send written confirmation." },
      { title: "Play", body: "Check in under your name, pay the club directly, enjoy your round." },
    ],
    note: "Green fees vary by course and day; the club's exact prices come with the proposal.",
    timingsH: "A typical day", bookingH: "How booking works",
  },
  prices: {
    heading: "Arrangement fee by group size",
    only: `${FEE} for the first golfer, ${EXTRA} for each additional golfer. Same in both areas; five or more are quoted for the group.`,
    golfersCol: "Golfers", perPersonCol: "Breakdown", totalCol: "Fee",
    approxNote: "Green fees, cart, rentals and lunch are paid at the club.",
    notes: [
      "A specific course costs the same fee.",
      "An English-speaking assistant is quoted separately.",
    ],
  },
  form: {
    steps: { dates: "Date & tee time", course: "Golf course", hotel: "Where you are staying (optional)", group: "Golfers & rentals", contact: "Contact" },
    departure: "Preferred tee time",
    specificCourse: "Request a specific golf course", specificCourseNote: "Optional: name a course and we try there first.",
    specificCourseQuote: "Same fee, subject to availability.",
    courseName: "Course name", courseUrl: "Course website (optional)",
    pickup: "Hotel or area (optional)", pickupHint: "e.g. Shinjuku — helps us suggest courses",
    rentalH: "Rental clubs & shoes (paid at the club)",
    rental: "Rental clubs", rentalOpts: { required: "Please reserve", own: "Bringing own", unsure: "Not sure" },
    rentalNote: "Tell us who needs clubs or shoes; we reserve them.",
    requestsHint: "Tee-time window, playing requests, anything else",
    confirmNote: "Fee for your group. Green fees are paid at the course.",
    package: "Arrangement fee", perPersonRef: "per golfer", recommendedCourse: "Course chosen by us",
    cta: "Send Tee-Time Request",
  },
  headings: { about: "About this service", included: "What the fee covers", day: "Your golf day", faq: "Questions", terms: "Cancellation", request: "Request a tee time" },
  summary: {
    lines: [`Fee from ${FEE} per group`, "Green fees and rentals paid at the club", "Courses anywhere in Japan · transfers on request"],
    beforeH: "Three things before you send",
    before: ["Green fees, cart and rentals are paid at the club, not to us.", "The fee is paid after we agree your requirements, before we research courses.", "Five golfers or more are quoted for the group."],
  },
  process: {
    received: arrangementPolicy["en"].request,
    proposal: arrangementPolicy["en"].beforePayment,
    arrange: arrangementPolicy["en"].research,
    protection: arrangementPolicy["en"].confirmation,
    steps: arrangementPolicy["en"].stages,
    area: "Tokyo area or Mt. Fuji region. Meet at the course; private transfers through our partner on request.",
    caddie: "Course caddie", caddies: ["No caddie", "Caddie requested (paid at the club, where offered)", "Please advise"],
    caddieNote: "We ask the club and tell you the caddie fee with the proposal.",
    paidH: "Payment received", paid: arrangementPolicy["en"].paid,
    assistant: "English-speaking assistant on the day", assistants: ["Not needed", "Requested (quoted separately)", "Please advise"],
    assistantNote: "Quoted separately with your proposal.",
    transfer: "Transfer to the course", transfers: ["Not needed — we make our own way", "Yes — please introduce the transfer partner", "Please advise"],
    transferNote: "Transfers are not part of the service; we can introduce our partner, whom you book and pay directly.",
  },
};

const ja: ArrangementCopy = {
  title: "日本のゴルフ場予約手配サービス",
  seoTitle: "日本のゴルフ場予約手配サービス | 東京近郊・富士山エリア | KAMEHAME JAPAN",
  metaDescription: `東京近郊または富士山エリアのゴルフ場で、あなたの名前でティータイムを予約します。手配料は1名目${FEE}、2名目以降は1名${EXTRA}を追加。プレー代・カート・レンタルは当日ゴルフ場で精算、送迎は提携会社をご紹介します。`,
  tagline: `コースを選び、お客様のお名前でティータイムを予約し、ゴルフ場とのやり取りを英語で代行します。手配料は1組${FEE}〜、プレー代は現地精算です。`,
  overview: [
    "海外から日本のゴルフ場を予約するのは簡単ではありません。日本語だけのサイト、メンバー紹介、暗黙のルール。日程・人数・エリアを教えていただければ、コースをご提案し、お名前で予約し、ゴルフ場の決まりごとをお伝えします。",
    "集合はゴルフ場。ご希望があれば送迎の提携会社をご紹介します。プレー代・カート・レンタル・昼食はゴルフ場でお支払いください。",
  ],
  duration: "1ラウンド・18ホール", group: "1〜12名(5名以上は見積)・現地集合", area: "東京近郊または富士山エリア",
  includedShort: "コース選定とティータイム予約 · ゴルフ場との英語でのやり取り",
  cancellation: arrangementPolicy["ja"].terms,
  included: [
    "ご希望エリアでの、日程・人数・レベルに合ったコース選定",
    "お客様のお名前でのティータイム予約と、書面での確定通知",
    "ゴルフ場との日本語でのやり取りすべて(レンタル、カート、キャディ、ドレスコード、昼食)",
    "事前のご案内:行き方、チェックイン、クラブハウスでの作法、持ち物",
    "事前と当日のメール・WhatsAppサポート",
    "消費税込み",
  ],
  notIncluded: [
    "プレー代、ゴルフカート、ロッカー、昼食、各種レンタル:当日ゴルフ場で直接お支払い",
    "送迎:現地集合、または当社がご紹介する送迎の提携会社と直接契約・直接お支払い",
    "英語対応アシスタントの同行:ご希望により別途お見積もり",
    "コースのキャディ(ゴルフ場に制度がある場合、現地払い)",
    "ゴルフウェアとグローブ(ご持参ください)",
  ],
  schedule: [
    { time: "朝", title: "ゴルフ場に到着", body: "ティータイムの45分ほど前にクラブハウスへ。レンタカー、電車とタクシー、または提携会社に手配した送迎車で。" },
    { time: "受付", title: "お名前でチェックイン", body: "予約はお客様のお名前で、ゴルフ場に必要な情報を添えて入っています。プレー代とレンタル料はフロントでお支払いください。日本のゴルファーと同じ流れです。" },
    { time: "スタート", title: "ラウンド", body: "18ホールをご自身のペースで。多くのコースでは昼食はハーフの間に取ります。事前にお知らせします。" },
    { time: "ラウンド後", title: "お風呂と出発", body: "クラブハウスで精算し、お風呂があればゆっくり浸かってから次の目的地へ。" },
  ],
  scheduleNote: "一日の流れの例です。ティータイムと昼食はコースによります。",
  timeLabel: "希望のティータイム",
  cta: { label: "空き状況を確認する", note: "お問い合わせの時点でお支払いは発生しません。", heading: "ティータイムをリクエスト", lead: "日程・人数・エリアをお送りください。今はお支払い不要です。" },
  variants: { tokyo: { title: "東京近郊", short: "東京近郊", tagline: "東京から車で1〜1.5時間のコース" }, fuji: { title: "富士山エリア", short: "富士山エリア", tagline: "富士山を望むコース" }, other: { title: "その他のエリア", short: "その他", tagline: "全国どこでも。場所はフォームでお知らせください。手配料は同じです。" } },
  otherArea: { label: "プレーしたい場所", hint: "都道府県・都市・コース名など。例: 北海道、軽井沢、宮崎" },
  venue: {
    known: ["グループの手配料", "集合はゴルフ場。送迎はご自身で、またはご紹介する提携会社で"],
    afterBooking: ["お客様のお名前でのティータイム確定通知(書面)", "事前案内:住所、行き方、到着時刻、ドレスコード、レンタル、昼食", "当日のWhatsApp連絡先"],
  },
  faq: [
    { q: "手配料で何をしてもらえますか?", a: "人数とエリアに合うコースを選び、お名前でティータイムを予約し、ゴルフ場との日本語のやり取りを引き受け、事前にご案内します。ゴルフ場の料金に上乗せはしません。" },
    { q: "プレー代はいくらですか?", a: "コースと曜日で変わります。お支払いはゴルフ場で。金額はご提案時にお伝えします。" },
    { q: "ゴルフ場へはどう行けばいいですか?", a: "お車、電車とタクシー、または当社がご紹介する送迎会社（直接予約・お支払い）で。" },
    { q: "当日、誰か同行してもらえますか?", a: "はい。英語アシスタントがゴルフ場でお迎えし、当日お側で対応します（別途お見積もり。プレーはしません）。" },
    { q: "特定のコースを指定できますか?", a: "はい、同じ手配料です。空き状況によります。メンバー制のクラブは確約できません。" },
    { q: "5名以上のグループでも手配できますか?", a: "はい、12名まで。5名以上はご提案時にグループの手配料をお見積もりします。" },
    { q: "1名でも予約できますか?", a: "はい。多くのゴルフ場では他のお客様との組み合わせになります。コースごとの扱いをお伝えします。" },
    { q: "富士山は見えますか?", a: "富士山エリアの多くのコースで、天候次第で望めます。確約はできません。" },
    { q: "レンタルクラブやシューズはありますか?", a: "多くのコースで可能です。必要な方をお知らせいただければ予約します。料金はゴルフ場払い。ウェアとグローブはご持参ください。" },
    { q: "ドレスコードはありますか?", a: "多くのクラブで来場時はきれいめの服装、コースでは襟付きシャツが求められます。コースの決まりをお伝えします。" },
    { q: "フォーム送信時に支払いは必要ですか?", a: "いいえ。お問い合わせは無料です。条件をメールで合意した後に手配料をお支払いいただき、調査を始めます。" },
    { q: "雨の場合は?", a: arrangementPolicy["ja"].weather },
    { q: "キャンセル規定は?", a: "ご提案前の取消は全額返金。ご提案後・予約確定前は5,000円を頂戴し残額を返金。確定通知後は手配料の返金はありません。詳細は下の「キャンセル」をご覧ください。" },
    { q: "どれくらい前に予約すべきですか?", a: "2〜4週間前が理想です。受付は開催3日前の18時（日本時間）まで。" },
  ],
  benefits: ["全国のゴルフ場を手配可能", `1組 ${FEE}〜`, "送迎のご紹介も可能"],
  crumb: "ゴルフ場予約手配",
  photoNote: "コースの一例です。実際のコースは予約確定時にご案内します。",
  inclusions: {
    heading: "手配料に含まれるもの",
    sub: "手配料は1組の金額です。当日の費用は日本のゴルファーと同じようにゴルフ場でお支払いいただきます。",
    includedLabel: "当社が手配", notIncludedLabel: "サービス対象外",
    items: {
      round: { label: "ティータイム予約", note: "コースを選定し、お名前で予約。プレー代はゴルフ場払い" },
      clubs: { label: "レンタルクラブ", note: "ご希望で予約。料金はゴルフ場払い" },
      shoes: { label: "レンタルシューズ", note: "ご希望で予約。料金はゴルフ場払い" },
      transfer: { label: "専用車送迎", note: "対応できる送迎会社をご紹介。予約とお支払いは直接" },
      driver: { label: "ドライバー", note: "提携会社の車両に付帯" },
      assistant: { label: "英語アシスタント", note: "オプション:当日ゴルフ場で同行、別途見積" },
      cart: { label: "ゴルフカート", note: "予約時に依頼。料金はゴルフ場払い" },
      locker: { label: "ロッカールーム", note: "クラブハウスの設備(プレー代に含む)" },
      bath: { label: "お風呂", note: "設備のあるクラブハウスで" },
      lunch: { label: "昼食", note: "クラブハウスで注文・お支払い" },
      taxes: { label: "税金", note: "手配料は税込。ゴルフ場の料金も税込表示" },
      wear: { label: "ゴルフウェア", note: "ウェアとグローブはご持参" },
    },
    footnote: "プレー代・カート・レンタル・昼食・キャディ代はゴルフ場払いです。金額は事前にお伝えします。",
    courseNote: "カートの運用、レンタル、クラブハウスの設備はコースにより異なります。詳細は予約確定時にご案内します。",
    alsoNot: "飲食や個人的な購入もゴルフ場でのお支払いです。",
  },
  transfer: {
    heading: "行き方は、お好みで",
    body: "手配料に送迎は含まれません。お車、電車とタクシー、または当社がご紹介する送迎会社（直接予約・お支払い）でお越しください。",
    points: [
      { title: "ゴルフ場に集合", body: "住所・行き方・到着時刻をご案内します。東京近郊は車で1〜1.5時間、富士山エリアは約2時間。" },
      { title: "提携会社の専用車", body: "ドライバー付きのミニバンでホテルとクラブハウスを往復。予約とお支払いは提携会社へ直接。" },
      { title: "電車とタクシー", body: "駅のそばでタクシーが使えるコースもあります。どのコースかお伝えします。" },
    ],
    note: "写真は送迎の提携会社の車両の一例です。",
  },
  options: {
    heading: "ラウンドを計画する", golfersLegend: "人数", areaLegend: "エリア", golfers: "{n}名",
    perPerson: "", total: "{n}名の手配料 {total}", totalShort: "手配料 {total}", perPersonRef: "1名 {price}",
    feeBase: "基本料 {base}(1名)", feeBreakdown: "基本料 {base}＋追加{n}名×{extra}", feeRule: `1名目${FEE}、2名目以降は1名${EXTRA}を追加`,
    customQuote: "個別見積", customQuoteLine: "希望コース指定・{n}名",
    moreGolfers: "5名以上", largePartyQuote: "個別見積", largePartyLine: "{n}名・手配料はお見積もり", largePartyRow: "5〜12名",
    largePartyNote: "5名以上はグループの手配料をお見積もりします。人数と日程をお送りください。お問い合わせは無料です。",
    includes: "表示は手配料のみ。プレー代・カート・レンタルはゴルフ場払いです。",
    note: arrangementPolicy["ja"].beforePayment,
    assure: { heading: "お問い合わせは無料", body: "まず条件をメールで確認します。手配料のお支払い後に調査・ご提案し、コース・時刻・料金をご承認いただいてから予約します。" },
    customNote: "希望コースの指定も同じ手配料です（空き状況によります）。",
    ctaNote: "お問い合わせの時点でお支払いは発生しません。",
    allPrices: "人数別の手配料",
  },
  intro: {
    heading: "日本でのティータイムを、あなたの名前で。",
    guideNote: "", // dropped from the page (owner, 2026-10-26); the FAQ answers the mark-up question
  },
  day: {
    steps: [
      { title: "ティータイムをリクエスト", body: "日程・人数・エリアをお送りください。無料です。" },
      { title: "条件合意と手配料のお支払い", body: "条件と予算をメールで確認し、手配料をお支払いいただいてから調査します。" },
      { title: "ご提案の承認", body: "コース・時刻・ゴルフ場の料金をご提案します。ご承認後に予約し、確定通知をお送りします。" },
      { title: "プレー", body: "お名前でチェックインし、ゴルフ場でお支払い。ラウンドをお楽しみください。" },
    ],
    note: "プレー代はコースと曜日で変わります。正確な金額はご提案時にお伝えします。",
    timingsH: "一日の流れの例", bookingH: "予約の流れ",
  },
  prices: {
    heading: "人数別の手配料",
    only: `1名目${FEE}、2名目以降は1名${EXTRA}。両エリア同額。5名以上はグループでお見積もりします。`,
    golfersCol: "人数", perPersonCol: "内訳", totalCol: "手配料",
    approxNote: "プレー代・カート・レンタル・昼食はゴルフ場払いです。",
    notes: [
      "希望コースの指定も同じ手配料です。",
      "英語アシスタントの同行は別途お見積もりです。",
    ],
  },
  form: {
    steps: { dates: "日程とティータイム", course: "ゴルフ場", hotel: "滞在先(任意)", group: "参加者とレンタル", contact: "連絡先" },
    departure: "希望のティータイム",
    specificCourse: "特定のゴルフ場を希望する", specificCourseNote: "任意:コース名をいただければ、まずそのコースに当たります。",
    specificCourseQuote: "同じ手配料です。空き状況によります。",
    courseName: "コース名", courseUrl: "コースのサイト(任意)",
    pickup: "ホテルまたはエリア(任意)", pickupHint: "例：新宿 — コース提案の参考にします",
    rentalH: "レンタルクラブ・シューズ（ゴルフ場払い）",
    rental: "レンタルクラブ", rentalOpts: { required: "予約希望", own: "持参する", unsure: "未定" },
    rentalNote: "必要な方をお知らせください。予約します。",
    requestsHint: "希望の時間帯、プレーのご要望など",
    confirmNote: "グループの手配料。プレー代はゴルフ場払いです。",
    package: "手配料", perPersonRef: "1名あたり", recommendedCourse: "当社が選定するコース",
    cta: "ティータイムをリクエストする",
  },
  headings: { about: "このサービスについて", included: "手配料に含まれるもの", day: "当日の流れ", faq: "よくあるご質問", terms: "キャンセルについて", request: "ティータイムをリクエスト" },
  summary: {
    lines: [`手配料 1組 ${FEE}〜`, "プレー代・レンタルはゴルフ場払い", "全国対応 · 送迎のご紹介可"],
    beforeH: "送る前に3つだけ",
    before: ["プレー代・カート・レンタルはゴルフ場でのお支払いです。", "手配料は条件の合意後、コース調査の前にお支払いいただきます。", "5名以上はグループでお見積もりします。"],
  },
  process: {
    received: arrangementPolicy["ja"].request,
    proposal: arrangementPolicy["ja"].beforePayment,
    arrange: arrangementPolicy["ja"].research,
    protection: arrangementPolicy["ja"].confirmation,
    steps: arrangementPolicy["ja"].stages,
    area: "東京近郊または富士山エリア。集合はゴルフ場。ご希望により提携会社の専用車送迎をご紹介します。",
    caddie: "コースのキャディ", caddies: ["不要", "希望する(制度のあるゴルフ場で、現地払い)", "相談したい"],
    caddieNote: "ゴルフ場に確認し、キャディ代をご提案時にお伝えします。",
    paidH: "お支払いを受け付けました", paid: arrangementPolicy["ja"].paid,
    assistant: "当日の英語対応アシスタント", assistants: ["不要", "希望する(別途見積)", "相談したい"],
    assistantNote: "ご提案時に別途お見積もりします。",
    transfer: "ゴルフ場までの送迎", transfers: ["不要(自分で移動する)", "希望する(提携会社の紹介を希望)", "相談したい"],
    transferNote: "送迎はサービスに含まれません。ご希望なら提携会社をご紹介し、直接ご予約・お支払いいただきます。",
  },
};

const es: ArrangementCopy = {
  title: "Reserva de campos de golf en Japón",
  seoTitle: "Reserva de campos de golf en Japón | Zona de Tokio y monte Fuji | KAMEHAME JAPAN",
  metaDescription: `Reservamos tu hora de salida en un campo cerca de Tokio o en la región del monte Fuji, en inglés, por ${FEE} (primer golfista) más ${EXTRA} por cada golfista adicional. Green fees, carrito y alquileres se pagan en el club; traslados privados a través de nuestro socio.`,
  tagline: `Elegimos el campo, reservamos la salida a tu nombre y tratamos con el club en inglés. Una tarifa por grupo desde ${FEE}; los green fees se pagan en el campo.`,
  overview: [
    "Reservar golf en Japón desde el extranjero es difícil: webs solo en japonés, presentaciones de socios, normas no escritas. Dinos tu fecha, tu grupo y la zona; proponemos un campo, lo reservamos a tu nombre y te contamos lo que el club espera.",
    "Quedamos en el campo, o te presentamos un socio de traslados privados. Green fees, carrito, alquileres y almuerzo se pagan en el club.",
  ],
  duration: "Una vuelta, 18 hoyos", group: "1–12 golfistas · 5 o más con presupuesto · encuentro en el campo", area: "Zona de Tokio o región del monte Fuji",
  includedShort: "Elección del campo y reserva de la salida · Gestión con el club en inglés",
  cancellation: arrangementPolicy["es"].terms,
  included: [
    "Elección del campo en la zona que prefieras, según fecha, tamaño del grupo y nivel",
    "Reserva de la hora de salida a tu nombre, confirmada por escrito",
    "Toda la comunicación con el club en japonés: alquileres, carrito o caddie, vestimenta, almuerzo",
    "Una guía previa: cómo llegar, el check-in, las costumbres de la casa club y qué llevar",
    "Asistencia por correo y WhatsApp antes y durante el día",
    "Impuestos incluidos",
  ],
  notIncluded: [
    "Green fees, carrito, taquilla, almuerzo y alquileres: se pagan directamente en el club ese día",
    "Traslados: encuentro en el campo, o coche privado con el socio de traslados que presentamos (contratado y pagado directamente con él)",
    "Asistente de habla inglesa para el día: a petición, presupuestado aparte",
    "Caddie del campo, donde el club lo ofrece (se paga en el club)",
    "Ropa y guantes de golf (trae los tuyos)",
  ],
  schedule: [
    { time: "Mañana", title: "Llegada al campo", body: "Llega a la casa club unos 45 minutos antes de tu salida: en coche, en tren y taxi, o en el coche privado reservado con nuestro socio." },
    { time: "Check-in", title: "Registro a tu nombre", body: "Tu reserva está a tu nombre con las notas que el club necesita. Paga los green fees y los alquileres en recepción, como hace cualquier golfista en Japón." },
    { time: "Salida", title: "Tu vuelta", body: "18 hoyos a tu ritmo. En la mayoría de los campos el almuerzo va entre las dos mitades; te lo decimos de antemano." },
    { time: "Tras la vuelta", title: "Baño y salida", body: "Liquida la cuenta de la casa club, disfruta del baño si el club lo tiene y sigue tu camino." },
  ],
  scheduleNote: "Un día típico; la hora de salida y el almuerzo dependen del campo.",
  timeLabel: "Hora de salida preferida",
  cta: { label: "Consultar horas de salida", note: "No se paga nada al consultar.", heading: "Solicitar una hora de salida", lead: "Tu fecha, tus golfistas, tu zona. Sin pago ahora." },
  variants: { tokyo: { title: "Zona de Tokio", short: "Zona de Tokio", tagline: "Campos a 1–1,5 horas de Tokio" }, fuji: { title: "Zona del monte Fuji", short: "Monte Fuji", tagline: "Campos con el monte Fuji en el horizonte" }, other: { title: "Otra zona", short: "Otra", tagline: "En cualquier lugar de Japón: dinos dónde en el formulario. Misma tarifa." } },
  otherArea: { label: "¿Dónde quieres jugar?", hint: "Prefectura, ciudad o campo, p. ej. Hokkaido, Karuizawa, Miyazaki" },
  venue: {
    known: ["La tarifa de tu grupo", "Encuentro en el campo, o traslado con el socio que presentamos"],
    afterBooking: ["Confirmación escrita de tu hora de salida a tu nombre", "Tu guía: dirección, ruta, hora de llegada, vestimenta, alquileres y almuerzo", "Un contacto de WhatsApp para el día"],
  },
  faq: [
    { q: "¿Qué hacéis exactamente por la tarifa?", a: "Elegimos un campo para tu grupo y zona, reservamos la salida a tu nombre, tratamos con el club en japonés y te informamos antes del día. No añadimos nada a los precios del club." },
    { q: "¿Cuánto cuestan los green fees?", a: "Varían según el campo y el día. Los pagas en el club; enviamos sus precios con la propuesta." },
    { q: "¿Cómo llegamos al campo?", a: "En coche, en tren y taxi, o con el socio de traslados que te presentamos, reservado y pagado directamente." },
    { q: "¿Puede acompañarnos alguien ese día?", a: "Sí. Un asistente de habla inglesa puede recibirte en el club y quedarse a tu disposición, presupuestado aparte. No juega." },
    { q: "¿Puedo pedir un campo concreto?", a: "Sí, por la misma tarifa, según disponibilidad. Los clubes solo para socios no se garantizan." },
    { q: "¿Podéis gestionar un grupo de cinco o más?", a: "Sí, hasta doce. A partir de cinco presupuestamos la tarifa de tu grupo con la propuesta." },
    { q: "¿Puedo reservar para un solo golfista?", a: "Sí. Muchos clubes agrupan a jugadores individuales con otros huéspedes; te decimos cómo lo hace tu campo." },
    { q: "¿Veremos el monte Fuji?", a: "En muchos campos de la zona del Fuji, si el tiempo lo permite; nunca garantizado." },
    { q: "¿Hay palos y zapatos de alquiler?", a: "En la mayoría, sí; dinos quién los necesita y los reservamos. Se pagan en el club. Trae tu ropa y guantes." },
    { q: "¿Hay código de vestimenta?", a: "La mayoría pide ropa formal al llegar y polo con cuello en el campo. Te decimos las normas de tu campo." },
    { q: "¿Hay que pagar al enviar el formulario?", a: "No. Consultar es gratis. Una vez acordados tus requisitos por correo, pagas la tarifa y empezamos la investigación." },
    { q: "¿Y si llueve?", a: arrangementPolicy["es"].weather },
    { q: "¿Cuál es la política de cancelación?", a: "Antes de enviar una propuesta: reembolso íntegro. Tras la propuesta, antes de confirmar la reserva: retenemos ¥5,000 y devolvemos el resto. Tras la confirmación escrita: la tarifa no se devuelve. Condiciones completas en Cancelación, más abajo." },
    { q: "¿Con cuánta antelación reservar?", a: "Lo ideal es con dos a cuatro semanas; las solicitudes cierran a las 18:00 JST tres días antes." },
  ],
  benefits: ["Campos en todo Japón", `Desde ${FEE} por grupo`, "Traslados a petición"],
  crumb: "Reserva de campo de golf",
  photoNote: "Campos de ejemplo; el tuyo se confirma con la reserva.",
  inclusions: {
    heading: "Qué cubre la tarifa",
    sub: "Una tarifa por grupo. El día en sí se paga en el club, como cualquier golfista en Japón.",
    includedLabel: "Lo gestionamos", notIncludedLabel: "No forma parte del servicio",
    items: {
      round: { label: "Reserva de la salida", note: "Campo elegido y reservado a tu nombre; green fees pagados en el club" },
      clubs: { label: "Palos de alquiler", note: "Reservados a petición; se pagan en el club" },
      shoes: { label: "Zapatos de alquiler", note: "Reservados a petición; se pagan en el club" },
      transfer: { label: "Traslado privado", note: "Te presentamos una empresa de traslados con licencia; reservas y pagas con ella directamente" },
      driver: { label: "Conductor", note: "Incluido con el coche del socio" },
      assistant: { label: "Asistente en inglés", note: "Opcional: contigo en el club ese día, presupuestado aparte" },
      cart: { label: "Carrito de golf", note: "Se pide con la reserva; se paga en el club" },
      locker: { label: "Vestuario", note: "Instalación de la casa club, con tu green fee" },
      bath: { label: "Baño", note: "En las casas club que lo tienen" },
      lunch: { label: "Almuerzo", note: "Se pide en la casa club; se paga allí" },
      taxes: { label: "Impuestos", note: "La tarifa incluye impuestos; los precios del club también" },
      wear: { label: "Ropa de golf", note: "Trae tu propia ropa y guantes" },
    },
    footnote: "Green fees, carrito, alquileres, almuerzo y caddie se pagan en el club; te decimos los importes de antemano.",
    courseNote: "Normas del carrito, alquileres e instalaciones varían según el campo; los detalles llegan con la reserva.",
    alsoNot: "Comida, bebida y compras personales se pagan en el club.",
  },
  transfer: {
    heading: "Cómo llegar: tú eliges",
    body: "La tarifa no incluye traslado. Ve en coche, en tren y taxi, o pídenos presentarte un socio de traslados autorizado, que reservas y pagas directamente.",
    points: [
      { title: "Encuentro en el campo", body: "Te enviamos dirección, ruta y hora de llegada. Cerca de Tokio, 1–1,5 h en coche; monte Fuji, unas 2." },
      { title: "Coche privado con nuestro socio", body: "Una monovolumen con conductor, del hotel al club y vuelta. Reservas y pagas al socio directamente." },
      { title: "Tren y taxi", body: "Algunos campos están cerca de una estación con taxis; te decimos cuáles." },
    ],
    note: "El vehículo mostrado es un ejemplo de nuestro socio de traslados.",
  },
  options: {
    heading: "Planifica tu vuelta", golfersLegend: "Golfistas", areaLegend: "Zona", golfers: "{n} golfistas",
    perPerson: " / golfista", total: "{total} de tarifa · {n} golfistas", totalShort: "{total} de tarifa", perPersonRef: "{price} / golfista",
    feeBase: "{base} por un golfista", feeBreakdown: "{base} + {extra} × {n} golfista adicional|golfistas adicionales", feeRule: `${FEE} por el primer golfista, más ${EXTRA} por cada golfista adicional`,
    customQuote: "Presupuesto individual", customQuoteLine: "Campo concreto · {n} golfistas",
    moreGolfers: "5 o más", largePartyQuote: "Presupuesto individual", largePartyLine: "{n} golfistas · tarifa presupuestada para tu grupo", largePartyRow: "5 a 12 golfistas",
    largePartyNote: "A partir de cinco presupuestamos la tarifa de tu grupo. Envía número y fecha; consultar es gratis.",
    includes: "Solo la tarifa. Green fees, carrito y alquileres se pagan en el club.",
    note: arrangementPolicy["es"].beforePayment,
    assure: { heading: "Consultar es gratis", body: "Primero acordamos tus requisitos. La tarifa se paga antes de investigar y proponer; reservamos solo cuando apruebas campo, hora y costes." },
    customNote: "Un campo concreto cuesta la misma tarifa, según disponibilidad.",
    ctaNote: "No se paga nada al consultar.",
    allPrices: "Tarifa por tamaño de grupo",
  },
  intro: {
    heading: "Tu hora de salida en Japón, gestionada.",
    guideNote: "", // dropped from the page (owner, 2026-10-26); the FAQ answers the mark-up question
  },
  day: {
    steps: [
      { title: "Solicita una salida", body: "Tu fecha, tus golfistas, tu zona. Gratis." },
      { title: "Acuerda y paga la tarifa", body: "Confirmamos requisitos y presupuesto por correo; la tarifa se paga antes de investigar." },
      { title: "Aprueba la propuesta", body: "Te enviamos campo, hora y precios del club. Reservamos solo con tu aprobación y enviamos la confirmación por escrito." },
      { title: "Juega", body: "Regístrate a tu nombre, paga al club y disfruta la vuelta." },
    ],
    note: "Los green fees varían según el campo y el día; los precios exactos llegan con la propuesta.",
    timingsH: "Un día típico", bookingH: "Cómo funciona la reserva",
  },
  prices: {
    heading: "Tarifa de gestión por tamaño de grupo",
    only: `${FEE} por el primer golfista, ${EXTRA} por cada golfista adicional. Igual en ambas zonas; cinco o más se presupuestan por grupo.`,
    golfersCol: "Golfistas", perPersonCol: "Desglose", totalCol: "Tarifa",
    approxNote: "Green fees, carrito, alquileres y almuerzo se pagan en el club.",
    notes: [
      "Un campo concreto cuesta la misma tarifa.",
      "El asistente de habla inglesa se presupuesta aparte.",
    ],
  },
  form: {
    steps: { dates: "Fecha y hora de salida", course: "Campo de golf", hotel: "Dónde te alojas (opcional)", group: "Golfistas y alquileres", contact: "Contacto" },
    departure: "Hora de salida preferida",
    specificCourse: "Solicitar un campo concreto", specificCourseNote: "Opcional: indica un campo y lo intentamos primero allí.",
    specificCourseQuote: "Misma tarifa, según disponibilidad.",
    courseName: "Nombre del campo", courseUrl: "Web del campo (opcional)",
    pickup: "Hotel o zona (opcional)", pickupHint: "p. ej. Shinjuku — nos ayuda a sugerir campos",
    rentalH: "Palos y zapatos de alquiler (se pagan en el club)",
    rental: "Palos de alquiler", rentalOpts: { required: "Reservar", own: "Traigo los míos", unsure: "No estoy seguro" },
    rentalNote: "Dinos quién los necesita; los reservamos.",
    requestsHint: "Franja de salida, peticiones de juego, lo que quieras",
    confirmNote: "Tarifa de tu grupo. Los green fees se pagan en el campo.",
    package: "Tarifa de gestión", perPersonRef: "por golfista", recommendedCourse: "Campo elegido por nosotros",
    cta: "Enviar solicitud de hora de salida",
  },
  headings: { about: "Sobre este servicio", included: "Qué cubre la tarifa", day: "Tu día de golf", faq: "Preguntas", terms: "Cancelación", request: "Solicitar una hora de salida" },
  summary: {
    lines: [`Tarifa desde ${FEE} por grupo`, "Green fees y alquileres se pagan en el club", "Campos en todo Japón · traslados a petición"],
    beforeH: "Tres cosas antes de enviar",
    before: ["Green fees, carrito y alquileres se pagan en el club, no a nosotros.", "La tarifa se paga tras acordar tus requisitos, antes de investigar campos.", "Cinco golfistas o más se presupuestan por grupo."],
  },
  process: {
    received: arrangementPolicy["es"].request,
    proposal: arrangementPolicy["es"].beforePayment,
    arrange: arrangementPolicy["es"].research,
    protection: arrangementPolicy["es"].confirmation,
    steps: arrangementPolicy["es"].stages,
    area: "Zona de Tokio o región del monte Fuji. Encuentro en el campo; traslados privados con nuestro socio a petición.",
    caddie: "Caddie del campo", caddies: ["Sin caddie", "Caddie solicitado (se paga en el club, donde lo haya)", "Prefiero consultar"],
    caddieNote: "Lo consultamos con el club y te decimos el precio del caddie con la propuesta.",
    paidH: "Pago recibido", paid: arrangementPolicy["es"].paid,
    assistant: "Asistente de habla inglesa para el día", assistants: ["No necesario", "Solicitado (presupuesto aparte)", "Prefiero consultar"],
    assistantNote: "Se presupuesta aparte con tu propuesta.",
    transfer: "Traslado al campo", transfers: ["No necesario: vamos por nuestra cuenta", "Sí: preséntennos a la empresa de traslados asociada", "Prefiero consultar"],
    transferNote: "El traslado no forma parte del servicio; podemos presentarte a nuestro socio, con quien reservas y pagas directamente.",
  },
};

const fr: ArrangementCopy = {
  title: "Réservation de parcours de golf au Japon",
  seoTitle: "Réservation de parcours de golf au Japon | Région de Tokyo et mont Fuji | KAMEHAME JAPAN",
  metaDescription: `Nous réservons votre départ sur un parcours près de Tokyo ou dans la région du mont Fuji, en anglais, pour ${FEE} (premier golfeur) plus ${EXTRA} par golfeur supplémentaire. Green fees, voiturette et locations se règlent au club ; transferts privés via notre partenaire.`,
  tagline: `Nous choisissons le parcours, réservons le départ à votre nom et gérons le club en anglais. Un forfait par groupe dès ${FEE} ; les green fees se règlent au parcours.`,
  overview: [
    "Réserver un parcours au Japon depuis l'étranger est difficile : sites en japonais, parrainage de membres, règles tacites. Donnez-nous votre date, votre groupe et la région ; nous proposons un parcours, le réservons à votre nom et vous expliquons ce que le club attend.",
    "Rendez-vous au parcours, ou nous vous présentons un partenaire de transfert privé. Green fees, voiturette, locations et déjeuner se règlent au club.",
  ],
  duration: "Une partie, 18 trous", group: "1 à 12 golfeurs · 5 ou plus sur devis · rendez-vous au parcours", area: "Région de Tokyo ou du mont Fuji",
  includedShort: "Choix du parcours et réservation du départ · Échanges avec le club en anglais",
  cancellation: arrangementPolicy["fr"].terms,
  included: [
    "Choix du parcours dans la région souhaitée, selon la date, la taille du groupe et le niveau",
    "Réservation de l'heure de départ à votre nom, confirmée par écrit",
    "Tous les échanges avec le club en japonais : locations, voiturette ou caddie, tenue, déjeuner",
    "Un briefing avant le jour J : accès, enregistrement, usages du club-house et affaires à apporter",
    "Assistance par e-mail et WhatsApp avant et pendant la journée",
    "Taxes comprises",
  ],
  notIncluded: [
    "Green fees, voiturette, vestiaire, déjeuner et locations : réglés directement au club le jour même",
    "Transferts : rendez-vous au parcours, ou voiture privée auprès du partenaire que nous présentons (contrat et paiement directement avec lui)",
    "Assistant anglophone pour la journée : sur demande, devis séparé",
    "Caddie du parcours, lorsque le club le propose (réglé au club)",
    "Tenue et gants de golf (à apporter)",
  ],
  schedule: [
    { time: "Matin", title: "Arrivée au parcours", body: "Présentez-vous au club-house environ 45 minutes avant votre départ : en voiture, en train et taxi, ou dans la voiture privée réservée auprès de notre partenaire." },
    { time: "Enregistrement", title: "Enregistrement à votre nom", body: "Votre réservation est à votre nom, avec les informations dont le club a besoin. Réglez les green fees et les locations à l'accueil, comme tout golfeur au Japon." },
    { time: "Départ", title: "Votre partie", body: "18 trous à votre rythme. Sur la plupart des parcours, le déjeuner se prend entre les deux neuf ; nous vous le précisons à l'avance." },
    { time: "Après la partie", title: "Bain et départ", body: "Réglez la note du club-house, profitez du bain si le club en a un, puis reprenez la route." },
  ],
  scheduleNote: "Une journée type ; l'horaire et le déjeuner dépendent du parcours.",
  timeLabel: "Heure de départ souhaitée",
  cta: { label: "Voir les départs", note: "Aucun paiement lors de la demande.", heading: "Demander un départ", lead: "Votre date, vos golfeurs, votre région. Aucun paiement maintenant." },
  variants: { tokyo: { title: "Région de Tokyo", short: "Région de Tokyo", tagline: "Parcours à 1 h – 1 h 30 de Tokyo" }, fuji: { title: "Région du mont Fuji", short: "Mont Fuji", tagline: "Parcours avec le mont Fuji à l'horizon" }, other: { title: "Autre région", short: "Autre", tagline: "Partout au Japon : indiquez le lieu dans le formulaire. Mêmes frais." } },
  otherArea: { label: "Où souhaitez-vous jouer ?", hint: "Préfecture, ville ou parcours, ex. Hokkaido, Karuizawa, Miyazaki" },
  venue: {
    known: ["Les frais pour votre groupe", "Rendez-vous au parcours, ou transfert via le partenaire que nous présentons"],
    afterBooking: ["Confirmation écrite de votre départ à votre nom", "Votre briefing : adresse, itinéraire, heure d'arrivée, tenue, locations et déjeuner", "Un contact WhatsApp pour la journée"],
  },
  faq: [
    { q: "Que faites-vous exactement pour ces frais ?", a: "Nous choisissons un parcours pour votre groupe et votre région, réservons le départ à votre nom, gérons le club en japonais et vous briefons avant le jour J. Nous n'ajoutons rien aux tarifs du club." },
    { q: "Combien coûtent les green fees ?", a: "Ils varient selon le parcours et le jour. Vous les réglez au club ; nous envoyons ses tarifs avec la proposition." },
    { q: "Comment se rend-on au parcours ?", a: "En voiture, en train et taxi, ou avec le partenaire de transfert que nous présentons, réservé et payé directement." },
    { q: "Quelqu'un peut-il nous accompagner ce jour-là ?", a: "Oui. Un assistant anglophone peut vous accueillir au club et rester disponible, sur devis séparé. Il ne joue pas." },
    { q: "Puis-je demander un parcours précis ?", a: "Oui, pour les mêmes frais, selon disponibilité. Les clubs réservés aux membres ne sont pas garantis." },
    { q: "Pouvez-vous organiser pour un groupe de cinq ou plus ?", a: "Oui, jusqu'à douze. À partir de cinq, nous chiffrons les frais pour votre groupe avec la proposition." },
    { q: "Puis-je réserver pour un seul golfeur ?", a: "Oui. Beaucoup de clubs regroupent les joueurs seuls avec d'autres ; nous vous disons comment fait votre parcours." },
    { q: "Verrons-nous le mont Fuji ?", a: "Sur beaucoup de parcours de la région du Fuji, si la météo le permet ; jamais garanti." },
    { q: "Y a-t-il des clubs et des chaussures de location ?", a: "Sur la plupart des parcours, oui ; dites-nous qui en a besoin et nous réservons. Réglé au club. Apportez tenue et gants." },
    { q: "Y a-t-il un code vestimentaire ?", a: "La plupart des clubs demandent une tenue soignée à l'arrivée et un polo à col sur le parcours. Nous vous indiquons les règles de votre parcours." },
    { q: "Faut-il payer en envoyant le formulaire ?", a: "Non. La demande est gratuite. Une fois vos exigences convenues par e-mail, vous réglez les frais et nous lançons la recherche." },
    { q: "Et s'il pleut ?", a: arrangementPolicy["fr"].weather },
    { q: "Quelles sont les conditions d'annulation ?", a: "Avant l'envoi d'une proposition : remboursement intégral. Après la proposition, avant la confirmation de la réservation : nous retenons ¥5,000 et remboursons le reste. Après la confirmation écrite : nos frais ne sont pas remboursés. Conditions complètes sous Annulation, ci-dessous." },
    { q: "Combien de temps à l'avance réserver ?", a: "Deux à quatre semaines à l'avance est idéal ; les demandes ferment à 18 h JST trois jours avant." },
  ],
  benefits: ["Parcours dans tout le Japon", `Dès ${FEE} par groupe`, "Transfert sur demande"],
  crumb: "Réservation de parcours",
  photoNote: "Parcours donnés en exemple ; le vôtre est confirmé avec la réservation.",
  inclusions: {
    heading: "Ce que couvrent les frais",
    sub: "Un forfait par groupe. La journée elle-même se règle au club, comme pour tout golfeur au Japon.",
    includedLabel: "Nous l'organisons", notIncludedLabel: "Hors service",
    items: {
      round: { label: "Réservation du départ", note: "Parcours choisi et réservé à votre nom ; green fees réglés au club" },
      clubs: { label: "Clubs de location", note: "Réservés sur demande ; réglés au club" },
      shoes: { label: "Chaussures de location", note: "Réservées sur demande ; réglées au club" },
      transfer: { label: "Transfert privé", note: "Nous vous présentons une société de transfert agréée ; réservation et paiement directement auprès d'elle" },
      driver: { label: "Chauffeur", note: "Compris avec la voiture du partenaire" },
      assistant: { label: "Assistant anglophone", note: "En option : avec vous au club ce jour-là, devis séparé" },
      cart: { label: "Voiturette", note: "Demandée avec la réservation ; réglée au club" },
      locker: { label: "Vestiaire", note: "Équipement du club-house, avec votre green fee" },
      bath: { label: "Bain", note: "Dans les club-houses qui en ont un" },
      lunch: { label: "Déjeuner", note: "À commander au club-house ; réglé sur place" },
      taxes: { label: "Taxes", note: "Les frais sont TTC ; les tarifs du club aussi" },
      wear: { label: "Tenue de golf", note: "Apportez votre tenue et vos gants" },
    },
    footnote: "Green fees, voiturette, locations, déjeuner et caddie se règlent au club ; nous vous indiquons les montants à l'avance.",
    courseNote: "Règles de voiturette, locations et installations varient selon le parcours ; les détails arrivent avec la réservation.",
    alsoNot: "Repas, boissons et achats personnels se règlent au club.",
  },
  transfer: {
    heading: "Pour y aller : à vous de choisir",
    body: "Aucun transfert n'est compris dans les frais. Venez en voiture, en train et taxi, ou demandez-nous de vous présenter un partenaire de transfert agréé, réservé et payé directement auprès de lui.",
    points: [
      { title: "Rendez-vous au parcours", body: "Nous envoyons l'adresse, l'itinéraire et l'heure d'arrivée. Près de Tokyo, 1 h – 1 h 30 en voiture ; mont Fuji, environ 2 h." },
      { title: "Voiture privée via notre partenaire", body: "Un monospace avec chauffeur, de l'hôtel au club-house et retour. Vous réservez et payez le partenaire directement." },
      { title: "Train et taxi", body: "Certains parcours sont proches d'une gare avec des taxis ; nous vous disons lesquels." },
    ],
    note: "Le véhicule montré est un exemple de notre partenaire de transfert.",
  },
  options: {
    heading: "Préparez votre partie", golfersLegend: "Golfeurs", areaLegend: "Région", golfers: "{n} golfeurs",
    perPerson: " / golfeur", total: "{total} de frais · {n} golfeurs", totalShort: "{total} de frais", perPersonRef: "{price} / golfeur",
    feeBase: "{base} pour un golfeur", feeBreakdown: "{base} + {extra} × {n} golfeur supplémentaire|golfeurs supplémentaires", feeRule: `${FEE} pour le premier golfeur, puis ${EXTRA} par golfeur supplémentaire`,
    customQuote: "Devis individuel", customQuoteLine: "Parcours précis · {n} golfeurs",
    moreGolfers: "5 ou plus", largePartyQuote: "Devis individuel", largePartyLine: "{n} golfeurs · frais chiffrés pour votre groupe", largePartyRow: "5 à 12 golfeurs",
    largePartyNote: "À partir de cinq, nous chiffrons les frais pour votre groupe. Envoyez le nombre et la date ; la demande est gratuite.",
    includes: "Frais uniquement. Green fees, voiturette et locations se règlent au club.",
    note: arrangementPolicy["fr"].beforePayment,
    assure: { heading: "La demande est gratuite", body: "Nous convenons d'abord de vos exigences. Les frais sont réglés avant la recherche et la proposition ; nous réservons seulement après votre accord sur le parcours, l'horaire et les coûts." },
    customNote: "Un parcours précis coûte les mêmes frais, selon disponibilité.",
    ctaNote: "Aucun paiement lors de la demande.",
    allPrices: "Frais par taille de groupe",
  },
  intro: {
    heading: "Votre départ au Japon, organisé.",
    guideNote: "", // dropped from the page (owner, 2026-10-26); the FAQ answers the mark-up question
  },
  day: {
    steps: [
      { title: "Demandez un départ", body: "Votre date, vos golfeurs, votre région. Gratuit." },
      { title: "Convenez et réglez les frais", body: "Nous confirmons vos exigences et votre budget par e-mail ; les frais sont réglés avant la recherche." },
      { title: "Approuvez la proposition", body: "Nous envoyons un parcours, un horaire et les tarifs du club. Nous réservons seulement après votre accord, puis envoyons la confirmation écrite." },
      { title: "Jouez", body: "Enregistrez-vous à votre nom, réglez le club directement et profitez de votre partie." },
    ],
    note: "Les green fees varient selon le parcours et le jour ; les tarifs exacts arrivent avec la proposition.",
    timingsH: "Une journée type", bookingH: "Comment se passe la réservation",
  },
  prices: {
    heading: "Frais d'organisation par taille de groupe",
    only: `${FEE} pour le premier golfeur, ${EXTRA} par golfeur supplémentaire. Identique dans les deux régions ; à partir de cinq, devis pour le groupe.`,
    golfersCol: "Golfeurs", perPersonCol: "Détail", totalCol: "Frais",
    approxNote: "Green fees, voiturette, locations et déjeuner se règlent au club.",
    notes: [
      "Un parcours précis coûte les mêmes frais.",
      "L'assistant anglophone fait l'objet d'un devis séparé.",
    ],
  },
  form: {
    steps: { dates: "Date et heure de départ", course: "Parcours", hotel: "Votre hébergement (facultatif)", group: "Golfeurs et locations", contact: "Contact" },
    departure: "Heure de départ souhaitée",
    specificCourse: "Demander un parcours précis", specificCourseNote: "Facultatif : nommez un parcours et nous l'essayons en premier.",
    specificCourseQuote: "Mêmes frais, selon disponibilité.",
    courseName: "Nom du parcours", courseUrl: "Site du parcours (facultatif)",
    pickup: "Hôtel ou quartier (facultatif)", pickupHint: "ex. Shinjuku — nous aide à suggérer des parcours",
    rentalH: "Clubs et chaussures de location (réglés au club)",
    rental: "Clubs de location", rentalOpts: { required: "À réserver", own: "J'apporte les miens", unsure: "Je ne sais pas" },
    rentalNote: "Dites-nous qui en a besoin ; nous les réservons.",
    requestsHint: "Créneau de départ, souhaits de jeu, autre",
    confirmNote: "Frais pour votre groupe. Les green fees se règlent au parcours.",
    package: "Frais d'organisation", perPersonRef: "par golfeur", recommendedCourse: "Parcours choisi par nos soins",
    cta: "Envoyer la demande de départ",
  },
  headings: { about: "À propos de ce service", included: "Ce que couvrent les frais", day: "Votre journée de golf", faq: "Questions", terms: "Annulation", request: "Demander un départ" },
  summary: {
    lines: [`Frais dès ${FEE} par groupe`, "Green fees et locations réglés au club", "Parcours dans tout le Japon · transfert sur demande"],
    beforeH: "Trois choses avant d'envoyer",
    before: ["Green fees, voiturette et locations se règlent au club, pas chez nous.", "Les frais sont réglés après accord sur vos exigences, avant la recherche de parcours.", "À partir de cinq golfeurs, devis pour le groupe."],
  },
  process: {
    received: arrangementPolicy["fr"].request,
    proposal: arrangementPolicy["fr"].beforePayment,
    arrange: arrangementPolicy["fr"].research,
    protection: arrangementPolicy["fr"].confirmation,
    steps: arrangementPolicy["fr"].stages,
    area: "Région de Tokyo ou du mont Fuji. Rendez-vous au parcours ; transferts privés via notre partenaire sur demande.",
    caddie: "Caddie du parcours", caddies: ["Sans caddie", "Caddie demandé (réglé au club, lorsqu'il est proposé)", "À discuter"],
    caddieNote: "Nous demandons au club et vous indiquons le tarif du caddie avec la proposition.",
    paidH: "Paiement reçu", paid: arrangementPolicy["fr"].paid,
    assistant: "Assistant anglophone pour la journée", assistants: ["Pas nécessaire", "Demandé (devis séparé)", "À discuter"],
    assistantNote: "Devis séparé avec votre proposition.",
    transfer: "Transfert vers le parcours", transfers: ["Pas nécessaire : nous nous déplaçons par nos propres moyens", "Oui : présentez-nous le partenaire de transfert", "À discuter"],
    transferNote: "Le transfert ne fait pas partie du service ; nous pouvons vous présenter notre partenaire, que vous réservez et payez directement.",
  },
};

const zh: ArrangementCopy = {
  title: "日本高爾夫球場預約代辦服務",
  seoTitle: "日本高爾夫球場預約代辦服務 | 東京近郊與富士山區域 | KAMEHAME JAPAN",
  metaDescription: `我們以英文為你預約東京近郊或富士山區域球場的開球時間，代辦費第 1 位 ${FEE}，每增加 1 位加 ${EXTRA}。果嶺費、球車與租借費用在球場支付；私人接送可透過合作夥伴安排。`,
  tagline: `我們挑選球場、以你的名字預約開球時間，並以英文與球場溝通。團體代辦費 ${FEE} 起；果嶺費在球場支付。`,
  overview: [
    "從海外預約日本球場並不容易：只有日文的網站、會員介紹、不成文的規定。告訴我們日期、人數與區域，我們提案球場、以你的名字預約，並說明球場的規定。",
    "在球場集合，或請我們介紹私人接送夥伴。果嶺費、球車、租借與午餐在球場支付。",
  ],
  duration: "一輪 18 洞", group: "1 至 12 位球友 · 5 位以上個別報價 · 球場集合", area: "東京近郊或富士山區域",
  includedShort: "球場挑選與開球時間預約 · 以英文與球場溝通",
  cancellation: arrangementPolicy["zh-tw"].terms,
  included: [
    "依日期、人數與程度，在你選擇的區域挑選球場",
    "以你的名字預約開球時間，並以書面確認",
    "與球場的所有日文溝通：租借、球車或桿弟、服裝規定、午餐",
    "行前說明：交通方式、報到、會館禮儀與攜帶物品",
    "行前與當天的電子郵件及 WhatsApp 支援",
    "含稅",
  ],
  notIncluded: [
    "果嶺費、球車、置物櫃、午餐與各項租借：當天在球場直接支付",
    "接送：球場集合，或透過我們介紹的接送合作夥伴預約私人用車（與對方直接簽約付款）",
    "英文助理隨行：可依需求安排，另行報價",
    "球場桿弟（球場有提供時，於球場支付）",
    "高爾夫服裝與手套（請自備）",
  ],
  schedule: [
    { time: "上午", title: "抵達球場", body: "請於開球前約 45 分鐘抵達會館：自駕、搭電車轉計程車，或搭乘向合作夥伴預約的私人用車。" },
    { time: "報到", title: "以你的名字報到", body: "預約登記在你的名下，並附上球場需要的資訊。請在櫃檯支付果嶺費與租借費，和日本球友的流程相同。" },
    { time: "開球", title: "你的一輪", body: "18 洞依自己的節奏打。多數球場在前後九洞之間用午餐，我們會事先告知。" },
    { time: "打完後", title: "泡澡與離開", body: "在會館結清費用，若球場有浴場可泡個澡，再前往下一站。" },
  ],
  scheduleNote: "一天的範例；開球時間與午餐依球場而定。",
  timeLabel: "希望的開球時間",
  cta: { label: "查詢開球時間", note: "詢問時無需付款。", heading: "申請開球時間", lead: "你的日期、人數、區域。現在無需付款。" },
  variants: { tokyo: { title: "東京近郊", short: "東京近郊", tagline: "距東京 1 至 1.5 小時車程的球場" }, fuji: { title: "富士山區域", short: "富士山區域", tagline: "可眺望富士山的球場" }, other: { title: "其他區域", short: "其他", tagline: "日本全國皆可：請在表單告知地點。代辦費相同。" } },
  otherArea: { label: "想在哪裡打球？", hint: "都道府縣、城市或球場名，例如北海道、輕井澤、宮崎" },
  venue: {
    known: ["你的團體代辦費", "球場集合，或透過我們介紹的夥伴接送"],
    afterBooking: ["以你的名字預約的開球時間書面確認", "行前說明：地址、路線、抵達時間、服裝規定、租借與午餐", "當天的 WhatsApp 聯絡方式"],
  },
  faq: [
    { q: "代辦費包含哪些服務？", a: "我們為你的團體與區域挑選球場，以你的名字預約開球時間，以日文與球場溝通，並在行前說明。不在球場價格上加價。" },
    { q: "果嶺費多少？", a: "依球場與日期而異。在球場支付；球場價格隨提案提供。" },
    { q: "怎麼前往球場？", a: "開車、搭電車加計程車，或透過我們介紹的接送夥伴，直接預約與付款。" },
    { q: "當天可以有人陪同嗎？", a: "可以。英文助理可在球場迎接並隨行協助，另行報價。助理不下場打球。" },
    { q: "可以指定球場嗎？", a: "可以，代辦費相同，視空檔而定。會員制球場無法保證。" },
    { q: "可以安排 5 位以上的團體嗎？", a: "可以，最多 12 位。5 位以上於提案時依團體報價代辦費。" },
    { q: "一位球友也能預約嗎？", a: "可以。許多球場會將單人與其他客人併組；我們會說明你球場的做法。" },
    { q: "看得到富士山嗎？", a: "富士山區域許多球場在天氣許可時可見；無法保證。" },
    { q: "有租借球桿與球鞋嗎？", a: "大多數球場可以；告訴我們誰需要，我們代為預約。在球場支付。請自備服裝與手套。" },
    { q: "有服裝規定嗎？", a: "多數球場要求抵達時穿著整齊、場上穿有領上衣。我們會告知你球場的規定。" },
    { q: "送出表單時需要付款嗎？", a: "不需要。詢問免費。以郵件合意條件後，你支付代辦費，我們開始調查。" },
    { q: "下雨怎麼辦？", a: arrangementPolicy["zh-tw"].weather },
    { q: "取消政策是什麼？", a: "提案寄出前取消：全額退款。提案後、預約確認前：保留 ¥5,000，退還其餘。書面確認後：代辦費不退。完整條款見下方「取消」。" },
    { q: "應該提前多久預約？", a: "提前 2 至 4 週最理想；申請於日期前 3 天的 18:00（日本時間）截止。" },
  ],
  benefits: ["全日本球場皆可代訂", `每組 ${FEE} 起`, "可介紹接送服務"],
  crumb: "球場預約代辦",
  photoNote: "球場範例；實際球場於預約確認時告知。",
  inclusions: {
    heading: "代辦費包含的服務",
    sub: "一筆團體代辦費。當天費用在球場支付，與日本球友相同。",
    includedLabel: "由我們安排", notIncludedLabel: "不在服務範圍",
    items: {
      round: { label: "開球時間預約", note: "挑選球場並以你的名字預約；果嶺費於球場支付" },
      clubs: { label: "租借球桿", note: "依需求預約；費用於球場支付" },
      shoes: { label: "租借球鞋", note: "依需求預約；費用於球場支付" },
      transfer: { label: "私人接送", note: "介紹可承接的持照接送公司；由你直接預約與付款" },
      driver: { label: "司機", note: "隨合作夥伴的車輛" },
      assistant: { label: "英文助理", note: "選購：當天在球場隨行，另行報價" },
      cart: { label: "高爾夫球車", note: "預約時一併申請；費用於球場支付" },
      locker: { label: "置物櫃", note: "會館設施，含在果嶺費內" },
      bath: { label: "浴場", note: "於設有浴場的會館" },
      lunch: { label: "午餐", note: "於會館點餐並付款" },
      taxes: { label: "稅金", note: "代辦費含稅；球場價格亦含稅" },
      wear: { label: "高爾夫服裝", note: "請自備服裝與手套" },
    },
    footnote: "果嶺費、球車、租借、午餐與桿弟費在球場支付；金額事先告知。",
    courseNote: "球車規定、租借與會館設施依球場而異；詳情隨預約確認提供。",
    alsoNot: "餐飲與個人消費在球場結算。",
  },
  transfer: {
    heading: "前往球場：由你決定",
    body: "代辦費不含接送。可自行開車、搭電車加計程車，或請我們介紹持照的私人接送夥伴，由你直接預約與付款。",
    points: [
      { title: "球場集合", body: "我們提供地址、路線與抵達時間。東京近郊車程 1 至 1.5 小時，富士山區域約 2 小時。" },
      { title: "透過合作夥伴的私人用車", body: "附司機的廂型車，飯店與會館往返。由你直接向夥伴預約與付款。" },
      { title: "電車與計程車", body: "部分球場鄰近車站且有計程車；我們會告訴你是哪些。" },
    ],
    note: "照片為接送夥伴車輛的範例。",
  },
  options: {
    heading: "規劃你的一輪", golfersLegend: "人數", areaLegend: "區域", golfers: "{n} 位球友",
    perPerson: "", total: "{n} 位代辦費 {total}", totalShort: "代辦費 {total}", perPersonRef: "每位 {price}",
    feeBase: "1 位基本費 {base}", feeBreakdown: "基本費 {base} + 加收 {n} 位 × {extra}", feeRule: `第 1 位 ${FEE}，每增加 1 位加 ${EXTRA}`,
    customQuote: "個別報價", customQuoteLine: "指定球場 · {n} 位球友",
    moreGolfers: "5 位以上", largePartyQuote: "個別報價", largePartyLine: "{n} 位球友 · 代辦費依團體報價", largePartyRow: "5 至 12 位",
    largePartyNote: "5 位以上依團體報價代辦費。請送出人數與日期；詢問免費。",
    includes: "僅代辦費。果嶺費、球車與租借在球場支付。",
    note: arrangementPolicy["zh-tw"].beforePayment,
    assure: { heading: "詢問免費", body: "先以郵件合意條件。代辦費在調查與提案前支付；你同意球場、時間與費用後才預約。" },
    customNote: "指定球場的代辦費相同，視空檔而定。",
    ctaNote: "詢問時無需付款。",
    allPrices: "各人數的代辦費",
  },
  intro: {
    heading: "你在日本的開球時間，由我們安排。",
    guideNote: "", // dropped from the page (owner, 2026-10-26); the FAQ answers the mark-up question
  },
  day: {
    steps: [
      { title: "提出開球時間申請", body: "你的日期、人數、區域。免費。" },
      { title: "合意並支付代辦費", body: "以郵件確認條件與預算；代辦費在調查前支付。" },
      { title: "同意提案", body: "我們寄送球場、時間與球場費用。你同意後才預約，並寄送書面確認。" },
      { title: "開球", body: "以你的名字報到，直接付款給球場，享受你的一輪。" },
    ],
    note: "果嶺費依球場與日期而異；正確金額隨提案提供。",
    timingsH: "典型的一天", bookingH: "預約流程",
  },
  prices: {
    heading: "各人數的代辦費",
    only: `第 1 位 ${FEE}，每增加 1 位加 ${EXTRA}。兩個區域相同；5 位以上依團體報價。`,
    golfersCol: "人數", perPersonCol: "明細", totalCol: "代辦費",
    approxNote: "果嶺費、球車、租借與午餐在球場支付。",
    notes: [
      "指定球場的代辦費相同。",
      "英文助理另行報價。",
    ],
  },
  form: {
    steps: { dates: "日期與開球時間", course: "球場", hotel: "住宿地點（選填）", group: "球友與租借", contact: "聯絡方式" },
    departure: "希望的開球時間",
    specificCourse: "指定球場", specificCourseNote: "選填：寫下球場名稱，我們會優先洽詢。",
    specificCourseQuote: "代辦費相同，視空檔而定。",
    courseName: "球場名稱", courseUrl: "球場網站（選填）",
    pickup: "飯店或區域（選填）", pickupHint: "例：新宿——有助於我們建議球場",
    rentalH: "租借球桿與球鞋（在球場支付）",
    rental: "租借球桿", rentalOpts: { required: "請代為預約", own: "自備", unsure: "不確定" },
    rentalNote: "告訴我們誰需要，我們代為預約。",
    requestsHint: "希望的開球時段、打球需求或其他",
    confirmNote: "團體代辦費。果嶺費在球場支付。",
    package: "代辦費", perPersonRef: "每位", recommendedCourse: "由我們挑選的球場",
    cta: "送出開球時間申請",
  },
  headings: { about: "關於這項服務", included: "代辦費包含的內容", day: "你的高爾夫日", faq: "常見問題", terms: "取消政策", request: "申請開球時間" },
  summary: {
    lines: [`代辦費每組 ${FEE} 起`, "果嶺費與租借在球場支付", "全日本球場 · 可介紹接送"],
    beforeH: "送出前的 3 件事",
    before: ["果嶺費、球車與租借在球場支付，不是付給我們。", "代辦費在合意條件後、調查球場前支付。", "5 位以上依團體報價。"],
  },
  process: {
    received: arrangementPolicy["zh-tw"].request,
    proposal: arrangementPolicy["zh-tw"].beforePayment,
    arrange: arrangementPolicy["zh-tw"].research,
    protection: arrangementPolicy["zh-tw"].confirmation,
    steps: arrangementPolicy["zh-tw"].stages,
    area: "東京近郊或富士山區域。球場集合；可依需求介紹合作夥伴的私人接送。",
    caddie: "球場桿弟", caddies: ["不需要", "需要（球場有提供時，於球場支付）", "希望諮詢"],
    caddieNote: "我們向球場確認，並在提案時告知桿弟費。",
    paidH: "已收到付款", paid: arrangementPolicy["zh-tw"].paid,
    assistant: "當天的英文助理", assistants: ["不需要", "需要（另行報價）", "希望諮詢"],
    assistantNote: "隨提案另行報價。",
    transfer: "前往球場的接送", transfers: ["不需要（自行前往）", "需要（請介紹合作接送公司）", "希望諮詢"],
    transferNote: "接送不屬於本服務；可為你介紹合作夥伴，由你直接預約與付款。",
  },
};

export const GOLF_ARRANGEMENT_COPY: Record<Lang, ArrangementCopy> = { en, ja, es, fr, "zh-tw": zh };
// On-day support is confirmed individually, not sold as a standalone language guarantee.
for (const lang of Object.keys(GOLF_ARRANGEMENT_COPY) as Lang[]) {
  const c = GOLF_ARRANGEMENT_COPY[lang];
  const p = golfPlanningCopy[lang];
  c.faq[3] = { q: p.assistantQ, a: p.assistantA };
  c.notIncluded = c.notIncluded.filter((_, i) => i !== 2);
  c.prices.notes = c.prices.notes.filter((_, i) => i !== 1);
}


/** The golf page as the booking service: every text and the structure that goes with it
 *  (party sizes from one, the fee tiers, tee times instead of departures, no add-ons).
 *  Runs after the locale merge and the booking-process copy, so it overrides both. */
export function applyGolfArrangement(e: Experience, lang: Lang): Experience {
  if (e.slug !== "mt-fuji-golf-day" || !e.variants) return e;
  const c = GOLF_ARRANGEMENT_COPY[lang];
  const vc = e.variantCopy;
  const size = golfPartySize();
  return {
    ...e,
    title: c.title, seoTitle: c.seoTitle, metaDescription: c.metaDescription, tagline: c.tagline, overview: c.overview,
    duration: c.duration, price: FEE, priceUnit: "group", group: c.group, area: c.area,
    includedShort: c.includedShort, cancellation: c.cancellation, cancellationTiers: undefined, included: c.included, notIncluded: c.notIncluded,
    addOns: undefined,
    partySize: size,
    pricing: { tiers: golfTiers("tokyo") },
    variants: [
      ...e.variants.map((v) => ({ ...v, ...c.variants[v.id as "tokyo" | "fuji"], tiers: golfTiers(v.id as "tokyo" | "fuji"), defaultTime: "08:00" })),
      // Anywhere else in Japan (owner, 2026-10-25): the same fee; the guest names the place in the form.
      { id: "other", ...c.variants.other, tiers: golfTiers("other"), img: e.variants[0]?.img ?? "/images/golf-gallery-10-golf-course.webp", alt: e.variants[0]?.alt ?? "", defaultTime: "08:00" },
    ],
    defaultVariant: "fuji",
    availability: { daily: true, startTimes: ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00"], defaultTime: "08:00", cutoffDays: 3, cutoffTime: "18:00" },
    timeLabel: c.timeLabel, scheduleNote: c.scheduleNote, schedule: c.schedule,
    cta: c.cta,
    langTag: undefined,
    venue: e.venue ? { ...e.venue, known: c.venue.known, afterBooking: c.venue.afterBooking } : e.venue,
    flow: c.process.steps.map((title, i) => ({ title, body: [c.process.received, c.process.proposal, `${c.process.arrange} ${c.process.protection}`][i] })),
    faq: [...c.faq, { q: golfPlanningCopy[lang].practicalQ, a: golfPlanningCopy[lang].practicalA }],
    variantCopy: vc ? {
      ...vc,
      benefits: c.benefits, crumb: c.crumb, photoNote: c.photoNote,
      inclusions: { ...vc.inclusions, heading: c.inclusions.heading, sub: c.inclusions.sub, includedLabel: c.inclusions.includedLabel, notIncludedLabel: c.inclusions.notIncludedLabel, items: ITEM_ORDER.map((id) => ({ id, ...c.inclusions.items[id] })), footnote: c.inclusions.footnote, courseNote: c.inclusions.courseNote, alsoNot: c.inclusions.alsoNot },
      transfer: { heading: c.transfer.heading, body: c.transfer.body, photo: vc.transfer.photo, points: c.transfer.points, note: c.transfer.note },
      options: { ...vc.options, ...c.options, from: "", approx: vc.options.approx },
      otherArea: c.otherArea,
      summary: c.summary,
      intro: c.intro,
      day: c.day,
      prices: c.prices,
      form: { ...vc.form, ...c.form, note: c.process.proposal, sentNote: `${c.process.received} ${c.process.arrange} ${c.process.protection}` },
      headings: c.headings,
    } : vc,
  };
}
