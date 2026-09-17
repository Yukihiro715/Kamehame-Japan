// Resolves a /{lang}/{collection}/ slug (city, category, tours, experiences)
// into everything the shared listing template needs, in the given language.

import {
  cancellationFor, catalogFor, cityBySlug,
  isLive, TOURS_PUBLISHED, type Experience, type Tour,
} from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

export interface ListingItem {
  kind: "experience" | "tour";
  /** Catalog slug, so a card can look up its own rating. */
  slug: string;
  /** False for placeholder experiences that no venue has signed for yet. */
  live: boolean;
  unit: "person" | "group";
  href: string;
  img: string;
  alt: string;
  tags: string[];
  title: string;
  line: string;
  meta: string;
  price: string;
}

export interface Faq { q: string; a: string }

export interface Collection {
  slug: string;
  crumb: string;
  h1: string;
  heroImg: string;
  heroAlt: string;
  lead: string;
  items: ListingItem[];
  refine: { label: string; href: string }[];
  about: { heading: string; body: string };
  faq: Faq[];
  explore: { label: string; href: string }[];
}

interface CollectionStrings {
  cityH1: (city: string) => string;
  catH1: (cat: string, where: string) => string;
  toursH1: string;
  allH1: string;
  toursCrumb: string;
  allCrumb: string;
  guidedTours: string;
  allExperiences: string;
  privateTag: string;
  smallGroupTag: string;
  tourTag: string;
  cityAboutH: (city: string) => string;
  cityAbout: (city: string) => string;
  cityFaqQ: (city: string) => string;
  cityFaqA: (city: string, area: string) => string;
  catAboutH: (cat: string) => string;
  catAbout: string;
  catFaqQ: string;
  catFaqA: string;
  toursLead: string;
  toursAboutH: string;
  toursAbout: string;
  toursFaqQ: string;
  toursFaqA: string;
  allLead: string;
  allAboutH: string;
  allAbout: string;
  allFaqQ: string;
  allFaqA: string;
  faqGuideQ: string; faqGuideA: string;
  faqBookQ: string; faqBookA: string;
  faqCancelQ: string;
  cityStreet: (city: string) => string;
  toursHeroAlt: string;
  allHeroAlt: string;
}

