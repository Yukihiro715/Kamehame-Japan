import Link from "next/link";
import { ArrowDownRight, ArrowRight, CalendarDays, Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { articleDate, latestArticles } from "@/lib/articles";
import { featuredReviews } from "@/lib/reviews";
import { RatingSummary, Stars } from "@/components/site/reviews";
import { catalogFor, isLive, TOURS_PUBLISHED, type Experience } from "@/lib/catalog";
import { pricingFor, yen } from "@/lib/pricing";
import { t, type Lang } from "@/lib/i18n";

const COPY = {
  en: {
    heroEyebrow: "Curated experiences in Japan",
    themesH: "Find your Japan.",
    themes: [
      { t: "Food & Drink", s: "Sushi / Cooking / Sake", img: "/images/cat-sushi.jpg", mark: "食" },
      { t: "Arts & Crafts", s: "Calligraphy / Craftsmanship", img: "/images/craft-hands.jpg", mark: "技" },
      { t: "Tradition & Culture", s: "Geiko / Tea Ceremony / Kimono", img: "/images/geiko-dance.jpg", mark: "芸", href: "geisha" },
      { t: "Pop Culture & Beauty", s: "Character Nails / Anime", img: "/images/cat-nail.jpg", mark: "爪" },
      { t: "Sports & Outdoors", s: "Golf / Sumo", img: "/images/cat-sumo.jpg", mark: "武" },
    ], comingSoon: "Coming soon",
    heroTitle: ["Don't just", "see Japan.", "Step into it."],
    heroLede: "Discover Japan through experiences you won't find on a typical itinerary. From food and craftsmanship to pop culture and private access, every experience is carefully selected.",
    heroCta: "Explore experiences", heroLink: "Browse by city",
    heroBubble: "Not a demonstration —\nthis seat is yours.", heroSpeaker: "— your host",
    trustEyebrow: "Why KAMEHAME", trustTitle: ["The curated way", "to experience Japan."],
    trust: [
      { h: "Selected, not endless.", p: "We don't list everything. We choose experiences we believe are genuinely worth your time in Japan." },
      { h: "Closer to the real thing.", p: "Meet the people behind the culture, craft, food, art and places you came to Japan for — from working professionals to local specialists." },
      { h: "Easy to book. Easy to understand.", p: "Clear pricing, clear inclusions and clear meeting details. English support is available throughout, with interpreter guides included where the experience calls for one." },
    ],
    trustSeal: "Small groups · Local hosts · Thoughtfully selected",
    craftQuote: "Not a demonstration — this seat is yours.", craftSpeaker: "— your host",
    craftAlt: "Tea ceremony host in kimono placing a tea bowl on tatami before seated guests",
    cityEyebrow: "Choose your city", cityTitle: ["Two cities.", "Countless stories."],
    cityLead: "Begin with where you'll be, then discover the people and practices that give each place its character.",
    cityTaglines: { tokyo: ["Modern rhythm.", "Enduring craft."], kyoto: ["Quiet rituals.", "Living heritage."] },
    cityAlts: {
      tokyo: "Five-storied pagoda of Senso-ji temple illuminated at night, Asakusa, Tokyo",
      kyoto: "Lantern-lined Yasaka-dori street at dawn with the Yasaka pagoda, Higashiyama, Kyoto",
    },
    kicker: ["Explore by interest", (n: number) => `${n} ways into Japan`], catTitle: "Follow your curiosity.",
    catTypes: { sushi: "Food culture", sumo: "Living tradition", "tea-ceremony": "Mindful ritual", kimono: "Craft & style", geisha: "Performing arts", swordsmith: "Heritage craft", "anime-nail-art": "Pop culture" } as Record<string, string>,
    toursCard: { title: "Private tours", type: "Made for you" },
    expEyebrow: "Find your Japan.", expTitle: ["Eat. Make.", "Meet. Play."], expLink: "View all experiences",
    featureEyebrow: "Now booking", featureCta: "See the experience",
    tourEyebrow: "Private guided days", tourTitle: ["Let the experience", "become the journey."],
    tourBody: "Spend a full day with a private licensed guide in Tokyo or Kyoto. We can place any masterclass at the heart of a route shaped around your interests.",
    tourDetails: ["8 hours", "Private group", "Tokyo / Kyoto"], tourCta: "Explore private tours",
    tourAlt: "Vermilion torii gates and a stone lantern along a path at Fushimi Inari shrine",
    reviewEyebrow: "Guest confidence", reviewTitle: ["Book with clarity.", "Remember it for life."],
    reviewBody: "Every guest receives clear inclusions, meeting details, and cancellation terms before payment. After the experience, we invite every guest to review it — only confirmed bookings can, and reviews are published as written.",
    reviewPh: "Guest reviews, from confirmed bookings only", reviewPhSub: "The first reviews appear here as they come in.",
    closingP: "Travelling as a group, or dreaming of something one-of-a-kind?",
    closingTitle: ["We'll shape Japan", "around your story."], closingCta: "Plan a private experience",
  },
  es: {
    heroEyebrow: "Experiencias seleccionadas en Japón",
    themesH: "Encuentra tu Japón.",
    themes: [
      { t: "Comida y bebida", s: "Sushi / Cocina / Sake", img: "/images/cat-sushi.jpg", mark: "食" },
      { t: "Arte y oficios", s: "Caligrafía / Artesanía", img: "/images/craft-hands.jpg", mark: "技" },
      { t: "Tradición y cultura", s: "Geiko / Ceremonia del té / Kimono", img: "/images/geiko-dance.jpg", mark: "芸", href: "geisha" },
      { t: "Cultura pop y belleza", s: "Uñas de personajes / Anime", img: "/images/cat-nail.jpg", mark: "爪" },
      { t: "Deporte y aire libre", s: "Golf / Sumo", img: "/images/cat-sumo.jpg", mark: "武" },
    ], comingSoon: "Próximamente",
    heroTitle: ["No te limites a ver Japón.", "Entra en él."],
    heroLede: "Descubre Japón a través de experiencias que no encontrarás en un itinerario al uso. De la comida y la artesanía a la cultura pop y los accesos privados, cada experiencia está cuidadosamente seleccionada.",
    heroCta: "Explora las experiencias", heroLink: "Ver por ciudad",
    heroBubble: "Esto no es una demostración —\neste asiento es tuyo.", heroSpeaker: "— tu anfitrión",
    trustEyebrow: "Por qué KAMEHAME", trustTitle: ["La forma seleccionada", "de vivir Japón."],
    trust: [
      { h: "Seleccionado, no infinito.", p: "No lo listamos todo. Elegimos experiencias que de verdad creemos que merecen tu tiempo en Japón." },
      { h: "Más cerca de lo auténtico.", p: "Conoce a las personas detrás de la cultura, el oficio, la comida, el arte y los lugares por los que viniste a Japón — de profesionales en activo a especialistas locales." },
      { h: "Fácil de reservar. Fácil de entender.", p: "Precios claros, inclusiones claras y punto de encuentro claro. Atención en inglés en todo momento, con guía intérprete incluido cuando la experiencia lo requiere." },
    ],
    trustSeal: "Grupos reducidos · Anfitriones locales · Selección cuidada",
    craftQuote: "Esto no es una demostración — este asiento es tuyo.", craftSpeaker: "— tu anfitrión",
    craftAlt: "Anfitriona de la ceremonia del té dejando un cuenco sobre el tatami ante sus invitados",
    cityEyebrow: "Elige tu ciudad", cityTitle: ["Dos ciudades.", "Historias infinitas."],
    cityLead: "Empieza por donde vas a estar, y descubre a las personas y los oficios que dan carácter a cada lugar.",
    cityTaglines: { tokyo: ["Ritmo moderno.", "Oficio eterno."], kyoto: ["Rituales serenos.", "Herencia viva."] },
    cityAlts: {
      tokyo: "Pagoda de cinco pisos del templo Senso-ji iluminada de noche, Asakusa, Tokio",
      kyoto: "Calle Yasaka-dori con farolillos y la pagoda de Yasaka al amanecer, Higashiyama, Kioto",
    },
    kicker: ["Explora por interés", (n: number) => `${n} puertas a Japón`], catTitle: "Sigue tu curiosidad.",
    catTypes: { sushi: "Cultura gastronómica", sumo: "Tradición viva", "tea-ceremony": "Ritual consciente", kimono: "Oficio y estilo", geisha: "Artes escénicas", swordsmith: "Oficio ancestral", "anime-nail-art": "Cultura pop" } as Record<string, string>,
    toursCard: { title: "Tours privados", type: "A tu medida" },
    expEyebrow: "Encuentra tu Japón.", expTitle: ["Come. Crea.", "Conoce. Juega."], expLink: "Ver todas las experiencias",
    featureEyebrow: "Reservas abiertas", featureCta: "Ver la experiencia",
    tourEyebrow: "Días privados con guía", tourTitle: ["Deja que la experiencia", "se vuelva el viaje."],
    tourBody: "Pasa un día completo con un guía privado titulado en Tokio o Kioto. Podemos poner cualquier clase magistral en el corazón de una ruta hecha a tu medida.",
    tourDetails: ["8 horas", "Grupo privado", "Tokio / Kioto"], tourCta: "Descubre los tours privados",
    tourAlt: "Torii bermellón y un farol de piedra en un sendero del santuario Fushimi Inari",
    reviewEyebrow: "Confianza del viajero", reviewTitle: ["Reserva con claridad.", "Recuérdalo toda la vida."],
    reviewBody: "Cada viajero recibe antes de pagar qué incluye la experiencia, el punto de encuentro y las condiciones de cancelación. Después, invitamos a cada huésped a valorarla — solo con reserva confirmada, y las opiniones se publican tal cual.",
    reviewPh: "Opiniones de huéspedes, solo con reserva confirmada", reviewPhSub: "Las primeras opiniones aparecerán aquí según lleguen.",
    closingP: "¿Viajáis en grupo, o soñáis con algo único?",
    closingTitle: ["Daremos forma a Japón", "alrededor de tu historia."], closingCta: "Planifica una experiencia privada",
  },
  ja: {
    heroEyebrow: "厳選した日本の体験",
    themesH: "あなたの日本を見つける。",
    themes: [
      { t: "食と酒", s: "寿司 / 料理 / 日本酒", img: "/images/cat-sushi.jpg", mark: "食" },
      { t: "アート・工芸", s: "書道 / 職人の技", img: "/images/craft-hands.jpg", mark: "技" },
      { t: "伝統と文化", s: "芸妓・舞妓 / 茶道 / 着物", img: "/images/geiko-dance.jpg", mark: "芸", href: "geisha" },
      { t: "ポップカルチャー・美容", s: "キャラクターネイル / アニメ", img: "/images/cat-nail.jpg", mark: "爪" },
      { t: "スポーツ・アウトドア", s: "ゴルフ / 相撲", img: "/images/cat-sumo.jpg", mark: "武" },
    ], comingSoon: "近日公開",
    heroTitle: ["日本を、見るだけで", "終わらせない。"],
    heroLede: "普通の観光では出会えない体験で、日本を知る。食、職人の技、ポップカルチャー、特別なアクセスまで、ひとつひとつ厳選しています。",
    heroCta: "体験を見る", heroLink: "都市から探す",
    heroBubble: "これは実演ではありません。\nこの席は、あなたのものです。", heroSpeaker: "— お迎えする側より",
    trustEyebrow: "KAMEHAME を選ぶ理由", trustTitle: ["厳選という", "日本の楽しみ方。"],
    trust: [
      { h: "数ではなく、厳選。", p: "何でも載せることはしません。日本での時間を使う価値が本当にあると考える体験だけを選んでいます。" },
      { h: "本物に、もっと近く。", p: "あなたが日本に来た理由である文化・技・食・芸術・場所。その担い手——現役の専門職から地元の目利きまで——に会えます。" },
      { h: "予約も理解も、簡単に。", p: "料金、含まれるもの、集合場所を明確に。英語でのサポートは常にあり、通訳ガイドが必要な体験には含まれています。" },
    ],
    trustSeal: "少人数 · 地元のホスト · 厳選",
    craftQuote: "これは実演ではありません。この席は、あなたのものです。", craftSpeaker: "— お迎えする側より",
    craftAlt: "客の前の畳に茶碗を置く茶道の亭主",
    cityEyebrow: "都市を選ぶ", cityTitle: ["二つの都市。", "尽きない物語。"],
    cityLead: "滞在される街から始めてください。その土地の人と技が見えてきます。",
    cityTaglines: { tokyo: ["今日の速さ。", "変わらぬ手仕事。"], kyoto: ["静かな儀礼。", "生きた継承。"] },
    cityAlts: {
      tokyo: "夜間にライトアップされた浅草・浅草寺の五重塔",
      kyoto: "夜明けの東山、八坂通と八坂の塔",
    },
    kicker: ["関心から探す", (n: number) => `日本への${n}つの扉`], catTitle: "気になるものから。",
    catTypes: { sushi: "食文化", sumo: "生きた伝統", "tea-ceremony": "静かな儀礼", kimono: "技と装い", geisha: "舞と芸", swordsmith: "古来の手仕事", "anime-nail-art": "ポップカルチャー" } as Record<string, string>,
    toursCard: { title: "プライベートツアー", type: "ご要望に合わせて" },
    expEyebrow: "あなたの日本を見つける。", expTitle: ["食べる。つくる。", "会う。遊ぶ。"], expLink: "すべての体験を見る",
    featureEyebrow: "受付中の体験", featureCta: "体験の詳細を見る",
    tourEyebrow: "ガイドと過ごす一日", tourTitle: ["その体験が、", "旅そのものになる。"],
    tourBody: "東京または京都で、専属の全国通訳案内士と一日を過ごしていただけます。どのマスタークラスでも、一日の中心に据えて組み立てられます。",
    tourDetails: ["8時間", "貸切", "東京 / 京都"], tourCta: "プライベートツアーを見る",
    tourAlt: "伏見稲荷の参道に立つ朱塗りの鳥居と石灯籠",
    reviewEyebrow: "安心してお申し込みいただくために", reviewTitle: ["明快に予約する。", "一生おぼえている。"],
    reviewBody: "含まれるもの、集合場所、キャンセル規定は、お支払いの前にすべてお伝えします。体験後はすべてのお客様に投稿をお願いし、予約確認済みの方の声だけを、手を加えずに掲載します。",
    reviewPh: "ご参加者の声(予約確認済みの方のみ)", reviewPhSub: "届いた順にこちらへ掲載します。",
    closingP: "グループでのご旅行ですか。特別な一日をお考えですか。",
    closingTitle: ["あなたの物語に合わせて", "日本を組み立てます。"], closingCta: "貸切の体験を相談する",
  },
  fr: {
    heroEyebrow: "Expériences sélectionnées au Japon",
    themesH: "Trouvez votre Japon.",
    themes: [
      { t: "Cuisine et boissons", s: "Sushi / Cuisine / Saké", img: "/images/cat-sushi.jpg", mark: "食" },
      { t: "Arts et artisanat", s: "Calligraphie / Savoir-faire", img: "/images/craft-hands.jpg", mark: "技" },
      { t: "Tradition et culture", s: "Geiko / Cérémonie du thé / Kimono", img: "/images/geiko-dance.jpg", mark: "芸", href: "geisha" },
      { t: "Pop culture et beauté", s: "Nail art de personnages / Anime", img: "/images/cat-nail.jpg", mark: "爪" },
      { t: "Sport et plein air", s: "Golf / Sumo", img: "/images/cat-sumo.jpg", mark: "武" },
    ], comingSoon: "Bientôt",
    heroTitle: ["Ne vous contentez pas de voir le Japon.", "Entrez-y."],
    heroLede: "Découvrez le Japon à travers des expériences absentes des itinéraires classiques. De la cuisine et de l'artisanat à la pop culture et aux accès privés, chaque expérience est soigneusement sélectionnée.",
    heroCta: "Explorer les expériences", heroLink: "Parcourir par ville",
    heroBubble: "Ce n'est pas une démonstration —\ncette place est la vôtre.", heroSpeaker: "— votre hôte",
    trustEyebrow: "Pourquoi KAMEHAME", trustTitle: ["Le Japon,", "façon sélection."],
    trust: [
      { h: "Sélectionné, pas exhaustif.", p: "Nous ne listons pas tout. Nous choisissons des expériences qui valent vraiment votre temps au Japon." },
      { h: "Au plus près du vrai.", p: "Rencontrez les personnes derrière la culture, l'artisanat, la cuisine, l'art et les lieux qui vous ont fait venir au Japon — professionnels en activité ou spécialistes locaux." },
      { h: "Facile à réserver. Facile à comprendre.", p: "Prix clairs, inclusions claires, rendez-vous clair. Un accompagnement en anglais à chaque étape, avec guide-interprète inclus lorsque l'expérience le demande." },
    ],
    trustSeal: "Petits groupes · Hôtes locaux · Sélection soignée",
    craftQuote: "Ce n'est pas une démonstration — cette place est la vôtre.", craftSpeaker: "— votre hôte",
    craftAlt: "Hôtesse de cérémonie du thé posant un bol sur le tatami devant ses invités",
    cityEyebrow: "Choisissez votre ville", cityTitle: ["Deux villes.", "Des histoires sans fin."],
    cityLead: "Partez de là où vous serez, et découvrez les personnes et les métiers qui donnent son caractère à chaque lieu.",
    cityTaglines: { tokyo: ["Rythme moderne.", "Métier éternel."], kyoto: ["Rituels sereins.", "Héritage vivant."] },
    cityAlts: {
      tokyo: "Pagode à cinq étages du temple Senso-ji illuminée la nuit, Asakusa, Tokyo",
      kyoto: "Rue Yasaka-dori bordée de lanternes avec la pagode de Yasaka à l'aube, Higashiyama, Kyoto",
    },
    kicker: ["Explorer par envie", (n: number) => `${n} portes sur le Japon`], catTitle: "Suivez votre curiosité.",
    catTypes: { sushi: "Culture gastronomique", sumo: "Tradition vivante", "tea-ceremony": "Rituel attentif", kimono: "Métier et style", geisha: "Arts de la scène", swordsmith: "Métier ancestral", "anime-nail-art": "Pop culture" } as Record<string, string>,
    toursCard: { title: "Journées privées", type: "Sur mesure" },
    expEyebrow: "Trouvez votre Japon.", expTitle: ["Goûter. Créer.", "Rencontrer. Jouer."], expLink: "Voir toutes les expériences",
    featureEyebrow: "Réservations ouvertes", featureCta: "Voir l'expérience",
    tourEyebrow: "Journées privées avec guide", tourTitle: ["Laissez l'expérience", "devenir le voyage."],
    tourBody: "Passez une journée entière avec un guide privé agréé à Tokyo ou Kyoto. N'importe quelle masterclass peut être au cœur d'un parcours fait pour vous.",
    tourDetails: ["8 heures", "Groupe privé", "Tokyo / Kyoto"], tourCta: "Découvrir les journées privées",
    tourAlt: "Torii vermillon et lanterne de pierre sur une allée du sanctuaire Fushimi Inari",
    reviewEyebrow: "Confiance du voyageur", reviewTitle: ["Réservez en clarté.", "Souvenez-vous-en toute une vie."],
    reviewBody: "Chaque voyageur reçoit avant de payer ce que comprend l'expérience, le point de rendez-vous et les conditions d'annulation. Ensuite, chaque convive est invité à donner son avis — réservation confirmée uniquement, publié tel quel.",
    reviewPh: "Avis des convives, réservations confirmées uniquement", reviewPhSub: "Les premiers avis apparaîtront ici au fur et à mesure.",
    closingP: "Vous voyagez en groupe, ou vous rêvez de quelque chose d'unique ?",
    closingTitle: ["Nous façonnerons le Japon", "autour de votre histoire."], closingCta: "Planifier une expérience privée",
  },
  "zh-tw": {
    heroEyebrow: "精選的日本體驗",
    themesH: "找到你的日本。",
    themes: [
      { t: "美食與酒", s: "壽司 / 料理 / 日本酒", img: "/images/cat-sushi.jpg", mark: "食" },
      { t: "藝術與工藝", s: "書道 / 職人技藝", img: "/images/craft-hands.jpg", mark: "技" },
      { t: "傳統與文化", s: "藝妓 / 茶道 / 和服", img: "/images/geiko-dance.jpg", mark: "芸", href: "geisha" },
      { t: "流行文化與美容", s: "角色美甲 / 動漫", img: "/images/cat-nail.jpg", mark: "爪" },
      { t: "運動與戶外", s: "高爾夫 / 相撲", img: "/images/cat-sumo.jpg", mark: "武" },
    ], comingSoon: "即將推出",
    heroTitle: ["不只是看日本。", "走進去。"],
    heroLede: "透過一般行程找不到的體驗，認識日本。從美食、職人工藝到流行文化與私人通道，每一項體驗都經過精心挑選。",
    heroCta: "探索體驗", heroLink: "依城市瀏覽",
    heroBubble: "這不是示範——\n這個位子是您的。", heroSpeaker: "— 您的東道主",
    trustEyebrow: "為什麼選 KAMEHAME", trustTitle: ["精選，", "是體驗日本的方式。"],
    trust: [
      { h: "精選，而非無限。", p: "我們不會什麼都列。只挑選我們真心認為值得您在日本花時間的體驗。" },
      { h: "更貼近真實。", p: "認識文化、工藝、美食、藝術與場所背後的人——從現役專業人士到在地行家——正是您來日本的理由。" },
      { h: "好預約，也好懂。", p: "價格清楚、內容清楚、集合地點清楚。全程提供英語協助，需要口譯導遊的體驗皆已包含。" },
    ],
    trustSeal: "小團 · 在地接待 · 用心挑選",
    craftQuote: "這不是示範——這個位子是您的。", craftSpeaker: "— 您的東道主",
    craftAlt: "茶道主人在客人面前將茶碗放到榻榻米上",
    cityEyebrow: "選擇城市", cityTitle: ["兩座城市。", "說不完的故事。"],
    cityLead: "從您將停留的地方開始，認識賦予每個地方性格的人與技藝。",
    cityTaglines: { tokyo: ["現代的節奏。", "不變的手藝。"], kyoto: ["寧靜的儀式。", "活著的傳承。"] },
    cityAlts: {
      tokyo: "夜間點燈的淺草寺五重塔，東京淺草",
      kyoto: "黎明時分掛滿燈籠的八坂通與八坂塔，京都東山",
    },
    kicker: ["依興趣探索", (n: number) => `通往日本的 ${n} 扇門`], catTitle: "跟著好奇心走。",
    catTypes: { sushi: "飲食文化", sumo: "活的傳統", "tea-ceremony": "靜心儀式", kimono: "技藝與風格", geisha: "表演藝術", swordsmith: "古老技藝", "anime-nail-art": "流行文化" } as Record<string, string>,
    toursCard: { title: "私人一日遊", type: "量身安排" },
    expEyebrow: "找到你的日本。", expTitle: ["吃。做。", "見。玩。"], expLink: "查看所有體驗",
    featureEyebrow: "開放預約中", featureCta: "查看體驗",
    tourEyebrow: "與導遊共度的一天", tourTitle: ["讓體驗", "成為旅程本身。"],
    tourBody: "與私人持證導遊在東京或京都度過完整的一天。任何一堂大師課都可以成為專屬路線的核心。",
    tourDetails: ["8 小時", "私人團", "東京／京都"], tourCta: "探索私人一日遊",
    tourAlt: "伏見稻荷大社參道上的朱紅鳥居與石燈籠",
    reviewEyebrow: "旅客的信任", reviewTitle: ["清楚地預約。", "記住一輩子。"],
    reviewBody: "每位旅客在付款前都會收到體驗內容、集合地點與取消條款。體驗後我們邀請每位旅客評價——僅限已確認的預約，評價原文刊登。",
    reviewPh: "旅客評價，僅限已確認的預約", reviewPhSub: "最早的評價將依收到順序顯示於此。",
    closingP: "團體出遊，或想要獨一無二的一天？",
    closingTitle: ["我們依您的故事", "安排日本。"], closingCta: "洽詢私人體驗",
  },
} as const;

/** The home page's one-experience presentation: a full card with the facts a
 *  visitor decides on (where, how long, how many, from what price), used
 *  while the catalog holds a single bookable experience. */
function FeaturedExperience({ exp, lang, cityTitle, mark, eyebrow, cta }: {
  exp: Experience; lang: Lang; cityTitle?: string; mark: string; eyebrow: string; cta: string;
}) {
  const T = t(lang);
  const D = T.detail;
  const pricing = pricingFor(exp, lang);
  const first = pricing.rows[0];
  const perGroup = pricing.unit === "group";
  const avail = exp.availability;
  return (
    <Link className="feature-card" href={`/${lang}/${exp.city}/${exp.slug}/`}>
      <div className="feature-art">
        <img src={exp.img} alt={exp.alt} loading="lazy" />
        <span aria-hidden="true">{mark}</span>
        <small>{eyebrow}</small>
      </div>
      <div className="feature-copy">
        <p className="experience-city"><MapPin size={14} /> {cityTitle ?? exp.area} · {T.interpreterIncluded}</p>
        <h3>{exp.title}</h3>
        <RatingSummary experience={exp.slug} lang={lang} size={13} />
        <p>{exp.tagline}</p>
        <ul className="feature-facts">
          <li><Clock3 size={14} /> {exp.duration}</li>
          <li><Users size={14} /> {exp.group}</li>
          {avail && <li><CalendarDays size={14} /> {avail.daily ? D.availDaily : `${D.availStart} ${avail.startTimes[0]}–${avail.startTimes[avail.startTimes.length - 1]}`}</li>}
        </ul>
        <div className="feature-price">
          {perGroup ? (
            <b><small>{D.priceHeadline(first.party)[0]}</small>{yen(first.total)}<small>{D.priceHeadline(first.party)[1]}</small></b>
          ) : (
            <b><small>{T.from} </small>{exp.price}<small> {T.perPerson}</small></b>
          )}
          <p>{exp.includedShort ?? D.priceTotalNote}{exp.taxIncluded && ` · ${D.taxIncluded}`}</p>
        </div>
        <span className="feature-cta">{cta} <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}

export function HomePage({ lang }: { lang: Lang }) {
  const C = COPY[lang];
  const T = t(lang);
  const { cities, categories, experiences } = catalogFor(lang);
  const p = (path: string) => `/${lang}${path}`;
  // catalogFor() already withholds placeholders; the filter only matters
  // once they are published again and cards must carry "Coming soon".
  const live = experiences.filter(isLive);
  // One bookable experience is presented in full rather than as a grid of
  // one, and the city / interest sections only appear once there is a choice.
  const solo = live.length === 1 ? live[0] : undefined;
  const featured = (live.length >= 3 ? live : experiences).slice(0, 3);
  const heroHref = p("/experiences/");
  const heroCta = C.heroCta;
  const markFor = (e: Experience) => categories.find((c) => c.slug === e.category)?.mark ?? "";
  const cityTitle = (slug: string) => cities.find((c) => c.slug === slug)?.title;
  const journal = latestArticles(lang, 3);
  const quotes = featuredReviews(3);

  return (
    <main id="top" lang={lang}>
      <SiteHeader lang={lang} />

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> {C.heroEyebrow}</p>
          <h1 id="hero-heading">{C.heroTitle.map((part, i) => <span className="hl" key={i}>{part}{i < C.heroTitle.length - 1 ? " " : ""}</span>)}</h1>
          <p className="hero-lede">{C.heroLede}</p>
          <div className="hero-actions">
            <Button asChild size="lg"><Link href={heroHref}>{heroCta} <ArrowDownRight /></Link></Button>
          </div>
        </div>
      </section>

      <section className="themes-section" aria-labelledby="themes-heading">
        <h2 id="themes-heading">{C.themesH}</h2>
        <div className="themes-grid">
          {C.themes.map((th) => {
            const live = "href" in th && categories.some((c) => c.slug === th.href);
            const inner = (
              <>
                <img src={th.img} alt="" loading="lazy" />
                <span className="theme-mark" aria-hidden="true">{th.mark}</span>
                <span className="theme-copy"><b>{th.t}</b><small>{th.s}</small></span>
                {!live && <span className="theme-soon">{C.comingSoon}</span>}
              </>
            );
            return live
              ? <Link key={th.t} className="theme-card live" href={p(`/${(th as { href: string }).href}/`)}>{inner}</Link>
              : <div key={th.t} className="theme-card">{inner}</div>;
          })}
        </div>
      </section>

      <section className="trust-strip" id="approach" aria-label="Why choose us">
        <div className="trust-intro">
          <p className="eyebrow dark"><span /> {C.trustEyebrow}</p>
          <h2>{C.trustTitle[0]}<br />{C.trustTitle[1]}</h2>
        </div>
        <div className="trust-grid">
          {C.trust.map((item, i) => (
            <article key={item.h}><span>{String(i + 1).padStart(2, "0")}</span><h3>{item.h}</h3><p>{item.p}</p></article>
          ))}
        </div>
        <div className="trust-seal"><ShieldCheck size={18} /> {C.trustSeal}</div>
        <figure className="craft-band">
          <img src="/images/craft-hands.jpg" alt={C.craftAlt} loading="lazy" />
          <figcaption className="bubble tail-right craft-bubble">
            <p>&ldquo;{C.craftQuote}&rdquo;</p>
            <small>{C.craftSpeaker}</small>
          </figcaption>
        </figure>
      </section>

      {cities.length > 1 && (
        <section className="city-section" id="cities">
          <div className="section-heading">
            <p className="eyebrow dark"><span /> {C.cityEyebrow}</p>
            <h2>{C.cityTitle[0]}<br />{C.cityTitle[1]}</h2>
            <p>{C.cityLead}</p>
          </div>
          <div className="city-cards">
            {cities.map((city, i) => {
              const tag = C.cityTaglines[city.slug];
              return (
                <Link className={`city-card ${city.slug}`} href={p(`/${city.slug}/`)} key={city.slug} aria-label={city.title}>
                  <img className="city-photo" src={city.img} alt={C.cityAlts[city.slug]} loading="lazy" />
                  <span className="city-index">{String(i + 1).padStart(2, "0")} / {city.jp}</span>
                  <span className={`sfx ${city.slug === "kyoto" ? "quiet" : ""}`} aria-hidden="true">{city.slug === "tokyo" ? "ドドンッ" : "しん…"}</span>
                  <div>
                    <p>{tag[0]}<br />{tag[1]}</p><h3>{city.title}</h3>
                    <small className="city-place">{city.slug === "tokyo" ? "Sensō-ji · Asakusa" : "Yasaka-dōri · Higashiyama"}</small>
                  </div>
                  <span className="circle-arrow"><ArrowDownRight /></span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {categories.length > 1 && (
        <section className="category-section" aria-labelledby="category-heading">
          <div className="section-kicker"><span>{C.kicker[0]}</span><span>{C.kicker[1](categories.length + (TOURS_PUBLISHED ? 1 : 0))}</span></div>
          <h2 id="category-heading">{C.catTitle}</h2>
          <div className="category-grid">
            {categories.map((cat, index) => (
              <Link href={p(`/${cat.slug}/`)} className="category-card" key={cat.slug}>
                <img className="category-photo" src={cat.img} alt={cat.title} loading="lazy" />
                <span className="category-no">{String(index + 1).padStart(2, "0")}</span>
                <span className="category-mark" aria-hidden="true">{cat.mark}</span>
                <span className="category-label"><b>{cat.title}</b><small>{C.catTypes[cat.slug]}</small></span>
                <ArrowDownRight size={18} />
              </Link>
            ))}
            {TOURS_PUBLISHED && (
              <Link href={p("/tours/")} className="category-card" key="tours">
                <img className="category-photo" src="/images/cat-tours.jpg" alt={C.toursCard.title} loading="lazy" />
                <span className="category-no">{String(categories.length + 1).padStart(2, "0")}</span>
                <span className="category-mark" aria-hidden="true">旅</span>
                <span className="category-label"><b>{C.toursCard.title}</b><small>{C.toursCard.type}</small></span>
                <ArrowDownRight size={18} />
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="experiences-section" id="experiences">
        <div className="section-heading horizontal">
          <div><p className="eyebrow"><span /> {solo ? C.featureEyebrow : C.expEyebrow}</p><h2>{C.expTitle[0]}<br />{C.expTitle[1]}</h2></div>
          {!solo && <Link className="underlined-link" href={p("/experiences/")}>{C.expLink} <ArrowRight /></Link>}
        </div>
        {solo ? (
          <FeaturedExperience exp={solo} lang={lang} cityTitle={cityTitle(solo.city)} mark={markFor(solo)} eyebrow={C.featureEyebrow} cta={C.featureCta} />
        ) : (
          <div className="experience-grid">
            {featured.map((item, i) => (
              <Link className="experience-card" href={p(`/${item.city}/${item.slug}/`)} key={item.slug}>
                <div className="experience-art">
                  <img src={item.img} alt={item.alt} loading="lazy" />
                  {!isLive(item) && <span className="soon-badge">{T.comingSoon}</span>}
                  <span aria-hidden="true">{markFor(item)}</span>
                  <small>{String(i + 1).padStart(2, "0")}</small>
                </div>
                <div className="experience-copy">
                  <p className="experience-city"><MapPin size={14} /> {cityTitle(item.city)} · {T.interpreterIncluded}</p>
                  <h3>{item.title}</h3>
                  <p>{item.tagline}</p>
                  <div className="experience-meta"><span><Clock3 size={14} /> {item.duration}</span><span>{T.from} <b>{item.price}</b> {item.priceUnit === "group" ? T.perGroupShort : T.perPerson}</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {TOURS_PUBLISHED && (
      <section className="tour-section" id="tours">
        <div className="tour-monogram">
          <img src="/images/tour-journey.jpg" alt={C.tourAlt} loading="lazy" />
          <span aria-hidden="true">旅</span>
        </div>
        <div className="tour-copy">
          <p className="eyebrow"><span /> {C.tourEyebrow}</p>
          <h2>{C.tourTitle[0]}<br />{C.tourTitle[1]}</h2>
          <p>{C.tourBody}</p>
          <div className="tour-details">{C.tourDetails.map((d) => <span key={d}>{d}</span>)}</div>
          <Button asChild variant="outline"><Link href={p("/tours/")}>{C.tourCta} <ArrowRight /></Link></Button>
        </div>
      </section>
      )}

      {journal.length > 0 && (
        <section className="journal-section">
          <div className="section-heading horizontal">
            <div>
              <p className="eyebrow"><span /> {T.journalHomeEyebrow}</p>
              <h2>{T.journalHomeTitle}</h2>
            </div>
            <Link className="underlined-link" href={p("/journal/")}>{T.journalAll} <ArrowRight /></Link>
          </div>
          <div className="journal-grid home">
            {journal.map((a) => (
              <Link className="journal-card" key={a.slug} href={p(`/journal/${a.slug}/`)}>
                <img src={a.img} alt={a.alt} loading="lazy" />
                <div>
                  <p className="journal-meta">{articleDate(a.date, lang)} · {T.readMinutes(a.minutes)}</p>
                  <h3>{a.copy[lang]!.title}</h3>
                  <p>{a.copy[lang]!.standfirst}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="review-section">
        <p className="eyebrow dark"><span /> {C.reviewEyebrow}</p>
        <div className="review-layout">
          <h2>{C.reviewTitle[0]}<br />{C.reviewTitle[1]}</h2>
          <div className="review-copy">
            <p>{C.reviewBody}</p>
            {quotes.length > 0 ? (
              <div className="home-quotes">
                {quotes.map((r) => (
                  <blockquote key={r.id}>
                    <Stars rating={r.rating} size={13} />
                    <p>{r.body}</p>
                    <footer><b>{r.author}</b> · {r.country} · <span>{r.source === "venue" ? T.reviewVenueGuest : T.reviewVerified}</span></footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <div className="review-placeholder"><ShieldCheck /><span><b>{C.reviewPh}</b><small>{C.reviewPhSub}</small></span></div>
            )}
          </div>
        </div>
      </section>

      <section className="closing-section" id="contact">
        <p>{C.closingP}</p>
        <h2>{C.closingTitle[0]}<br />{C.closingTitle[1]}</h2>
        <Button asChild size="lg"><Link href={p("/contact/")}>{C.closingCta} <ArrowDownRight /></Link></Button>
      </section>

      <SiteFooter lang={lang} />
    </main>
  );
}
