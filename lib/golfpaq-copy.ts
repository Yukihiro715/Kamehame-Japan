/** Copy for the Shared Bus Golf Tours page (要件 3, 7, 8, 9). English is the
 *  page's language; Japanese carries the booking notice and the form, as the
 *  brief specifies. Other languages read the English page. */
import type { Lang } from "@/lib/i18n";

export interface BusCopy {
  heroTitle: string; heroLede: string; features: string[]; heroCta: string;
  twoWaysH: string; sharedH: string; sharedBody: string; sharedCta: string; customH: string; customBody: string; customCta: string;
  toursH: string; toursLede: string; updated: string; unavailable: string; noMatch: string; filterMonth: string; filterGolfers: string; filterDeparture: string; allMonths: string; allDepartures: string;
  perPerson: string; includesLine: string; /** "{n}" is replaced by the number; "|" separates the singular and plural forms. */ seatsLeft: string; enquireBtn: string; noPayment: string;
  howH: string; howBody: string; howAvailability: string;
  stepsH: string; steps: { n: string; title: string; body: string }[];
  includedH: string; included: string[]; notIncludedH: string; notIncluded: string[];
  goodH: string; good: { title: string; body: string }[];
  faqH: string; faq: { q: string; a: string }[];
  formH: string; golfers: string; rentalLabel: string; rentalCount: string; rentalCountHint: string; name: string; email: string; phone: string; notes: string; notesHint: string; consent: string; send: string; sending: string;
  summaryPerPerson: string; summaryRental: string; summaryTotal: string; taxIncluded: string;
  doneH: string; doneLines: string[]; doneRef: string; doneAgain: string;
  errors: Record<string, string>;
  departure: string; departs: string; lunchIncluded: string; lunchSubsidy: string; lunchNot: string; throughPlay: string; cartIncluded: string; scheduleH: string; highlightsH: string; notesH: string; back: string; details: string;
}

