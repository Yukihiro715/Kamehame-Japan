/** Copy for the golf landing page (/golf-tours/: the two options compared) and
 *  the Shared Bus Golf Tours page (/golf-bus/). English is the reference;
 *  Japanese is translated; other languages read the English page.
 *  Facts about the bus tours come from the partner's published guide pages
 *  (meeting points, how a day runs, what the price covers, cancellation);
 *  the partner is never named to the visitor. */
import type { Lang } from "@/lib/i18n";

export interface BusCopy {
  // Landing: the two ways compared
  landTitle: string; landLede: string; landFeatures: string[]; landCta: string;
  twoWaysH: string; sharedH: string; sharedBody: string; sharedCta: string; customH: string; customBody: string; customCta: string;
  compareH: string; compareLede: string; compareCols: [string, string]; compare: { label: string; shared: string; custom: string }[];
  chooseH: string; chooseShared: string; chooseCustom: string;
  /** The two cards inside the landing hero: custom first, with who each one suits and a price line. "{price}" = lowest bus price. */
  heroCustomTag: string; heroCustomWho: string; heroCustomPrice: string; heroCustomItems: { ok: boolean; text: string }[]; heroBusWho: string; heroBusPrice: string; heroBusItems: { ok: boolean; text: string }[]; heroCardsNote: string;
  /** Per-person estimate for a party of four with custom booking (fee + club fees, with and without the private transfer). */
  estimateH: string; estimateLede: string; estimateCols: [string, string]; estimateRows: { label: string; feeOnly: string; withTransfer: string }[]; estimateNote: string;
  // Bus page hero and the tour explained
  heroTitle: string; heroLede: string; features: string[]; heroCta: string;
  aboutH: string; aboutLede: string;
  meetH: string; meetLede: string; meetPoints: { name: string; where: string; access: string }[]; meetNote: string;
  dayH: string; day: { time: string; title: string; body: string }[]; dayNote: string;
  playH: string; play: { title: string; body: string }[];
  costH: string; costLede: string; costIncludedH: string; costIncluded: { item: string; note: string }[]; costExtraH: string; costExtra: { item: string; note: string }[]; costNote: string;
  cancelH: string; cancelLede: string; cancel: string[]; cancelNote: string;
  /** The short strip above the calendar; the full sections sit below the list. */
  glanceH: string; glance: { title: string; body: string }[]; glanceMore: string; detailsH: string;
  // Calendar and list
  toursH: string; toursLede: string; updated: string; unavailable: string; noMatch: string; filterGolfers: string; filterDeparture: string; allDepartures: string;
  calH: string; calAny: string; calLegendOpen: string; calLegendSold: string; calPrev: string; calNext: string; weekdays: string[]; calShowing: string;
  /** "{n}" = number of tours; "|" separates singular and plural. */ calShow: string; calNone: string; calHint: string;
  perPerson: string; includesLine: string; /** "{n}" is replaced by the number; "|" separates the singular and plural forms. */ seatsLeft: string; soldOut: string; enquireBtn: string; noPayment: string;
  howH: string; howBody: string; howAvailability: string;
  stepsH: string; steps: { n: string; title: string; body: string }[];
  includedH: string; included: string[]; notIncludedH: string; notIncluded: string[];
  goodH: string; good: { title: string; body: string }[];
  faqH: string; faq: { q: string; a: string }[];
  formH: string; golfers: string; golfersMax: string; rentalLabel: string; rentalCount: string; rentalCountHint: string;
  partyH: string; partyLede: string; golferN: string; golferName: string; golferLead: string; golferClubs: string; golferHand: string; handRight: string; handLeft: string; golferShoes: string; golferShoeSize: string; shoeSizeHint: string; shoesNote: string; name: string; email: string; phone: string; notes: string; notesHint: string; consent: string; send: string; sending: string;
  summaryPerPerson: string; summaryRental: string; summaryTotal: string; taxIncluded: string;
  doneH: string; doneLines: string[]; doneRef: string; doneAgain: string;
  errors: Record<string, string>;
  departure: string; departs: string; lunchIncluded: string; lunchSubsidy: string; lunchNot: string; throughPlay: string; cartIncluded: string; scheduleH: string; highlightsH: string; notesH: string; back: string; details: string;
  customLink: string;
}

