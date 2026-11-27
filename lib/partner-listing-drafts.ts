
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