const en: BusCopy = {
  heroTitle: "Golf in Japan, Made Easy.",
  heroLede: "Enjoy a round at beautiful Japanese golf courses with convenient shared bus transportation from Tokyo.",
  features: ["Round-trip Bus Transportation", "Solo Golfers Welcome", "18-Hole Golf Experiences", "Easy Enquiry & Booking Support"],
  heroCta: "Explore Available Tours",
  twoWaysH: "Two ways to play golf in Japan",
  sharedH: "Shared Bus Golf Tours", sharedBody: "Published dates, a shared coach from Tokyo and 18 holes of self-play golf. Ideal for solo golfers, pairs and small groups who want a simple, well-priced day out.", sharedCta: "See available tours",
  customH: "Custom Golf Booking", customBody: "Your course, your date, your group. We book the tee time in your name, brief you on the club's customs and can introduce a private transfer.", customCta: "Plan a custom round",
  toursH: "Available Golf Tours", toursLede: "Dates and prices come from our tour partner's published schedule and are refreshed through the day. Pick a date, tell us how many golfers, and send a free enquiry.",
  updated: "Schedule updated", unavailable: "The live schedule is temporarily unavailable. Please try again shortly or contact us and we will send you the upcoming dates.", noMatch: "No tours match these filters. Try another month, departure point or group size.",
  filterMonth: "Month", filterGolfers: "Golfers", filterDeparture: "Departure", allMonths: "All months", allDepartures: "All departures",
  perPerson: "/person", includesLine: "Includes golf and round-trip bus · tax included", seatsLeft: "1 seat left|{n} seats left", enquireBtn: "Enquire About This Tour", noPayment: "No payment is required to enquire.",
  howH: "How booking works", howBody: "After submitting your enquiry, our travel partner will email you the purchase details and payment instructions. No payment is collected on this website.", howAvailability: "Availability is subject to final confirmation.",
  stepsH: "How It Works",
  steps: [
    { n: "01", title: "Find Your Tour", body: "Browse available dates and golf courses." },
    { n: "02", title: "Send an Enquiry", body: "Select your tour and submit your details. It’s free." },
    { n: "03", title: "Receive Purchase Instructions", body: "Our travel partner will email you the booking details and payment instructions." },
    { n: "04", title: "Complete Your Purchase", body: "Review the terms and complete your purchase with the travel partner." },
    { n: "05", title: "Receive Confirmation", body: "Once your booking is confirmed, receive the meeting details and golf guide." },
  ],
  includedH: "What’s Included",
  included: ["Round-trip shared bus from the departure point in Tokyo", "18 holes of self-play golf (green fee)", "Golf cart where the course provides one", "Our English golf guide with meeting details after confirmation", "Rental clubs, when you add them to your enquiry (+¥5,500 per person)"],
  notIncludedH: "Not included",
  notIncluded: ["Lunch and drinks at the clubhouse, unless the tour says lunch is included", "Golf shoes and gloves (bring your own)", "Hotel pick-up and a private guide (see Custom Golf Booking)"],
  goodH: "Good to Know",
  good: [
    { title: "Shared rounds", body: "You may be paired with other golfers on the tour. Groups are formed by the tour operator on the day." },
    { title: "Rental clubs", body: "Tick “Add Rental Clubs” in the enquiry and tell us how many golfers need a set. Right- and left-handed sets can be requested in the notes." },
    { title: "English support", body: "The bus and course staff speak Japanese. We send you an English guide with the meeting point, the day’s timing and clubhouse etiquette once your booking is confirmed, and you can email us any time." },
    { title: "Combine with a trip", body: "Tours depart early from Tokyo and return in the evening. Tell us your hotel area in the notes and we will mention the nearest departure point." },
  ],
  faqH: "FAQ",
  faq: [
    { q: "Is my tour booked when I send the enquiry?", a: "No. An enquiry is free and takes no payment. Our travel partner emails you the purchase details; your booking is confirmed only after you complete the purchase with them and receive a confirmation." },
    { q: "Who do I pay?", a: "The travel partner named in the purchase instructions. KAMEHAME JAPAN does not collect payment for shared bus tours." },
    { q: "What does the price include?", a: "The round of golf and the round-trip bus, tax included. Rental clubs are an option at ¥5,500 per person. Lunch is extra unless the tour says it is included." },
    { q: "Can I cancel?", a: "Cancellation and refund terms are set by the travel partner and are given to you before you purchase. Cancelling for your own reasons may not be refundable in full, especially close to the date." },
    { q: "What if the tour is full after I pay?", a: "Seats shown on this site can change before your purchase is processed. If a tour cannot be secured after payment, you will be offered an alternative date or a full refund of that purchase." },
    { q: "Can beginners join?", a: "Tours are for golfers who have played a round before. The pace is relaxed, but you should be comfortable playing 18 holes." },
  ],
  formH: "Enquire about this tour", golfers: "Golfers", rentalLabel: "Add Rental Clubs (+¥5,500 per person)", rentalCount: "How many golfers need rental clubs?", rentalCountHint: "Add which hand (right/left) and your heights in the notes.",
  name: "Your name", email: "Email", phone: "Phone or WhatsApp (optional)", notes: "Notes (optional)", notesHint: "Hotel area, handedness and height for rental clubs, dietary needs, anything else.",
  consent: "I understand that this is a free enquiry, not a booking, and that KAMEHAME JAPAN will share these details with its travel partner so they can email me the purchase instructions.",
  send: "Send Enquiry", sending: "Sending…",
  summaryPerPerson: "Tour price", summaryRental: "Rental clubs", summaryTotal: "Total", taxIncluded: "tax included",
  doneH: "Thank you for your enquiry!",
  doneLines: ["We have received your request.", "Our travel partner will contact you by email with the purchase details and next steps.", "Your booking is not yet confirmed, and no payment has been taken."],
  doneRef: "Your enquiry reference", doneAgain: "Enquire about another tour",
  errors: { availability_changed: "This tour no longer has enough seats for your group. Please choose another date.", availability_unavailable: "The live schedule is temporarily unavailable. Please try again in a few minutes.", invalid: "Please check the form and try again.", default: "We could not send your enquiry. Please try again or email hello@kamehame-japan.com." },
  departure: "Departure", departs: "departs", lunchIncluded: "Lunch included", lunchSubsidy: "Lunch voucher included", lunchNot: "Lunch not included", throughPlay: "Through play (no lunch break)", cartIncluded: "Cart included", scheduleH: "The day", highlightsH: "About the course", notesH: "Conditions", back: "Back to tours", details: "Details",
};

