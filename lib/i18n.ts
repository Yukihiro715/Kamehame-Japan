// Published languages and shared UI strings. Adding a language means:
// 1) a catalog translation file (see catalog.es.ts), 2) an entry in LANGS,
// 3) strings below — the [lang] routes pick everything up automatically.

export type Lang = "en" | "es" | "ja";

export const LANGS: Lang[] = ["en", "es", "ja"];

export const isLang = (v: string): v is Lang => (LANGS as string[]).includes(v);

// Path prefix for a language ("" keeps the English top page at "/").
export const langHome = (lang: Lang) => (lang === "en" ? "/" : `/${lang}/`);
export const langPath = (lang: Lang, path: string) => `/${lang}${path}`; // path starts with "/"

const strings = {
  en: {
    // header / footer
    navTokyo: "Tokyo", navKyoto: "Kyoto", navExperiences: "Experiences", navTours: "Private tours", navApproach: "Our approach",
    findExperience: "Find an experience",
    footerAbout: "About", navFaq: "FAQ", footerOperated: "Operated by Prosent Inc. with our tour operations partner.",
    langNote: "English · Español · 日本語 — Français · 繁體中文 coming soon",
    home: "Home",
    // cards
    from: "from", perPerson: "/ person", perGroupShort: "/ group", perGroup: "per group / day", perPersonUnit: "per person", perGroupUnit: "per group",
    interpreterIncluded: "Interpreter included",
    refine: "Refine", sort: "Sort: Recommended",
    alsoExplore: "Also explore", frequentlyAsked: "Frequently asked",
    guidedTours: "Guided tours", allExperiences: "All experiences",
    // detail page
    whatYoullDo: "What you'll do", yourMaster: "Your master", itinerary: "Itinerary",
    goodToKnow: "Good to know", meetingPoint: "Meeting point & access", cancellationH: "Cancellation",
    meetingBody: (area: string) => `You will meet your interpreter guide in the ${area} area. Out of respect for our partners' working venues, the exact address and map are sent with your booking confirmation.`,
    meetingChip: (area: string) => `${area} — exact location shared after booking`,
    // Stated on every experience: we arrange no transport, which is what keeps
    // these products outside 旅行業 while only a 手配業 registration is held.
    meetOnSite: "Meet on site · no transfers",
    interpreterGuide: "Interpreter guide included", licensedGuide: "Licensed guide",
    makeItFullDay: "Make it a full day",
    pairWith: (city: string) => `Pair it with a private ${city} day tour.`,
    pairBody: "Put this experience at the heart of an eight-hour day with a licensed guide — transport, timing and the route around it all handled.",
    moreIn: (city: string) => `More in ${city}`,
    experiencesIn: (city: string) => `Experiences in ${city}`,
    reviewNote: "Verified Google guest reviews for this experience will be shown here after launch.",
    yourDay: "Your day, your route", buildAround: "Build it around a masterclass",
    buildBody: (city: string) => `Any ${city} experience below can anchor the day. Tell us which one when you enquire, and the route, meals and pace are planned around its schedule.`,
    // booking box
    bookingUnitNote: "pay in JPY (USD/EUR shown at checkout)",
    bookingSoonTitle: "Online booking opens soon.", bookingSoonBody: "Date and guest selection (Bókun) will appear here.",
    bookNow: "Book now", bookingFine: "Instant confirmation · Pay in yen · Free cancellation (7 days)", bookingFineTerms: "Instant confirmation · Pay in yen · See cancellation terms below",
    // request-based products: the venue confirms the date before the booking is final
    requestBook: "Request this date",
    requestBadge: "On request",
    bookingFineRequest: "Your date is confirmed with the house before anything is final · Pay in yen",
    requestStepsTitle: "How booking works",
    requestSteps: [
      "Send your preferred date and party size.",
      "We confirm availability with the house and reply within 24 hours.",
      "Once confirmed, you complete payment and receive the venue details.",
    ],
    questions: "Questions?", questionsBody: "WhatsApp and email support details will appear here at launch.",
    // misc
    breadcrumbTours: "Guided tours",
    eyebrowHero: "Tokyo · Kyoto · With the masters",
  },
  es: {
    navTokyo: "Tokio", navKyoto: "Kioto", navExperiences: "Experiencias", navTours: "Tours privados", navApproach: "Nuestra filosofía",
    findExperience: "Buscar experiencia",
    footerAbout: "Nosotros", navFaq: "Preguntas frecuentes", footerOperated: "Operado por Prosent Inc. junto con nuestro socio operador de tours.",
    langNote: "English · Español · 日本語 — Français · 繁體中文 próximamente",
    home: "Inicio",
    from: "desde", perPerson: "/ persona", perGroupShort: "/ grupo", perGroup: "por grupo / día", perPersonUnit: "por persona", perGroupUnit: "por grupo",
    interpreterIncluded: "Intérprete incluido",
    refine: "Filtrar", sort: "Orden: Recomendado",
    alsoExplore: "Explora también", frequentlyAsked: "Preguntas frecuentes",
    guidedTours: "Tours guiados", allExperiences: "Todas las experiencias",
    whatYoullDo: "Qué harás", yourMaster: "Tu maestro", itinerary: "Itinerario",
    goodToKnow: "Conviene saber", meetingPoint: "Punto de encuentro y acceso", cancellationH: "Cancelación",
    meetingBody: (area: string) => `Te reunirás con tu guía intérprete en la zona de ${area}. Por respeto a los locales de nuestros socios, la dirección exacta y el mapa se envían con la confirmación de tu reserva.`,
    meetingChip: (area: string) => `${area} — ubicación exacta tras la reserva`,
    meetOnSite: "Punto de encuentro en el lugar · sin traslados",
    interpreterGuide: "Guía intérprete incluido", licensedGuide: "Guía titulado",
    makeItFullDay: "Conviértelo en un día completo",
    pairWith: (city: string) => `Combínalo con un tour privado de un día por ${city}.`,
    pairBody: "Pon esta experiencia en el centro de una jornada de ocho horas con un guía titulado: transporte, horarios y toda la ruta, resueltos.",
    moreIn: (city: string) => `Más en ${city}`,
    experiencesIn: (city: string) => `Experiencias en ${city}`,
    reviewNote: "Las reseñas verificadas de Google de esta experiencia aparecerán aquí tras el lanzamiento.",
    yourDay: "Tu día, tu ruta", buildAround: "Construye el día alrededor de una clase magistral",
    buildBody: (city: string) => `Cualquiera de las experiencias de ${city} puede ser el corazón del día. Dinos cuál al hacer tu consulta y planificamos la ruta, las comidas y el ritmo según su horario.`,
    bookingUnitNote: "pago en JPY (USD/EUR como referencia)",
    bookingSoonTitle: "La reserva online llega muy pronto.", bookingSoonBody: "El calendario de fechas y personas (Bókun) aparecerá aquí.",
    bookNow: "Reservar", bookingFine: "Confirmación inmediata · Pago en yenes · Cancelación gratuita (7 días)", bookingFineTerms: "Confirmación inmediata · Pago en yenes · Ver condiciones de cancelación abajo",
    // productos bajo petición: la casa confirma la fecha antes de cerrar la reserva
    requestBook: "Solicitar esta fecha",
    requestBadge: "Bajo petición",
    requestStepsTitle: "Cómo funciona la reserva",
    bookingFineRequest: "Confirmamos tu fecha con la casa antes de cerrar nada · Pago en yenes",
    requestSteps: [
      "Envíanos tu fecha preferida y el número de personas.",
      "Confirmamos la disponibilidad con la casa y te respondemos en 24 horas.",
      "Una vez confirmada, completas el pago y recibes los datos del local.",
    ],
    questions: "¿Dudas?", questionsBody: "Los datos de contacto por WhatsApp y email aparecerán aquí en el lanzamiento.",
    breadcrumbTours: "Tours guiados",
    eyebrowHero: "Tokio · Kioto · Con los maestros",
  },
  ja: {
    navTokyo: "東京", navKyoto: "京都", navExperiences: "体験一覧", navTours: "プライベートツアー", navApproach: "私たちの考え方",
    findExperience: "体験を探す",
    footerAbout: "私たちについて", navFaq: "よくあるご質問", footerOperated: "運営:Prosent Inc.／旅行手配:株式会社 ELNX TRAVEL",
    langNote: "English · Español · 日本語 — Français · 繁體中文 近日公開",
    home: "ホーム",
    from: "", perPerson: "／1名", perGroupShort: "／1組", perGroup: "1組・1日あたり", perPersonUnit: "1名あたり", perGroupUnit: "1組あたり",
    interpreterIncluded: "通訳ガイド同行",
    refine: "絞り込む", sort: "並び順:おすすめ",
    alsoExplore: "こちらもご覧ください", frequentlyAsked: "よくあるご質問",
    guidedTours: "ガイド付きツアー", allExperiences: "すべての体験",
    whatYoullDo: "体験の内容", yourMaster: "お迎えする師", itinerary: "当日の流れ",
    goodToKnow: "事前にお知らせしたいこと", meetingPoint: "集合場所とアクセス", cancellationH: "キャンセルについて",
    meetingBody: (area: string) => `${area}で通訳ガイドと合流していただきます。受け入れ先への配慮から、正確な住所と地図はご予約確定時にお送りします。`,
    meetingChip: (area: string) => `${area} — 正確な場所は予約確定後にお伝えします`,
    meetOnSite: "現地集合・現地解散(送迎はありません)",
    interpreterGuide: "通訳ガイド同行", licensedGuide: "全国通訳案内士",
    makeItFullDay: "一日かけて楽しむ",
    pairWith: (city: string) => `${city}のプライベート1日ツアーと組み合わせる`,
    pairBody: "この体験を軸に、8時間を全国通訳案内士とともに。移動も時間割もルートもすべてお任せいただけます。",
    moreIn: (city: string) => `${city}の他の体験`,
    experiencesIn: (city: string) => `${city}の体験`,
    reviewNote: "この体験に対するGoogleの認証済みレビューは、販売開始後にこちらへ掲載します。",
    yourDay: "一日の組み立て", buildAround: "マスタークラスを軸に組み立てる",
    buildBody: (city: string) => `以下の${city}の体験は、いずれも一日の軸になります。お問い合わせの際にご希望をお知らせいただければ、その時間割に合わせてルート・食事・ペースを組み立てます。`,
    bookingUnitNote: "日本円でのお支払い(USD/EURは目安表示)",
    bookingSoonTitle: "オンライン予約は近日開始します。", bookingSoonBody: "日程と人数の選択(Bókun)がこちらに表示されます。",
    bookNow: "予約する", bookingFine: "即時確定 · 日本円決済 · 7日前まで無料キャンセル", bookingFineTerms: "即時確定 · 日本円決済 · キャンセル規定は下記をご確認ください",
    // リクエスト予約:受け入れ先と日程を確認してから確定します
    requestBook: "この日程で申し込む",
    requestBadge: "リクエスト予約",
    requestStepsTitle: "ご予約の流れ",
    bookingFineRequest: "受け入れ先と日程を確認してから確定します · 日本円決済",
    requestSteps: [
      "ご希望の日程と人数をお送りください。",
      "受け入れ先に空き状況を確認し、24時間以内にご返信します。",
      "確定後、お支払いに進んでいただき、会場の詳細をお伝えします。",
    ],
    questions: "ご不明な点は", questionsBody: "WhatsApp・メールでのお問い合わせ先は、販売開始時にこちらへ掲載します。",
    breadcrumbTours: "ガイド付きツアー",
    eyebrowHero: "東京 · 京都 · 師のもとで",
  },
} as const;

export type UIStrings = (typeof strings)["en"];

export const t = (lang: Lang): UIStrings => strings[lang] as unknown as UIStrings;
