import { yakushimaListingDrafts } from "./yakushima-listing-drafts";

/** Partner listing previews. Supplier terms and source messages stay in the private
 * listing ledger. These drafts never enter the public catalog or checkout. */
export interface ListingDraftCopy {
  title: string;
  area: string;
  lead: string;
  details: [string, string][];
  highlights: string[];
  pending: string[];
}
export interface ListingDraft {
  slug: string;
  city?: "tokyo" | "kyoto";
  priceOnRequest?: boolean;
  prices?: { name: { ja: string; en: string }; perGuest: number; solo?: number }[];
  /** Event photography uses the standard photo grid. Artwork is shown in full. */
  gallery?: "artwork" | "photo";
  images?: { src: string; en: string; ja: string; width: number; height: number }[];
  mediaNote?: { en: string; ja: string };
  en: ListingDraftCopy;
  ja: ListingDraftCopy;
}

export const sumiEPreviewSlug = "sumi-e-ink-painting";
export const sumiEPreviewTitle = { en: "Sumi-e Japanese Ink Painting in Ginza", ja: "銀座・水墨画体験" };

/** Proposed retail prices including tax for sessions from 1 January 2027. */
const sumiEProposedPrices = [
  { name: { ja: "色紙", en: "Shikishi art board" }, solo: 38_000, perGuest: 22_000 },
  { name: { ja: "コースター3枚", en: "Three coasters" }, solo: 38_000, perGuest: 22_000 },
  { name: { ja: "ランプシェード", en: "Lampshade" }, solo: 30_500, perGuest: 30_500 },
  { name: { ja: "掛軸", en: "Hanging scroll" }, solo: 32_000, perGuest: 32_000 },
];

