// Published languages and shared UI strings. Adding a language means:
// 1) a catalog translation file (see catalog.es.ts), 2) an entry in LANGS,
// 3) strings below — the [lang] routes pick everything up automatically.

export type Lang = "en" | "es";

export const LANGS: Lang[] = ["en", "es"];

export const isLang = (v: string): v is Lang => (LANGS as string[]).includes(v);

// Path prefix for a language ("" keeps the English top page at "/").
export const langHome = (lang: Lang) => (lang === "en" ? "/" : `/${lang}/`);
export const langPath = (lang: Lang, path: string) => `/${lang}${path}`; // path starts with "/"

const strings = {
  en: {
    // header / footer
    navTokyo: "Tokyo", navKyoto: "Kyoto", navExperiences: "Experiences", navTours: "Private tours", navApproach: "Our approach",
    findExperience: "Find an experience",
    footerAbout: "About", footerOperated: "Operated by Prosent Inc. with our tour operations partner.",
    langNote: "English · Español — Français · 繁體中文 coming soon",
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
    footerAbout: "Nosotros", footerOperated: "Operado por Prosent Inc. junto con nuestro socio operador de tours.",
    langNote: "English · Español — Français · 繁體中文 próximamente",
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
} as const;

export type UIStrings = (typeof strings)["en"];

export const t = (lang: Lang): UIStrings => strings[lang] as unknown as UIStrings;
