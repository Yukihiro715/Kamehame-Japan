/** Review copy only. Commercial terms and source messages stay in the private
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
  en: ListingDraftCopy;
  ja: ListingDraftCopy;
}
export const partnerListingDrafts: ListingDraft[] = [
  {
    slug: "tokyo-underground-idol-live",
    en: {
      title: "An Evening of Underground Idol Music in Tokyo", area: "Tokyo · Shinjuku / Shibuya / Ikebukuro",
      lead: "Step into a local live venue for Japanese idol songs, dance and the energy of the audience. This experience is admission to a performance, with two viewing areas to choose from.",
      details: [["Experience", "Live performance admission only"], ["Start", "18:30; venue and performance confirmed for each date"], ["Tickets", "Standard: rear viewing area. Front: forward viewing area."], ["Arrival", "A digital ticket is provided after confirmation. Go directly to the confirmed venue."], ["Language", "No English-language support"], ["Cancellation", "Non-refundable once booked"]],
      highlights: ["Discover Tokyo's local idol scene", "Watch singing and dance in a live venue", "Choose standard or front-area admission"],
      pending: ["Selling prices and availability", "Duration, age requirements and admission conditions", "Photos from the actual performance"],
    },
    ja: {
      title: "東京・地下アイドルライブ体験", area: "東京 · 新宿／渋谷／池袋",
      lead: "歌やダンス、ファンの声援が広がるライブ会場で、日本の地下アイドル文化に触れる体験です。通常・前方の2種類から観覧エリアを選びます。",
      details: [["体験内容", "地下アイドルのライブ観覧のみ"], ["開始時刻", "18:30〜。開催会場・公演は日程ごとに確定"], ["チケット", "通常：後方エリア／前方：前方エリア"], ["参加方法", "確定後にデジタルチケットをお渡しし、指定会場へ直接入場"], ["対応言語", "英語対応なし"], ["キャンセル", "予約確定後のキャンセル不可"]],
      highlights: ["東京の地下アイドル文化に触れる", "歌・ダンスと会場の熱気を楽しむ", "通常・前方の観覧エリアから選ぶ"],
      pending: ["販売価格・日程ごとの空き状況", "所要時間・年齢条件・入場条件", "実際の公演写真"],
    },
  },
  {
    slug: "tokyo-ninja-zen-night-walk",
    en: {
      title: "Ninja Zen Night Walk in Tokyo", area: "Tokyo · Azabudai / Tokyo Tower area",
      lead: "Explore Tokyo after dark through mindful walking, breathing and meditation. Practise ninja-inspired movement and hand gestures while paying attention to the city around you.",
      details: [["Duration", "Approximately 2 hours 15 minutes"], ["Language", "English / Japanese"], ["Participants", "Adults aged 18 and over; up to 10 guests"], ["Meeting", "Azabudai area; final meeting instructions to be confirmed"]],
      highlights: ["An introduction to ninja-inspired movement", "Mindful walking near Tokyo Tower", "Breathing practice and seated meditation"],
      pending: ["Selling price, dates and start time", "Inclusions, weather policy and booking deadline", "KAMEHAME cancellation conditions and photos"],
    },
    ja: {
      title: "忍者禅ナイトウォーク", area: "東京 · 麻布台／東京タワー周辺",
      lead: "夜の東京を歩きながら、忍者の歩法や印、呼吸、瞑想に触れる体験です。周囲の音や光に意識を向け、普段とは違う街の表情を感じます。",
      details: [["所要時間", "約2時間15分"], ["対応言語", "日本語・英語"], ["参加条件", "18歳以上・最大10名"], ["集合", "麻布台周辺。最終の集合案内は確認中"]],
      highlights: ["忍者の歩き方や動きを学ぶ", "東京タワー周辺の夜を歩く", "呼吸法と坐禅に触れる"],
      pending: ["販売価格・開催日・開始時刻", "含有内容・雨天対応・予約締切", "当社販売の取消条件・写真"],
    },
  },
  {
    slug: "mukojima-geisha-evening",
    en: {
      title: "Geisha Hospitality in Mukojima", area: "Tokyo · Mukojima",
      lead: "An evening of Japanese cuisine, geisha performance and traditional parlour games in one of Tokyo's historic entertainment districts. A guided walk introduces the neighbourhood before dinner.",
      details: [["Proposed schedule", "16:00 neighbourhood walk; 18:00 dinner and performances; around 21:00 finish"], ["Format", "Tailor-made arrangements, subject to confirmation"], ["Price", "Individual quotation; not yet available for booking"]],
      highlights: ["Explore the Sumida River neighbourhood", "Enjoy seasonal Japanese cuisine", "Discover geisha performance and parlour games"],
      pending: ["Final itinerary, party size and language support", "Selling price and included food and drinks", "Booking conditions and approved photos"],
    },
    ja: {
      title: "向島・芸者のおもてなし体験", area: "東京 · 向島",
      lead: "向島の街歩きとともに、日本料理、芸者の演舞、お座敷遊びに触れる体験案です。希望日程・人数に合わせて内容を調整します。",
      details: [["行程案", "16:00街歩き／18:00食事・演舞・お座敷遊び／21:00頃終了"], ["開催形式", "日程・人数に応じた個別手配。確定前の内容です"], ["料金", "個別見積・予約受付前"]],
      highlights: ["隅田川周辺の街を歩く", "季節の日本料理を味わう", "演舞やお座敷遊びに触れる"],
      pending: ["最終行程・人数条件・言語対応", "販売価格・飲食の含有範囲", "予約条件・掲載写真"],
    },
  },
  {
    slug: "japanese-home-cooking-class",
    en: {
      title: "Japanese Home Cooking Class", area: "Japan · Venue to be confirmed",
      lead: "Discover Japanese food culture through everyday home cooking. This draft introduces a proposed cooking class for international visitors; the menu and venue are being arranged.",
      details: [["Theme", "Japanese home cooking and food culture"], ["Menu", "To be confirmed"], ["Location and duration", "To be confirmed"]],
      highlights: ["Explore everyday Japanese cooking", "Learn about Japanese food culture"],
      pending: ["Menu, venue, language and duration", "Capacity, age requirements and dietary options", "Prices, dates, cancellation terms and photos"],
    },
    ja: {
      title: "外国人向け・日本の家庭料理教室", area: "開催エリア・会場確認中",
      lead: "日本の家庭料理を通じて食文化を知る、訪日ゲスト向け料理教室の下書きです。具体的なメニューと開催場所は調整中です。",
      details: [["テーマ", "日本の家庭料理・食文化"], ["メニュー", "確認中"], ["会場・所要時間", "確認中"]],
      highlights: ["家庭で親しまれる日本料理に触れる", "料理を通じて食文化を知る"],
      pending: ["メニュー・会場・対応言語・所要時間", "定員・年齢条件・食事制限対応", "料金・日程・取消条件・写真"],
    },
  },
  {
    slug: "tokyo-matcha-cultural-experience",
    en: {
      title: "Matcha Culture Experience in Tokyo", area: "Tokyo",
      lead: "An introduction to Japanese matcha culture. The exact lesson, setting and inclusions for this proposed experience are being confirmed.",
      details: [["Theme", "Matcha culture"], ["Venue, duration and language", "To be confirmed"], ["Price", "To be confirmed"]],
      highlights: ["Discover Japanese matcha culture"],
      pending: ["Selected lesson and whether kimono is included", "Venue, language, duration and capacity", "Prices, dates, booking conditions and photos"],
    },
    ja: {
      title: "東京・抹茶文化体験", area: "東京",
      lead: "日本の抹茶文化に触れる体験の下書きです。当社で扱う具体的なプランと含まれる内容を確認しています。",
      details: [["テーマ", "抹茶文化"], ["会場・所要時間・言語", "確認中"], ["料金", "確認中"]],
      highlights: ["日本の抹茶文化に触れる"],
      pending: ["対象プラン・着物の有無", "会場・言語・所要時間・人数条件", "料金・日程・予約条件・写真"],
    },
  },
  {
    slug: "arashiyama-private-terrace-gathering",
    en: {
      title: "A Private Terrace Gathering in Arashiyama", area: "Kyoto · Arashiyama",
      lead: "Bring your group together on a terrace in Arashiyama. Receptions, welcome gatherings and a place to pause between activities can be arranged around your plans.",
      details: [["Capacity", "Private events: up to 50 guests, subject to layout"], ["Schedule", "Arranged between 10:00 and 18:00; duration by arrangement"], ["Included", "Basic venue use; food and drinks quoted separately"], ["Price", "Quotation for each event"]],
      highlights: ["A terrace setting in Arashiyama", "Flexible group receptions and breaks", "Food and drinks can be discussed separately"],
      pending: ["Event quotation and minimum spend", "Final layout, menu and availability", "Booking deadline, cancellation terms and photos"],
    },
    ja: {
      title: "嵐山・貸切テラスでの集まり", area: "京都 · 嵐山",
      lead: "嵐山のテラスで、レセプションやウェルカムパーティー、団体の休憩時間を。日程・人数・目的に合わせて内容を調整する会場利用プランです。",
      details: [["人数", "貸切最大50名。レイアウトにより調整"], ["時間", "10:00〜18:00の範囲で調整。利用時間は内容ごとに相談"], ["含まれるもの", "基本会場利用。ケータリング・飲料は別途見積"], ["料金", "1利用・案件ごとの個別見積"]],
      highlights: ["嵐山のテラス空間で過ごす", "レセプションや団体休憩に", "飲食プランは別途相談"],
      pending: ["会場料金・最低利用条件", "レイアウト・飲食内容・空き状況", "予約締切時刻・取消条件・写真"],
    },
  },
  {
    slug: "sumi-e-ink-painting",
    en: {
      title: "Sumi-e Japanese Ink Painting", area: "Venue to be confirmed",
      lead: "Explore Japanese ink painting in a proposed private lesson. English support and private arrangements are available; the lesson format and booking conditions are being prepared.",
      details: [["Theme", "Japanese ink painting"], ["Format", "Private arrangements available"], ["Language", "English support available"]],
      highlights: ["Discover Japanese ink painting", "A private setting with English support"],
      pending: ["Venue, lesson content, materials and duration", "Party-size prices and dates", "Cancellation conditions and photos"],
    },
    ja: {
      title: "水墨画体験", area: "開催エリア・会場確認中",
      lead: "墨の表現に触れる水墨画体験の下書きです。英語対応と貸切に対応可能との回答を受け、具体的なレッスン内容を調整しています。",
      details: [["テーマ", "水墨画"], ["開催形式", "貸切対応可"], ["対応言語", "英語対応可"]],
      highlights: ["日本の水墨画に触れる", "英語対応・貸切で相談可能"],
      pending: ["会場・内容・材料・所要時間", "人数別料金・開催日", "取消条件・写真"],
    },
  },
];
