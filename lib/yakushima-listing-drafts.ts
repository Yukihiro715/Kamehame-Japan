import type { ListingDraft, ListingDraftCopy } from "./partner-listing-drafts";

type Copy = { en: string; ja: string };
type Course = {
  slug: string;
  title: Copy;
  lead: Copy;
  duration: Copy;
  price: number;
  details: { en: ListingDraftCopy["details"]; ja: ListingDraftCopy["details"] };
  /** Photos from the operator's own tour page (used at the owner's instruction, 2026-11-27). */
  images?: ListingDraft["images"];
};

const Y = "/images/partner-listings";
const photo = (src: string, en: string, ja: string, width = 940, height = 474) => ({ src, en, ja, width, height });
const seaPhotos = [
  photo(`${Y}/yakushima-sea/turtle.webp`, "A snorkeller face to face with a sea turtle in clear water", "透明な海でウミガメと向かい合うシュノーケラー", 1600, 900),
  photo(`${Y}/yakushima-sea/photos-phone.webp`, "Underwater photos of the tour delivered to your phone", "ツアー中の水中写真をスマートフォンで受け取る", 1600, 900),
];
const photosBySlug: Record<string, ListingDraft["images"]> = {
  "yakushima-jomonsugi-trekking": [
    photo(`${Y}/yakushima-jomonsugi/jomon-sugi.webp`, "The vast trunk of Jomon Sugi", "縄文杉の巨大な幹"),
    photo(`${Y}/yakushima-jomonsugi/railway-light.webp`, "Morning light on the old logging railway", "朝日が差し込むトロッコ道"),
    photo(`${Y}/yakushima-jomonsugi/trail-bridge.webp`, "A bridge on the railway trail through the forest", "森を抜けるトロッコ道の橋"),
    photo(`${Y}/yakushima-jomonsugi/deer.webp`, "Yakushima deer beside the trail", "登山道のそばのヤクシカ"),
    photo(`${Y}/yakushima-jomonsugi/stump.webp`, "A giant moss-covered stump in the forest", "苔むした巨大な切り株"),
    photo(`${Y}/yakushima-jomonsugi/waterfall.webp`, "A mountain stream and waterfall along the way", "途中で出会う渓流と滝"),
  ],
  "yakushima-shiratani-moss-forest": [
    photo(`${Y}/yakushima-moss-forest/moss-forest.webp`, "Moss-covered boulders and trees in Shiratani Unsuikyo", "白谷雲水峡の苔むした岩と木々", 1600, 1000),
    photo(`${Y}/yakushima-moss-forest/old-trees.webp`, "Old cedars and twisted trunks in the moss forest", "苔の森の古い杉と曲がった幹"),
    photo(`${Y}/yakushima-moss-forest/stream-rocks.webp`, "A clear stream running over mossy rocks", "苔の岩の上を流れる澄んだ沢"),
    photo(`${Y}/yakushima-moss-forest/giant-cedar.webp`, "A hiker beneath a giant cedar", "巨大な杉の下に立つハイカー"),
    photo(`${Y}/yakushima-moss-forest/moss-creek.webp`, "Moss-covered banks of a forest creek", "苔に覆われた森の小川の岸"),
    photo(`${Y}/yakushima-moss-forest/monkeys.webp`, "Yakushima macaques grooming by the trail", "登山道のそばで毛づくろいするヤクザル"),
  ],
  "yakushima-shiratani-taikoiwa": [
    photo(`${Y}/yakushima-taikoiwa/taiko-rock.webp`, "The view over the mountains from Taiko-iwa rock", "太鼓岩から見渡す山並み", 1600, 1067),
    photo(`${Y}/yakushima-taikoiwa/forest.webp`, "Moss-covered boulders and trees in Shiratani Unsuikyo", "白谷雲水峡の苔むした岩と木々", 1600, 1000),
    photo(`${Y}/yakushima-taikoiwa/waterfall.webp`, "A waterfall in the ravine", "渓谷の滝"),
    photo(`${Y}/yakushima-taikoiwa/moss-tree-stream.webp`, "A mossy tree leaning over a stream", "沢に張り出した苔むした木"),
    photo(`${Y}/yakushima-taikoiwa/autumn-view.webp`, "Autumn colour on the slopes seen from the rock", "岩の上から見る紅葉の斜面"),
    photo(`${Y}/yakushima-taikoiwa/cedar.webp`, "A hiker beside an ancient cedar", "古い杉のそばに立つハイカー"),
  ],
  "yakushima-shiratani-taikoiwa-old-growth": [
    photo(`${Y}/yakushima-taikoiwa-old-growth/big-cedar.webp`, "An ancient cedar on the old-growth trail", "原生林歩道の古い杉", 1600, 1000),
    photo(`${Y}/yakushima-taikoiwa-old-growth/taiko-rock.webp`, "The view over the mountains from Taiko-iwa rock", "太鼓岩から見渡す山並み", 1600, 1067),
    photo(`${Y}/yakushima-taikoiwa-old-growth/old-growth.webp`, "Twisted trunks in the old-growth forest", "原生林の曲がりくねった幹"),
    photo(`${Y}/yakushima-taikoiwa-old-growth/moss-tree-stream.webp`, "A mossy tree leaning over a stream", "沢に張り出した苔むした木"),
    photo(`${Y}/yakushima-taikoiwa-old-growth/creek.webp`, "A clear creek through the moss forest", "苔の森を流れる澄んだ小川"),
    photo(`${Y}/yakushima-taikoiwa-old-growth/ridge-view.webp`, "Mountain ridges seen from the trail", "歩道から見える山の稜線"),
  ],
  "yakushima-sea-turtle-snorkeling": seaPhotos,
  "yakushima-discover-scuba-one-dive": seaPhotos,
  "yakushima-discover-scuba-extended-dive": seaPhotos,
  "yakushima-discover-scuba-two-dives": seaPhotos,
};