const ja: BusCopy = {
  ...en,
  heroTitle: "日本でゴルフを、もっと手軽に。",
  heroLede: "東京発の乗合バスで、日本の美しいゴルフ場でのラウンドを気軽に楽しめます。",
  features: ["往復バス送迎", "おひとり様歓迎", "18ホール・セルフプレー", "無料のお問い合わせと予約サポート"],
  heroCta: "開催中のツアーを見る",
  twoWaysH: "日本でゴルフを楽しむ2つの方法",
  sharedH: "乗合バスゴルフツアー", sharedBody: "決まった日程に、東京発の乗合バスでゴルフ場へ。18ホールのセルフプレー。おひとり様や少人数に。", sharedCta: "ツアーを見る",
  customH: "カスタムゴルフ手配", customBody: "ご希望のコース・日程・人数で、お名前でティータイムを予約。ゴルフ場のしきたりもご案内し、送迎のご紹介も可能です。", customCta: "個別に手配する",
  toursH: "開催中のゴルフツアー", toursLede: "日程と料金は提携ツアー会社の公開スケジュールから取得し、日中に更新しています。日程と人数を選んで、無料でお問い合わせください。",
  updated: "スケジュール更新", unavailable: "現在スケジュールを取得できません。しばらくしてから再度お試しいただくか、お問い合わせください。", noMatch: "条件に合うツアーがありません。月・出発地・人数を変えてお試しください。",
  filterMonth: "月", filterGolfers: "人数", filterDeparture: "出発地", allMonths: "すべての月", allDepartures: "すべての出発地",
  perPerson: "/人", includesLine: "ゴルフと往復バスを含む・税込", seatsLeft: "残り{n}席", enquireBtn: "このツアーについて問い合わせる", noPayment: "お問い合わせにお支払いは不要です。",
  howH: "ご予約・お支払いについて", howBody: "お問い合わせ完了後、提携旅行会社より購入方法とお支払いについてメールでご案内します。当サイトでのお支払いは不要です。お問い合わせのみでは予約は確定しません。", howAvailability: "空席は最終確認の結果によります。",
  stepsH: "ご利用の流れ",
  steps: [
    { n: "01", title: "ツアーを探す", body: "開催日とゴルフ場を一覧から選びます。" },
    { n: "02", title: "問い合わせを送る", body: "ツアーを選び、必要事項を送信します。無料です。" },
    { n: "03", title: "購入案内を受け取る", body: "提携旅行会社から、予約内容とお支払い方法がメールで届きます。" },
    { n: "04", title: "購入手続きをする", body: "条件を確認のうえ、提携旅行会社で購入手続きを行います。" },
    { n: "05", title: "確定通知を受け取る", body: "予約確定後、集合場所の案内とゴルフガイドが届きます。" },
  ],
  includedH: "含まれるもの",
  included: ["東京の出発地からの往復乗合バス", "18ホールのセルフプレー（グリーンフィー）", "ゴルフ場が用意するカート", "予約確定後の集合案内と英語のゴルフガイド", "レンタルクラブ（お問い合わせ時に追加、1人 +¥5,500）"],
  notIncludedH: "含まれないもの",
  notIncluded: ["クラブハウスでの昼食・飲み物（昼食付きと記載のあるツアーを除く）", "ゴルフシューズ・グローブ（ご持参）", "ホテル送迎・専属ガイド（カスタムゴルフ手配をご覧ください）"],
  goodH: "知っておきたいこと",
  good: [
    { title: "乗合のラウンド", body: "当日はツアーの他の参加者と同じ組になることがあります。組分けはツアー会社が当日行います。" },
    { title: "レンタルクラブ", body: "お問い合わせで「レンタルクラブを追加」にチェックし、必要な人数を選んでください。右・左利きは備考に。" },
    { title: "英語サポート", body: "バスとゴルフ場のスタッフは日本語です。予約確定後に集合場所・当日の流れ・マナーをまとめた英語ガイドをお送りします。" },
    { title: "旅程との組み合わせ", body: "ツアーは東京を早朝に出発し、夕方に戻ります。備考にホテルのエリアを書いていただければ、最寄りの出発地をお伝えします。" },
  ],
  faqH: "よくある質問",
  faq: [
    { q: "問い合わせを送ると予約になりますか？", a: "いいえ。お問い合わせは無料で、お支払いも発生しません。提携旅行会社から購入方法のご案内が届き、購入手続きと確定通知をもって予約が確定します。" },
    { q: "お支払い先はどこですか？", a: "購入案内に記載の提携旅行会社です。KAMEHAME JAPAN は乗合バスツアーの代金を受け取りません。" },
    { q: "料金に含まれるものは？", a: "ゴルフのプレーと往復バスで、税込です。レンタルクラブは1人 ¥5,500 のオプション。昼食は、昼食付きと記載のあるツアー以外は別途です。" },
    { q: "キャンセルはできますか？", a: "キャンセル・返金条件は提携旅行会社が定め、購入前にご案内します。お客様都合のキャンセルは、特に直前の場合、全額返金にならないことがあります。" },
    { q: "支払い後にツアーが満席だったら？", a: "表示の残席は購入手続きまでに変わることがあります。お支払い後にツアーを確保できない場合は、代替日のご案内か、その購入代金の全額返金となります。" },
    { q: "初心者でも参加できますか？", a: "ラウンド経験のある方が対象です。18ホールを回れる方であればご参加いただけます。" },
  ],
  formH: "このツアーについて問い合わせる", golfers: "人数", rentalLabel: "レンタルクラブを追加（1人 +¥5,500）", rentalCount: "レンタルクラブが必要な人数", rentalCountHint: "右・左利きと身長を備考にお書きください。",
  name: "お名前", email: "メールアドレス", phone: "電話番号・WhatsApp（任意）", notes: "備考（任意）", notesHint: "ホテルのエリア、レンタルクラブの利き手・身長、食事の希望など。",
  consent: "これは予約ではなく無料のお問い合わせであること、購入案内のために KAMEHAME JAPAN が提携旅行会社にこの内容を共有することを理解しました。",
  send: "問い合わせを送る", sending: "送信中…",
  summaryPerPerson: "ツアー料金", summaryRental: "レンタルクラブ", summaryTotal: "合計", taxIncluded: "税込",
  doneH: "お問い合わせありがとうございます",
  doneLines: ["内容を受け付けました。", "提携旅行会社より、購入方法と次の手順をメールでご案内します。", "お問い合わせのみでは予約は確定せず、お支払いも発生していません。"],
  doneRef: "受付番号", doneAgain: "別のツアーについて問い合わせる",
  errors: { availability_changed: "このツアーの残席が人数分ありません。別の日程をお選びください。", availability_unavailable: "現在スケジュールを取得できません。数分後にお試しください。", invalid: "入力内容をご確認ください。", default: "送信できませんでした。再度お試しいただくか hello@kamehame-japan.com までご連絡ください。" },
  departure: "出発", departs: "発", lunchIncluded: "昼食付き", lunchSubsidy: "昼食補助付き", lunchNot: "昼食別", throughPlay: "スループレー", cartIncluded: "カート込み", scheduleH: "当日の流れ", highlightsH: "コースについて", notesH: "条件", back: "ツアー一覧へ戻る", details: "詳細",
};

export const busCopy = (lang: Lang): BusCopy => (lang === "ja" ? ja : en);
