// Resolves a /{lang}/{collection}/ slug (city, category, tours, experiences)
// into everything the shared listing template needs, in the given language.

import {
  cancellationFor, catalogFor, cityBySlug,
  type Experience, type Tour,
} from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

export interface ListingItem {
  kind: "experience" | "tour";
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
};

export function getCollection(slug: string, lang: Lang = "en"): Collection | undefined {
  const S = STR[lang];
  const { cities, categories, experiences, tours } = catalogFor(lang);
  const p = (path: string) => `/${lang}${path}`;

  const cityTitle = (citySlug: string) => cityBySlug(citySlug, lang)?.title ?? citySlug;
  const catBySlug = (c: string) => categories.find((x) => x.slug === c);

  const expItem = (e: Experience): ListingItem => ({
    kind: "experience", href: p(`/${e.city}/${e.slug}/`), img: e.img, alt: e.alt,
    tags: [catBySlug(e.category)?.tag ?? "", e.group.startsWith("Priva") || e.group.startsWith("Private") ? S.privateTag : S.smallGroupTag].filter(Boolean),
    title: e.title, line: e.tagline,
    meta: `${cityTitle(e.city)} · ${e.duration}`, price: e.price,
  });
  const tourItem = (tr: Tour): ListingItem => ({
    kind: "tour", href: p(`/tours/${tr.slug}/`), img: tr.img, alt: tr.alt,
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
        { label: S.guidedTours, href: p("/tours/") },
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
      explore: [...cityLinks, ...others, { label: S.guidedTours, href: p("/tours/") }],
    };
  }

  if (slug === "tours") {
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
        { label: S.guidedTours, href: p("/tours/") },
      ],
    };
  }

  return undefined;
}

export const collectionSlugs = [
  "tokyo", "kyoto",
  "sushi", "sumo", "tea-ceremony", "kimono", "geisha", "swordsmith", "anime-nail-art",
  "tours",
  "experiences",
];