const shirataniCosts = {
  en: [["Included", "Guide, hiking insurance and pickup from covered areas"], ["Additional costs", "Gear rental from an external shop, lunch, ¥500 forest conservation contribution and any private tour fee"]],
  ja: [["含まれるもの", "ガイド・登山保険・対象エリア内の送迎"], ["別途費用", "外部店での登山用品レンタル・弁当・森林環境整備推進協力金500円・貸切料（必要な場合）"]],
} satisfies Course["details"];

const diveDetails = {
  en: [
    ["Participants", "Ages 10–65. Beginners are welcome."],
    ["Start times", "08:00 or 13:00. 10:00 and 15:00 by arrangement."],
    ["Included", "Instruction, guide, equipment, facilities, photos and video, insurance, parking, one drink and pickup by arrangement"],
    ["Additional costs", "Lunch, any private tour fee and boat fee if applicable"],
  ],
  ja: [
    ["参加条件", "10〜65歳。初心者も参加可。"],
    ["開始時刻", "8:00／13:00。10:00・15:00は要相談。"],
    ["含まれるもの", "講習・ガイド・器材・施設利用・写真と動画・保険・駐車場・1ドリンク・送迎（要相談）"],
    ["別途費用", "昼食・貸切料・ボート代（該当する場合）"],
  ],
} satisfies Course["details"];

