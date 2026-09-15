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
    cityAbout: (c) => `Each ${c} experience is hosted by the practitioner in their own working space — a counter, a stable, a studio, a forge — never a classroom set. Groups stay small, a private interpreter guide is always included, and venue names and exact addresses are shared once your booking is confirmed, out of respect for our partners' daily work.`,
    cityFaqQ: (c) => `Where in ${c} do the experiences take place?`,
    cityFaqA: (c, area) => `Each listing shows its general area (for example “${area}”). The exact address follows in your confirmation email — our partners' venues are working businesses, so we share precise locations only with confirmed guests.`,
    catAboutH: (cat) => `About ${cat.toLowerCase()} experiences`,
    catAbout: "These sessions are led by working practitioners, not presenters, and sized so the master can actually teach you. Your private interpreter guide is part of every booking — from the first email to the final goodbye — and prices are shown “from ¥” per person, paid securely in yen.",
    catFaqQ: "Do I need any experience to join?",
    catFaqA: "No. Every session is designed for first-timers and adapted to you on the day; the master sets the pace and your guide keeps instruction clear. Where a minimum age applies, it is shown on the experience page.",
    toursLead: "A full day in Tokyo or Kyoto with a private licensed guide, planned around your interests. Any of our masterclasses can sit at the heart of the route — the tour handles everything around it: timing, transport, tables and the stories in between.",
    toursAboutH: "About our private tours",
    toursAbout: "Tours are operated with our licensed tour operations partner. Your guide is nationally licensed, the day is planned for your group alone, and routes flex on the day — linger where you are absorbed, skip what you have already seen. Combine a tour with a masterclass to turn one booking into a complete day.",
    toursFaqQ: "Can a tour include one of the masterclasses?",
    toursFaqA: "Yes — that is the recommended way to book. Tell us which experience you want at the centre of the day and the route is built around its schedule.",
    allLead: "Nine cultural experiences across Tokyo and Kyoto, each led by the practitioner themselves and joined by your private interpreter guide — plus full-day private tours to build them into.",
    allAboutH: "About KAMEHAME JAPAN experiences",
    allAbout: "We work directly with a small number of masters in Tokyo and Kyoto and keep every group small enough to sit at their side. Booking is online with payment in yen; venue details follow your confirmation. If you are choosing a first experience, start with your city and let curiosity do the rest.",
    allFaqQ: "Which experience should I choose first?",
    allFaqA: "Start from the city you will be in — each city page lists everything available there. The sushi masterclass and the tea ceremony are the most universally loved first bookings.",
    faqGuideQ: "Is an interpreter guide included?",
    faqGuideA: "Yes. Every experience and tour includes a private interpreter guide who accompanies you throughout, so nothing the master says — or that you want to ask — is lost.",
    faqBookQ: "How do I book and pay?",
    faqBookA: "You book online and pay securely in Japanese yen; approximate USD and EUR prices are shown for reference. You receive confirmation and meeting details by email.",
    faqCancelQ: "What is the cancellation policy?",
    cityStreet: (c) => `${c} street scene`,
    toursHeroAlt: "Path through the Arashiyama bamboo grove",
    allHeroAlt: "Tea ceremony host serving a bowl of tea",
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
    cityAbout: (c) => `Cada experiencia en ${c} la acoge el propio maestro en su lugar de trabajo real — una barra, una cuadra, un estudio, una fragua — nunca un aula preparada. Los grupos son reducidos, el guía intérprete privado siempre está incluido, y el nombre y la dirección exacta del local se comparten al confirmar la reserva, por respeto al trabajo diario de nuestros socios.`,
    cityFaqQ: (c) => `¿En qué parte de ${c} se celebran las experiencias?`,
    cityFaqA: (c, area) => `Cada ficha muestra su zona general (por ejemplo, «${area}»). La dirección exacta llega en el email de confirmación — los locales de nuestros socios son negocios en activo, así que solo compartimos la ubicación precisa con reservas confirmadas.`,
    catAboutH: (cat) => `Sobre las experiencias de ${cat.toLowerCase()}`,
    catAbout: "Estas sesiones las dirigen profesionales en activo, no presentadores, con grupos pensados para que el maestro pueda enseñarte de verdad. Tu guía intérprete privado forma parte de cada reserva — del primer email a la despedida — y los precios se muestran «desde ¥» por persona, con pago seguro en yenes.",
    catFaqQ: "¿Necesito experiencia previa para participar?",
    catFaqA: "No. Cada sesión está pensada para principiantes y se adapta a ti sobre la marcha; el maestro marca el ritmo y tu guía mantiene las instrucciones claras. Si hay edad mínima, aparece en la página de la experiencia.",
    toursLead: "Un día completo en Tokio o Kioto con un guía privado titulado, planificado según tus intereses. Cualquiera de nuestras clases magistrales puede ser el corazón de la ruta — el tour resuelve todo lo demás: horarios, transporte, mesas y las historias entre medias.",
    toursAboutH: "Sobre nuestros tours privados",
    toursAbout: "Los tours se operan con nuestro socio operador titulado. Tu guía cuenta con licencia nacional, el día se planifica solo para tu grupo y la ruta se adapta sobre la marcha — quédate donde algo te absorba, sáltate lo que ya conozcas. Combina un tour con una clase magistral y convierte una reserva en un día completo.",
    toursFaqQ: "¿Puede un tour incluir una de las clases magistrales?",
    toursFaqA: "Sí — es la forma recomendada de reservar. Dinos qué experiencia quieres en el centro del día y construimos la ruta alrededor de su horario.",
    allLead: "Nueve experiencias culturales entre Tokio y Kioto, cada una dirigida por el propio maestro y acompañada por tu guía intérprete privado — más tours privados de día completo donde encajarlas.",
    allAboutH: "Sobre las experiencias de KAMEHAME JAPAN",
    allAbout: "Trabajamos directamente con un número reducido de maestros en Tokio y Kioto y mantenemos cada grupo lo bastante pequeño para sentarte a su lado. La reserva es online con pago en yenes; los datos del local llegan con tu confirmación. Si eliges tu primera experiencia, empieza por tu ciudad y deja que la curiosidad haga el resto.",
    allFaqQ: "¿Qué experiencia elijo primero?",
    allFaqA: "Empieza por la ciudad en la que estarás — cada página de ciudad lista todo lo disponible allí. La clase magistral de sushi y la ceremonia del té son las primeras reservas más queridas.",
    faqGuideQ: "¿Está incluido el guía intérprete?",
    faqGuideA: "Sí. Cada experiencia y tour incluye un guía intérprete privado que te acompaña en todo momento, para que nada de lo que diga el maestro — ni nada de lo que quieras preguntar — se pierda.",
    faqBookQ: "¿Cómo reservo y pago?",
    faqBookA: "Reservas online y pagas de forma segura en yenes japoneses; los precios aproximados en USD y EUR se muestran como referencia. Recibes la confirmación y el punto de encuentro por email.",
    faqCancelQ: "¿Cuál es la política de cancelación?",
    cityStreet: (c) => `Escena urbana de ${c}`,
    toursHeroAlt: "Sendero del bosque de bambú de Arashiyama",
    allHeroAlt: "Anfitriona de la ceremonia del té sirviendo un cuenco",
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
    cityAbout: (c) => `${c}の体験はいずれも、その方が日々仕事をしている場所——付け台、稽古場、工房、鍛冶場——で行います。見学用に設えた教室ではありません。人数は少なく保ち、通訳ガイドが必ず同行します。受け入れ先の日々の営みに配慮し、店名と正確な住所はご予約確定後にお伝えしています。`,
    cityFaqQ: (c) => `${c}のどのあたりで行われますか。`,
    cityFaqA: (c, area) => `各ページにおおよその地域を記載しています(例:「${area}」)。正確な住所は確定メールでお送りします。受け入れ先はいずれも営業中の事業者のため、詳しい場所はご予約が確定した方にのみお伝えしています。`,
    catAboutH: (cat) => `${cat}の体験について`,
    catAbout: "いずれも、説明役ではなく現役の作り手が直接教えます。人数は、師が実際に手を取って教えられる規模に抑えています。通訳ガイドは最初のご連絡から最後のお見送りまで同行し、料金は1名あたりの「¥〜」表示、日本円でのお支払いです。",
    catFaqQ: "経験がなくても参加できますか。",
    catFaqA: "はい。いずれも初めての方を前提に組み立てており、当日その方に合わせて進めます。ペースは師が決め、通訳ガイドが説明を分かりやすく保ちます。年齢制限がある場合は各ページに記載しています。",
    toursLead: "東京または京都を、専属の全国通訳案内士と一日かけて巡ります。マスタークラスを一日の中心に据えることもでき、その周りの時間割・移動・食事はすべてツアー側で整えます。",
    toursAboutH: "プライベートツアーについて",
    toursAbout: "ツアーは旅行手配の提携先とともに運行します。ガイドは国家資格を持ち、その日はお客様のグループだけのために組み立てます。ルートは当日も調整可能です。マスタークラスと組み合わせれば、一度のご予約で一日が完結します。",
    toursFaqQ: "ツアーにマスタークラスを組み込めますか。",
    toursFaqA: "はい。むしろその形をおすすめしています。一日の中心に据えたい体験をお知らせいただければ、その時間割に合わせてルートを組み立てます。",
    allLead: "東京と京都の9つの文化体験。いずれも作り手本人が直接教え、通訳ガイドが同行します。一日かけて組み立てるプライベートツアーもご用意しています。",
    allAboutH: "KAMEHAME JAPAN の体験について",
    allAbout: "東京と京都の限られた数の師と直接お付き合いし、隣に座って学べる人数を保っています。ご予約はオンライン、お支払いは日本円です。会場の詳細は確定後にお送りします。最初の一つを選ぶなら、滞在する都市から見ていただくのが分かりやすいと思います。",
    allFaqQ: "最初はどの体験を選べばよいですか。",
    allFaqA: "滞在される都市から選んでいただくのが確実です。各都市のページに、その街で受けられるものがすべて載っています。初めての方には寿司のマスタークラスと茶道が広く好まれています。",
    faqGuideQ: "通訳ガイドは含まれますか。",
    faqGuideA: "はい。すべての体験とツアーに通訳ガイドが同行し、最後までご一緒します。師の言葉も、お客様が尋ねたいことも、取りこぼしません。",
    faqBookQ: "予約と支払いはどうすればよいですか。",
    faqBookA: "オンラインでご予約いただき、日本円でお支払いいただきます。米ドル・ユーロの概算も参考として表示します。確定と集合場所のご案内はメールでお送りします。",
    faqCancelQ: "キャンセル規定を教えてください。",
    cityStreet: (c) => `${c}の街並み`,
    toursHeroAlt: "嵐山の竹林の小径",
    allHeroAlt: "茶碗を差し出す茶道の亭主",
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
    cityAbout: (c) => `Chaque expérience à ${c} est accueillie par le praticien dans son propre lieu de travail — un comptoir, une écurie, un atelier, une forge — jamais un décor de classe. Les groupes restent petits, un guide-interprète privé est toujours inclus, et les noms des lieux et adresses exactes sont communiqués une fois votre réservation confirmée, par respect pour le travail quotidien de nos partenaires.`,
    cityFaqQ: (c) => `Où se déroulent les expériences à ${c} ?`,
    cityFaqA: (c, area) => `Chaque fiche indique son secteur général (par exemple « ${area} »). L'adresse exacte suit dans votre e-mail de confirmation — les lieux de nos partenaires sont des commerces en activité, nous ne partageons donc les adresses précises qu'avec les voyageurs confirmés.`,
    catAboutH: (cat) => `À propos des expériences ${cat.toLowerCase()}`,
    catAbout: "Ces séances sont menées par des praticiens en activité, pas par des présentateurs, et dimensionnées pour que le maître puisse réellement vous enseigner. Votre guide-interprète privé fait partie de chaque réservation — du premier e-mail au dernier au revoir — et les prix sont indiqués « dès ¥ » par personne, réglés en toute sécurité en yens.",
    catFaqQ: "Faut-il de l'expérience pour participer ?",
    catFaqA: "Non. Chaque séance est conçue pour les débutants et adaptée à vous le jour même ; le maître donne le rythme et votre guide garde les explications claires. Lorsqu'un âge minimum s'applique, il est indiqué sur la page de l'expérience.",
    toursLead: "Une journée entière à Tokyo ou Kyoto avec un guide privé agréé, planifiée autour de vos centres d'intérêt. N'importe laquelle de nos masterclasses peut être au cœur du parcours — la journée s'occupe de tout le reste : horaires, trajets, tables et histoires entre deux.",
    toursAboutH: "À propos de nos journées privées",
    toursAbout: "Les journées sont exploitées avec notre partenaire agréé. Votre guide est agréé au niveau national, la journée est planifiée pour votre groupe seul, et le parcours s'adapte sur place. Associez une journée à une masterclass pour faire d'une réservation une journée complète.",
    toursFaqQ: "Une journée peut-elle inclure une masterclass ?",
    toursFaqA: "Oui — c'est la façon recommandée de réserver. Dites-nous quelle expérience vous voulez au centre de la journée et le parcours est construit autour de son horaire.",
    allLead: "Neuf expériences culturelles à Tokyo et Kyoto, chacune menée par le praticien lui-même et accompagnée de votre guide-interprète privé.",
    allAboutH: "À propos des expériences KAMEHAME JAPAN",
    allAbout: "Nous travaillons directement avec un petit nombre de maîtres à Tokyo et Kyoto et gardons chaque groupe assez petit pour s'asseoir à leurs côtés. La réservation se fait en ligne avec paiement en yens ; les coordonnées du lieu suivent votre confirmation. Pour une première expérience, partez de votre ville et laissez faire la curiosité.",
    allFaqQ: "Quelle expérience choisir en premier ?",
    allFaqA: "Partez de la ville où vous serez — chaque page de ville liste tout ce qui y est disponible. La masterclass de sushi et la cérémonie du thé sont les premières réservations les plus universellement appréciées.",
    faqGuideQ: "Un guide-interprète est-il inclus ?",
    faqGuideA: "Oui. Chaque expérience inclut un guide-interprète privé qui vous accompagne d'un bout à l'autre, pour que rien de ce que dit le maître — ni de ce que vous voulez demander — ne se perde.",
    faqBookQ: "Comment réserver et payer ?",
    faqBookA: "Vous réservez en ligne et payez en toute sécurité en yens japonais ; des prix approximatifs en USD et EUR sont affichés à titre indicatif. Vous recevez la confirmation et les détails du rendez-vous par e-mail.",
    faqCancelQ: "Quelle est la politique d'annulation ?",
    cityStreet: (c) => `Scène de rue à ${c}`,
    toursHeroAlt: "Allée dans la bambouseraie d'Arashiyama",
    allHeroAlt: "Hôtesse de cérémonie du thé servant un bol",
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
    cityAbout: (c) => `每一項${c}體驗都由職人本人在自己的工作場所接待——吧檯、部屋、工作室、鍛冶場——絕非佈置出來的教室。團體人數保持精簡，一律含專屬口譯導遊，場地名稱與確切地址於預約確認後告知，以尊重合作夥伴的日常工作。`,
    cityFaqQ: (c) => `體驗在${c}的哪裡進行？`,
    cityFaqA: (c, area) => `每個頁面都標示大致區域（例如「${area}」）。確切地址將隨確認信寄出——合作場地都是營業中的店家，因此只向已確認的旅客提供詳細位置。`,
    catAboutH: (cat) => `關於${cat}體驗`,
    catAbout: "這些課程由現役職人親自帶領，而非解說員，人數也控制在師傅真的能教您的規模。專屬口譯導遊是每筆預約的一部分——從第一封信到最後道別——價格以「每位 ¥ 起」標示，以日圓安全付款。",
    catFaqQ: "沒有經驗也能參加嗎？",
    catFaqA: "可以。每堂課都為初學者設計，並在當天依您調整；師傅掌握步調，導遊確保說明清楚。若有年齡下限，會標示在體驗頁面。",
    toursLead: "與私人持證導遊在東京或京都度過完整的一天，依您的興趣規劃。任何一堂大師課都可以是路線的核心——其餘的時間、交通、餐廳與沿途故事都由行程安排。",
    toursAboutH: "關於私人一日遊",
    toursAbout: "行程與我們的持證合作夥伴共同執行。導遊具全國資格，一天只為您的團體規劃，路線可於當日調整。將一日遊與大師課搭配，一次預約即成完整的一天。",
    toursFaqQ: "一日遊可以包含大師課嗎？",
    toursFaqA: "可以——這正是我們推薦的預約方式。告訴我們您想以哪項體驗為一天的核心，路線就會依它的時間安排。",
    allLead: "東京與京都的九項文化體驗，每一項都由職人親自帶領，並有您的專屬口譯導遊隨行。",
    allAboutH: "關於 KAMEHAME JAPAN 的體驗",
    allAbout: "我們直接與東京、京都少數幾位師傅合作，並將每個團體保持在能坐在他們身旁的規模。線上預約、日圓付款；場地資訊於確認後寄出。若在挑選第一項體驗，從您所在的城市開始，其餘交給好奇心。",
    allFaqQ: "第一次該選哪項體驗？",
    allFaqA: "從您將停留的城市開始——每個城市頁面都列出當地所有可選體驗。壽司大師課與茶道是最普遍受喜愛的第一次預約。",
    faqGuideQ: "是否包含口譯導遊？",
    faqGuideA: "是。每項體驗都包含全程陪同的專屬口譯導遊，師傅說的話、您想問的問題，一句都不會漏掉。",
    faqBookQ: "如何預約與付款？",
    faqBookA: "線上預約，以日圓安全付款；頁面上顯示的美元與歐元價格僅供參考。確認信與集合資訊將以電子郵件寄出。",
    faqCancelQ: "取消政策是什麼？",
    cityStreet: (c) => `${c}街景`,
    toursHeroAlt: "嵐山竹林小徑",
    allHeroAlt: "遞上茶碗的茶道主人",
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
    const other = cities.find((c) => c.slug !== city.slug)!;
    return {
      slug, crumb: city.title, h1: S.cityH1(city.title),
      heroImg: city.img, heroAlt: S.cityStreet(city.title), lead: city.lead,
      items: [...exps.map(expItem), ...cityTours.map(tourItem)],
      refine: catLinks,
      about: { heading: S.cityAboutH(city.title), body: S.cityAbout(city.title) },
      faq: [{ q: S.cityFaqQ(city.title), a: S.cityFaqA(city.title, exps[0]?.area ?? "") }, FAQ_GUIDE, FAQ_CANCEL],
      explore: [
        { label: other.title, href: p(`/${other.slug}/`) },
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
      heroImg: "/images/craft-hands.jpg", heroAlt: S.allHeroAlt,
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

export const collectionSlugs = [
  "tokyo", "kyoto",
  "sushi", "sumo", "tea-ceremony", "kimono", "geisha", "swordsmith", "anime-nail-art",
  ...(TOURS_PUBLISHED ? ["tours"] : []),
  "experiences",
];
