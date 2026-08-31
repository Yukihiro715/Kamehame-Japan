// Resolves a /en/{collection}/ slug (city, category, tours, experiences)
// into everything the shared listing template needs.

import {
  CANCELLATION, categories, categoryBySlug, cities, cityBySlug,
  experiences, experiencesInCategory, experiencesInCity,
  tours, toursInCity, type Experience, type Tour,
} from "@/lib/catalog";

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

const expHref = (e: Experience) => `/en/${e.city}/${e.slug}/`;
const tourHref = (t: Tour) => `/en/tours/${t.slug}/`;

const cityTitle = (slug: string) => cityBySlug(slug as "tokyo" | "kyoto")?.title ?? slug;

function expItem(e: Experience): ListingItem {
  const cat = categoryBySlug(e.category);
  return {
    kind: "experience", href: expHref(e), img: e.img, alt: e.alt,
    tags: [cat?.tag ?? "Experience", e.group.startsWith("Private") ? "Private" : "Small group"],
    title: e.title, line: e.tagline,
    meta: `${cityTitle(e.city)} · ${e.duration}`, price: e.price,
  };
}

function tourItem(t: Tour): ListingItem {
  return {
    kind: "tour", href: tourHref(t), img: t.img, alt: t.alt,
    tags: ["Tour", "Private"],
    title: t.title, line: t.tagline,
    meta: `${cityTitle(t.city)} · ${t.duration}`, price: t.price,
  };
}

const FAQ_GUIDE: Faq = {
  q: "Is an interpreter guide included?",
  a: "Yes. Every experience and tour includes a private interpreter guide who accompanies you throughout, so nothing the master says — or that you want to ask — is lost.",
};
const FAQ_BOOK: Faq = {
  q: "How do I book and pay?",
  a: "You book online and pay securely in Japanese yen; approximate USD and EUR prices are shown for reference. You receive confirmation and meeting details by email.",
};
const FAQ_CANCEL: Faq = { q: "What is the cancellation policy?", a: CANCELLATION };