const courses: Course[] = [
  {
    slug: "yakushima-jomonsugi-trekking",
    title: { en: "Jomon Sugi Trek in Yakushima", ja: "屋久島・縄文杉トレッキング" },
    lead: { en: "Follow an old logging railway and a mountain trail past Wilson's Stump and Daiō Sugi to Jomon Sugi, one of Yakushima's oldest cedars. This is a strenuous full-day hike.", ja: "トロッコ道と山道をたどり、ウィルソン株や大王杉を経て縄文杉を目指します。長距離を歩く、体力が必要な日帰りコースです。" },
    duration: { en: "About 12 hours", ja: "約12時間" },
    price: 10_500,
    details: {
      en: [["Participants", "Up to four guests per guide. Ages 12–55 on the standard tour; groups including anyone aged 56–60 require a private tour by request."], ["Included", "Guide, hiking insurance and pickup from covered areas"], ["Additional costs", "Gear rental from an external shop, lunch, ¥1,400 shuttle and ¥1,000 mountain conservation contribution"]],
      ja: [["参加条件", "ガイド1名につき最大4名。通常12〜55歳。56〜60歳の方を含むグループは貸切で要相談。"], ["含まれるもの", "ガイド・登山保険・対象エリア内の送迎"], ["別途費用", "外部店での登山用品レンタル・弁当・シャトルバス1,400円・山岳部環境保全協力金1,000円"]],
    },
  },
  {
    slug: "yakushima-shiratani-moss-forest",
    title: { en: "Shiratani Unsuikyo Moss Forest Hike", ja: "屋久島・白谷雲水峡 苔むす森トレッキング" },
    lead: { en: "Spend a morning or afternoon on a guided walk through the moss-covered forest of Shiratani Unsuikyo.", ja: "白谷雲水峡の苔むす森を、ガイドと歩く半日コースです。午前・午後から選べます。" },
    duration: { en: "About 4 hours", ja: "約4時間" },
    price: 7_500,
    details: {
      en: [["Participants", "Up to five guests per guide. A private tour is required if the group includes a child below fourth grade or someone aged 61–65."], ...shirataniCosts.en],
      ja: [["参加条件", "ガイド1名につき最大5名。小学4年生未満または61〜65歳の方を含むグループは貸切。"], ...shirataniCosts.ja],
    },
  },
  {
    slug: "yakushima-shiratani-taikoiwa",
    title: { en: "Shiratani Unsuikyo to Taiko Rock", ja: "屋久島・白谷雲水峡 太鼓岩トレッキング（ノーマルコース）" },
    lead: { en: "Hike through Shiratani Unsuikyo's moss forest to Taiko Rock, a lookout over the island's interior when the weather is clear.", ja: "白谷雲水峡の苔むす森を抜けて太鼓岩へ。天気がよければ、屋久島の山々を見渡せます。" },
    duration: { en: "About 7 hours", ja: "約7時間" },
    price: 11_000,
    details: {
      en: [["Participants", "Ages 10–65. Groups including children aged 10–12 or adults aged 61–65 require a private tour."], ...shirataniCosts.en],
      ja: [["参加条件", "10〜65歳。10〜12歳のお子様または61〜65歳の方を含むグループは貸切。"], ...shirataniCosts.ja],
    },
  },
  {
    slug: "yakushima-shiratani-taikoiwa-old-growth",
    title: { en: "Shiratani Unsuikyo to Taiko Rock via the Old-Growth Trail", ja: "屋久島・白谷雲水峡 太鼓岩トレッキング（原生林歩道コース）" },
    lead: { en: "Take the longer route to Taiko Rock for more time among the old-growth cedars and moss of Shiratani Unsuikyo.", ja: "白谷雲水峡の原生林歩道を経由して太鼓岩へ。苔に覆われた森や屋久杉をじっくり見ながら歩く、通常より長いルートです。" },
    duration: { en: "About 8½ hours", ja: "約8時間半" },
    price: 12_000,
    details: {
      en: [["Participants", "Ages 10–65. Groups including children aged 10–12 or adults aged 61–65 require a private tour."], ...shirataniCosts.en],
      ja: [["参加条件", "10〜65歳。10〜12歳のお子様または61〜65歳の方を含むグループは貸切。"], ...shirataniCosts.ja],
    },
  },
  {
    slug: "yakushima-sea-turtle-snorkeling",
    title: { en: "Sea Turtle Snorkelling in Yakushima", ja: "屋久島・ウミガメシュノーケリング" },
    lead: { en: "Snorkel with a guide in waters frequented by sea turtles. Beginners and non-swimmers can take part. Wildlife sightings vary, and the guide shares photos and video from your tour.", ja: "ウミガメが生息する海でガイドとシュノーケリング。初心者や泳ぎが苦手な方も参加でき、ツアーの写真・動画を受け取れます。ウミガメに出会えるかは当日の状況によります。" },
    duration: { en: "About 2½–3 hours", ja: "約2時間半〜3時間" },
    price: 5_000,
    details: {
      en: [["Participants", "Ages 5–69"], ["Meet and start times", "Isso Beach car park; 08:00, 11:00 or 14:00. 10:00 and 15:00 by arrangement. No tours December–February."], ["Language", "The 10–15 minute briefing is normally in Japanese. English support is being confirmed."], ["Included", "Instruction, guide, equipment, shower and changing facilities, photos and video, insurance, parking, one drink and pickup by arrangement"]],
      ja: [["参加条件", "5〜69歳"], ["集合・開始時刻", "一湊海水浴場駐車場に集合。8:00／11:00／14:00。10:00・15:00は要相談。12月〜2月は休止。"], ["対応言語", "10〜15分の講習は通常日本語です。英語対応は確認中です。"], ["含まれるもの", "講習・ガイド・器材・シャワーと更衣室・写真と動画・保険・駐車場・1ドリンク・送迎（要相談）"]],
    },
  },
  {
    slug: "yakushima-discover-scuba-one-dive",
    title: { en: "Discover Scuba Diving in Yakushima · One Dive", ja: "屋久島・体験ダイビング（1ダイブ）" },
    lead: { en: "An introductory dive with an instructor. Allow about 30 minutes underwater after the briefing and practice.", ja: "インストラクターと潜る入門コースです。説明と練習のあと、約30分のダイビングを体験します。" },
    duration: { en: "About 3 hours", ja: "約3時間" },
    price: 7_000,
    details: diveDetails,
  },
  {
    slug: "yakushima-discover-scuba-extended-dive",
    title: { en: "Discover Scuba Diving in Yakushima · Extended Dive", ja: "屋久島・体験ダイビング（スペシャル1ダイブ）" },
    lead: { en: "An extended introductory dive with an instructor. About 60 minutes underwater gives you more time to explore the reef and look for sea turtles.", ja: "約60分潜る体験ダイビングです。インストラクターと海の中をゆっくり観察し、ウミガメを探します。" },
    duration: { en: "About 3½ hours", ja: "約3時間半" },
    price: 11_000,
    details: diveDetails,
  },
  {
    slug: "yakushima-discover-scuba-two-dives",
    title: { en: "Discover Scuba Diving in Yakushima · Two Dives", ja: "屋久島・体験ダイビング（2ダイブ）" },
    lead: { en: "Take two introductory dives of about 30 minutes each with an instructor, with a break ashore between dives.", ja: "インストラクターと約30分ずつ、2回潜る体験です。1本目と2本目の間に陸上で休憩します。" },
    duration: { en: "About 4 hours", ja: "約4時間" },
    price: 14_000,
    details: diveDetails,
  },
];