const en: BusCopy = {
  landTitle: "Golf in Japan, Made Easy.",
  landLede: "Two ways to play a round near Tokyo: join a shared bus tour on a published date, or let us book a course and tee time just for your group.",
  landFeatures: ["18-Hole Golf Experiences", "Solo Golfers Welcome", "English Booking Support", "No Payment to Enquire"],
  landCta: "Compare the two options",
  twoWaysH: "Two ways to play golf in Japan",
  sharedH: "Shared Bus Golf Tours", sharedBody: "Published dates, a shared coach from Tokyo and 18 holes of self-play golf at courses in Chiba, Ibaraki and Tochigi. One all-in price per person. Ideal for solo golfers, pairs and small groups who want a simple, well-priced day out.", sharedCta: "See dates & prices",
  customH: "Custom Golf Booking", customBody: "Your course, your date, your group, including the Mt. Fuji area. We choose the course with you, reserve the tee time in your name, brief you on the club's customs and can introduce a private transfer. Our arrangement fee plus the club's own green fees.", customCta: "Plan a custom round",
  compareH: "Which one is for you?",
  compareLede: "Both end with 18 holes on a well-kept Japanese course. The difference is how you get there, who sets the date, and how the price is made up.",
  compareCols: ["Shared Bus Tour", "Custom Booking"],
  compare: [
    { label: "Best for", shared: "Solo golfers, pairs and groups of up to 8 who are happy to share a coach", custom: "Groups who want a specific course, date or area, including Mt. Fuji" },
    { label: "Dates", shared: "Fixed dates from the tour schedule, published about three months ahead", custom: "Any day the course has a tee time" },
    { label: "Getting there", shared: "Shared coach from Shinjuku or Oimachi (Tokyo), back the same evening", custom: "Train and taxi, your own car, or a private transfer partner we introduce" },
    { label: "Courses", shared: "The scheduled courses in Chiba, Ibaraki and Tochigi, 1.5–2.5 hours from Tokyo", custom: "Your choice, including Mt. Fuji-view courses; members-only clubs on request" },
    { label: "Price", shared: "One price per person, tax included: golf + coach, typically ¥30,000–¥38,000", custom: "Our fee ¥15,000 for the first golfer + ¥5,000 per extra golfer; green fees paid at the club" },
    { label: "On the day", shared: "Japanese tour staff on the coach; you play self-play in a cart, paired with other golfers", custom: "Your own group; an English-speaking assistant can be quoted separately" },
    { label: "How you book", shared: "Free enquiry → our travel partner emails the purchase instructions → you pay them", custom: "Request form → we confirm the plan → you pay our fee, then we book" },
  ],
  chooseH: "Not sure which to choose?",
  chooseShared: "Pick the Shared Bus Tour if you are travelling light, don't mind company on the course and want the easiest, best-priced day of golf from Tokyo.",
  chooseCustom: "Pick Custom Booking if you have a course or a date in mind, want to play as your own group, or would like Mt. Fuji on the horizon.",
  heroCustomTag: "Recommended for groups", heroCustomWho: "3+ golfers · families & friends · your own course or date", heroCustomPrice: "About ¥24,500 /person (4 golfers)",
  heroCustomItems: [{ ok: true, text: "Our arrangement fee" }, { ok: true, text: "Green fee & cart, paid at the club" }, { ok: false, text: "Travel to the course (private transfer about +¥22,500 /person)" }, { ok: true, text: "Lunch at the clubhouse, paid on the day" }, { ok: true, text: "Rental clubs available for an extra fee" }],
  heroBusWho: "1–2 golfers · solo welcome · fixed dates from Tokyo", heroBusPrice: "From {price} /person",
  heroBusItems: [{ ok: true, text: "Green fee & cart" }, { ok: true, text: "Round-trip coach from Tokyo" }, { ok: true, text: "Tax included" }, { ok: true, text: "Lunch at the clubhouse, paid on the day" }, { ok: true, text: "Rental clubs available (+¥5,500 /person)" }],
  heroCardsNote: "Both: 18 holes on a well-kept Japanese course, English support, nothing to pay to enquire.",
  estimateH: "What custom booking costs, for four golfers",
  estimateLede: "A worked example per person, tax included, based on the club fees we usually see. The shared bus tour, by comparison, is one price of about ¥30,000–¥38,000 per person with the coach included.",
  estimateCols: ["Arrangement fee only", "With private transfer"],
  estimateRows: [
    { label: "Our arrangement fee (¥30,000 for four)", feeOnly: "¥7,500", withTransfer: "¥7,500" },
    { label: "Green fee, cart and tax at the club (Tokyo area, typical)", feeOnly: "about ¥17,000", withTransfer: "about ¥17,000" },
    { label: "Private minivan with driver, hotel to course and back (about ¥90,000 per group)", feeOnly: "—", withTransfer: "about ¥22,500" },
    { label: "Per person, Tokyo area", feeOnly: "about ¥24,500", withTransfer: "about ¥47,000" },
    { label: "Per person, Mt. Fuji area (green fee about ¥23,000)", feeOnly: "about ¥30,500", withTransfer: "about ¥53,000" },
  ],
  estimateNote: "Green fees vary by course and day (weekends cost more) and are paid at the club; the transfer is booked and paid directly with the transfer partner. Rental clubs and lunch are extra in both cases. For two golfers the per-person figures are higher, because the fee and the vehicle are shared by fewer people.",

  heroTitle: "Shared Bus Golf Tours from Tokyo",
  heroLede: "A coach from Shinjuku or Oimachi, 18 holes of self-play golf at a country club in the Kanto hills, and a seat back to Tokyo the same evening. One price per person, tax included.",
  features: ["Round-trip Coach from Tokyo", "Solo Golfers Welcome", "18 Holes, Self-play in a Cart", "Free Enquiry, No Payment Here"],
  heroCta: "See Dates & Prices",
  aboutH: "How the tour works",
  aboutLede: "Everything below comes from the tour operator's published rules, written up in English. The exact meeting point and times for your date are confirmed with your booking.",
  meetH: "Where you meet the coach",
  meetLede: "Each tour departs from one of two points in Tokyo; the card shows which, and the departure time. Some Shinjuku tours also call at Ikebukuro, Oji or Tokyo Station on the way out.",
  meetPoints: [
    { name: "Shinjuku (Shinjuku-sanchome)", where: "On Meiji-dori in Shinjuku 4-chome, between Isetan and Takashimaya, in front of the operator's golf studio.", access: "Shinjuku Station South-East exit 3 min · Shinjuku-sanchome Station exit E7 0 min · Busta Shinjuku 3 min. The tour also ends here." },
    { name: "Oimachi (Shinagawa)", where: "Oimachi Station Central exit, 2 minutes on foot, by the car-rental office opposite the estate agent on the wide street.", access: "JR Keihin-Tohoku Line · Tokyu Oimachi Line · Rinkai Line. The return drop-off may be the station's East exit." },
  ],
  meetNote: "The coach arrives about 10 minutes before the meeting time and leaves on the dot. If you miss it, you would have to reach the course on your own, so please be there 10 minutes early.",
  dayH: "Your day, step by step",
  day: [
    { time: "06:30–07:00", title: "Depart Tokyo", body: "Board the coach at the meeting point. Clubs go in the luggage hold. Most courses are 1.5 to 2.5 hours away; the coach stops once on the way." },
    { time: "08:30–09:30", title: "Arrive and check in", body: "The tour leader checks everyone in at the clubhouse. Change in the locker room, collect your cart and head to the first tee." },
    { time: "Morning", title: "Front nine", body: "Self-play in a riding cart, in groups of three or four formed by the tour leader. No caddie; the course's own rules apply." },
    { time: "Midday", title: "Lunch at the clubhouse", body: "Most tours break for lunch at the clubhouse restaurant, paid on the day, unless the card says lunch is included or the tour is through play." },
    { time: "Afternoon", title: "Back nine", body: "Finish your round, then a bath or shower at the clubhouse if you like, before the coach leaves." },
    { time: "17:30–19:30", title: "Back in Tokyo", body: "The coach returns to the same meeting point. Arrival times depend on the course and the traffic." },
  ],
  dayNote: "Times vary by tour; the departure time for each date is on its card and confirmed with your booking.",
  playH: "How you play",
  play: [
    { title: "Self-play, in a cart", body: "You drive a shared riding cart and keep your own score. There is no caddie, which is how most Japanese golfers play." },
    { title: "Paired with other golfers", body: "The tour is shared. The tour leader forms groups of three or four on the day, so a solo golfer is never alone and a pair may play with two others." },
    { title: "Japanese-speaking tour staff", body: "A tour leader rides with the coach, handles check-in and the course. Course staff speak Japanese; we send you an English guide to the day and the clubhouse etiquette with your confirmation." },
    { title: "Rain or shine", body: "Tours run in the rain. If the course itself closes, the tour price is refunded." },
    { title: "Dress and etiquette", body: "Collared shirt, golf shoes and a cap are the norm; many clubs ask for a jacket or smart clothes when entering the clubhouse. Our guide covers the details." },
  ],
  costH: "What the price covers",
  costLede: "The price on each card is per person, tax included. It is the only amount we quote.",
  costIncludedH: "Included in the price",
  costIncluded: [
    { item: "18 holes of golf", note: "The green fee for a full round on the scheduled course" },
    { item: "Riding cart", note: "Shared with your group, where the course provides one (almost all do)" },
    { item: "Round-trip coach", note: "From the Tokyo meeting point to the course and back" },
    { item: "Tour leader", note: "Check-in, grouping and the day's logistics on the Japanese side" },
    { item: "Consumption tax", note: "Nothing is added on top" },
  ],
  costExtraH: "Paid separately",
  costExtra: [
    { item: "Lunch and drinks", note: "At the clubhouse restaurant, roughly ¥1,500–¥2,500, unless the card says lunch is included" },
    { item: "Rental clubs", note: "¥5,500 per person through our enquiry form, or ask us about the course's own sets" },
    { item: "Golf shoes, glove, balls", note: "Bring your own; some courses rent shoes for a small fee" },
    { item: "Locker and bath", note: "Most courses include them; a few charge a small locker fee" },
    { item: "Travel to the meeting point", note: "Your own transport to Shinjuku or Oimachi" },
    { item: "Travel insurance", note: "Recommended, as for any day out" },
  ],
  costNote: "",
  cancelH: "Cancellation",
  cancelLede: "The tour seller's terms apply and are sent to you before you pay. As published by the tour operator, they currently are:",
  cancel: [
    "7 or more days before the tour: free",
    "3 to 6 days before: ¥2,000 per person",
    "1 to 2 days before: 50% of the tour price",
    "On the day or no-show: 100%, no refund",
    "Changing to another date counts as a cancellation",
    "Cancellations are accepted by telephone only, during the operator's hours",
  ],
  cancelNote: "Tours run in rain. If the course closes, the tour price is refunded. Bank and card fees on refunds are deducted. If a tour cannot be secured after you pay, you are offered another date or a full refund of that purchase.",
  glanceH: "The tour at a glance",
  glance: [
    { title: "Meet in Tokyo", body: "Shinjuku (Shinjuku-sanchome) or Oimachi, around 06:30–07:00. Back at the same spot by about 18:00–19:30." },
    { title: "18 holes, self-play", body: "Riding cart, groups of 3–4 formed by the tour leader. No caddie." },
    { title: "One price, tax included", body: "Golf, cart and the round-trip coach. Lunch, rental clubs and shoes are extra." },
    { title: "Free to enquire", body: "No payment here. Our travel partner emails you the purchase details; cancellation terms come with them." },
  ],
  glanceMore: "Full details: meeting points, the day, costs and cancellation",
  detailsH: "How the tour works, in detail",

  toursH: "Available Golf Tours", toursLede: "Dates and prices come from the tour operator's published schedule and are refreshed through the day. Pick a date on the calendar, tell us how many golfers, and send a free enquiry.",
  updated: "Schedule updated", unavailable: "The live schedule is temporarily unavailable. Please try again shortly or contact us and we will send you the upcoming dates.", noMatch: "No tours match these filters. Try another date, departure point or group size.",
  filterGolfers: "Golfers", filterDeparture: "Departure", allDepartures: "All departures",
  calH: "Pick a date", calAny: "Show all dates", calLegendOpen: "Seats available", calLegendSold: "Sold out", calPrev: "Previous month", calNext: "Next month", weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], calShowing: "Showing tours on",
  calShow: "Show 1 tour on {d}|Show {n} tours on {d}", calNone: "Tap a date to see its tours", calHint: "Green dates have seats; the number is how many tours leave that day.",
  perPerson: "/person", includesLine: "Includes golf and round-trip bus · tax included", seatsLeft: "1 seat left|{n} seats left", soldOut: "Sold out", enquireBtn: "Enquire About This Tour", noPayment: "No payment is required to enquire.",
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
  included: ["Round-trip shared coach from the departure point in Tokyo", "18 holes of self-play golf (green fee)", "Riding cart where the course provides one", "Tour leader on the day (Japanese-speaking)", "Our English guide with the meeting details after confirmation", "Rental clubs, when you add them to your enquiry (+¥5,500 per person)"],
  notIncludedH: "Not included",
  notIncluded: ["Lunch and drinks at the clubhouse, unless the tour says lunch is included", "Golf shoes and gloves (bring your own)", "Hotel pick-up and a private guide (see Custom Golf Booking)"],
  goodH: "Good to Know",
  good: [
    { title: "Shared rounds", body: "You may be paired with other golfers on the tour. Groups are formed by the tour leader on the day." },
    { title: "Rental clubs", body: "Tick “Add Rental Clubs” in the enquiry and tell us how many golfers need a set. Right- and left-handed sets can be requested in the notes." },
    { title: "English support", body: "The coach and course staff speak Japanese. We send you an English guide with the meeting point, the day’s timing and clubhouse etiquette once your booking is confirmed, and you can email us any time." },
    { title: "Combine with a trip", body: "Tours depart early from Tokyo and return in the evening. Tell us your hotel area in the notes and we will mention the nearest departure point." },
  ],
  faqH: "FAQ",
  faq: [
    { q: "Is my tour booked when I send the enquiry?", a: "No. An enquiry is free and takes no payment. Our travel partner emails you the purchase details; your booking is confirmed only after you complete the purchase with them and receive a confirmation." },
    { q: "Who do I pay?", a: "The travel partner named in the purchase instructions. KAMEHAME JAPAN does not collect payment for shared bus tours." },
    { q: "What does the price include?", a: "The round of golf, the cart and the round-trip coach, tax included. Rental clubs are an option at ¥5,500 per person. Lunch is extra unless the tour says it is included." },
    { q: "Can I cancel?", a: "Cancellation terms are set by the tour seller and sent to you before you purchase. As published today: free 7 or more days before, ¥2,000 per person 3–6 days before, 50% 1–2 days before, and no refund on the day." },
    { q: "What if the tour is full after I pay?", a: "Seats shown on this site can change before your purchase is processed. If a tour cannot be secured after payment, you will be offered an alternative date or a full refund of that purchase." },
    { q: "Can beginners join?", a: "Tours are for golfers who have played a round before. The pace is relaxed, but you should be comfortable playing 18 holes." },
    { q: "Can I bring my own clubs?", a: "Yes. Clubs travel in the coach's luggage hold. If you would rather not carry them, add rental clubs to your enquiry." },
  ],
  formH: "Enquire about this tour", golfers: "Golfers", golfersMax: "up to {n} seats left on this tour", rentalLabel: "Add Rental Clubs (+¥5,500 per person)", rentalCount: "How many golfers need rental clubs?", rentalCountHint: "Add which hand (right/left) and your heights in the notes.",
  partyH: "Your party", partyLede: "One line per golfer. Rental clubs are ¥5,500 per person and are added to the total; shoe rental is requested from the course and paid there on the day.",
  golferN: "Golfer {n}", golferName: "Name", golferLead: "Lead golfer (you)", golferClubs: "Rental clubs (+¥5,500)", golferHand: "Hand", handRight: "Right", handLeft: "Left", golferShoes: "Rental shoes", golferShoeSize: "Shoe size", shoeSizeHint: "e.g. 26.5 cm, US 9, EU 42", shoesNote: "Shoe rental depends on the course's stock and is paid at the club.",
  name: "Your name", email: "Email", phone: "Phone or WhatsApp (optional)", notes: "Notes (optional)", notesHint: "Hotel area, handedness and height for rental clubs, dietary needs, anything else.",
  consent: "I understand that this is a free enquiry, not a booking, and that KAMEHAME JAPAN will share these details with its travel partner so they can email me the purchase instructions.",
  send: "Send Enquiry", sending: "Sending…",
  summaryPerPerson: "Tour price", summaryRental: "Rental clubs", summaryTotal: "Total", taxIncluded: "tax included",
  doneH: "Thank you for your enquiry!",
  doneLines: ["We have received your request.", "Our travel partner will contact you by email with the purchase details and next steps.", "Your booking is not yet confirmed, and no payment has been taken."],
  doneRef: "Your enquiry reference", doneAgain: "Enquire about another tour",
  errors: { availability_changed: "This tour no longer has enough seats for your group. Please choose another date.", availability_unavailable: "The live schedule is temporarily unavailable. Please try again in a few minutes.", invalid: "Please check the form and try again.", default: "We could not send your enquiry. Please try again or email hello@kamehame-japan.com." },
  departure: "Departure", departs: "departs", lunchIncluded: "Lunch included", lunchSubsidy: "Lunch voucher included", lunchNot: "Lunch not included", throughPlay: "Through play (no lunch break)", cartIncluded: "Cart included", scheduleH: "The day", highlightsH: "About the course", notesH: "Conditions", back: "Back to tours", details: "Details",
  customLink: "Prefer your own course and date? See Custom Golf Booking",
};