const STR: Record<Lang, CollectionStrings> = {
  en: {
    cityH1: (c) => `${c} masterclasses`,
    catH1: (cat, where) => `${cat} experiences in ${where}`,
    toursH1: "Private guided tours",
    allH1: "All experiences",
    toursCrumb: "Guided tours",
    allCrumb: "Experiences",
    guidedTours: "Guided tours",
    allExperiences: "All experiences",
    privateTag: "Private", smallGroupTag: "Small group", tourTag: "Tour",
    cityAboutH: (c) => `About our ${c} experiences`,
    cityAbout: (c) => `Each ${c} experience is hosted by the practitioners themselves, in the rooms where they actually work — never a set built for tour groups. Groups stay small, a private interpreter guide is always included, and venue names and exact addresses are shared once your booking is confirmed, out of respect for our partners' daily work.`,
    cityFaqQ: (c) => `Where in ${c} do the experiences take place?`,
    cityFaqA: (c, area) => `Each listing shows its general area (for example “${area}”). The exact address follows in your confirmation email — our partners' venues are working businesses, so we share precise locations only with confirmed guests.`,
    catAboutH: (cat) => `About ${cat.toLowerCase()} experiences`,
    catAbout: "These evenings and sessions are hosted by working practitioners, not presenters, and sized so they can actually give you their attention. Your private interpreter guide is part of every booking — from the first email to the final goodbye — and prices are shown “from ¥” for the group size stated, paid securely in yen.",
    catFaqQ: "Do I need any experience to join?",
    catFaqA: "No. Every session is designed for first-timers and adapted to you on the day; the master sets the pace and your guide keeps instruction clear. Where a minimum age applies, it is shown on the experience page.",
    toursLead: "A full day in Tokyo or Kyoto with a private licensed guide, planned around your interests. Any of our masterclasses can sit at the heart of the route — the tour handles everything around it: timing, transport, tables and the stories in between.",
    toursAboutH: "About our private tours",
    toursAbout: "Tours are operated with our licensed tour operations partner. Your guide is nationally licensed, the day is planned for your group alone, and routes flex on the day — linger where you are absorbed, skip what you have already seen. Combine a tour with a masterclass to turn one booking into a complete day.",
    toursFaqQ: "Can a tour include one of the masterclasses?",
    toursFaqA: "Yes — that is the recommended way to book. Tell us which experience you want at the centre of the day and the route is built around its schedule.",
    allLead: "Private cultural experiences led by the practitioners themselves, with your own interpreter guide at your side. Every date is confirmed with the venue before you pay.",
    allAboutH: "About KAMEHAME JAPAN experiences",
    allAbout: "We work directly with a small number of hosts and masters, and keep every group small enough to sit at their side. You send us a date, we confirm it with the venue, and only then do you pay — online, in yen. Venue details follow your confirmation.",
    allFaqQ: "How do I choose?",
    allFaqA: "Every experience page shows what is included, the price for your group size, when it runs and how the booking works. If you are unsure whether it fits your trip, send an enquiry with your dates and we will tell you honestly.",
    faqGuideQ: "Is an interpreter guide included?",
    faqGuideA: "Yes. Every experience and tour includes a private interpreter guide who accompanies you throughout, so nothing the master says — or that you want to ask — is lost.",
    faqBookQ: "How do I book and pay?",
    faqBookA: "Send a request with your preferred date and group size. We confirm the date with the venue — usually within 24 hours — and send you a secure payment link in Japanese yen (card or bank transfer). Your booking is final once payment arrives, and the meeting details follow by email.",
    faqCancelQ: "What is the cancellation policy?",
    cityStreet: (c) => `${c} street scene`,
    toursHeroAlt: "Path through the Arashiyama bamboo grove",
    allHeroAlt: "A private tatami room in Kyoto opening onto a small garden",
  },
  es: {
    cityH1: (c) => `Clases magistrales en ${c}`,
    catH1: (cat, where) => `${cat} en ${where}`,
    toursH1: "Tours privados con guía",
    allH1: "Todas las experiencias",
    toursCrumb: "Tours guiados",
    allCrumb: "Experiencias",
    guidedTours: "Tours guiados",
    allExperiences: "Todas las experiencias",
    privateTag: "Privado", smallGroupTag: "Grupo reducido", tourTag: "Tour",
    cityAboutH: (c) => `Sobre nuestras experiencias en ${c}`,
    cityAbout: (c) => `Cada experiencia en ${c} la acogen los propios profesionales, en los espacios donde realmente trabajan — nunca un decorado montado para grupos turísticos. Los grupos son reducidos, el guía intérprete privado siempre está incluido, y el nombre y la dirección exacta del local se comparten al confirmar la reserva, por respeto al trabajo diario de nuestros socios.`,
    cityFaqQ: (c) => `¿En qué parte de ${c} se celebran las experiencias?`,
    cityFaqA: (c, area) => `Cada ficha muestra su zona general (por ejemplo, «${area}»). La dirección exacta llega en el email de confirmación — los locales de nuestros socios son negocios en activo, así que solo compartimos la ubicación precisa con reservas confirmadas.`,
    catAboutH: (cat) => `Sobre las experiencias de ${cat.toLowerCase()}`,
    catAbout: "Estas veladas y sesiones las acogen profesionales en activo, no presentadores, con grupos pensados para que puedan dedicarte atención de verdad. Tu guía intérprete privado forma parte de cada reserva — del primer email a la despedida — y los precios se muestran «desde ¥» para el tamaño de grupo indicado, con pago seguro en yenes.",
    catFaqQ: "¿Necesito experiencia previa para participar?",
    catFaqA: "No. Cada sesión está pensada para principiantes y se adapta a ti sobre la marcha; el maestro marca el ritmo y tu guía mantiene las instrucciones claras. Si hay edad mínima, aparece en la página de la experiencia.",
    toursLead: "Un día completo en Tokio o Kioto con un guía privado titulado, planificado según tus intereses. Cualquiera de nuestras clases magistrales puede ser el corazón de la ruta — el tour resuelve todo lo demás: horarios, transporte, mesas y las historias entre medias.",
    toursAboutH: "Sobre nuestros tours privados",
    toursAbout: "Los tours se operan con nuestro socio operador titulado. Tu guía cuenta con licencia nacional, el día se planifica solo para tu grupo y la ruta se adapta sobre la marcha — quédate donde algo te absorba, sáltate lo que ya conozcas. Combina un tour con una clase magistral y convierte una reserva en un día completo.",
    toursFaqQ: "¿Puede un tour incluir una de las clases magistrales?",
    toursFaqA: "Sí — es la forma recomendada de reservar. Dinos qué experiencia quieres en el centro del día y construimos la ruta alrededor de su horario.",
    allLead: "Experiencias culturales privadas dirigidas por los propios maestros, con tu guía intérprete a tu lado. Cada fecha se confirma con el lugar antes de pagar.",
    allAboutH: "Sobre las experiencias de KAMEHAME JAPAN",
    allAbout: "Trabajamos directamente con un número reducido de anfitriones y maestros, y mantenemos cada grupo lo bastante pequeño para sentarte a su lado. Nos envías una fecha, la confirmamos con el lugar y solo entonces pagas — online, en yenes. Los datos del local llegan con tu confirmación.",
    allFaqQ: "¿Cómo elijo?",
    allFaqA: "Cada página de experiencia muestra qué incluye, el precio para tu grupo, cuándo se celebra y cómo funciona la reserva. Si dudas de si encaja en tu viaje, envíanos una consulta con tus fechas y te lo diremos con franqueza.",
    faqGuideQ: "¿Está incluido el guía intérprete?",
    faqGuideA: "Sí. Cada experiencia y tour incluye un guía intérprete privado que te acompaña en todo momento, para que nada de lo que diga el maestro — ni nada de lo que quieras preguntar — se pierda.",
    faqBookQ: "¿Cómo reservo y pago?",
    faqBookA: "Envía una solicitud con tu fecha preferida y el tamaño del grupo. Confirmamos la fecha con el lugar — normalmente en 24 horas — y te enviamos un enlace de pago seguro en yenes (tarjeta o transferencia). La reserva es firme cuando llega el pago, y el punto de encuentro te llega por email.",
    faqCancelQ: "¿Cuál es la política de cancelación?",
    cityStreet: (c) => `Escena urbana de ${c}`,
    toursHeroAlt: "Sendero del bosque de bambú de Arashiyama",
    allHeroAlt: "Una sala privada de tatami en Kioto abierta a un pequeño jardín",
  },
  ja: {
    cityH1: (c) => `${c}のマスタークラス`,
    catH1: (cat, where) => `${where}の${cat}体験`,
    toursH1: "プライベートガイドツアー",
    allH1: "すべての体験",
    toursCrumb: "ガイド付きツアー",
    allCrumb: "体験一覧",
    guidedTours: "ガイド付きツアー",
    allExperiences: "すべての体験",
    privateTag: "貸切", smallGroupTag: "少人数", tourTag: "ツアー",
    cityAboutH: (c) => `${c}の体験について`,
    cityAbout: (c) => `${c}の体験はいずれも、その道の方が日々仕事をしている場所そのもので行います。団体客向けに設えた舞台ではありません。人数は少なく保ち、通訳ガイドが必ず同行します。受け入れ先の日々の営みに配慮し、店名と正確な住所はご予約確定後にお伝えしています。`,
    cityFaqQ: (c) => `${c}のどのあたりで行われますか。`,
    cityFaqA: (c, area) => `各ページにおおよその地域を記載しています(例:「${area}」)。正確な住所は確定メールでお送りします。受け入れ先はいずれも営業中の事業者のため、詳しい場所はご予約が確定した方にのみお伝えしています。`,
    catAboutH: (cat) => `${cat}の体験について`,
    catAbout: "いずれも、説明役ではなく現役のその道の方が直接もてなします。人数は、一人ひとりに目が届く規模に抑えています。通訳ガイドは最初のご連絡から最後のお見送りまで同行し、料金は記載の人数での「¥〜」表示、日本円でのお支払いです。",
    catFaqQ: "経験がなくても参加できますか。",
    catFaqA: "はい。いずれも初めての方を前提に組み立てており、当日その方に合わせて進めます。ペースは師が決め、通訳ガイドが説明を分かりやすく保ちます。年齢制限がある場合は各ページに記載しています。",
    toursLead: "東京または京都を、専属の全国通訳案内士と一日かけて巡ります。マスタークラスを一日の中心に据えることもでき、その周りの時間割・移動・食事はすべてツアー側で整えます。",
    toursAboutH: "プライベートツアーについて",
    toursAbout: "ツアーは旅行手配の提携先とともに運行します。ガイドは国家資格を持ち、その日はお客様のグループだけのために組み立てます。ルートは当日も調整可能です。マスタークラスと組み合わせれば、一度のご予約で一日が完結します。",
    toursFaqQ: "ツアーにマスタークラスを組み込めますか。",
    toursFaqA: "はい。むしろその形をおすすめしています。一日の中心に据えたい体験をお知らせいただければ、その時間割に合わせてルートを組み立てます。",
    allLead: "作り手本人が直接もてなす貸切の文化体験。通訳ガイドが同行します。日程は受け入れ先に確認してからお支払いいただきます。",
    allAboutH: "KAMEHAME JAPAN の体験について",
    allAbout: "限られた数の受け入れ先と直接お付き合いし、隣に座って過ごせる人数を保っています。ご希望日をお送りいただき、受け入れ先に確認が取れてからお支払い(オンライン・日本円)。会場の詳細は確定後にお送りします。",
    allFaqQ: "どう選べばよいですか。",
    allFaqA: "各体験ページに、含まれるもの、人数ごとの料金、開催日時、予約の流れを載せています。ご旅程に合うか迷われたら、日程を添えてお問い合わせください。率直にお答えします。",
    faqGuideQ: "通訳ガイドは含まれますか。",
    faqGuideA: "はい。すべての体験とツアーに通訳ガイドが同行し、最後までご一緒します。師の言葉も、お客様が尋ねたいことも、取りこぼしません。",
    faqBookQ: "予約と支払いはどうすればよいですか。",
    faqBookA: "ご希望日と人数を添えてリクエストをお送りください。受け入れ先に確認のうえ(通常24時間以内)、日本円の安全な決済リンク(カードまたは銀行振込)をお送りします。ご入金をもって予約確定となり、集合場所のご案内をメールでお送りします。",
    faqCancelQ: "キャンセル規定を教えてください。",
    cityStreet: (c) => `${c}の街並み`,
    toursHeroAlt: "嵐山の竹林の小径",
    allHeroAlt: "小さな庭に面した京都の貸切座敷",
  },
  fr: {
    cityH1: (c) => `Masterclasses à ${c}`,
    catH1: (cat, where) => `${cat} à ${where}`,
    toursH1: "Journées privées avec guide",
    allH1: "Toutes les expériences",
    toursCrumb: "Journées guidées",
    allCrumb: "Expériences",
    guidedTours: "Journées guidées",
    allExperiences: "Toutes les expériences",
    privateTag: "Privé", smallGroupTag: "Petit groupe", tourTag: "Journée",
    cityAboutH: (c) => `À propos de nos expériences à ${c}`,
    cityAbout: (c) => `Chaque expérience à ${c} est accueillie par les praticiens eux-mêmes, dans les lieux où ils travaillent réellement — jamais un décor conçu pour les groupes de touristes. Les groupes restent petits, un guide-interprète privé est toujours inclus, et les noms des lieux et adresses exactes sont communiqués une fois votre réservation confirmée, par respect pour le travail quotidien de nos partenaires.`,
    cityFaqQ: (c) => `Où se déroulent les expériences à ${c} ?`,
    cityFaqA: (c, area) => `Chaque fiche indique son secteur général (par exemple « ${area} »). L'adresse exacte suit dans votre e-mail de confirmation — les lieux de nos partenaires sont des commerces en activité, nous ne partageons donc les adresses précises qu'avec les voyageurs confirmés.`,
    catAboutH: (cat) => `À propos des expériences ${cat.toLowerCase()}`,
    catAbout: "Ces soirées et séances sont accueillies par des praticiens en activité, pas par des présentateurs, et dimensionnées pour qu'ils puissent réellement s'occuper de vous. Votre guide-interprète privé fait partie de chaque réservation — du premier e-mail au dernier au revoir — et les prix sont indiqués « dès ¥ » pour la taille de groupe précisée, réglés en toute sécurité en yens.",
    catFaqQ: "Faut-il de l'expérience pour participer ?",
    catFaqA: "Non. Chaque séance est conçue pour les débutants et adaptée à vous le jour même ; le maître donne le rythme et votre guide garde les explications claires. Lorsqu'un âge minimum s'applique, il est indiqué sur la page de l'expérience.",
    toursLead: "Une journée entière à Tokyo ou Kyoto avec un guide privé agréé, planifiée autour de vos centres d'intérêt. N'importe laquelle de nos masterclasses peut être au cœur du parcours — la journée s'occupe de tout le reste : horaires, trajets, tables et histoires entre deux.",
    toursAboutH: "À propos de nos journées privées",
    toursAbout: "Les journées sont exploitées avec notre partenaire agréé. Votre guide est agréé au niveau national, la journée est planifiée pour votre groupe seul, et le parcours s'adapte sur place. Associez une journée à une masterclass pour faire d'une réservation une journée complète.",
    toursFaqQ: "Une journée peut-elle inclure une masterclass ?",
    toursFaqA: "Oui — c'est la façon recommandée de réserver. Dites-nous quelle expérience vous voulez au centre de la journée et le parcours est construit autour de son horaire.",
    allLead: "Des expériences culturelles privées menées par les praticiens eux-mêmes, avec votre guide-interprète à vos côtés. Chaque date est confirmée avec le lieu avant tout paiement.",
    allAboutH: "À propos des expériences KAMEHAME JAPAN",
    allAbout: "Nous travaillons directement avec un petit nombre d'hôtes et de maîtres, et gardons chaque groupe assez petit pour s'asseoir à leurs côtés. Vous nous envoyez une date, nous la confirmons avec le lieu, et vous ne payez qu'ensuite — en ligne, en yens. Les coordonnées du lieu suivent votre confirmation.",
    allFaqQ: "Comment choisir ?",
    allFaqA: "Chaque page d'expérience indique ce qui est inclus, le prix pour votre groupe, quand elle a lieu et comment fonctionne la réservation. Si vous hésitez, envoyez-nous une demande avec vos dates et nous vous répondrons franchement.",
    faqGuideQ: "Un guide-interprète est-il inclus ?",
    faqGuideA: "Oui. Chaque expérience inclut un guide-interprète privé qui vous accompagne d'un bout à l'autre, pour que rien de ce que dit le maître — ni de ce que vous voulez demander — ne se perde.",
    faqBookQ: "Comment réserver et payer ?",
    faqBookA: "Envoyez une demande avec votre date souhaitée et la taille du groupe. Nous confirmons la date avec le lieu — généralement sous 24 heures — puis vous envoyons un lien de paiement sécurisé en yens (carte ou virement). La réservation est ferme à réception du paiement, et les détails du rendez-vous suivent par e-mail.",
    faqCancelQ: "Quelle est la politique d'annulation ?",
    cityStreet: (c) => `Scène de rue à ${c}`,
    toursHeroAlt: "Allée dans la bambouseraie d'Arashiyama",
    allHeroAlt: "Une salle privée en tatami à Kyoto ouvrant sur un petit jardin",
  },
  "zh-tw": {
    cityH1: (c) => `${c}大師課`,
    catH1: (cat, where) => `${where}的${cat}體驗`,
    toursH1: "私人導覽一日遊",
    allH1: "所有體驗",
    toursCrumb: "導覽行程",
    allCrumb: "體驗",
    guidedTours: "導覽行程",
    allExperiences: "所有體驗",
    privateTag: "包場", smallGroupTag: "小團", tourTag: "行程",
    cityAboutH: (c) => `關於我們的${c}體驗`,
    cityAbout: (c) => `每一項${c}體驗都由職人本人接待，就在他們平日工作的場所——絕非為觀光團佈置的舞台。團體人數保持精簡，一律含專屬口譯導遊，場地名稱與確切地址於預約確認後告知，以尊重合作夥伴的日常工作。`,
    cityFaqQ: (c) => `體驗在${c}的哪裡進行？`,
    cityFaqA: (c, area) => `每個頁面都標示大致區域（例如「${area}」）。確切地址將隨確認信寄出——合作場地都是營業中的店家，因此只向已確認的旅客提供詳細位置。`,
    catAboutH: (cat) => `關於${cat}體驗`,
    catAbout: "這些體驗由現役職人親自接待，而非解說員，人數也控制在他們真的能照顧到每位客人的規模。專屬口譯導遊是每筆預約的一部分——從第一封信到最後道別——價格以所示人數的「¥ 起」標示，以日圓安全付款。",
    catFaqQ: "沒有經驗也能參加嗎？",
    catFaqA: "可以。每堂課都為初學者設計，並在當天依您調整；師傅掌握步調，導遊確保說明清楚。若有年齡下限，會標示在體驗頁面。",
    toursLead: "與私人持證導遊在東京或京都度過完整的一天，依您的興趣規劃。任何一堂大師課都可以是路線的核心——其餘的時間、交通、餐廳與沿途故事都由行程安排。",
    toursAboutH: "關於私人一日遊",
    toursAbout: "行程與我們的持證合作夥伴共同執行。導遊具全國資格，一天只為您的團體規劃，路線可於當日調整。將一日遊與大師課搭配，一次預約即成完整的一天。",
    toursFaqQ: "一日遊可以包含大師課嗎？",
    toursFaqA: "可以——這正是我們推薦的預約方式。告訴我們您想以哪項體驗為一天的核心，路線就會依它的時間安排。",
    allLead: "由職人親自帶領的私人文化體驗，您的專屬口譯導遊全程隨行。每個日期都會先與場地確認，再請您付款。",
    allAboutH: "關於 KAMEHAME JAPAN 的體驗",
    allAbout: "我們直接與少數幾位接待方與師傅合作，並將每個團體保持在能坐在他們身旁的規模。您先告訴我們日期，我們與場地確認後，您才需要付款——線上、以日圓。場地資訊於確認後寄出。",
    allFaqQ: "該怎麼選？",
    allFaqA: "每個體驗頁面都列出包含內容、您人數的價格、舉辦時間與預約流程。若不確定是否適合您的行程，請附上日期向我們詢問，我們會誠實回答。",
    faqGuideQ: "是否包含口譯導遊？",
    faqGuideA: "是。每項體驗都包含全程陪同的專屬口譯導遊，師傅說的話、您想問的問題，一句都不會漏掉。",
    faqBookQ: "如何預約與付款？",
    faqBookA: "請附上希望日期與人數送出申請。我們與場地確認日期（通常 24 小時內）後，寄給您日圓的安全付款連結（信用卡或銀行轉帳）。收到款項即預約確定，集合資訊將以電子郵件寄出。",
    faqCancelQ: "取消政策是什麼？",
    cityStreet: (c) => `${c}街景`,
    toursHeroAlt: "嵐山竹林小徑",
    allHeroAlt: "面向小庭園的京都私人榻榻米包廂",
  },
};