export function getCollection(slug: string): Collection | undefined {
  const city = cityBySlug(slug as "tokyo" | "kyoto");
  if (city) {
    const exps = experiencesInCity(city.slug);
    const catLinks = [...new Set(exps.map((e) => e.category))]
      .map((c) => categoryBySlug(c)!)
      .map((c) => ({ label: c.title, href: `/en/${c.slug}/` }));
    const other = cities.find((c) => c.slug !== city.slug)!;
    return {
      slug, crumb: city.title, h1: `${city.title} masterclasses`,
      heroImg: city.img, heroAlt: `${city.title} street scene`, lead: city.lead,
      items: [...exps.map(expItem), ...toursInCity(city.slug).map(tourItem)],
      refine: catLinks,
      about: {
        heading: `About our ${city.title} experiences`,
        body: `Each ${city.title} experience is hosted by the practitioner in their own working space — a counter, a stable, a studio, a forge — never a classroom set. Groups stay small, a private interpreter guide is always included, and venue names and exact addresses are shared once your booking is confirmed, out of respect for our partners' daily work.`,
      },
      faq: [
        { q: `Where in ${city.title} do the experiences take place?`, a: `Each listing shows its general area (for example “${exps[0]?.area}”). The exact address follows in your confirmation email — our partners' venues are working businesses, so we share precise locations only with confirmed guests.` },
        FAQ_GUIDE, FAQ_CANCEL,
      ],
      explore: [
        { label: other.title, href: `/en/${other.slug}/` },
        ...catLinks.slice(0, 3),
        { label: "Guided tours", href: "/en/tours/" },
      ],
    };
  }

  const cat = categoryBySlug(slug);
  if (cat) {
    const exps = experiencesInCategory(cat.slug);
    const cityLinks = [...new Set(exps.map((e) => e.city))].map((c) => ({ label: cityTitle(c), href: `/en/${c}/` }));
    const others = categories.filter((c) => c.slug !== cat.slug).slice(0, 3)
      .map((c) => ({ label: c.title, href: `/en/${c.slug}/` }));
    const where = cityLinks.map((c) => c.label).join(" & ");
    return {
      slug, crumb: cat.title, h1: `${cat.title} experiences in ${where}`,
      heroImg: cat.img, heroAlt: cat.title, lead: cat.lead,
      items: exps.map(expItem),
      refine: cityLinks,
      about: {
        heading: `About ${cat.title.toLowerCase()} experiences`,
        body: `These sessions are led by working practitioners, not presenters, and sized so the master can actually teach you. Your private interpreter guide is part of every booking — from the first email to the final goodbye — and prices are shown “from ¥” per person, paid securely in yen.`,
      },
      faq: [
        { q: `Do I need any experience to join?`, a: `No. Every session is designed for first-timers and adapted to you on the day; the master sets the pace and your guide keeps instruction clear. Where a minimum age applies, it is shown on the experience page.` },
        FAQ_GUIDE, FAQ_BOOK,
      ],
      explore: [...cityLinks, ...others, { label: "Guided tours", href: "/en/tours/" }],
    };
  }

  if (slug === "tours") {
    return {
      slug, crumb: "Guided tours", h1: "Private guided tours",
      heroImg: "/images/cat-tours.jpg", heroAlt: "Path through the Arashiyama bamboo grove",
      lead: "A full day in Tokyo or Kyoto with a private licensed guide, planned around your interests. Any of our masterclasses can sit at the heart of the route — the tour handles everything around it: timing, transport, tables and the stories in between.",
      items: [...tours.map(tourItem), ...experiences.slice(0, 3).map(expItem)],
      refine: cities.map((c) => ({ label: c.title, href: `/en/${c.slug}/` })),
      about: {
        heading: "About our private tours",
        body: "Tours are operated with our licensed tour operations partner. Your guide is nationally licensed, the day is planned for your group alone, and routes flex on the day — linger where you are absorbed, skip what you have already seen. Combine a tour with a masterclass to turn one booking into a complete day.",
      },
      faq: [
        { q: "Can a tour include one of the masterclasses?", a: "Yes — that is the recommended way to book. Tell us which experience you want at the centre of the day and the route is built around its schedule." },
        FAQ_GUIDE, FAQ_CANCEL,
      ],
      explore: [
        ...cities.map((c) => ({ label: c.title, href: `/en/${c.slug}/` })),
        { label: "All experiences", href: "/en/experiences/" },
      ],
    };
  }

  if (slug === "experiences") {
    return {
      slug, crumb: "Experiences", h1: "All experiences",
      heroImg: "/images/craft-hands.jpg", heroAlt: "Tea ceremony host serving a bowl of tea",
      lead: "Nine cultural experiences across Tokyo and Kyoto, each led by the practitioner themselves and joined by your private interpreter guide — plus full-day private tours to build them into.",
      items: [...experiences.map(expItem), ...tours.map(tourItem)],
      refine: [
        ...cities.map((c) => ({ label: c.title, href: `/en/${c.slug}/` })),
        ...categories.map((c) => ({ label: c.title, href: `/en/${c.slug}/` })),
      ],
      about: {
        heading: "About OMOTENASHI JAPAN experiences",
        body: "We work directly with a small number of masters in Tokyo and Kyoto and keep every group small enough to sit at their side. Booking is online with payment in yen; venue details follow your confirmation. If you are choosing a first experience, start with your city and let curiosity do the rest.",
      },
      faq: [
        { q: "Which experience should I choose first?", a: "Start from the city you will be in — each city page lists everything available there. The sushi masterclass and the tea ceremony are the most universally loved first bookings." },
        FAQ_GUIDE, FAQ_CANCEL,
      ],
      explore: [
        ...cities.map((c) => ({ label: c.title, href: `/en/${c.slug}/` })),
        { label: "Guided tours", href: "/en/tours/" },
      ],
    };
  }

  return undefined;
}

export const collectionSlugs = [
  ...cities.map((c) => c.slug as string),
  ...categories.map((c) => c.slug),
  "tours",
  "experiences",
];