const ja: BusCopy = {
  landTitle: "日本でゴルフを、もっと手軽に。",
  landLede: "東京近郊でラウンドする2つの方法。決まった日程の乗合バスツアーに参加するか、グループだけのコース・ティータイムを私たちが手配するか。",
  landFeatures: ["18ホールのラウンド", "おひとり様歓迎", "英語での予約サポート", "お問い合わせは無料"],
  landCta: "2つの方法を比べる",
  twoWaysH: "日本でゴルフを楽しむ2つの方法",
  sharedH: "乗合バスゴルフツアー", sharedBody: "決まった日程に、東京発の乗合バスで千葉・茨城・栃木のゴルフ場へ。18ホールのセルフプレー。1人あたりの総額表示。おひとり様・お二人・少人数に。", sharedCta: "日程と料金を見る",
  customH: "カスタムゴルフ手配", customBody: "ご希望のコース・日程・人数で。富士山エリアも。コース選びからお名前でのティータイム予約、ゴルフ場のしきたりのご案内、送迎のご紹介まで。手配料＋ゴルフ場のプレー代。", customCta: "個別に手配する",
  compareH: "どちらが合っていますか？",
  compareLede: "どちらも手入れの行き届いた日本のコースで18ホール。違うのは、行き方、日程の決め方、料金の組み立てです。",
  compareCols: ["乗合バスツアー", "カスタム手配"],
  compare: [
    { label: "向いている方", shared: "おひとり様・お二人・8名までのグループで、バスの相乗りに抵抗のない方", custom: "特定のコース・日程・エリア（富士山含む）を希望するグループ" },
    { label: "日程", shared: "ツアーの公開日程（約3か月先まで）から選ぶ", custom: "ティータイムが取れる日ならいつでも" },
    { label: "行き方", shared: "新宿または大井町（東京）発の乗合バス、当日夕方に戻る", custom: "電車＋タクシー、自家用車、またはご紹介する送迎事業者" },
    { label: "コース", shared: "千葉・茨城・栃木の日程掲載コース（東京から1.5〜2.5時間）", custom: "ご希望のコース。富士山ビューのコースも。会員制はご相談" },
    { label: "料金", shared: "1人あたり総額（税込）：ゴルフ＋バス、目安 ¥30,000〜¥38,000", custom: "手配料 1人目 ¥15,000＋追加1人 ¥5,000、プレー代はゴルフ場で精算" },
    { label: "当日", shared: "日本語の添乗スタッフが同行。カートでセルフプレー、他の参加者と同組", custom: "ご自身のグループで。英語アシスタント同行は別途お見積もり" },
    { label: "予約の流れ", shared: "無料のお問い合わせ → 提携旅行会社から購入案内メール → 旅行会社へお支払い", custom: "リクエストフォーム → 内容確認 → 手配料のお支払い後に予約" },
  ],
  chooseH: "迷ったら",
  chooseShared: "身軽に、同組でも構わない、東京から一番手軽でお得な1日ゴルフなら乗合バスツアー。",
  chooseCustom: "行きたいコースや日程が決まっている、自分たちだけで回りたい、富士山を眺めたいならカスタム手配。",
  heroCustomTag: "グループにおすすめ", heroCustomWho: "3名以上・家族や友人と・コースや日程を自分で決めたい", heroCustomPrice: "1人 約 ¥24,500（4名の場合）",
  heroCustomItems: [{ ok: true, text: "手配料" }, { ok: true, text: "プレー代・カート（ゴルフ場で精算）" }, { ok: false, text: "コースまでの交通費（送迎つきは1人 約+¥22,500）" }, { ok: true, text: "昼食はクラブハウスで当日払い" }, { ok: true, text: "レンタルクラブは追加料金で可" }],
  heroBusWho: "1〜2名・おひとり様歓迎・東京発の決まった日程", heroBusPrice: "1人 {price}〜",
  heroBusItems: [{ ok: true, text: "プレー代・カート" }, { ok: true, text: "東京発着の往復バス" }, { ok: true, text: "税込" }, { ok: true, text: "昼食はクラブハウスで当日払い" }, { ok: true, text: "レンタルクラブは追加料金で可（1人 +¥5,500）" }],
  heroCardsNote: "どちらも手入れの行き届いた日本のコースで18ホール。英語サポートつき、問い合わせは無料です。",
  estimateH: "カスタム手配の費用の目安（4名の場合）",
  estimateLede: "よくあるゴルフ場料金をもとにした1人あたり（税込）の試算です。乗合バスツアーはバス込みで1人 ¥30,000〜¥38,000ほどです。",
  estimateCols: ["手配料のみ", "送迎つき"],
  estimateRows: [
    { label: "手配料（4名で ¥30,000）", feeOnly: "¥7,500", withTransfer: "¥7,500" },
    { label: "ゴルフ場のプレー代・カート・税（東京近郊の目安）", feeOnly: "約 ¥17,000", withTransfer: "約 ¥17,000" },
    { label: "ドライバー付きミニバン送迎・ホテル往復（1組 約 ¥90,000）", feeOnly: "—", withTransfer: "約 ¥22,500" },
    { label: "1人あたり（東京近郊）", feeOnly: "約 ¥24,500", withTransfer: "約 ¥47,000" },
    { label: "1人あたり（富士山エリア・プレー代 約 ¥23,000）", feeOnly: "約 ¥30,500", withTransfer: "約 ¥53,000" },
  ],
  estimateNote: "プレー代はコース・曜日で変わり（週末は高め）、ゴルフ場でお支払い。送迎は送迎事業者と直接契約・お支払い。レンタルクラブと昼食はどちらも別途。2名の場合は手配料と車両を少人数で分けるため1人あたりは高くなります。",

  heroTitle: "東京発・乗合バスゴルフツアー",
  heroLede: "新宿または大井町からバスで関東のカントリークラブへ。18ホールのセルフプレーのあと、同じ日の夕方に東京へ戻ります。1人あたりの総額表示（税込）。",
  features: ["東京発着の往復バス", "おひとり様歓迎", "カートでセルフプレー18ホール", "問い合わせ無料・当サイトでの支払いなし"],
  heroCta: "日程と料金を見る",
  aboutH: "ツアーのしくみ",
  aboutLede: "以下はツアー運行会社の公開ルールを英語圏のお客様向けにまとめたものです。日程ごとの正確な集合場所・時刻はご予約時に確定します。",
  meetH: "集合場所",
  meetLede: "各ツアーは東京の2か所のどちらかから出発します。カードに出発地と出発時刻を表示しています。新宿発の一部は池袋・王子・東京駅を経由します。",
  meetPoints: [
    { name: "新宿（新宿三丁目）", where: "新宿4丁目の明治通り沿い、伊勢丹と高島屋の間、運行会社のゴルフスタジオ前。", access: "新宿駅東南口 徒歩3分 · 新宿三丁目駅E7出口 徒歩0分 · バスタ新宿 徒歩3分。解散も同じ場所です。" },
    { name: "大井町（品川区）", where: "大井町駅中央口から徒歩2分、広い通りのレンタカー店付近、不動産店の向かい。", access: "JR京浜東北線 · 東急大井町線 · りんかい線。帰りは駅東口での解散になる場合があります。" },
  ],
  meetNote: "バスは集合時刻の約10分前に到着し、定刻に出発します。乗り遅れた場合はご自身でゴルフ場へ向かうことになるため、10分前にはお越しください。",
  dayH: "1日の流れ",
  day: [
    { time: "06:30〜07:00", title: "東京を出発", body: "集合場所でバスに乗車。クラブは荷物室へ。ゴルフ場までは1.5〜2.5時間、途中1回休憩します。" },
    { time: "08:30〜09:30", title: "到着・チェックイン", body: "添乗員がクラブハウスでまとめて受付。ロッカーで着替え、カートを受け取って1番ティーへ。" },
    { time: "午前", title: "前半9ホール", body: "添乗員が組み分けした3〜4名の組で、乗用カートのセルフプレー。キャディはつきません。コースのルールに従います。" },
    { time: "昼", title: "クラブハウスで昼食", body: "多くのツアーは昼食休憩あり（当日精算）。カードに「昼食つき」とある場合や、スループレーの場合を除きます。" },
    { time: "午後", title: "後半9ホール", body: "ラウンド終了後、ご希望でクラブハウスの浴場・シャワーを利用してからバスへ。" },
    { time: "17:30〜19:30", title: "東京へ", body: "バスは集合場所まで戻ります。到着時刻はコースと交通状況によります。" },
  ],
  dayNote: "時刻はツアーによって異なります。各日程の出発時刻はカードに表示し、ご予約時に確定します。",
  playH: "プレーのスタイル",
  play: [
    { title: "カートでセルフプレー", body: "乗用カートを組で使い、スコアはご自身で。キャディなしは日本の一般的なスタイルです。" },
    { title: "他の参加者と同組", body: "乗合ツアーのため、当日添乗員が3〜4名の組を作ります。おひとりでも組に入れます。" },
    { title: "日本語の添乗スタッフ", body: "添乗員がバスに同乗し、受付とコースでの進行を担当。ゴルフ場スタッフは日本語です。予約確定後に当日の流れとクラブハウスのマナーをまとめた英語ガイドをお送りします。" },
    { title: "雨天決行", body: "雨でも催行します。ゴルフ場がクローズした場合はツアー代金が返金されます。" },
    { title: "服装とマナー", body: "襟付きシャツ・ゴルフシューズ・帽子が基本。クラブハウス入館時にジャケットや整った服装を求めるコースもあります。ガイドで詳しくご案内します。" },
  ],
  costH: "料金に含まれるもの",
  costLede: "カードの料金は1人あたり・税込です。当サイトでご案内する金額はこれだけです。",
  costIncludedH: "料金に含まれる",
  costIncluded: [
    { item: "18ホールのゴルフ", note: "当該コースのプレー代（グリーンフィー）" },
    { item: "乗用カート", note: "組で共用。ほぼすべてのコースで提供" },
    { item: "往復バス", note: "東京の集合場所とゴルフ場の往復" },
    { item: "添乗員", note: "受付・組み分け・当日の進行（日本語）" },
    { item: "消費税", note: "追加はありません" },
  ],
  costExtraH: "別途お支払い",
  costExtra: [
    { item: "昼食・飲み物", note: "クラブハウスのレストランで目安 ¥1,500〜¥2,500。「昼食つき」のツアーを除く" },
    { item: "レンタルクラブ", note: "お問い合わせフォームで1人 ¥5,500。コースのレンタルについてもご相談ください" },
    { item: "シューズ・グローブ・ボール", note: "ご持参ください。一部コースはシューズの有料レンタルあり" },
    { item: "ロッカー・浴場", note: "多くのコースは無料。少額のロッカー代がかかるコースもあります" },
    { item: "集合場所までの交通費", note: "新宿または大井町までご自身で" },
    { item: "旅行保険", note: "任意ですが加入をおすすめします" },
  ],
  costNote: "",
  cancelH: "キャンセル",
  cancelLede: "販売会社の規定が適用され、お支払い前にお送りします。運行会社が現在公開している規定は次のとおりです。",
  cancel: [
    "7日前まで：無料",
    "3〜6日前：1人 ¥2,000",
    "前日・前々日：ツアー代金の50%",
    "当日・不参加：100%（返金なし）",
    "日程変更は一度キャンセル扱いになります",
    "キャンセルは運行会社の受付時間内に電話のみ",
  ],
  cancelNote: "雨天決行です。ゴルフ場がクローズした場合はツアー代金が返金されます。返金時の銀行・カード手数料は差し引かれます。お支払い後にツアーを確保できなかった場合は、別日程のご案内または全額返金となります。",
  glanceH: "ツアーの概要",
  glance: [
    { title: "東京集合", body: "新宿（新宿三丁目）または大井町に6:30〜7:00ごろ集合。18:00〜19:30ごろ同じ場所に戻ります。" },
    { title: "18ホール・セルフプレー", body: "乗用カート、添乗員が3〜4名の組を編成。キャディなし。" },
    { title: "総額表示（税込）", body: "ゴルフ・カート・往復バス込み。昼食、レンタルクラブ、シューズは別途。" },
    { title: "問い合わせは無料", body: "当サイトでの支払いなし。提携旅行会社から購入案内が届き、キャンセル規定もそこに記載されます。" },
  ],
  glanceMore: "詳しく見る：集合場所・1日の流れ・費用・キャンセル",
  detailsH: "ツアーのしくみ（詳細）",

  toursH: "ツアー日程", toursLede: "日程と料金は運行会社の公開スケジュールから取得し、随時更新しています。カレンダーで日付を選び、人数を指定して、無料でお問い合わせください。",
  updated: "日程更新", unavailable: "ただいま日程を表示できません。しばらくしてからもう一度お試しいただくか、お問い合わせください。直近の日程をお送りします。", noMatch: "条件に合うツアーがありません。日付・出発地・人数を変えてお試しください。",
  filterGolfers: "人数", filterDeparture: "出発地", allDepartures: "すべての出発地",
  calH: "日付を選ぶ", calAny: "すべての日程を表示", calLegendOpen: "空きあり", calLegendSold: "完売", calPrev: "前の月", calNext: "次の月", weekdays: ["月", "火", "水", "木", "金", "土", "日"], calShowing: "表示中の日付",
  calShow: "{d}のツアー {n}件を表示|{d}のツアー {n}件を表示", calNone: "日付をタップするとその日のツアーを表示します", calHint: "緑の日は空きあり。数字はその日に出発するツアーの本数です。",
  perPerson: "/人", includesLine: "ゴルフと往復バスを含む・税込", seatsLeft: "残り{n}席", soldOut: "完売", enquireBtn: "このツアーについて問い合わせる", noPayment: "お問い合わせにお支払いは不要です。",
  howH: "ご予約の流れ", howBody: "お問い合わせ完了後、提携旅行会社より購入方法とお支払いについてメールでご案内します。当サイトでのお支払いは不要です。", howAvailability: "お問い合わせのみでは予約は確定しません。",
  stepsH: "ご利用の流れ",
  steps: [
    { n: "01", title: "ツアーを探す", body: "日程とゴルフ場を一覧から選びます。" },
    { n: "02", title: "問い合わせを送る", body: "ツアーを選んで必要事項を送信。無料です。" },
    { n: "03", title: "購入案内を受け取る", body: "提携旅行会社から予約内容とお支払い方法をメールでご案内します。" },
    { n: "04", title: "購入を完了する", body: "条件を確認のうえ、提携旅行会社と購入手続きを行います。" },
    { n: "05", title: "確定のご連絡", body: "予約確定後、集合場所の詳細とゴルフガイドをお届けします。" },
  ],
  includedH: "含まれるもの",
  included: ["東京の出発地からの往復乗合バス", "18ホールのセルフプレー（グリーンフィー）", "乗用カート（コースが提供する場合）", "当日の添乗員（日本語）", "予約確定後の英語ガイド（集合場所の詳細つき）", "レンタルクラブ（お問い合わせで追加した場合、1人 +¥5,500）"],
  notIncludedH: "含まれないもの",
  notIncluded: ["クラブハウスでの昼食・飲み物（「昼食つき」のツアーを除く）", "ゴルフシューズ・グローブ（ご持参ください）", "ホテル送迎・専属ガイド（カスタムゴルフ手配をご覧ください）"],
  goodH: "知っておきたいこと",
  good: [
    { title: "同組について", body: "ツアーの他の参加者と同じ組になることがあります。組み分けは当日添乗員が行います。" },
    { title: "レンタルクラブ", body: "お問い合わせで「レンタルクラブを追加」にチェックし、必要な人数をお選びください。右利き・左利きは備考欄へ。" },
    { title: "英語サポート", body: "バスとゴルフ場のスタッフは日本語です。予約確定後に集合場所・当日の時間・クラブハウスのマナーをまとめた英語ガイドをお送りします。メールでのご質問はいつでもどうぞ。" },
    { title: "旅程との組み合わせ", body: "朝早く東京を出て夕方に戻ります。備考欄に滞在ホテルのエリアをお書きいただければ、近い出発地をご案内します。" },
  ],
  faqH: "よくある質問",
  faq: [
    { q: "問い合わせを送ると予約になりますか？", a: "いいえ。お問い合わせは無料で、お支払いも発生しません。提携旅行会社から購入案内が届き、購入手続きと確定のご連絡をもって予約成立です。" },
    { q: "支払先はどこですか？", a: "購入案内に記載の提携旅行会社です。乗合バスツアーの代金をKAMEHAME JAPANが受け取ることはありません。" },
    { q: "料金には何が含まれますか？", a: "ラウンド、カート、往復バス（税込）。レンタルクラブは1人 ¥5,500のオプション。昼食は「昼食つき」のツアーを除き別途です。" },
    { q: "キャンセルはできますか？", a: "キャンセル規定は販売会社が定め、購入前にお送りします。現在の公開規定では、7日前まで無料、3〜6日前は1人 ¥2,000、前日・前々日は50%、当日は返金なしです。" },
    { q: "支払い後に満席だったら？", a: "表示の残席は購入手続きの前に変わることがあります。お支払い後にツアーを確保できなかった場合は、別日程のご案内またはその購入分の全額返金となります。" },
    { q: "初心者でも参加できますか？", a: "ラウンド経験のある方向けです。のんびりしたペースですが、18ホールを回れることが前提です。" },
    { q: "自分のクラブを持ち込めますか？", a: "はい。クラブはバスの荷物室に積みます。持ち運びを避けたい場合はお問い合わせでレンタルクラブを追加してください。" },
  ],
  formH: "このツアーについて問い合わせる", golfers: "人数", golfersMax: "このツアーの残席は{n}席です", rentalLabel: "レンタルクラブを追加（1人 +¥5,500）", rentalCount: "レンタルクラブが必要な人数", rentalCountHint: "右利き・左利きと身長を備考欄にお書きください。",
  partyH: "参加者", partyLede: "参加者ごとに1行ずつ。レンタルクラブは1人 ¥5,500で合計に加算。シューズレンタルはゴルフ場に依頼し、当日現地でお支払いです。",
  golferN: "参加者 {n}", golferName: "お名前", golferLead: "代表者（あなた）", golferClubs: "レンタルクラブ（+¥5,500）", golferHand: "利き手", handRight: "右", handLeft: "左", golferShoes: "レンタルシューズ", golferShoeSize: "シューズサイズ", shoeSizeHint: "例: 26.5 cm", shoesNote: "シューズレンタルはゴルフ場の在庫次第で、料金は現地払いです。",
  name: "お名前", email: "メールアドレス", phone: "電話番号またはWhatsApp（任意）", notes: "備考（任意）", notesHint: "ご滞在ホテルのエリア、レンタルクラブの利き手と身長、食事のご要望など。",
  consent: "これは無料のお問い合わせであり予約ではないこと、また購入案内をメールでお送りするためにKAMEHAME JAPANがこの内容を提携旅行会社と共有することを理解しました。",
  send: "問い合わせを送る", sending: "送信中…",
  summaryPerPerson: "ツアー料金", summaryRental: "レンタルクラブ", summaryTotal: "合計", taxIncluded: "税込",
  doneH: "お問い合わせありがとうございます。",
  doneLines: ["お問い合わせを受け付けました。", "お問い合わせ完了後、提携旅行会社より購入方法とお支払いについてメールでご案内します。当サイトでのお支払いは不要です。", "お問い合わせのみでは予約は確定しません。"],
  doneRef: "受付番号", doneAgain: "別のツアーについて問い合わせる",
  errors: { availability_changed: "このツアーはご希望の人数分の空きがなくなりました。別の日程をお選びください。", availability_unavailable: "ただいま日程を表示できません。数分後にもう一度お試しください。", invalid: "入力内容をご確認のうえ、もう一度お試しください。", default: "送信できませんでした。もう一度お試しいただくか、hello@kamehame-japan.com までご連絡ください。" },
  departure: "出発", departs: "出発", lunchIncluded: "昼食つき", lunchSubsidy: "昼食補助つき", lunchNot: "昼食別", throughPlay: "スループレー（昼食休憩なし）", cartIncluded: "カート込み", scheduleH: "当日の流れ", highlightsH: "コースについて", notesH: "条件", back: "ツアー一覧へ戻る", details: "詳細",
  customLink: "コースや日程を自分で決めたい方はカスタムゴルフ手配へ",
};

export const busCopy = (lang: Lang): BusCopy => (lang === "ja" ? ja : en);