export const partnerListingDrafts: ListingDraft[] = [
  ...yakushimaListingDrafts,
  {
    slug: "tokyo-ninja-zen-night-walk",
    city: "tokyo",
    // Photos from the organiser's listing of this walk (Airbnb experience 7063214), used at the owner's instruction (2026-11-27).
    // Wholesale ¥13,500 per person (the listing's ¥15,000 less 10%, confirmed 2026-11-27); the price below is the owner's rule
    // (net + ¥4,500 ad cost, 20% margin, rounded up to ¥500).
    gallery: "photo",
    images: [
      { src: "/images/partner-listings/ninja-zen-night-walk/tower-group.webp", en: "The group gathered beneath Tokyo Tower at night", ja: "夜の東京タワーの足元に集まった参加者", width: 1440, height: 960 },
      { src: "/images/partner-listings/ninja-zen-night-walk/temple-gate.webp", en: "A red temple gate lit at night", ja: "夜に照らされた赤い寺の門", width: 1440, height: 960 },
      { src: "/images/partner-listings/ninja-zen-night-walk/street-walk.webp", en: "Walking the night streets near Tokyo Tower", ja: "東京タワー近くの夜の通りを歩く", width: 1440, height: 960 },
      { src: "/images/partner-listings/ninja-zen-night-walk/hand-seal.webp", en: "Learning a ninja hand seal", ja: "忍者の印を習う手元", width: 1440, height: 960 },
      { src: "/images/partner-listings/ninja-zen-night-walk/crossing.webp", en: "The group crossing a quiet street after dark", ja: "暗くなった静かな通りを渡る参加者", width: 1440, height: 960 },
      { src: "/images/partner-listings/ninja-zen-night-walk/temple-talk.webp", en: "The guide explaining the practice in front of the temple", ja: "寺の前で説明をするガイド", width: 1440, height: 960 },
    ],
    mediaNote: { en: "Photos from the organiser's listing of this walk.", ja: "写真は主催者の掲載ページのものです。" },
    en: {
      title: "Ninja Zen Night Walk in Tokyo", area: "Tokyo · Azabudai / Tokyo Tower area",
      lead: "Explore Tokyo after dark through mindful walking, breathing and meditation. Practise ninja-inspired movement and hand gestures while paying attention to the city around you.",
      details: [["Duration", "Approximately 2 hours 15 minutes"], ["Price", "¥23,500 per person, tax included"], ["Language", "English / Japanese"], ["Participants", "Adults aged 18 and over; up to 10 guests"], ["Meeting", "Azabudai area; final meeting instructions to be confirmed"], ["Cancellation", "Full refund for cancellations up to one day before the start; exact cutoff and later cancellation conditions to be confirmed"], ["Weather", "Normally runs in the rain"], ["Availability", "Checked directly with the operator"]],
      highlights: ["An introduction to ninja-inspired movement", "Mindful walking near Tokyo Tower", "Breathing practice and seated meditation"],
      pending: ["Dates and start time", "Inclusions and booking deadline", "Exact cancellation cutoff and later cancellation conditions"],
    },
    ja: {
      title: "忍者禅ナイトウォーク", area: "東京 · 麻布台／東京タワー周辺",
      lead: "夜の東京を歩きながら、忍者の歩法や印、呼吸、瞑想に触れる体験です。周囲の音や光に意識を向け、普段とは違う街の表情を感じます。",
      details: [["所要時間", "約2時間15分"], ["料金", "1名あたり¥23,500(税込)"], ["対応言語", "日本語・英語"], ["参加条件", "18歳以上・最大10名"], ["集合", "麻布台周辺。最終の集合案内は確認中"], ["キャンセル", "開始1日前まで全額返金。具体的な締切時刻・以降の取消条件は確認中"], ["雨天", "原則雨天決行"], ["空き状況", "主催者への問い合わせで確認"]],
      highlights: ["忍者の歩き方や動きを学ぶ", "東京タワー周辺の夜を歩く", "呼吸法と坐禅に触れる"],
      pending: ["開催日・開始時刻", "含まれる内容・予約締切", "取消の具体的な締切時刻・以降の条件"],
    },
  },
  {
    slug: "mukojima-geisha-evening",
    city: "tokyo",
    priceOnRequest: true,
    gallery: "photo",
    images: [
      { src: "/images/mukojima-geisha-hero.jpg", en: "A geisha performing in a traditional room", ja: "座敷で舞を披露する芸者", width: 800, height: 400 },
      { src: "/images/mukojima-geisha-dance.jpg", en: "Three performers dancing with fans in a tatami room", ja: "座敷で扇を手に舞う3人", width: 500, height: 500 },
      { src: "/images/mukojima-geisha-games.jpg", en: "Two participants seated across from each other for a parlour game", ja: "座敷で向かい合いお座敷遊びをする2人", width: 500, height: 500 },
    ],
    en: {
      title: "Geisha Hospitality in Mukojima", area: "Tokyo · Mukojima",
      lead: "Explore Mukojima and the Sumida River with a guide before an evening of Japanese cuisine, dance, music and traditional parlour games.",
      details: [
        ["Proposed schedule", "16:00 neighbourhood walk; 18:00 dinner and performances; around 21:00 finish"],
        ["Date request", "Send your first, second and third choices. We arrange one date based on availability."],
        ["Participants", "For 5–10 guests, at least four performers across dance and music, including an apprentice geisha. Groups of fewer than five are arranged separately."],
        ["Language", "An English-speaking guide joins the riverside walk. At dinner, accompanying staff can help using a translation app. Request a professional interpreter in advance if needed."],
        ["Interpreter option", "Reference price shared for the interpreter-accompanied option: ¥75,000 per person. The final price and what it includes are being confirmed."],
      ],
      highlights: ["Explore the Sumida River neighbourhood", "Enjoy seasonal Japanese cuisine", "Discover geisha performance and parlour games"],
      pending: ["Final itinerary and booking terms", "Selling price, interpreter pricing and inclusions"],
    },
    ja: {
      title: "向島・芸者のおもてなし体験", area: "東京 · 向島",
      lead: "ガイドと向島・隅田川沿いを散策したあと、日本料理を味わいながら芸者の舞や演奏、お座敷遊びを楽しみます。",
      details: [
        ["行程案", "16:00街歩き／18:00食事・演舞・お座敷遊び／21:00頃終了"],
        ["希望日", "第1〜第3希望日をお知らせください。手配可能な日を1日調整します。"],
        ["参加人数", "参加者5〜10名の場合、半玉を含め、立方・地方合わせて4名以上。参加者5名未満の場合は個別にご案内します。"],
        ["対応言語", "墨堤散策には英語ガイドが同行します。料亭では同行スタッフが必要に応じて翻訳アプリでサポートします。通訳の同席を希望する場合は事前にお知らせください。"],
        ["通訳同席プラン", "共有された参考額は1名75,000円。最終料金と料金に含まれる範囲は確認中です。"],
      ],
      highlights: ["隅田川周辺の街を歩く", "季節の日本料理を味わう", "演舞やお座敷遊びに触れる"],
      pending: ["最終行程・予約条件", "販売価格・通訳料金の内訳・含まれる内容"],
    },
  },
  {
    slug: "japanese-home-cooking-class",
    en: {
      title: "Japanese Home Cooking Class", area: "Japan · Venue to be confirmed",
      lead: "Discover Japanese food culture through everyday home cooking. This draft introduces a proposed cooking class for international visitors; the menu and venue are being arranged.",
      details: [["Theme", "Japanese home cooking and food culture"], ["Menu", "To be confirmed"], ["Location and duration", "To be confirmed"]],
      highlights: ["Explore everyday Japanese cooking", "Learn about Japanese food culture"],
      pending: ["Menu, venue, language and duration", "Capacity, age requirements and dietary options", "Final selling price and dates; applicability of the proposed five-day booking deadline, individual and group cancellation terms; photos"],
    },
    ja: {
      title: "外国人向け・日本の家庭料理教室", area: "開催エリア・会場確認中",
      lead: "日本の家庭料理を通じて食文化を知る、訪日ゲスト向け料理教室の下書きです。具体的なメニューと開催場所は調整中です。",
      details: [["テーマ", "日本の家庭料理・食文化"], ["メニュー", "確認中"], ["会場・所要時間", "確認中"]],
      highlights: ["家庭で親しまれる日本料理に触れる", "料理を通じて食文化を知る"],
      pending: ["メニュー・会場・対応言語・所要時間", "定員・年齢条件・食事制限対応", "最終販売価格・日程、提示済みの5日前予約締切と個人・団体の取消条件の適用範囲、写真"],
    },
  },
  {
    // Built from Richard's brief (2026-11-27) and a full read of the academy's
    // website and its public booking page the same day: about 1.5 hours,
    // starts 11:00 and 13:30, all ages, meeting in front of the LUUP stand next
    // to the ACN Yotsuya Building (6 min from Yotsuya station, one stop from
    // Shinjuku), English-speaking instructor (Japanese also offered), easy-to-
    // wear kimono rental, first-flush matcha + sweet + welcome drink + utensils,
    // free cancellation until 24 hours before, more than 10 minutes late counts
    // as a cancellation, socks required on the tatami, not wheelchair or
    // stroller accessible. The programme: kimono, a talk on tea-ceremony
    // history and matcha production comparing matcha from five countries,
    // whisking a bowl, five essential guest rules; matcha chosen from a cellar
    // of 400+ types (seven options, one decaffeinated). Public price ¥9,000
    // per person; a private-workshop option exists. Price set by the owner on
    // 2026-11-27 on the assumption of the partner's 10% commission offer
    // (wholesale ¥8,100 → owner's rule: net + ¥4,500 ad cost, 20% margin,
    // rounded up to ¥500 = ¥16,500); the commission itself is not yet agreed. The academy's name and its review counts stay off
    // the page. Photos from its website.
    slug: "tokyo-matcha-cultural-experience",
    city: "tokyo",
    gallery: "photo",
    images: [
      { src: "/images/partner-listings/tokyo-matcha/whisking.webp", en: "Whisking a bowl of matcha by a window", ja: "窓辺で抹茶を点てる手元", width: 1440, height: 960 },
      { src: "/images/partner-listings/tokyo-matcha/tea-tools.webp", en: "Tea utensils laid out: kettle, bowl, whisk, scoop and sieve", ja: "並べられた茶道具。釜、茶碗、茶筅、茶杓、茶こし", width: 1440, height: 960 },
      { src: "/images/partner-listings/tokyo-matcha/tea-room.webp", en: "The tatami tea room with a hanging scroll and a low table", ja: "掛軸と座卓のある畳の茶室", width: 1440, height: 960 },
    ],
    mediaNote: { en: "Photos from the academy's website, pending its review.", ja: "写真は主催者の公式サイトのもの。掲載写真は先方確認待ちです。" },
    en: {
      title: "Matcha and Tea Ceremony in Kimono, Yotsuya, Tokyo", area: "Tokyo · Yotsuya",
      lead: "About ninety minutes in a tatami room in Yotsuya with an English-speaking instructor. Dress in an easy-to-wear kimono, hear how the tea ceremony came about and how matcha is made and graded, taste the difference between matcha from five countries, and whisk your own bowl of first-flush matcha, served with a Japanese sweet. The kimono and the tea utensils are included.",
      details: [
        ["Duration", "About 1.5 hours"],
        ["Start times", "11:00 or 13:30 (as offered on the academy's own booking page; to be confirmed for our bookings)"],
        ["Meeting point", "Yotsuya: in front of the LUUP scooter stand next to the ACN Yotsuya Building, where the guide waits with a sign. About six minutes on foot from Yotsuya station, one stop from Shinjuku"],
        ["Language", "English-speaking instructor (Japanese also available)"],
        ["Participants", "All ages. A private-workshop option exists; its terms are being confirmed"],
        ["Kimono", "Easy-to-wear kimono rental included: choose one from the collection, learn to put it on, and take photos in the tea room"],
        ["Included", "First-flush matcha, a Japanese sweet and a welcome drink; tea utensils provided"],
        ["Not included", "Transport to the meeting point"],
        ["Cancellation", "Free until 24 hours before the start; later, the full price. Arriving more than 10 minutes late counts as a cancellation with no refund"],
        ["Good to know", "Socks are required on the tatami (sold at the workshop if you forget). Not wheelchair or stroller accessible. Infants cannot sit on laps"],
        ["Price", "¥16,500 per person, tax included"],
      ],
      highlights: [
        "Kimono, matcha and the tea ceremony in one ninety-minute session",
        "Whisk your own bowl of first-flush matcha with tips from the instructor",
        "A talk on the history of the tea ceremony and how matcha is produced, comparing matcha from five countries",
        "How matcha is really graded: why 'ceremonial' and 'premium' labels mean little, and what to look for",
        "Matcha drawn from a cellar of more than 400 kinds, with seven on offer including a decaffeinated one",
        "Guest etiquette condensed to five essential rules: handling the utensils, greetings and how to drink",
      ],
      pending: ["Trading terms with the academy", "Start times and capacity for our bookings, and the private-workshop terms", "Photo approval (current photos from the academy's website)"],
    },
    ja: {
      title: "四ツ谷・着物で抹茶と茶道体験(東京)", area: "東京 · 四ツ谷",
      lead: "四ツ谷の畳の茶室で、英語インストラクターと過ごす約90分。簡易着物に着替え、茶道の成り立ちと抹茶の製法・等級の話を聞き、5か国の抹茶を飲み比べ、一番茶の抹茶を自分で点てて和菓子とともにいただきます。着物と茶道具は料金に含まれます。",
      details: [
        ["所要時間", "約1.5時間"],
        ["開始時刻", "11:00または13:30(主催者の予約ページの設定。当社予約分の枠は確認中)"],
        ["集合場所", "四ツ谷。ACN四谷ビル隣のLUUPスタンド前で、ガイドが看板を持って待機。四ツ谷駅から徒歩約6分、新宿駅から電車で1駅"],
        ["対応言語", "英語インストラクター(日本語も可)"],
        ["参加条件", "年齢制限なし。貸切プランもあり、条件は確認中"],
        ["着物", "簡易着物レンタル込み。好みの一着を選んで着方を習い、茶室で写真を撮る時間があります"],
        ["含まれるもの", "一番茶の抹茶、和菓子とウェルカムドリンク、茶道具レンタル"],
        ["含まれないもの", "集合場所までの交通費"],
        ["キャンセル", "開始24時間前まで無料。以降は全額。10分以上の遅刻はキャンセル扱いとなり返金はありません"],
        ["注意事項", "畳の部屋のため靴下が必要です(忘れた場合は会場で購入)。車椅子・ベビーカーは利用不可。乳児の膝上参加は不可"],
        ["料金", "1名あたり¥16,500(税込)"],
      ],
      highlights: [
        "着物・抹茶・茶道を90分でまとめて体験",
        "インストラクターのコツを聞きながら、一番茶の抹茶を自分で点てる",
        "茶道の歴史と抹茶の製法の講義。5か国の抹茶を飲み比べ",
        "抹茶の本当の等級の見方。「セレモニアル」「プレミアム」の表示が当てにならない理由",
        "400種類以上をそろえた抹茶セラーから7種を用意。カフェインレスも",
        "茶会の客の作法を5つの基本に絞って。道具の扱い、挨拶、飲み方",
      ],
      pending: ["主催者との取引条件", "当社予約分の開始時刻・人数条件、貸切プランの条件", "掲載写真の先方承認(現在は公式サイトの写真)"],
    },
  },
  {
    slug: "arashiyama-private-terrace-gathering",
    city: "kyoto",
    priceOnRequest: true,
    en: {
      title: "A Private Terrace Gathering in Arashiyama", area: "Kyoto · Arashiyama",
      lead: "Bring your group together on a terrace in Arashiyama. Receptions, welcome gatherings and a place to pause between activities can be arranged around your plans.",
      details: [["Capacity", "Private events: up to 50 guests, subject to layout"], ["Schedule", "Arranged between 10:00 and 18:00; duration by arrangement"], ["Included", "Basic venue use; food and drinks quoted separately"], ["Price", "Quotation for each event"], ["Minimum spend", "No minimum spend requirement for venue use"], ["Quote request", "Provide the date, start time, length of use and number of guests"], ["Age", "All ages"], ["Advance booking", "At least one day before; exact cutoff time to be confirmed"], ["Group size", "Final guest count 14 days before; no refund for later reductions"], ["Venue cancellation terms", "45 or more days before: free. 44–29 days before: 50%. 28 days before or later: 100%. Final customer terms will be confirmed before booking."]],
      highlights: ["A terrace setting in Arashiyama", "Flexible group receptions and breaks", "Food and drinks can be discussed separately"],
      pending: ["Final event quotation", "Final layout, menu and availability", "Exact booking cutoff time, final customer cancellation terms and selected photos"],
    },
    ja: {
      title: "嵐山・貸切テラスでの集まり", area: "京都 · 嵐山",
      lead: "嵐山のテラスで、レセプションやウェルカムパーティー、団体の休憩時間を。日程・人数・目的に合わせて内容を調整する会場利用プランです。",
      details: [["人数", "貸切最大50名。レイアウトにより調整"], ["時間", "10:00〜18:00の範囲で調整。利用時間は内容ごとに相談"], ["含まれるもの", "基本会場利用。ケータリング・飲料は別途見積"], ["料金", "1利用・案件ごとの個別見積"], ["最低保証額", "会場利用の最低保証額なし"], ["見積に必要な情報", "利用日時・利用時間・人数"], ["年齢", "全年齢"], ["予約締切", "1日前。具体的な締切時刻は確認中"], ["人数確定", "14日前。以降の人数減少は返金なし"], ["会場の貸切取消条件", "45日前まで無料／44〜29日前50%／28日前から100%。当社販売の最終条件は予約受付前に確定します"]],
      highlights: ["嵐山のテラス空間で過ごす", "レセプションや団体休憩に", "飲食プランは別途相談"],
      pending: ["案件ごとの最終見積", "レイアウト・飲食内容・空き状況", "予約締切の具体時刻・当社販売の最終取消条件・掲載写真の選定"],
    },
  },
  {
    slug: sumiEPreviewSlug,
    city: "tokyo",
    prices: sumiEProposedPrices,
    images: [
      { src: "/images/partner-listings/sumi-e/rensui-koi.webp", en: "Koi painted in ink by Rensui", ja: "蓮水講師が墨で描いた鯉", width: 681, height: 960 },
      { src: "/images/partner-listings/sumi-e/rensui-plum.webp", en: "Plum blossoms painted by Rensui", ja: "蓮水講師が描いた梅の花", width: 878, height: 960 },
    ],
    mediaNote: { en: "Examples painted by the instructor, Rensui.", ja: "講師の蓮水さんによるお手本です。" },
    en: {
      title: sumiEPreviewTitle.en, area: "Tokyo · Ginza",
      lead: "Explore Japanese ink painting in Ginza and create a piece to take home. Choose from four formats: a shikishi art board, a set of three coasters, a lampshade or a hanging scroll. English support and private arrangements are available.",
      details: [["Venue", "SPACE KONA, 3rd floor, 保立ビル, 3-12-16 Ginza, Tokyo"], ["Duration", "80 minutes"], ["Participants", "Ages 4 and over; up to 6 guests"], ["Start times", "Weekdays: 10:00, 11:30 or 13:00. Weekends and Japanese public holidays: 18:00 only. Subject to availability."], ["Formats", "Shikishi art board / three coasters / lampshade / hanging scroll"], ["Language", "English support included"], ["Materials", "Materials included"], ["Booking deadline", "23:59 three days before the experience (Japan time)"], ["Cancellation deadline", "20:00 the day before the experience (Japan time)"], ["Children and observers", "No separate child rate. Non-participating companions and observers are not allowed"], ["Group format", "All participants in the same group must choose the same format"], ["Demonstration", "An optional demonstration can be arranged separately; it is not included in the standard lesson"], ["Booking status", "Preview only; not open for booking. Private arrangements and demonstrations are quoted separately."]],
      highlights: ["Choose motifs such as cherry blossoms, Mt. Fuji, samurai, koi, dragons, bamboo or plum blossoms", "Create your own work and take it home", "Four creative formats in an 80-minute session", "English support and private arrangements available"],
      pending: ["Available dates", "Tool provision", "Pricing and cancellation fees, if applicable", "Whether the confirmed terms also apply to experiences held in 2026"],
    },
    ja: {
      title: sumiEPreviewTitle.ja, area: "東京 · 銀座",
      lead: "銀座で墨の表現に触れ、自分の作品を持ち帰る水墨画体験です。色紙、コースター3枚、ランプシェード、掛軸の4種類から制作内容を選びます。英語対応・貸切の相談も可能です。",
      details: [["会場", "東京都中央区銀座3-12-16 保立ビル SPACE KONA 3階"], ["所要時間", "80分"], ["参加条件", "4歳以上・最大6名"], ["開始時刻", "平日10:00／11:30／13:00、土日祝は18:00のみ。空き状況は要確認"], ["制作内容", "色紙／コースター3枚／ランプシェード／掛軸"], ["対応言語", "英語対応費を含む"], ["材料", "材料費を含む"], ["予約締切", "体験日の3日前23:59まで（日本時間）"], ["キャンセル締切", "体験日前日の20:00まで（日本時間）"], ["子ども・見学", "子ども料金の設定なし。参加しない方の同伴・見学不可"], ["グループの制作内容", "同じグループでは同一コースを選択。別々のコースは選べません"], ["実演", "別途オプションとして相談可能。基本の体験料金には含まれません"], ["受付状況", "確認用プレビュー・予約受付前。貸切・実演は別途見積です。"]],
      highlights: ["桜・富士山・侍・鯉・龍・竹・梅などのモチーフを描く", "制作した作品を持ち帰れる", "80分で楽しむ4種類の制作体験", "英語対応・貸切で相談可能"],
      pending: ["開催日ごとの空き状況", "道具の提供範囲", "販売価格・キャンセル料の有無と条件", "2026年実施分にも同じ条件が適用されるか"],
    },
  },
];
