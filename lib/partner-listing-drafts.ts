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
  /** "photo": event photography shown edge to edge, the first one large; default "artwork": whole images on a plain ground. */
  gallery?: "artwork" | "photo";
  images?: { src: string; en: string; ja: string; width: number; height: number }[];
  mediaNote?: { en: string; ja: string };
  en: ListingDraftCopy;
  ja: ListingDraftCopy;
}

export const sumiEPreviewSlug = "sumi-e-ink-painting";
export const sumiEPreviewTitle = { en: "Sumi-e Japanese Ink Painting in Ginza", ja: "銀座・水墨画体験" };

/** Proposed retail prices including tax for sessions from 1 January 2027. */
export const sumiEProposedPrices = [
  { name: { ja: "色紙", en: "Shikishi art board" }, solo: 38_000, perGuest: 22_000 },
  { name: { ja: "コースター3枚", en: "Three coasters" }, solo: 38_000, perGuest: 22_000 },
  { name: { ja: "ランプシェード", en: "Lampshade" }, solo: 30_500, perGuest: 30_500 },
  { name: { ja: "掛軸", en: "Hanging scroll" }, solo: 32_000, perGuest: 32_000 },
];

export const partnerListingDrafts: ListingDraft[] = [
  {
    slug: "tokyo-underground-idol-live",
    // Photos supplied by the organiser 2026-11 (Drive folder "BBP紹介素材"); the
    // group and the venue are not named in the copy until the organiser confirms.
    gallery: "photo",
    images: [
      { src: "/images/partner-listings/idol/venue.webp", en: "A live house seen from the floor: penlights raised towards the stage under blue beams", ja: "フロアから見たライブハウス。青いライトの下、ステージに向けて掲げられたペンライト", width: 1600, height: 1067 },
      { src: "/images/partner-listings/idol/group.webp", en: "Six members in matching frilled costumes pointing skyward as the crowd cheers", ja: "揃いのフリル衣装で空を指す6人のメンバーと、声援を送る客席", width: 1600, height: 1067 },
      { src: "/images/partner-listings/idol/solo-pink.webp", en: "A member singing beside a wall of pastel balloons", ja: "パステルの風船の横で歌うメンバー", width: 1600, height: 1067 },
      { src: "/images/partner-listings/idol/solo-blue.webp", en: "A member in blue reaching out to the audience", ja: "青い衣装で客席に手を伸ばすメンバー", width: 1600, height: 1067 },
      { src: "/images/partner-listings/idol/solo-red.webp", en: "A member in red against an animated screen", ja: "赤い衣装でアニメーションの映像を背に歌うメンバー", width: 1600, height: 1067 },
      { src: "/images/partner-listings/idol/group-2.webp", en: "The whole group on stage with penlights in the front rows", ja: "最前列のペンライトとステージ上のメンバー全員", width: 1600, height: 1067 },
    ],
    mediaNote: { en: "Photos supplied by the organiser. The performing group, the venue and the set list vary by date.", ja: "写真は主催者提供。出演グループ・会場・セットリストは日程により異なります。" },
    en: {
      title: "An Evening at a Tokyo Idol Live", area: "Tokyo · Shinjuku / Shibuya / Ikebukuro",
      lead: "A ticket to a real idol concert in a small Tokyo live house: six-piece harmonies, choreographed dance, costume changes and a floor of fans with penlights who know every call. Not a show staged for tourists; this is the local scene as it is, and you stand in it.",
      details: [["What it is", "Admission to one evening performance; no tour or guide"], ["Start", "Doors from 18:30; the venue and the line-up are confirmed for each date"], ["Tickets", "Standard ¥12,000 per person (the rear of the floor). Front ¥19,000 per person (the forward area closest to the stage). Prices include tax."], ["Getting in", "A digital ticket arrives after confirmation. Go straight to the confirmed venue and show it at the door."], ["Duration", "About 2 hours; you may leave early"], ["Age", "No age restriction; children are welcome with an adult"], ["At the venue", "A drink charge of ¥700 per person is paid at the door in cash; it is not included in the ticket price (standard at Japanese live houses)"], ["Language", "Performances are in Japanese; no English support at the venue"], ["Cancellation", "Non-refundable once booked"]],
      highlights: ["Stand in a Tokyo live house with local fans, not in a tourist show", "Singing, dance and costume changes from a working idol group", "Choose the rear of the floor or the front area by the stage", "No age limit: families are welcome"],
      pending: ["Availability by date", "Whether the group and venue may be named on the page"],
    },
    ja: {
      title: "東京・アイドルライブの夜", area: "東京 · 新宿／渋谷／池袋",
      lead: "東京の小さなライブハウスで行われる本物のアイドル公演のチケットです。6人のハーモニー、振り付け、衣装替え、そしてコールを知り尽くしたファンのペンライト。観光客向けの演出ではなく、地元のシーンそのものの中に立ちます。",
      details: [["体験内容", "夜公演1回の観覧チケット。ツアー・ガイドはありません"], ["開始時刻", "18:30開場。会場・出演は日程ごとに確定"], ["チケット", "通常チケット 12,000円（1人・税込）：フロア後方／前方チケット 19,000円（1人・税込）：ステージに近い前方エリア"], ["参加方法", "確定後にデジタルチケットをお渡しします。指定会場へ直接お越しいただき、入口でご提示ください"], ["所要時間", "約2時間。途中退出可"], ["年齢", "年齢制限なし。お子さまは大人同伴で"], ["会場での支払い", "ドリンク代700円（1人）を入口で現地払い。チケット代には含まれません。日本のライブハウスの通例です"], ["対応言語", "公演は日本語。会場での英語対応はありません"], ["キャンセル", "予約確定後のキャンセル不可"]],
      highlights: ["観光向けショーではなく、地元ファンと同じフロアに立つ", "現役アイドルグループの歌・ダンス・衣装替え", "フロア後方か、ステージ近くの前方エリアかを選ぶ", "年齢制限なし。家族でも"],
      pending: ["日程ごとの空き状況", "グループ名・会場名をページに出してよいか"],
    },
  },
  {
    slug: "tokyo-ninja-zen-night-walk",
    en: {
      title: "Ninja Zen Night Walk in Tokyo", area: "Tokyo · Azabudai / Tokyo Tower area",
      lead: "Explore Tokyo after dark through mindful walking, breathing and meditation. Practise ninja-inspired movement and hand gestures while paying attention to the city around you.",
      details: [["Duration", "Approximately 2 hours 15 minutes"], ["Language", "English / Japanese"], ["Participants", "Adults aged 18 and over; up to 10 guests"], ["Meeting", "Azabudai area; final meeting instructions to be confirmed"], ["Cancellation", "Full refund for cancellations up to one day before the start; exact cutoff and later cancellation conditions to be confirmed"], ["Weather", "Normally runs in the rain"], ["Availability", "Checked directly with the operator"]],
      highlights: ["An introduction to ninja-inspired movement", "Mindful walking near Tokyo Tower", "Breathing practice and seated meditation"],
      pending: ["Selling price, dates and start time", "Inclusions and booking deadline", "Exact cancellation cutoff, later cancellation conditions and photos"],
    },
    ja: {
      title: "忍者禅ナイトウォーク", area: "東京 · 麻布台／東京タワー周辺",
      lead: "夜の東京を歩きながら、忍者の歩法や印、呼吸、瞑想に触れる体験です。周囲の音や光に意識を向け、普段とは違う街の表情を感じます。",
      details: [["所要時間", "約2時間15分"], ["対応言語", "日本語・英語"], ["参加条件", "18歳以上・最大10名"], ["集合", "麻布台周辺。最終の集合案内は確認中"], ["キャンセル", "開始1日前まで全額返金。具体的な締切時刻・以降の取消条件は確認中"], ["雨天", "原則雨天決行"], ["空き状況", "主催者への問い合わせで確認"]],
      highlights: ["忍者の歩き方や動きを学ぶ", "東京タワー周辺の夜を歩く", "呼吸法と坐禅に触れる"],
      pending: ["販売価格・開催日・開始時刻", "含まれる内容・予約締切", "取消の具体的な締切時刻・以降の条件・写真"],
    },
  },
  {
    slug: "mukojima-geisha-evening",
    en: {
      title: "Geisha Hospitality in Mukojima", area: "Tokyo · Mukojima",
      lead: "An evening of Japanese cuisine, geisha performance and traditional parlour games in one of Tokyo's historic entertainment districts. A guided walk introduces the neighbourhood before dinner.",
      details: [["Proposed schedule", "16:00 neighbourhood walk; 18:00 dinner and performances; around 21:00 finish"], ["Format", "Tailor-made arrangements, subject to confirmation"], ["Price", "Individual quotation; not yet available for booking"]],
      highlights: ["Explore the Sumida River neighbourhood", "Enjoy seasonal Japanese cuisine", "Discover geisha performance and parlour games"],
      pending: ["Final terms for the proposed itinerary, party size and language support", "Selling price and included food and drinks", "Booking conditions and approved photos"],
    },
    ja: {
      title: "向島・芸者のおもてなし体験", area: "東京 · 向島",
      lead: "向島の街歩きとともに、日本料理、芸者の演舞、お座敷遊びに触れる体験案です。希望日程・人数に合わせて内容を調整します。",
      details: [["行程案", "16:00街歩き／18:00食事・演舞・お座敷遊び／21:00頃終了"], ["開催形式", "日程・人数に応じた個別手配。確定前の内容です"], ["料金", "個別見積・予約受付前"]],
      highlights: ["隅田川周辺の街を歩く", "季節の日本料理を味わう", "演舞やお座敷遊びに触れる"],
      pending: ["企画中の最終行程・人数条件・言語対応", "販売価格・飲食の含有範囲", "予約条件・掲載写真"],
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
    slug: "tokyo-matcha-cultural-experience",
    en: {
      title: "Matcha Culture Experience in Tokyo", area: "Tokyo",
      lead: "An introduction to Japanese matcha culture. The exact lesson, setting and inclusions for this proposed experience are being confirmed.",
      details: [["Theme", "Matcha culture"], ["Venue, duration and language", "To be confirmed"], ["Price", "To be confirmed"]],
      highlights: ["Discover Japanese matcha culture"],
      pending: ["Selected lesson and whether kimono is included", "Venue, language, duration and capacity", "Final agreement, selling prices, dates, booking conditions and photos"],
    },
    ja: {
      title: "東京・抹茶文化体験", area: "東京",
      lead: "日本の抹茶文化に触れる体験の下書きです。当社で扱う具体的なプランと含まれる内容を確認しています。",
      details: [["テーマ", "抹茶文化"], ["会場・所要時間・言語", "確認中"], ["料金", "確認中"]],
      highlights: ["日本の抹茶文化に触れる"],
      pending: ["対象プラン・着物の有無", "会場・言語・所要時間・人数条件", "取扱条件の最終合意・販売価格・日程・予約条件・写真"],
    },
  },
  {
    slug: "arashiyama-private-terrace-gathering",
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