export const yakushimaListingDrafts: ListingDraft[] = courses.map(course => {
  const amount = course.price.toLocaleString("en-US");
  return {
    slug: course.slug,
    gallery: "photo",
    images: course.images ?? photosBySlug[course.slug],
    mediaNote: { en: "Photos from the operator's own tour pages.", ja: "写真はツアー運営会社の公式ページのものです。" },
    en: {
      title: course.title.en, area: "Yakushima, Kagoshima", lead: course.lead.en,
      details: [
        ["Duration", course.duration.en],
        ["Provisional reference price", `From ¥${amount} per person, tax included. Final selling price to be confirmed.`],
        ...course.details.en,
        ["Health and safety", "Disclose cardiovascular conditions, high blood pressure, epilepsy, chronic back or knee conditions, major surgery in the past year, fear of heights or panic disorder when requesting a booking. Guests who are pregnant cannot take part. The tour may be called off for bad weather, illness or unsuitable equipment."],
        ["Minors", "Under 13s need an accompanying guardian. Guests under 18 need a guardian's signature."],
      ],
      highlights: [],
      pending: ["Final selling price and booking terms", "English-language support and approved photos"],
    },
    ja: {
      title: course.title.ja, area: "鹿児島・屋久島", lead: course.lead.ja,
      details: [
        ["所要時間", course.duration.ja],
        ["仮の参考価格", `1名あたり税込${amount}円〜。最終販売価格は確認中です。`],
        ...course.details.ja,
        ["健康・安全条件", "心臓・循環器系疾患、高血圧、てんかん、腰や膝の持病、1年以内の大きな手術、高所恐怖症やパニック障害がある場合は申込時にお知らせください。妊娠中は参加できません。悪天候・体調不良・装備不備により中止する場合があります。"],
        ["未成年の参加", "13歳未満は保護者同伴。18歳未満は申込書に保護者の署名が必要です。"],
      ],
      highlights: [],
      pending: ["最終販売価格・予約条件", "英語対応・掲載用写真"],
    },
  };
});