export function getCollection(slug: string, lang: Lang = "en"): Collection | undefined {
  const S = STR[lang];
  const { cities, categories, experiences, tours } = catalogFor(lang);
  const p = (path: string) => `/${lang}${path}`;

  const cityTitle = (citySlug: string) => cityBySlug(citySlug, lang)?.title ?? citySlug;
  const catBySlug = (c: string) => categories.find((x) => x.slug === c);

  const expItem = (e: Experience): ListingItem => ({
    kind: "experience", slug: e.slug, live: isLive(e), unit: e.priceUnit ?? "person", href: p(`/${e.city}/${e.slug}/`), img: e.img, alt: e.alt,
    tags: [catBySlug(e.category)?.tag ?? "", e.group.startsWith("Priva") || e.group.startsWith("Private") ? S.privateTag : S.smallGroupTag].filter(Boolean),
    title: e.title, line: e.tagline,
    meta: `${cityTitle(e.city)} · ${e.duration}`, price: e.price,
  });
  const tourItem = (tr: Tour): ListingItem => ({
    kind: "tour", slug: tr.slug, live: false, unit: "group", href: p(`/tours/${tr.slug}/`), img: tr.img, alt: tr.alt,
    tags: [S.tourTag, S.privateTag],
    title: tr.title, line: tr.tagline,
    meta: `${cityTitle(tr.city)} · ${tr.duration}`, price: tr.price,
  });

  const FAQ_GUIDE: Faq = { q: S.faqGuideQ, a: S.faqGuideA };
  const FAQ_BOOK: Faq = { q: S.faqBookQ, a: S.faqBookA };
  const FAQ_CANCEL: Faq = { q: S.faqCancelQ, a: cancellationFor(lang) };

  const city = cities.find((c) => c.slug === slug);
  if (city) {
    const exps = experiences.filter((e) => e.city === city.slug);
    const cityTours = tours.filter((tr) => tr.city === city.slug);
    const catLinks = [...new Set(exps.map((e) => e.category))]
      .map((c) => catBySlug(c)!)
      .map((c) => ({ label: c.title, href: p(`/${c.slug}/`) }));
    const other = cities.find((c) => c.slug !== city.slug);
    return {
      slug, crumb: city.title, h1: S.cityH1(city.title),
      heroImg: city.img, heroAlt: S.cityStreet(city.title), lead: city.lead,
      items: [...exps.map(expItem), ...cityTours.map(tourItem)],
      refine: catLinks,
      about: { heading: S.cityAboutH(city.title), body: S.cityAbout(city.title) },
      faq: [{ q: S.cityFaqQ(city.title), a: S.cityFaqA(city.title, exps[0]?.area ?? "") }, FAQ_GUIDE, FAQ_CANCEL],
      explore: [
        ...(other ? [{ label: other.title, href: p(`/${other.slug}/`) }] : []),
        ...catLinks.slice(0, 3),
        ...(TOURS_PUBLISHED ? [{ label: S.guidedTours, href: p("/tours/") }] : []),
      ],
    };
  }

  const cat = catBySlug(slug);
  if (cat) {
    const exps = experiences.filter((e) => e.category === cat.slug);
    const cityLinks = [...new Set(exps.map((e) => e.city))].map((c) => ({ label: cityTitle(c), href: p(`/${c}/`) }));
    const others = categories.filter((c) => c.slug !== cat.slug).slice(0, 3)
      .map((c) => ({ label: c.title, href: p(`/${c.slug}/`) }));
    const where = cityLinks.map((c) => c.label).join(lang === "es" ? " y " : " & ");
    return {
      slug, crumb: cat.title, h1: S.catH1(cat.title, where),
      heroImg: cat.img, heroAlt: cat.title, lead: cat.lead,
      items: exps.map(expItem),
      refine: cityLinks,
      about: { heading: S.catAboutH(cat.title), body: S.catAbout },
      faq: [{ q: S.catFaqQ, a: S.catFaqA }, FAQ_GUIDE, FAQ_BOOK],
      explore: [...cityLinks, ...others, ...(TOURS_PUBLISHED ? [{ label: S.guidedTours, href: p("/tours/") }] : [])],
    };
  }

  if (slug === "tours" && TOURS_PUBLISHED) {
    return {
      slug, crumb: S.toursCrumb, h1: S.toursH1,
      heroImg: "/images/cat-tours.jpg", heroAlt: S.toursHeroAlt,
      lead: S.toursLead,
      items: [...tours.map(tourItem), ...experiences.slice(0, 3).map(expItem)],
      refine: cities.map((c) => ({ label: c.title, href: p(`/${c.slug}/`) })),
      about: { heading: S.toursAboutH, body: S.toursAbout },
      faq: [{ q: S.toursFaqQ, a: S.toursFaqA }, FAQ_GUIDE, FAQ_CANCEL],
      explore: [
        ...cities.map((c) => ({ label: c.title, href: p(`/${c.slug}/`) })),
        { label: S.allExperiences, href: p("/experiences/") },
      ],
    };
  }

  if (slug === "experiences") {
    return {
      slug, crumb: S.allCrumb, h1: S.allH1,
      heroImg: "/images/geiko-room-garden.jpg", heroAlt: S.allHeroAlt,
      lead: S.allLead,
      items: [...experiences.map(expItem), ...tours.map(tourItem)],
      refine: [
        ...cities.map((c) => ({ label: c.title, href: p(`/${c.slug}/`) })),
        ...categories.map((c) => ({ label: c.title, href: p(`/${c.slug}/`) })),
      ],
      about: { heading: S.allAboutH, body: S.allAbout },
      faq: [{ q: S.allFaqQ, a: S.allFaqA }, FAQ_GUIDE, FAQ_CANCEL],
      explore: [
        ...cities.map((c) => ({ label: c.title, href: p(`/${c.slug}/`) })),
        ...(TOURS_PUBLISHED ? [{ label: S.guidedTours, href: p("/tours/") }] : []),
      ],
    };
  }

  return undefined;
}

// Only cities and categories with something to list get a page; the catalog
// already drops the rest while placeholders are unpublished (lib/catalog.ts).
const { cities: listedCities, categories: listedCategories } = catalogFor("en");
export const collectionSlugs = [
  ...listedCities.map((c) => c.slug),
  ...listedCategories.map((c) => c.slug),
  ...(TOURS_PUBLISHED ? ["tours"] : []),
  "experiences",
];
