// Catalog of cities, categories, experiences and guided tours.
// Prices, durations and operating conditions are placeholders pending
// confirmation with each partner venue (see CLAUDE_HANDOFF.md). Venue
// names and exact addresses stay private until a booking is confirmed.

export type CitySlug = "tokyo" | "kyoto" | "osaka" | "nagoya" | "okinawa" | "kanazawa" | "himeji";

/** How a booking is confirmed. Instant products are bookable straight from the
 *  calendar; request products are held until the venue confirms the date. */
export type BookingType = "instant" | "request";

/** Whether an experience is backed by a signed partner ("live"), is still a
 *  placeholder awaiting one ("soon"), or is built and waiting for sign-off
 *  ("preview": reachable by its URL for review, never listed, never indexed,
 *  and the only status allowed to show sample reviews). Undefined counts as "soon". */
export type ExperienceStatus = "live" | "soon" | "preview";
export const isLive = (e: { status?: ExperienceStatus }) => e.status === "live";
export const isPreview = (e: { status?: ExperienceStatus }) => e.status === "preview";

/** Whether placeholder ("soon") experiences appear on the site at all. While
 *  false, catalogFor() returns only signed experiences, and only the cities
 *  and categories that still have one — so nothing is listed that cannot be
 *  booked. The placeholder entries stay in the data for when a partner signs:
 *  set their status to "live" (or flip this on to show the planned range with
 *  "Coming soon" labels). The sitemap generator reads this flag too. */
export const PLACEHOLDERS_PUBLISHED = false;

export interface Category {
  slug: string;
  title: string;
  tag: string;
  mark: string;
  img: string;
  lead: string;
}

export interface City {
  slug: CitySlug;
  title: string;
  jp: string;
  img: string;
  lead: string;
}

/** One of several products sold on a single page (e.g. a golf day near Tokyo
 *  or in the Mt. Fuji region): the visitor picks one, and the prices, the
 *  photo order and the request follow the choice. Text fields are per
 *  locale; the prices, photo and pre-selected time come from the English
 *  catalog (see lib/golf-prices.ts for the golf numbers). */
export interface ExperienceVariant {
  id: string;
  /** "Tokyo Area Golf Day" — the request, the emails, the summary line */
  title: string;
  /** "Tokyo Area" — the card title, the sticky bar, the photo labels */
  short: string;
  /** One line under the card title, e.g. "Golf courses near Tokyo" */
  tagline: string;
  /** Whole-group package prices by party size; any other size is quoted. */
  tiers: { party: number; total: number }[];
  /** The photo shown first when this variant is chosen. */
  img: string; alt: string;
  /** Pre-selected start/departure time for this variant. */
  defaultTime?: string;
}

/** Copy for the two-plan page (golf): the first view, the one options panel,
 *  the sections and the single request form. All text, authored per locale.
 *  Strings with {n}, {price} or {total} are templates (plain text so they can
 *  cross to client components). */
/** The twelve items of the golf inclusion grid; which icon each shows and whether it is
 *  covered is fixed in components/site/golf-inclusions.tsx, the words come from each locale. */
export type GolfInclusionId = "round" | "clubs" | "shoes" | "transfer" | "driver" | "assistant" | "cart" | "locker" | "bath" | "lunch" | "taxes" | "wear";

export interface VariantPageCopy {
  /** Benefit chips under the photos, e.g. "Private hotel transfers". */
  benefits: string[];
  /** Breadcrumb tail, e.g. "Private Golf Day". */
  crumb: string;
  /** Note under the photos (example courses, views depend on the weather). */
  photoNote: string;
  /** What the package covers, as an icon grid: twelve items, the one it does not cover marked. */
  inclusions: {
    heading: string; sub: string; includedLabel: string; notIncludedLabel: string;
    items: { id: GolfInclusionId; label: string; note?: string }[];
    /** Under the grid: bring your own wear and gloves; shoes and clubs are provided. */
    footnote: string;
    /** Cart rules and clubhouse facilities vary by course. */
    courseNote: string;
    /** The things that stay extra: food and drink beyond lunch, personal purchases, a caddie. */
    alsoNot: string;
  };
  /** The private transfer section: the car, the driver and the assistant, door to door. */
  transfer: {
    heading: string; body: string;
    photo: { img: string; alt: string };
    /** A second, supporting photo (the driver) when one is available. */
    photo2?: { img: string; alt: string };
    points: { title: string; body: string }[];
    /** The vehicle shown is an example; the model on the day may vary. */
    note: string;
  };
  /** The one place where the party size and the area are chosen. */
  options: {
    heading: string; golfersLegend: string; areaLegend: string;
    /** "{n} golfers" */
    golfers: string;
    /** Words around the per-person price: `from` before it ("From" / "1名"), `approx` for a
     *  rounded figure ("approx." / "約"), `perPerson` after it ("/ person"), `fromSuffix` after it ("〜"). */
    from: string; approx: string; perPerson: string; fromSuffix?: string;
    /** "{total} total · {n} golfers" */
    total: string;
    /** "{total} total" */
    totalShort: string;
    /** "{price} / person" — the per-person figure as a reference beside a fixed total (no "From"). */
    perPersonRef: string;
    customQuote: string;
    /** "Preferred course · {n} golfers" */
    customQuoteLine: string;
    /** One line under the cards: what both packages include. */
    includes: string;
    /** Under the cards: recommended-course package, confirmed before payment. */
    note: string;
    /** The reassurance under the cards: the course, tee time and total are proposed for approval before payment. */
    assure: { heading: string; body: string };
    /** Replaces it while a specific course is requested in the form. */
    customNote: string;
    /** Under the button: no payment required to enquire. */
    ctaNote: string;
    /** Link to the read-only price table. */
    allPrices: string;
  };
  intro: { heading: string; guideNote: string };
  day: { steps: { title: string; body: string }[]; note: string; timingsH: string; bookingH: string };
  prices: { heading: string; only: string; golfersCol: string; perPersonCol: string; totalCol: string; approxNote: string; notes: string[] };
  form: {
    summaryH: string; change: string;
    steps: { dates: string; course: string; hotel: string; group: string; contact: string };
    departure: string; noPreference: string;
    specificCourse: string; specificCourseNote: string; specificCourseQuote: string; courseName: string; courseUrl: string;
    pickup: string; pickupHint: string; hotelUndecided: string; hotelArea: string; hotelAreaHint: string;
    experience: string; experienceSelect: string; experienceOpts: { casual: string; regular: string; experienced: string; unsure: string };
    handicap: string; handicapHint: string;
    /** "Rental clubs & shoes" — the heading of the per-golfer rows. */
    rentalH: string;
    rental: string; rentalOpts: { required: string; own: string; unsure: string };
    /** Under the rental heading: clubs are ¥5,000 per golfer and included; own clubs deduct that much. */
    rentalNote: string;
    /** "Own clubs × {n}: −{amount}" and the label of the deducted total, in the form summary. */
    ownClubsLine: string; ownClubsTotal: string;
    /** Shoe size per golfer: a size in cm, own shoes, or "later". */
    shoes: string; shoeOpts: { own: string; unsure: string }; /** "{n} cm" */ shoeSize: string;
    handed: string; handedOpts: { right: string; left: string; unsure: string };
    /** "Golfer {n}" */
    golferN: string;
    clubSpecs: string; clubSpecsHint: string;
    whatsapp: string; whatsappHint: string; requests: string; requestsHint: string;
    extras: string; extrasNote: string; notForFour: string;
    confirmH: string; confirmNote: string; perPersonRef: string; package: string; recommendedCourse: string;
    cta: string; note: string; terms: string;
    /** Shown on the confirmation page after sending. */
    sentNote: string;
  };
  headings: { about: string; included: string; day: string; faq: string; terms: string; request: string };
}

export interface Experience {
  slug: string;
  city: CitySlug;
  category: string;
  title: string;
  tagline: string;
  duration: string;
  price: string;
  group: string;
  ages: string;
  area: string;
  img: string;
  alt: string;
  gallery: { img: string; alt: string; caption?: string; /** Two-plan pages: the variant this photo shows. */ area?: string }[];
  /** Pricing unit: per person (default) or per group. */
  priceUnit?: "person" | "group";
  /** "request" when the venue confirms the date before the booking is final. */
  bookingType?: BookingType;
  /** "soon" until a venue has actually signed for this experience. Placeholder
   *  listings stay visible so the range is clear, but they are labelled and
   *  cannot be booked. Only set "live" once the partner's terms are loaded. */
  status?: ExperienceStatus;
  /** Overrides the site-wide cancellation policy when the venue's terms differ. */
  cancellation?: string;
  /** Stepped cancellation fees: each step applies from `until` days before the date
   *  (counted in Japan time) down to the next step. Rendered as a table. */
  cancellationTiers?: { until: number; rate: number }[];
  /** Dietary needs the kitchen can meet on request (keys of the i18n dietary labels). */
  dietary?: string[];
  /** False when no interpreter guide comes with the product (the teacher runs it
   *  in English): hides the interpreter choice and the "Interpreter guide" tag. */
  interpreter?: boolean;
  /** Replaces the "Interpreter guide" condition tag, e.g. "Taught in English". */
  langTag?: string;
  /** Request-form notes field, when the product needs something specific from guests. */
  notesLabel?: string;
  notesHint?: string;
  /** Replaces the site-wide booking steps (written for the geiko evening). */
  flow?: { title: string; body: string }[];
  /** Leaves out the site-wide FAQ entries (interpreter, request, transport). */
  skipSiteFaq?: boolean;
  /** The person who teaches or hosts, in their own words. No name on purpose
   *  where the partner's brand must not be searchable. */
  teacher?: { img: string; alt: string; credentials: string[]; comment: string };
  whatYoullDo: string[];
  master: { title: string; bio: string; quote: string };
  itinerary: string[];
  goodToKnow: string[];
  story: { heading: string; body: string };

  // ---- Detail-page structure. Structural fields (numbers, media, flags) are
  // authored once in the English catalog and merged into every locale by
  // catalogFor(); locale files only carry text. ----------------------------

  /** Smallest and largest party the venue takes (and the pre-selected size, default two). Drives the pricing table. */
  partySize?: { min: number; max: number; default?: number };
  /** Party-size pricing. `tiers` are whole-group totals in yen; a per-person
   *  figure is derived for display. Absent for per-person products, where the
   *  table is derived from `price` × party. */
  pricing?: {
    /** Whole-group totals by party size (products priced as a flat table). */
    tiers?: { party: number; total: number }[];
    /** Rate that applies inside `windows`; only the tiers actually confirmed. */
    highSeason?: { tiers: { party: number; total: number }[]; windows: { from: string; to: string }[] };
    /** Plan-based products: each plan is a price for a base party (`extraGuest.included`),
     *  regular and peak season; further guests add `extraGuest` each up to `upTo`,
     *  and larger parties are quoted. Plan names and blurbs live in `planText`. */
    plans?: {
      id: string;
      /** Plan-priced products: the plan's price for the base party (regular / peak season). */
      regular?: number; peak?: number;
      recommended?: boolean;
      /** Supplement plans: a flat amount added to the party-size table (`tiers` /
       *  `highSeason`) whatever the party size, e.g. a live musician. 0 for the base plan. */
      supplement?: number;
    }[];
    extraGuest?: { regular: number; peak: number; included: number; upTo: number };
    peakWindows?: { from: string; to: string }[];
    /** Per-person products: a smaller party pays as this many guests (e.g. a solo guest pays for two). */
    minCharge?: number;
  };
  /** Localised text for `pricing.plans`, keyed by plan id. */
  planText?: Record<string, { label: string; name: string; performers: string; blurb: string }>;
  /** Optional extras chosen in the request form. No `price` means "on request". */
  addOns?: { id: string; name: string; description: string; price?: number; /** The price is the lowest of several (shown as "From …"). */ priceFrom?: boolean;
    /** Priced per guest (the form multiplies by the party size). */ perGuest?: boolean;
    /** Not offered to larger parties than this. */ maxParty?: number }[];
  /** Experience video. Absent until an asset exists; the whole video section,
   *  the "Watch the experience" link and its anchor are omitted when absent. */
  video?: {
    kind: "youtube" | "vimeo" | "mp4";
    /** YouTube/Vimeo id, or the mp4 URL. */
    src: string;
    poster: string;
    aspect: "16/9" | "9/16" | "4/3" | "1/1";
  };
  /** Note shown beside the gallery, e.g. that the room or dishes vary by date. */
  galleryNote?: string;
  /** Operating pattern from the partner sheet: which days it runs, the start
   *  times offered, and the booking cutoff (days before, Japan-time clock). */
  availability?: {
    daily: boolean;
    /** Every start time the product uses (for dated products: the union of the dates' times). */
    startTimes: string[];
    cutoffDays: number; cutoffTime: string;
    /** Pre-selected start time in the booking box (default: 18:00 if offered, else the first). */
    defaultTime?: string;
    closed?: { from: string; to: string }[];
    /** Products that run on announced dates only (e.g. a teacher's calendar
     *  released every three months): the open dates and each date's start times. */
    dates?: { date: string; times: string[] }[];
  };
  /** One line for the price block: what the headline price buys, e.g.
   *  "Private room · Meal and drinks · English interpreter". Localised. */
  includedShort?: string;
  /** True when tax and service charge are inside the headline price. */
  taxIncluded?: boolean;
  /** Localised line for closures (e.g. "Closed over the New Year holidays"). */
  availabilityNote?: string;
  /** Approximate pin for the map when the exact address is only shared after
   *  booking: a public landmark in the same district, never the venue itself. */
  map?: { lat: number; lng: number; zoom?: number };
  /** Two-plan pages: the alternatives, the pre-selected one and the page copy. */
  variants?: ExperienceVariant[];
  defaultVariant?: string;
  variantCopy?: VariantPageCopy;
  /** Page <title> and meta description when they should not derive from `title` / `tagline`. */
  seoTitle?: string;
  metaDescription?: string;
  /** Three value cards. Falls back to the site-wide trio when absent. */
  highlights?: { title: string; body: string; icon: "group" | "chat" | "interpreter" | "dance" | "meal" | "photo" | "brush" | "car" | "flag" | "spark" }[];
  /** Confirmed with the venue. Absent means "not confirmed" and nothing is
   *  claimed — never "all inclusive" by default. */
  included?: string[];
  notIncluded?: string[];
  /** Vertical timeline. Falls back to `itinerary` (time — text) when absent. */
  schedule?: { time: string; title: string; body?: string; img?: string }[];
  /** Time actually spent with the practitioner, when shorter than `duration`. */
  interactionTime?: string;
  /** Further overview paragraphs under the lead (`tagline`). */
  overview?: string[];
  /** A full-width picture at the end of the overview, shown uncropped. */
  overviewFigure?: { img: string; alt: string; caption?: string };
  /** Replaces the generic "N in total, M with your host" line when the host needs naming. */
  interactionNote?: string;
  /** Replaces the generic map caption, e.g. to say what the pin marks. */
  mapNote?: string;
  /** What is known before booking vs. shared only in the confirmation. */
  venue?: {
    /** Heading and lead for the venue section when the site-wide "The venue" does not fit (e.g. a course arranged per request). */
    heading?: string; lead?: string;
    /** Column headings, when "now" / "once confirmed" is not the right split. */
    knownHeading?: string; afterHeading?: string;
    known: string[]; afterBooking: string[]; img?: string; alt?: string;
  };
  /** Product-specific wording around the request: the button (card, sticky bar
   *  and form), the trust line under it, and the request section's heading and lead. */
  cta?: { label: string; note?: string; heading?: string; lead?: string };
  /** Replaces "Preferred start time" when the time means something else, e.g. departure from the hotel. */
  timeLabel?: string;
  /** Replaces the sample-start note above the schedule. */
  scheduleNote?: string;
  /** Product-specific questions, confirmed with the venue. Site-level
   *  questions (interpreter, dietary, booking flow) are appended by the page. */
  faq?: { q: string; a: string }[];
}

/** Fields that are authored once (English) and shared by every locale. */
export type StructuralKeys = "partySize" | "pricing" | "video" | "status" | "bookingType" | "priceUnit" | "availability" | "map" | "taxIncluded" | "cancellationTiers" | "dietary" | "interpreter" | "skipSiteFaq";

export interface Tour {
  slug: string;
  city: CitySlug;
  /** "request" when the date is confirmed with the operator before booking is final. */
  bookingType?: BookingType;
  title: string;
  tagline: string;
  duration: string;
  price: string;
  group: string;
  img: string;
  alt: string;
  description: string;
}

// Used for absolute URLs in structured data.
export const SITE_ORIGIN = "https://kamehame-japan.com";

/** Guided tours arrange transport between sites, which makes them 旅行業
 *  (travel agency business) rather than a standalone experience. Our operating
 *  partner holds a 旅行サービス手配業 registration, which is business-to-business
 *  only, so tours stay unpublished until a 旅行業 registration is in place.
 *  The tour data below is kept intact: flip this flag to restore them
 *  everywhere — listings, detail pages, navigation, sitemap and cross-sell. */
export const TOURS_PUBLISHED = false;

export const CANCELLATION = "Free cancellation up to 7 days before the experience. Full refund if the session is cancelled by the venue.";

export const cities: City[] = [
  {
    slug: "tokyo", title: "Tokyo", jp: "東京", img: "/images/city-tokyo.jpg",
    lead: "Tokyo keeps its traditions close, a few streets from the neon. We start with a private brush-calligraphy class in Shinjuku: kanji chosen for the meaning of your name, taught in English by a brush-lettering teacher. From Tokyo, there is also a golf day near Mt. Fuji, with a private car from your hotel, and a hands-on ramen class a few minutes from Shibuya. More Tokyo experiences are on the way.",
  },
  {
    slug: "kyoto", title: "Kyoto", jp: "京都", img: "/images/city-kyoto.jpg",
    lead: "Discover a different side of Kyoto through its living traditions. Spend a private evening with a geiko or maiko — dinner, a dance and conversation in your own room — with more Kyoto experiences in food, craft and special access on the way.",
  },
  {
    slug: "osaka", title: "Osaka", jp: "大阪", img: "/images/city-osaka.jpg",
    lead: "Osaka is Japan's kitchen, and Dotonbori is where it cooks loudest. We start right in the middle of it with a hands-on ramen class: noodles from scratch, three broths side by side, taught in English. More Osaka experiences are on the way.",
  },
  {
    slug: "nagoya", title: "Nagoya", jp: "名古屋", img: "/images/city-nagoya.jpg",
    lead: "Nagoya is the city that built modern Japan's industry and keeps a castle at its centre. We begin with the kendo tour, run on weekday afternoons in a dojo arranged for your date by instructors of fifth to seventh dan. More Nagoya experiences are on the way.",
  },
  {
    slug: "okinawa", title: "Okinawa", jp: "沖縄", img: "/images/city-okinawa.jpg",
    lead: "Okinawa has the history of its own kingdom, its own music and a slower clock. We begin with the kendo tour, run on weekday afternoons in a dojo arranged for your date near Naha. More Okinawa experiences are on the way.",
  },
  {
    slug: "kanazawa", title: "Kanazawa", jp: "金沢", img: "/images/city-kanazawa.jpg",
    lead: "Kanazawa kept its samurai quarter, its teahouse districts and its gold leaf through the centuries that flattened other cities. We begin with the kendo tour, run on weekday mornings in a dojo arranged for your date. More Kanazawa experiences are on the way.",
  },
  {
    slug: "himeji", title: "Himeji", jp: "姫路", img: "/images/city-himeji.jpg",
    lead: "Himeji is the white castle, the finest left standing in Japan, and a city that lives in its shadow. We begin with the kendo tour, run on weekday mornings in a dojo arranged for your date. More Himeji experiences are on the way.",
  },
];

export const categories: Category[] = [
  { slug: "sushi", title: "Sushi", tag: "Food", mark: "寿", img: "/images/cat-sushi.jpg",
    lead: "Sushi in Japan is a craft measured in decades, not recipes. These small-group masterclasses put you behind the counter with working chefs in Tokyo and Kyoto — shaping, seasoning and tasting as they do, with an interpreter guide beside you." },
  { slug: "sumo", title: "Sumo", tag: "Traditional", mark: "相", img: "/images/cat-sumo.jpg",
    lead: "Sumo is Japan's oldest living sport, and its daily reality is far more intimate than the arena. Watch morning practice at a working stable at close range and understand the discipline behind the ceremony, with your guide quietly explaining every ritual." },
  { slug: "tea-ceremony", title: "Tea ceremony", tag: "Traditional", mark: "茶", img: "/images/cat-tea.jpg",
    lead: "The tea ceremony distils Japanese hospitality into a single bowl. Sit with a practising tea master, learn the gestures, and share a quiet hour where every movement has meaning — translated gently, never interrupted." },
  { slug: "kimono", title: "Kimono", tag: "Traditional", mark: "着", img: "/images/cat-kimono.jpg",
    lead: "A kimono is worn architecture — silk, season and posture in agreement. Be dressed properly by professional stylists in Tokyo or Kyoto, then walk gardens and lantern-lit lanes that were made to be seen from inside one." },
  { slug: "geisha", title: "Geisha", tag: "Traditional", mark: "芸", img: "/images/geiko-dance.jpg",
    lead: "An evening with a geiko is Kyoto's most guarded invitation. Share conversation, dance and seasonal cuisine in a private setting, with an interpreter who lets the exchange flow naturally in your language." },
  { slug: "swordsmith", title: "Swordsmith", tag: "Traditional", mark: "刀", img: "/images/cat-sword.jpg",
    lead: "The Japanese sword is a thousand years of metallurgy in a single curve. Visit a working forge, watch a licensed swordsmith fold steel the traditional way, and hold history — guided and translated throughout." },
  { slug: "anime-nail-art", title: "Anime nail art", tag: "Pop culture", mark: "爪", img: "/images/cat-nail.jpg",
    lead: "Tokyo's nail artists treat a fingernail like a canvas. Bring your favourite character or design and leave with wearable fan art by an artist who does this every day — a lighter, playful side of Japanese craft." },
  { slug: "calligraphy", title: "Calligraphy", tag: "Arts & crafts", mark: "書", img: "/images/kanji-works-table.jpg",
    lead: "A brush, black ink and one character. Learn the strokes from a teacher, choose kanji that carry your name's meaning, and take home a piece you made yourself." },
  { slug: "ramen", title: "Ramen", tag: "Food", mark: "麺", img: "/images/ramen-noodle-machine.jpg",
    lead: "Ramen is Japan's everyday comfort food, and the quickest way to understand it is to make it: noodles from scratch, the broth, the bowl. Small hands-on classes in Tokyo and Osaka, taught in English." },
  { slug: "kendo", title: "Kendo", tag: "Traditional", mark: "剣", img: "/images/kendo-match.jpg",
    lead: "Kendo is the samurai's sword turned into a discipline: a bow, the footwork, a strike that unites spirit, sword and body. Train in a working Tokyo dojo with an instructor who teaches in English, or spend a quieter hour with the Nihon Kendo Kata and the words the samurai left behind." },
  { slug: "golf", title: "Golf", tag: "Sport", mark: "球", img: "/images/golf-gallery-01-fuji-aerial.webp",
    lead: "Golf in Japan has its own customs and some of the country's finest views. A private golf day in the Mt. Fuji region, with your course and tee time arranged for you, a private car from your Tokyo hotel and English-speaking support." },
  { slug: "samurai", title: "Samurai", tag: "Traditional", mark: "侍", img: "/images/tate-kata-performance.jpg",
    lead: "The samurai left Tokyo its old post towns, its sword schools and a code of conduct that still shapes manners here. Walk a historic district in samurai dress, or learn tate, the choreographed sword combat of Japanese stage and film, with a professional performer." },
  { slug: "rakugo", title: "Rakugo", tag: "Traditional", mark: "噺", img: "/images/rakugo-stage.jpg",
    lead: "Rakugo is Japan's comic storytelling: one performer, a fan and a hand towel, and a whole cast of characters. Hear it performed in English in Asakusa, then walk the district where Tokyo's popular entertainment grew up." },
  { slug: "cooking", title: "Cooking", tag: "Food", mark: "料", img: "/images/cooking-sushi-lesson.jpg",
    lead: "Japanese home and restaurant cooking, taught hands-on by professional chefs: sushi rice, rolls and nigiri, fermented seasonings and the dishes built on them. Small classes where you cook, then sit down to eat." },
  { slug: "ninja", title: "Ninja", tag: "Traditional", mark: "忍", img: "/images/ninja-arashiyama-hero.jpg",
    lead: "The ninja were scouts and survivors, and their skills ran from the blowpipe and the throwing star to breathing and stillness. Try the tools in a Kyoto studio, cast your own shuriken, or sit down to the meditation practice behind the legend in Tokyo." },
  { slug: "knife-making", title: "Knife making", tag: "Arts & crafts", mark: "包", img: "/images/knife-arashiyama-hero.jpg",
    lead: "The Japanese kitchen knife is the sword's quieter descendant. In a workshop in Arashiyama, sharpen a blade on a whetstone, fit its handle and take home a knife you finished yourself." },
];

export const experiences: Experience[] = [
  {
    // Tokyo calligraphy teacher; the partner's own brand is deliberately not
    // shown (guests would find it and book around us). Built from the condition
    // sheet, 2026-09; live since 2026-09-24 at ¥19,800 per person. Dates come from the
    // teacher's lesson calendar and are replaced every three months: ◎ slots have
    // the studio booked; ▲ slots need the studio booked when a request comes in.
    // The calendar has two tables (■ teacher/space, ★ summary); a slot is open
    // when either marks it ◎ or ▲ (teacher, 2026-09-30).
    slug: "kanji-name-calligraphy", city: "tokyo", category: "calligraphy", bookingType: "request", status: "live",
    title: "Your Name in Kanji: Brush Calligraphy Class in Tokyo",
    tagline: "Create a one-of-a-kind kanji artwork inspired by your own name, in a private class in Tokyo. Before the day we ask about your name and its meaning, and the teacher prepares three kanji for you; you choose the one that feels most like you and turn it into art with brush and ink.",
    overview: ["This is not a calligraphy class about writing perfectly or following strict rules. What matters is what your kanji means to you, and expressing it in your own way.", "You start by exploring how the brush moves — lines, dry-brush texture, the moods of ink. Then you choose a style, Cute, Bold or Elegant, and develop your character with one-to-one guidance from the teacher. No experience with brushes or kanji is needed.", "A red seal completes the piece, and it goes home with you: a kanji chosen for you and shaped by your own hands — a piece of art from your time in Tokyo, not just a souvenir."],
    overviewFigure: { img: "/images/kanji-styles.jpg", alt: "Style examples: six kanji brushed in the Cute, Bold and Elegant styles", caption: "The three styles to choose from — Cute, Bold and Elegant (examples)." },
    duration: "About 2 hours", price: "¥19,800", priceUnit: "person", group: "Private · 1–4 guests", ages: "Ages 10+", area: "Tokyo (Shinjuku)",
    img: "/images/kanji-hero-results.jpg", alt: "Two guests smiling with the kanji they brushed in a Tokyo calligraphy class",
    gallery: [
      { img: "/images/kanji-teacher-demo.jpg", alt: "The teacher demonstrates a stroke while a guest practises beside her" },
      { img: "/images/kanji-guests-works.jpg", alt: "Two guests holding their finished kanji, 灯 (light) and 夢 (dream)" },
      { img: "/images/kanji-finished-stand.jpg", alt: "A finished 夢 (dream) on its wooden stand, ready to take home" },
      { img: "/images/kanji-works-table.jpg", alt: "Finished pieces laid out to dry, each with a red seal" },
      { img: "/images/kanji-brush-focus.jpg", alt: "A guest concentrating on his final piece" },
      { img: "/images/kanji-teacher-yume.jpg", alt: "The teacher holding 夢 (dream), brushed in a playful style" },
      { img: "/images/kanji-writing-together.jpg", alt: "Two guests practising at a shared table" },
      { img: "/images/kanji-teacher-guides.jpg", alt: "The teacher guiding a guest's practice sheet" },
      { img: "/images/kanji-teacher-shows.jpg", alt: "The teacher showing a finished character" },
      { img: "/images/kanji-brush-closeup.jpg", alt: "Close-up of a brush on practice paper" },
      { img: "/images/kanji-teacher-check.jpg", alt: "The teacher checking a guest's practice sheets" },
      { img: "/images/kanji-table-setup.jpg", alt: "Brush, ink and inkstone beside a finished 舞 (dance)" },
      { img: "/images/kanji-teacher-seal.jpg", alt: "The teacher with a finished piece and the box of red seals" },
      { img: "/images/kanji-studio.jpg", alt: "The bright studio with a long shared table" },
    ],
    partySize: { min: 1, max: 4 },
    pricing: { minCharge: 2 },
    // 2026-10-07: every day is open to requests (the owner wants to see
    // whether bookings come in); the teacher's calendar is checked per request.
    // Dated availability can come back by restoring `dates` here.
    availability: { daily: true, startTimes: ["10:30", "13:30", "16:00"], cutoffDays: 1, cutoffTime: "18:00" },
    taxIncluded: true,
    interpreter: false,
    langTag: "Taught in English",
    skipSiteFaq: true,
    includedShort: "Teacher-led class · All tools · Your finished piece + stand",
    cancellation: "Days are counted to the date of the class, Japan time. Date changes follow the same scale, if another date has room. The studio is booked by the hour, so arriving late shortens practice rather than extending the class. If the teacher has to cancel, you hear by 17:00 the day before and receive a full refund.",
    cancellationTiers: [{ until: 7, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    highlights: [
      { icon: "chat", title: "Three kanji prepared for you", body: "Before the class we ask about your name and its meaning. The teacher prepares three characters for you; on the day you choose the one that feels most like you." },
      { icon: "brush", title: "Art, not a handwriting test", body: "Choose a style — Cute, Bold or Elegant — and make the character your own. No experience with brushes or kanji needed." },
      { icon: "photo", title: "A piece you take home", body: "Your final work on a shikishi board, sealed with a red stamp and set on a wooden stand — made and handed over the same day." },
      { icon: "group", title: "Just your group", body: "Classes are not shared with other guests: one to four people, one teacher, one long table." },
    ],
    included: [
      "A two-hour class led by the teacher in simple English",
      "All tools for the class: brush, ink, inkstone, felt mat and practice paper — and an apron",
      "Your finished piece on a shikishi board, with a wooden display stand to take home",
      "The red seal on your work, and time for photos at the end",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the studio (meet on site)",
      "The teacher's postcards and prints, on sale at the studio if you would like one",
    ],
    teacher: {
      img: "/images/kanji-teacher-portrait.jpg", alt: "Your teacher, holding a character she brushed",
      credentials: ["7 years of experience teaching Japanese brush lettering art", "Over 25 years of experience in pastel art, watercolor painting, and various other forms of art and craft"],
      comment: "Brushes, ink, and kanji each have a unique beauty and depth that are deeply rooted in Japanese culture. Through this experience, I hope you will enjoy discovering Japanese culture while freely expressing yourself by putting your name, feelings, or personal meaning into a single kanji character. Even if it is your first time, I will guide you carefully and provide personalized support so that everyone can enjoy the experience with confidence.",
    },
    schedule: [
      { time: "10:30", title: "Welcome", body: "What the class involves, and an introduction to the brush, ink and paper." },
      { time: "10:50", title: "Brush practice and choosing your kanji", body: "Get to know the brush — lines, dry-brush texture, the moods of ink — and learn what each of your three kanji means; choose the one that feels like you.", img: "/images/kanji-brush-closeup.jpg" },
      { time: "11:10", title: "Your style: Cute, Bold or Elegant", body: "Choose the direction you like and practise it, with one-to-one guidance from the teacher.", img: "/images/kanji-teacher-demo.jpg" },
      { time: "11:40", title: "Your final piece", body: "A full-size practice run, then the final version on a shikishi board.", img: "/images/kanji-brush-focus.jpg" },
      { time: "12:00", title: "Seal, sharing and photos", body: "The red seal goes on; show each other your work and take photos.", img: "/images/kanji-guests-works.jpg" },
      { time: "12:15", title: "Time to spare", body: "Extra practice, or a chat with the teacher before you go.", img: "/images/kanji-teacher-yume.jpg" },
      { time: "12:30", title: "End of the class" },
    ],
    venue: {
      known: ["A rental studio in Shinjuku, Tokyo — the exact address comes with your confirmation", "Tables and chairs; a bright room with a long shared table", "Meet the teacher at the studio 5 minutes before the start", "Ink stains: wear clothes you don't mind marking — aprons are provided"],
      afterBooking: ["The studio's name and address", "Directions from the nearest station", "The teacher's contact for the day"],
      img: "/images/kanji-studio.jpg", alt: "The studio with its long shared table",
    },
    notesLabel: "Everyone's name and what it means, if you know — plus anything the teacher should know (optional)",
    notesHint: "e.g. Emma — \"whole, universal\"; Liam — \"strong-willed protector\". One of us is left-handed…",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date and a start time. Add each guest's name and its meaning if you know it." },
      { title: "We reply within 24 hours", body: "With whether the class is free on that date, the price and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. We then ask for what the teacher needs: every guest's name and its meaning, nationality, and a phone number for the day." },
    ],
    faq: [
      { q: "Do I need any experience?", a: "No. The class starts with the basic strokes, and the teacher adjusts the pace to your group." },
      { q: "My handwriting isn't neat. Does that matter?", a: "Not at all. The class isn't about writing perfectly: it's about what the kanji means to you and expressing it your way. You choose a style — Cute, Bold or Elegant — and the teacher guides you step by step." },
      { q: "How do you choose kanji for a name that isn't Japanese?", a: "By meaning. Before the class we ask what your name means and where it comes from, as far as you know. The teacher prepares three characters that carry that meaning or image, and explains each one on the day. If you would rather not use your name, tell us a word instead — light, dream, courage." },
      { q: "What do I take home?", a: "Your final piece on a shikishi board, sealed with a red stamp, and a wooden stand to display it." },
      { q: "Which language is the class taught in?", a: "English — the teacher runs the class herself in simple English." },
      { q: "Can children join?", a: "From age 10, because the class uses real ink. Children pay the adult price." },
      { q: "I'm travelling alone. Can I join?", a: "Yes. A class for one is priced as two guests; the booking box shows the total when you choose one guest." },
      { q: "What should I wear?", a: "Clothes you don't mind getting ink on. Aprons are provided." },
      { q: "Can we book at short notice?", a: "Yes, until 6:00 pm JST the day before. The teacher and the studio are booked when your request comes in, so we confirm once both are free for your date — for a class in the next few days, only if they still are." },
      { q: "How does booking work?", a: "Choose a date and send a request; we reply within 24 hours with the price and conditions. Sending the request costs nothing. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
      { q: "What if we are late?", a: "The studio is booked by the hour, so the class ends on time and practice is shorter. Tell us as soon as you know you are running late." },
      { q: "Is transport included?", a: "No. You meet the teacher at the studio in Shinjuku; the address and directions come with your confirmation." },
    ],
    whatYoullDo: ["Learn the basic brush strokes", "Choose kanji that carry your name's meaning", "Brush your final piece on a shikishi board", "Take it home, sealed and on its stand"],
    master: { title: "Your teacher", bio: "Your teacher teaches fude-moji — expressive brush lettering — in Tokyo and runs every class herself.", quote: "" },
    itinerary: ["10:30 — Welcome", "10:50 — Brush practice and choosing your kanji", "11:10 — Your style: Cute, Bold or Elegant", "11:40 — Your final piece", "12:00 — Seal, sharing and photos", "12:15 — Time to spare"],
    goodToKnow: ["Ages 10 and over; children pay the adult price.", "Wear clothes you don't mind marking; aprons are provided.", "Taught in simple English."],
    story: { heading: "Why a name in kanji", body: "Kanji carry meaning, not just sound. Choosing characters for a name is how many Japanese parents name their children — and it turns a souvenir into something that is actually about you." },
  },
  {
    // Ramen-making class near Shibuya, from the partner's OTA listing
    // (2026-10-10). Sale price ¥26,500 per person set by the owner (2026-10-16, was ¥25,000); the
    // partner's name, address, cost, session times, party limits and
    // cancellation terms are still to be confirmed, so the page stays in
    // "preview" until they are. Photos are the partner's own, via its listing.
    slug: "shibuya-ramen-class", city: "tokyo", category: "ramen", bookingType: "request", status: "live",
    title: "Ramen Making Class near Shibuya, Tokyo",
    tagline: "Knead, roll and cut fresh noodles, prepare chicken chashu, then finish three small bowls — tonkotsu, shoyu and miso — and taste them side by side. A 90-minute hands-on class in a small ramen kitchen a few minutes from Shibuya.",
    overview: [
      "Ramen is Japan's everyday comfort food, and this is the quickest way to understand it: make it. In a small teaching kitchen near Shibuya you turn flour and water into noodles by hand, pass the dough through a noodle machine, and finish three small bowls so you can compare the three great broths in one sitting.",
      "The class is run in English and takes about 90 minutes. Everything is provided — ingredients, aprons, tools — and you eat what you make at the end. Vegetarian and vegan versions can be arranged at no extra cost, and a halal-friendly broth with advance notice (a supplement is confirmed with your quote); tell us when you request your date.",
    ],
    duration: "90 minutes", price: "¥26,500", priceUnit: "person", group: "Small class · 1–16 guests", ages: "Ages 6+ (younger children may watch with a parent)", area: "Tokyo (a few minutes from Shibuya)",
    img: "/images/ramen-noodle-machine.jpg", alt: "Two guests feeding a sheet of dough through a hand-cranked noodle machine, fresh noodles falling into the tray",
    gallery: [
      { img: "/images/ramen-dough.jpg", alt: "Gloved hands bringing flour and water together into a dough in a steel bowl" },
      { img: "/images/ramen-fresh-noodles.jpg", alt: "Two guests holding handfuls of the noodles they have just cut" },
      { img: "/images/ramen-boiling.jpg", alt: "A guest lifting freshly boiled noodles from the basket, bowls lined up behind" },
    ],
    galleryNote: "Photos from the partner's kitchen.",
    // Partner sheet 2026-10: every day at 11:00 / 13:30 / 16:00 / 18:30, up to 16 per session, booking by the day before.
    partySize: { min: 1, max: 16 },
    availability: { daily: true, startTimes: ["11:00", "13:30", "16:00", "18:30"], cutoffDays: 1, cutoffTime: "18:00" },
    scheduleNote: "Timings counted from the start of your session; the class runs about 90 minutes.",
    taxIncluded: true,
    interpreter: false,
    langTag: "Taught in English",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the class, Japan time; free cancellation ends 30 days before. The date can be changed once, free of charge, up to 14 days before if another session has room; from 14 days before, a smaller group is charged in full. Private sessions and groups of 20 or more: free cancellation ends 45 days before, half the price from 44 to 29 days before, the full price from 28 days before. If the kitchen has to cancel, you hear by the day before and receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 30, rate: 0 }, { until: 14, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "90-minute class · All ingredients and tools · The ramen you make",
    highlights: [
      { icon: "brush", title: "Noodles from scratch", body: "Flour, water and your own hands: knead the dough, roll it through the noodle machine and cut your noodles." },
      { icon: "meal", title: "Three bowls, three styles", body: "Tonkotsu, shoyu and miso in small bowls, finished with chicken chashu and toppings, so you can taste the differences side by side." },
      { icon: "chat", title: "Taught in English", body: "A small kitchen, an instructor who explains each step in English, and no experience needed." },
      { icon: "group", title: "Vegetarian, vegan and halal-friendly on request", body: "Say so when you request your date: vegetarian and vegan at no extra cost, a halal-friendly broth with advance notice and a supplement confirmed with your quote." },
    ],
    included: [
      "A 90-minute hands-on class in English",
      "All ingredients, tools and an apron",
      "The ramen you make, and a drink with it",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the kitchen (meet on site)",
      "Additional food and drinks ordered on the day",
      "A halal-friendly broth: a supplement, confirmed with your quote",
    ],
    schedule: [
      { time: "0:00", title: "Welcome and aprons on", body: "Meet your instructor, wash up and hear how the class runs." },
      { time: "0:10", title: "The dough", body: "Bring flour and water together and knead until the dough comes right." },
      { time: "0:30", title: "Roll and cut", body: "Pass the dough through the noodle machine, then cut your noodles.", img: "/images/ramen-noodle-machine.jpg" },
      { time: "0:50", title: "Chashu and toppings", body: "Prepare chicken chashu and the toppings while the broths come up to heat." },
      { time: "1:05", title: "Three bowls", body: "Boil your noodles and assemble tonkotsu, shoyu and miso bowls." },
      { time: "1:15", title: "Eat", body: "Taste the three styles side by side and compare notes with your instructor." },
      { time: "1:30", title: "End of the class" },
    ],
    venue: {
      known: ["A small ramen teaching kitchen in Tokyo, a few minutes from Shibuya — the exact address comes with your confirmation", "Wheelchair and stroller accessible; infants need their own seat", "Arrive 15 minutes before the start: the kitchen can wait at most 5 to 10 minutes after the start, so later arrivals cannot join the session", "Flour in the air and shared equipment: not recommended for anyone with coeliac disease or a severe wheat or gluten allergy", "Allergens handled in the kitchen: wheat, egg, milk, soy, pork, chicken, beef and gelatin — tell us about allergies when you request"],
      afterBooking: ["The kitchen's name, address and entrance instructions", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/ramen-fresh-noodles.jpg", alt: "Two guests holding their freshly cut noodles in the teaching kitchen",
    },
    notesLabel: "Dietary needs and requests (optional)",
    notesHint: "e.g. one of us is vegetarian; a halal-friendly bowl for two; allergies we should know about",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date and a start time — 11:00, 13:30, 16:00 or 18:30 — and tell us how many of you there are. Say if anyone needs a vegetarian, vegan or halal-friendly bowl." },
      { title: "We reply within 24 hours", body: "With the session time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The kitchen's address and entrance instructions come with your confirmation." },
    ],
    faq: [
      { q: "Do I need any cooking experience?", a: "No. The instructor shows every step, and the dough is forgiving. If you can knead, you can make noodles." },
      { q: "What do we actually make?", a: "Fresh noodles from scratch, chicken chashu, and three small bowls — tonkotsu, shoyu and miso — finished with toppings, so you can taste the three styles side by side. Vegetarian, vegan and halal-friendly bowls differ in content." },
      { q: "Is there a vegetarian, vegan or halal option?", a: "Yes. Vegetarian and vegan bowls are arranged at no extra cost. A halal-friendly broth can be arranged with advance notice; the supplement is confirmed with your quote. Tell us when you request your date." },
      { q: "Which language is the class in?", a: "English. The instructor runs the class in English and Japanese." },
      { q: "Can children join?", a: "From about age 6. Younger children cannot take part but may watch alongside a parent; the kitchen is stroller accessible. Children pay the adult price." },
      { q: "I'm travelling alone. Can I join?", a: "Yes, from one guest." },
      { q: "Can groups book?", a: "Up to 16 guests share a session. Larger groups and private sessions are quoted individually." },
      { q: "Can we book at short notice?", a: "Yes, until 6:00 pm JST the day before, if the session still has room. Sessions run every day at 11:00, 13:30, 16:00 and 18:30." },
      { q: "What is the cancellation policy?", a: "Free cancellation ends 30 days before the class; from 29 to 14 days before, half the price; from 13 days before, the full price. The date can be changed once, free, up to 14 days before if another session has room. Private sessions and groups of 20 or more: free cancellation ends 45 days before; from 44 to 29 days before, half the price; from 28 days before, the full price, with one free date change up to 29 days before." },
      { q: "I have a wheat or gluten allergy.", a: "The class is not recommended for anyone with coeliac disease or a severe wheat or gluten allergy: there is flour in the air and the equipment is shared." },
      { q: "What if we are late?", a: "Please arrive 15 minutes before the start. To keep every session on time, the kitchen can wait at most 5 to 10 minutes after the start, after which you cannot join; we will try to move you to another session, which may carry a rescheduling fee." },
      { q: "Is transport included?", a: "No. You meet at the kitchen, a few minutes from Shibuya; the address and directions come with your confirmation." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the session time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Knead, roll and cut fresh noodles", "Prepare chicken chashu and the toppings", "Finish three small bowls: tonkotsu, shoyu and miso", "Eat what you made"],
    master: { title: "Your instructor", bio: "A ramen cook who teaches small classes in English in a dedicated kitchen near Shibuya.", quote: "" },
    itinerary: ["0:00 — Welcome and aprons on", "0:10 — The dough", "0:30 — Roll and cut", "0:50 — Chashu and toppings", "1:05 — Three bowls", "1:15 — Eat", "1:30 — End of the class"],
    goodToKnow: ["About 90 minutes; every day at 11:00, 13:30, 16:00 and 18:30; arrive 15 minutes early.", "From about age 6; younger children may watch with a parent. Children pay the adult price.", "Not recommended for coeliac disease or a severe wheat or gluten allergy.", "Taught in English."],
    story: { heading: "Three broths, one bowl at a time", body: "Tonkotsu, shoyu and miso are the three words every ramen menu in Japan turns on. Making the noodles yourself and tasting the three side by side is the fastest way to know which one is yours." },
  },
  {
    // Ramen-making class in Dotonbori, Osaka: the same operator's second kitchen, from its OTA listing; the partner sheet's conditions were written for this venue
    // (2026-10-10). Sale price ¥26,500 per person set by the owner (2026-10-16, was ¥25,000); the
    // partner's name, address, cost, session times, party limits and
    // cancellation terms are still to be confirmed, so the page stays in
    // "preview" until they are. Photos are the partner's own, via its listing.
    slug: "dotonbori-ramen-class", city: "osaka", category: "ramen", bookingType: "request", status: "live",
    title: "Ramen Making Class in Dotonbori, Osaka",
    tagline: "Knead, roll and cut fresh noodles, prepare chicken chashu, then finish three small bowls — tonkotsu, shoyu and miso — and taste them side by side. A 90-minute hands-on class in a small ramen kitchen in the middle of Dotonbori.",
    overview: [
      "Ramen is Japan's everyday comfort food, and this is the quickest way to understand it: make it. In a small teaching kitchen in Dotonbori, Osaka's loudest food street, you turn flour and water into noodles by hand, pass the dough through a noodle machine, and finish three small bowls so you can compare the three great broths in one sitting.",
      "The class is run in English and takes about 90 minutes. Everything is provided — ingredients, aprons, tools — and you eat what you make at the end. Vegetarian and vegan versions can be arranged at no extra cost, and a halal-friendly broth with advance notice (a supplement is confirmed with your quote); tell us when you request your date.",
    ],
    duration: "90 minutes", price: "¥26,500", priceUnit: "person", group: "Small class · 1–16 guests", ages: "Ages 6+ (younger children may watch with a parent)", area: "Osaka (Dotonbori)",
    img: "/images/ramen-osaka-boiling.jpg", alt: "Two guests lifting freshly boiled noodles from the baskets at the counter of the teaching kitchen",
    gallery: [
      { img: "/images/ramen-osaka-toppings.jpg", alt: "Trays of toppings laid out for the bowls: soft-boiled eggs, bamboo shoots, nori, sweetcorn and spring onion" },
      { img: "/images/ramen-osaka-group.jpg", alt: "A small class holding up the sheets of dough they have just rolled, beside the noodle machines" },
      { img: "/images/ramen-noodle-machine.jpg", alt: "Two guests feeding a sheet of dough through a hand-cranked noodle machine, fresh noodles falling into the tray" },
      { img: "/images/ramen-dough.jpg", alt: "Gloved hands bringing flour and water together into a dough in a steel bowl" },
    ],
    galleryNote: "Photos from the partner's kitchens in Osaka and Tokyo.",
    // Partner sheet 2026-10: every day at 11:00 / 13:30 / 16:00 / 18:30, up to 16 per session, booking by the day before.
    partySize: { min: 1, max: 16 },
    availability: { daily: true, startTimes: ["11:00", "13:30", "16:00", "18:30"], cutoffDays: 1, cutoffTime: "18:00" },
    scheduleNote: "Timings counted from the start of your session; the class runs about 90 minutes.",
    taxIncluded: true,
    interpreter: false,
    langTag: "Taught in English",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the class, Japan time; free cancellation ends 30 days before. The date can be changed once, free of charge, up to 14 days before if another session has room; from 14 days before, a smaller group is charged in full. Private sessions and groups of 20 or more: free cancellation ends 45 days before, half the price from 44 to 29 days before, the full price from 28 days before. If the kitchen has to cancel, you hear by the day before and receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 30, rate: 0 }, { until: 14, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "90-minute class · All ingredients and tools · The ramen you make",
    highlights: [
      { icon: "brush", title: "Noodles from scratch", body: "Flour, water and your own hands: knead the dough, roll it through the noodle machine and cut your noodles." },
      { icon: "meal", title: "Three bowls, three styles", body: "Tonkotsu, shoyu and miso in small bowls, finished with chicken chashu and toppings, so you can taste the differences side by side." },
      { icon: "chat", title: "Taught in English", body: "A small kitchen, an instructor who explains each step in English, and no experience needed." },
      { icon: "group", title: "Vegetarian, vegan and halal-friendly on request", body: "Say so when you request your date: vegetarian and vegan at no extra cost, a halal-friendly broth with advance notice and a supplement confirmed with your quote." },
    ],
    included: [
      "A 90-minute hands-on class in English",
      "All ingredients, tools and an apron",
      "The ramen you make, and a drink with it",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the kitchen (meet on site)",
      "Additional food and drinks ordered on the day",
      "A halal-friendly broth: a supplement, confirmed with your quote",
    ],
    schedule: [
      { time: "0:00", title: "Welcome and aprons on", body: "Meet your instructor, wash up and hear how the class runs." },
      { time: "0:10", title: "The dough", body: "Bring flour and water together and knead until the dough comes right." },
      { time: "0:30", title: "Roll and cut", body: "Pass the dough through the noodle machine, then cut your noodles.", img: "/images/ramen-noodle-machine.jpg" },
      { time: "0:50", title: "Chashu and toppings", body: "Prepare chicken chashu and the toppings while the broths come up to heat." },
      { time: "1:05", title: "Three bowls", body: "Boil your noodles and assemble tonkotsu, shoyu and miso bowls." },
      { time: "1:15", title: "Eat", body: "Taste the three styles side by side and compare notes with your instructor." },
      { time: "1:30", title: "End of the class" },
    ],
    venue: {
      known: ["A small ramen teaching kitchen in Dotonbori, Osaka, a few minutes' walk from Namba station — the exact address comes with your confirmation", "Not wheelchair or stroller accessible; infants need their own seat", "Arrive 15 minutes before the start: the kitchen can wait at most 5 to 10 minutes after the start, so later arrivals cannot join the session", "Flour in the air and shared equipment: not recommended for anyone with coeliac disease or a severe wheat or gluten allergy", "Allergens handled in the kitchen: wheat, egg, milk, soy, pork, chicken, beef and gelatin — tell us about allergies when you request"],
      afterBooking: ["The kitchen's name, address and entrance instructions", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/ramen-osaka-group.jpg", alt: "A small class with their rolled sheets of dough in the Dotonbori teaching kitchen",
    },
    notesLabel: "Dietary needs and requests (optional)",
    notesHint: "e.g. one of us is vegetarian; a halal-friendly bowl for two; allergies we should know about",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date and a start time — 11:00, 13:30, 16:00 or 18:30 — and tell us how many of you there are. Say if anyone needs a vegetarian, vegan or halal-friendly bowl." },
      { title: "We reply within 24 hours", body: "With the session time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The kitchen's address and entrance instructions come with your confirmation." },
    ],
    faq: [
      { q: "Do I need any cooking experience?", a: "No. The instructor shows every step, and the dough is forgiving. If you can knead, you can make noodles." },
      { q: "What do we actually make?", a: "Fresh noodles from scratch, chicken chashu, and three small bowls — tonkotsu, shoyu and miso — finished with toppings, so you can taste the three styles side by side. Vegetarian, vegan and halal-friendly bowls differ in content." },
      { q: "Is there a vegetarian, vegan or halal option?", a: "Yes. Vegetarian and vegan bowls are arranged at no extra cost. A halal-friendly broth can be arranged with advance notice; the supplement is confirmed with your quote. Tell us when you request your date." },
      { q: "Which language is the class in?", a: "English. The instructor runs the class in English and Japanese." },
      { q: "Can children join?", a: "From about age 6. Younger children cannot take part but may watch alongside a parent; the kitchen is not stroller accessible. Children pay the adult price." },
      { q: "I'm travelling alone. Can I join?", a: "Yes, from one guest." },
      { q: "Can groups book?", a: "Up to 16 guests share a session. Larger groups and private sessions are quoted individually." },
      { q: "Can we book at short notice?", a: "Yes, until 6:00 pm JST the day before, if the session still has room. Sessions run every day at 11:00, 13:30, 16:00 and 18:30." },
      { q: "What is the cancellation policy?", a: "Free cancellation ends 30 days before the class; from 29 to 14 days before, half the price; from 13 days before, the full price. The date can be changed once, free, up to 14 days before if another session has room. Private sessions and groups of 20 or more: free cancellation ends 45 days before; from 44 to 29 days before, half the price; from 28 days before, the full price, with one free date change up to 29 days before." },
      { q: "I have a wheat or gluten allergy.", a: "The class is not recommended for anyone with coeliac disease or a severe wheat or gluten allergy: there is flour in the air and the equipment is shared." },
      { q: "What if we are late?", a: "Please arrive 15 minutes before the start. To keep every session on time, the kitchen can wait at most 5 to 10 minutes after the start, after which you cannot join; we will try to move you to another session, which may carry a rescheduling fee." },
      { q: "Is transport included?", a: "No. You meet at the kitchen in Dotonbori, a few minutes' walk from Namba station; the address and directions come with your confirmation." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the session time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Knead, roll and cut fresh noodles", "Prepare chicken chashu and the toppings", "Finish three small bowls: tonkotsu, shoyu and miso", "Eat what you made"],
    master: { title: "Your instructor", bio: "A ramen cook who teaches small classes in English in a dedicated kitchen in Dotonbori.", quote: "" },
    itinerary: ["0:00 — Welcome and aprons on", "0:10 — The dough", "0:30 — Roll and cut", "0:50 — Chashu and toppings", "1:05 — Three bowls", "1:15 — Eat", "1:30 — End of the class"],
    goodToKnow: ["About 90 minutes; every day at 11:00, 13:30, 16:00 and 18:30; arrive 15 minutes early.", "From about age 6; younger children may watch with a parent. Children pay the adult price.", "Not recommended for coeliac disease or a severe wheat or gluten allergy.", "Taught in English."],
    story: { heading: "Three broths, one bowl at a time", body: "Tonkotsu, shoyu and miso are the three words every ramen menu in Japan turns on. Making the noodles yourself and tasting the three side by side is the fastest way to know which one is yours." },
  },
  {
    // Kendo Spirit (Nihonbashi dojo), from its public pages and PR photos. No
    // condition sheet yet: the sale price, start times and wholesale terms are
    // placeholders (docs/EMAIL_TEMPLATES.md §I). The partner's brand and the
    // founder's name stay off the page so guests cannot book around us.
    slug: "nihonbashi-kendo-experience", city: "tokyo", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience in a Nihonbashi Dojo, Tokyo",
    tagline: "Put on the armour, take up the shinai and train in a working Tokyo dojo: the history and etiquette of kendo, footwork, the swing, striking practice and a match to finish — against the other guests, then the instructor. Two hours, taught in English, from age six.",
    overview: [
      "Kendo is the samurai's sword turned into a discipline, and this is the real thing: a working dojo in Nihonbashi where the instructor trains members every week and teaches visitors in the same room. You start with how kendo came to be and why every exchange begins and ends with a bow, then learn the footwork, the grip and the swing, and put them together in striking practice until spirit, sword and body land as one.",
      "The last part is a match. You face the other guests, then the instructor, in full protective armour. Nobody needs to have held a sword before; the session is built for beginners and adjusted to each person's age and fitness. The dojo lends everything — uniform, armour and shinai — and photographs the session for you.",
    ],
    duration: "About 2 hours", price: "¥20,000", priceUnit: "person", group: "Small class · 1–8 guests", ages: "Ages 6+ (reduced rates for ages 6–15 and 65+)", area: "Tokyo (Nihonbashi)",
    img: "/images/kendo-match.jpg", alt: "A guest in kendo uniform squaring up to the armoured instructor with shinai raised, in a wooden-floored dojo",
    gallery: [
      { img: "/images/kendo-grip.jpg", alt: "The instructor correcting a guest's grip on the shinai, swords crossed" },
      { img: "/images/kendo-sparring.jpg", alt: "Two guests in full armour sparring, shinai crossed at close range" },
      { img: "/images/kendo-shinai.jpg", alt: "A smiling guest in a dark kendo uniform holding her shinai ready" },
      { img: "/images/kendo-family-bow.jpg", alt: "A family of three kneeling in kendo uniforms on the dojo floor" },
      { img: "/images/kendo-men.jpg", alt: "A guest with a checked tenugui tied on his head holding the men helmet before putting it on" },
      { img: "/images/kendo-child.jpg", alt: "A child in armour raising the shinai over his head to strike at the instructor" },
    ],
    galleryNote: "Photos from the dojo.",
    partySize: { min: 1, max: 8 },
    scheduleNote: "Timings counted from the start of your session; the parts shift a little with the group.",
    taxIncluded: true,
    interpreter: false,
    langTag: "Taught in English",
    skipSiteFaq: true,
    cancellation: "Free cancellation until 24 hours before the start of your session; later than that, including no-shows, the full price is charged. The date can be moved within the same window if another session has room — ask as early as you can. If the dojo has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 1, rate: 0 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Uniform, armour and shinai · Photos and video of your session",
    highlights: [
      { icon: "chat", title: "Begins and ends with a bow", body: "Kendo's etiquette is not decoration. You learn why the bow comes first and what it asks of you, and the rest of the session makes sense from there." },
      { icon: "brush", title: "The fundamentals, properly", body: "Footwork, stance, grip and swing, the way they have been refined and passed down: the fastest route to a strike that counts." },
      { icon: "group", title: "A real match to finish", body: "In full armour, you face the other guests and then challenge the instructor. Win or lose, that is where the lesson lands." },
      { icon: "photo", title: "Taught in English, photographed for you", body: "The instructor runs the session in English and Japanese. The dojo takes photos and video and sends you the files." },
    ],
    included: [
      "A two-hour session in a working dojo, in English (and Japanese)",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "Photos and video taken by the dojo during your session",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the dojo (meet on site; the address and a photo guide from the building entrance come with your confirmation)",
      "A private session for your group only, quoted on request",
    ],
    schedule: [
      { time: "0:00", title: "Change and meet the instructor", body: "Into the uniform, then an introduction to kendo: its history, its spirit and the rules of a match." },
      { time: "0:15", title: "Etiquette and the bow", body: "Why kendo bows, and how to do it properly." },
      { time: "0:30", title: "Spirit, footwork and the swing", body: "The kiai that carries a strike, the sliding footwork that keeps you grounded, and how to hold and swing the shinai.", img: "/images/kendo-grip.jpg" },
      { time: "1:05", title: "Striking practice", body: "Put spirit, footwork and swing together and strike for real." },
      { time: "1:25", title: "The match", body: "In full armour: bouts with the other guests, then your challenge to the instructor.", img: "/images/kendo-sparring.jpg" },
      { time: "1:40", title: "A demonstration", body: "The instructor shows what kendo looks like after years of training." },
      { time: "1:50", title: "Photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo on an upper floor of a building in Nihonbashi, Chūō-ku — six to seven minutes on foot from Ningyōchō, Mitsukoshimae and Shin-Nihombashi stations, 18 minutes from Tokyo Station; the exact address comes with your confirmation", "Changing rooms and lockers on site; come in everyday clothes, the uniform is provided", "Parts of the etiquette are done kneeling on the floor — a chair is provided if that is difficult", "Spectators are welcome", "The session is run for beginners and kendo's injury rate is low; two of the dojo's instructors hold advanced first-aid certification"],
      afterBooking: ["The dojo's address and a Google Maps link", "A photo guide from the building entrance to the dojo", "A phone number for the day"],
      img: "/images/kendo-practice.jpg", alt: "The instructor guiding a guest's shinai in the dojo",
    },
    notesLabel: "Ages, kendo experience and anything the instructor should know (optional)",
    notesHint: "e.g. two adults and a ten-year-old; one of us has practised kendo; a chair for the seated etiquette",
    flow: [
      { title: "Choose a date and send your request", body: "Tell us your date, a preferred time of day and how many of you there are, with everyone's age. Say if anyone has practised kendo before." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The dojo's address and the photo guide to the entrance come with your confirmation." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is designed for complete beginners: the instructor takes you from how to hold the shinai to the basic strikes. Experienced practitioners are welcome too and get more out of the match." },
      { q: "What do we actually do?", a: "The history, spirit and rules of kendo; etiquette and the bow; footwork, grip and swing; striking practice; then a match against the other guests and the instructor, and a short demonstration." },
      { q: "Is everything provided?", a: "Yes. Uniform, protective armour and shinai are lent at no extra cost. Come in everyday clothes; there are changing rooms and lockers." },
      { q: "Which language is the session in?", a: "English. The instructor teaches in English and Japanese." },
      { q: "Can I join alone?", a: "Yes, from one guest. Many guests come on their own." },
      { q: "Can children join?", a: "From age 6, provided they can follow the instructor's directions safely; children aged 6 to 15 pay a reduced rate, and so do guests aged 65 and over — tell us everyone's age in your request and the quote applies it. Younger children cannot join a shared session; a private session can be arranged instead." },
      { q: "Is this a samurai show?", a: "No. It is not a costume or role-play experience. You train in a real dojo, in the kendo that is practised in Japan today, and learn where its traditions come from." },
      { q: "How large is the class?", a: "Up to eight guests share a session. Larger groups, and a private session for your party only, are quoted individually." },
      { q: "I am not sporty. Can I keep up?", a: "Yes. The session is adjusted to each person's age and fitness, and there is no need to perform every movement perfectly. Older guests join regularly; where the etiquette involves kneeling, a chair is provided." },
      { q: "Can we take photos?", a: "Yes, as long as they do not disturb the other guests. The dojo also photographs and films the session and sends you the files." },
      { q: "Can friends come and watch?", a: "Yes, spectators are welcome." },
      { q: "What is the cancellation policy?", a: "Free until 24 hours before the start of your session; later than that, including no-shows, the full price. The date can be moved within the same window if another session has room." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Learn where kendo comes from and why it begins and ends with a bow", "Footwork, grip and swing, then striking practice", "Put on full armour and face the other guests in a match", "Challenge the instructor, then watch a demonstration"],
    master: { title: "Your instructor", bio: "The dojo's founder began kendo at five in Osaka, finished runner-up in the prefectural high-school championship and taught visitors from abroad for years before opening this dojo in 2025 to pass on kendo in English. He or one of the dojo's instructors runs your session.", quote: "Kendo begins and ends with respect." },
    itinerary: ["0:00 — Change and meet the instructor", "0:15 — Etiquette and the bow", "0:30 — Spirit, footwork and the swing", "1:05 — Striking practice", "1:25 — The match", "1:40 — A demonstration", "1:50 — Photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About two hours; come in everyday clothes, everything else is lent.", "From age 6; reduced rates for ages 6–15 and 65+.", "Up to eight guests share a session; private sessions on request.", "Taught in English."],
    story: { heading: "Rei ni hajimari, rei ni owaru", body: "Kendo begins with a bow and ends with a bow. The phrase is the first thing a child learns in a Japanese dojo and the last thing a master lets go of. Two hours is not long enough to understand it — but it is long enough to feel why it is there." },
  },
  {
    // Kendo Spirit's second programme in the same dojo: the Nihon Kendo Kata
    // and the words of the samurai, one hour, no sparring. Same placeholders.
    slug: "nihonbashi-bushido-experience", city: "tokyo", category: "kendo", bookingType: "request", status: "preview",
    title: "Bushido Experience in a Tokyo Dojo: the Nihon Kendo Kata",
    tagline: "An hour in a working Nihonbashi dojo with the Nihon Kendo Kata — the forms that preserve the samurai's sword — and the words the samurai left behind. No armour, no sparring, no single right answer: a quiet hour to find your own.",
    overview: [
      "This is not a samurai show, and the dojo is clear that it is not meant to be fun in the usual sense. Bushido has no single correct answer. What you take from the forms and the words the samurai left behind will be different for everyone, and the hour is built to let you find out what that is.",
      "It moves through three things. Tradition: the Nihon Kendo Kata, performed with a wooden sword, which keep the samurai's techniques and spirit in a fixed sequence of movements — why the bow, why the distance, why this is more than practising with a sword. Words: the sayings the samurai handed down, read with the thoughts behind them. Reflection: what you feel, and how you read it. The session is in English, there is no strenuous exercise, and the dojo photographs it for you.",
    ],
    duration: "About 1 hour", price: "¥10,000", priceUnit: "person", group: "Small class · 2–8 guests", ages: "Ages 15+", area: "Tokyo (Nihonbashi)",
    img: "/images/bushido-kata.jpg", alt: "Two guests in dark kendo uniforms raising wooden swords overhead in unison on the dojo floor",
    gallery: [
      { img: "/images/bushido-seiza.jpg", alt: "Two guests kneeling in seiza with eyes closed, side by side in the dojo" },
      { img: "/images/bushido-stance.jpg", alt: "A guest holding the sword upright in the ready position, looking straight ahead" },
      { img: "/images/bushido-senior.jpg", alt: "A smiling older guest crossing swords with the instructor" },
      { img: "/images/kendo-grip.jpg", alt: "The instructor adjusting a guest's grip, swords crossed" },
    ],
    galleryNote: "Photos from the dojo.",
    partySize: { min: 2, max: 8 },
    scheduleNote: "About an hour; the order of the three parts varies with the group.",
    taxIncluded: true,
    interpreter: false,
    langTag: "Taught in English",
    skipSiteFaq: true,
    cancellation: "Free cancellation until 24 hours before the start of your session; later than that, including no-shows, the full price is charged. The date can be moved within the same window if another session has room — ask as early as you can. If the dojo has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 1, rate: 0 }, { until: 0, rate: 100 }],
    includedShort: "1-hour session · Uniform and wooden sword · Photos of your session",
    highlights: [
      { icon: "brush", title: "Tradition: the Nihon Kendo Kata", body: "The forms that carry the samurai's sword from one generation to the next, performed with a wooden sword. Not a competition — a way of imagining the hearts of those who left them." },
      { icon: "chat", title: "Words", body: "The samurai also left words. Read with the thoughts behind them, they come a little closer than a translation can." },
      { icon: "spark", title: "Reflection", body: "There is no answer outside yourself. What do you feel, and how do you read it? The hour leaves room for that." },
      { icon: "photo", title: "In English, without strain", body: "The session is taught in English, involves no strenuous exercise, and the dojo photographs it for you." },
    ],
    included: [
      "A one-hour session in a working dojo, in English (and Japanese)",
      "Kendo uniform and wooden sword, lent on site",
      "Photos and video taken by the dojo during your session",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the dojo (meet on site; the address and a photo guide from the building entrance come with your confirmation)",
      "A private session for your group only, quoted on request",
    ],
    schedule: [
      { time: "0:00", title: "Change and begin", body: "Into the uniform, a bow, and what Bushido is — and what it is not." },
      { time: "0:10", title: "Tradition", body: "The Nihon Kendo Kata with a wooden sword: the bow, the distance, the forms.", img: "/images/bushido-kata.jpg" },
      { time: "0:35", title: "Words", body: "Sayings the samurai left behind, and the thoughts that were poured into them." },
      { time: "0:50", title: "Reflection", body: "A few minutes of quiet, then your own reading of what you have done." },
      { time: "1:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo on an upper floor of a building in Nihonbashi, Chūō-ku — six to seven minutes on foot from Ningyōchō, Mitsukoshimae and Shin-Nihombashi stations, 18 minutes from Tokyo Station; the exact address comes with your confirmation", "Changing rooms and lockers on site; come in everyday clothes, the uniform is provided", "Parts of the etiquette are done kneeling on the floor — a chair is provided if that is difficult", "Spectators are welcome", "No strenuous exercise: the hour centres on the kata"],
      afterBooking: ["The dojo's address and a Google Maps link", "A photo guide from the building entrance to the dojo", "A phone number for the day"],
      img: "/images/bushido-seiza.jpg", alt: "Guests kneeling quietly in the dojo",
    },
    notesLabel: "Anything the instructor should know (optional)",
    notesHint: "e.g. one of us has practised kendo; a chair for the seated parts; we would like to join as a single guest",
    flow: [
      { title: "Choose a date and send your request", body: "Tell us your date, a preferred time of day and how many of you there are. Sessions take two or more guests; a single guest can ask and we check with the dojo." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The dojo's address and the photo guide to the entrance come with your confirmation." },
    ],
    faq: [
      { q: "What is the Bushido Experience?", a: "An hour that explores the samurai's values through the Nihon Kendo Kata and the words they left behind, and leaves you to reflect on what Bushido means to you." },
      { q: "What do we actually do?", a: "Practise the Nihon Kendo Kata with a wooden sword, read words the samurai handed down, and take a few minutes to reflect." },
      { q: "What is the Nihon Kendo Kata?", a: "A set of fixed forms, passed down to preserve the techniques, principles and spirit of the samurai's sword. It is not about competition: it teaches the bow, the distance and the state of mind the samurai valued." },
      { q: "Do I need any kendo experience?", a: "No. The session is open to complete beginners." },
      { q: "Is it physically demanding?", a: "No. The hour centres on the kata and involves no strenuous exercise, so it suits most guests. Where the etiquette involves kneeling, a chair is provided." },
      { q: "Is there a correct answer to Bushido?", a: "No. What you take from the forms and the words will be different for everyone; that is the point." },
      { q: "Is this a samurai show?", a: "No. You do not dress up and act as a samurai. You explore Bushido through the kata and the words, in a real dojo." },
      { q: "Can I join alone?", a: "Sessions are booked for two or more guests. If you would like to join on your own, say so in your request and we check with the dojo for a date that works." },
      { q: "How is this different from the Kendo Experience?", a: "Bushido is the philosophy of the samurai; kendo is the modern martial art that carries its spirit. This hour asks why those traditions were kept; the two-hour Kendo Experience puts you in armour to practise them." },
      { q: "Which language is the session in?", a: "English. The instructor teaches in English and Japanese." },
      { q: "Can we take photos?", a: "Yes, as long as they do not disturb the other guests. The dojo also photographs and films the session and sends you the files." },
      { q: "What is the cancellation policy?", a: "Free until 24 hours before the start of your session; later than that, including no-shows, the full price. The date can be moved within the same window if another session has room." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Perform the Nihon Kendo Kata with a wooden sword", "Read the words the samurai left behind, with the thoughts behind them", "Sit with what you felt, and find your own reading of Bushido"],
    master: { title: "Your instructor", bio: "The dojo's founder began kendo at five in Osaka and has taught visitors from abroad for years; he opened this dojo in 2025 to pass on kendo and Bushido in English, and runs this hour himself or with one of the dojo's instructors.", quote: "Our role is not to define the meaning. It is to imagine the hearts of those who left these forms behind." },
    itinerary: ["0:00 — Change and begin", "0:10 — Tradition: the Nihon Kendo Kata", "0:35 — Words", "0:50 — Reflection", "1:00 — End of the session"],
    goodToKnow: ["About an hour; no strenuous exercise. Come in everyday clothes.", "Ages 15 and over. Sessions take two or more guests; a single guest can ask.", "Up to eight guests share a session; private sessions on request.", "Taught in English."],
    story: { heading: "A sword with no opponent", body: "The Nihon Kendo Kata were set down in 1912 so that the sword of the samurai would survive the end of the samurai. Two people, wooden swords, fixed forms — and no winner. What is left when nobody wins is the question the hour is about." },
  },
  {
    // Tea ceremony in Yotsuya, from the host's public listing on Airbnb. No
    // agreement, prices or photos from the host yet: price and photos are
    // placeholders (docs/EMAIL_TEMPLATES.md §J); the host and the gallery are
    // not named on the page.
    slug: "yotsuya-tea-ceremony", city: "tokyo", category: "tea-ceremony", bookingType: "request", status: "preview",
    title: "Tea Ceremony in a Yotsuya Tearoom, Tokyo",
    tagline: "Ninety minutes with a tea teacher of the Sōhen school in a small Yotsuya tearoom: the history and etiquette, entering the room the traditional way, a full tea performance, then a bowl of matcha you whisk yourself and a few minutes of quiet. Taught in English, from age five.",
    overview: [
      "The tea ceremony distils Japanese hospitality into a single bowl, and this is a chance to sit inside it rather than watch from the door. Your host is the third generation of her family to teach tea: licensed as an instructor of the Sōhen school in 1993, more than forty years in the practice, and teaching several hundred students a month. She has welcomed visitors from abroad to this tearoom for years.",
      "The ninety minutes follow the shape of a real gathering. You meet at the gallery in Yotsuya, learn how the ceremony came to be and the etiquette of a guest, enter the tearoom the traditional way, and watch the host prepare tea — every movement with a reason. Then you whisk a bowl yourself, under her guidance, and sit for a short meditation before questions and photographs. In English, for a group of up to ten, with socks the only thing to bring.",
    ],
    duration: "About 1.5 hours", price: "¥8,800", priceUnit: "person", group: "Small class · 1–10 guests", ages: "Ages 5+", area: "Tokyo (Yotsuya, Shinjuku-ku)",
    img: "/images/craft-hands.jpg", alt: "Tea ceremony host placing a tea bowl on tatami before seated guests",
    gallery: [
      { img: "/images/cat-tea.jpg", alt: "Host preparing matcha at a tea gathering" },
    ],
    galleryNote: "Placeholder photos; the host's own photos of the tearoom follow.",
    partySize: { min: 1, max: 10 },
    taxIncluded: true,
    interpreter: false,
    langTag: "Taught in English",
    skipSiteFaq: true,
    cancellation: "Free cancellation until the day before your session; from the day itself, including no-shows, the full price is charged. If the host has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 1, rate: 0 }, { until: 0, rate: 100 }],
    includedShort: "90-minute session · The tea you whisk · Taught in English",
    highlights: [
      { icon: "chat", title: "A teacher, not a demonstration", body: "Three generations of tea in one family, a Sōhen-school licence since 1993 and several hundred students a month: your host explains as she goes, in English." },
      { icon: "brush", title: "Enter the room the proper way", body: "The crawl-through door, the alcove, the order of looking: the etiquette of a guest, learnt by doing it." },
      { icon: "meal", title: "A bowl you whisk yourself", body: "After the host's full performance, you prepare matcha with your own hands, with her guidance." },
      { icon: "spark", title: "A few minutes of quiet", body: "A short meditation closes the gathering, before questions and photographs." },
    ],
    included: [
      "A ninety-minute session in English",
      "The matcha you whisk yourself",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the tearoom (meet at the gallery in Yotsuya; the address comes with your confirmation)",
    ],
    schedule: [
      { time: "0:00", title: "Meet at the gallery", body: "A small gallery in Yotsuya; the tearoom is inside." },
      { time: "0:10", title: "History and etiquette", body: "How the tea ceremony came to be, and how a guest behaves." },
      { time: "0:25", title: "Entering the tearoom", body: "Through the small door, the traditional way." },
      { time: "0:35", title: "The host's temae", body: "A full tea performance, bowl by bowl.", img: "/images/craft-hands.jpg" },
      { time: "1:00", title: "Your own bowl", body: "Whisk matcha yourself, under the host's guidance." },
      { time: "1:15", title: "Meditation, questions and photos", body: "A few minutes of quiet, then anything you want to ask." },
      { time: "1:30", title: "End of the session" },
    ],
    venue: {
      known: ["A small tearoom inside a gallery in Yotsuya, Shinjuku-ku, a short walk from Yotsuya station — the exact address comes with your confirmation", "Sitting is on tatami; bring socks (the only thing to bring)", "Light activity, beginner level; from age 5", "Up to ten guests share a session"],
      afterBooking: ["The gallery's name and address", "Directions from Yotsuya station", "A phone number for the day"],
      img: "/images/cat-tea.jpg", alt: "Matcha being prepared at a tea gathering",
    },
    notesLabel: "Dietary needs, children's ages and anything the host should know (optional)",
    notesHint: "e.g. one of us is vegetarian; a child of six joins; we have never sat on tatami",
    flow: [
      { title: "Choose a date and send your request", body: "Tell us your date, a preferred time in the afternoon and how many of you there are, with children's ages." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The gallery's address comes with your confirmation." },
    ],
    faq: [
      { q: "Do I need to know anything about tea?", a: "No. The host explains the history and the etiquette as you go, and the session is built for first-time guests." },
      { q: "What do we actually do?", a: "Learn the history and the etiquette, enter the tearoom the traditional way, watch the host's full performance, whisk a bowl of matcha yourself, then sit for a short meditation before questions and photographs." },
      { q: "Which language is the session in?", a: "English." },
      { q: "Can children join?", a: "Yes, from age 5. Tell us their ages in your request." },
      { q: "Do we sit on the floor?", a: "Yes, on tatami. Socks are the one thing to bring; the host can suggest a more comfortable way to sit if kneeling is difficult." },
      { q: "How large is the group?", a: "Up to ten guests share a session. Larger groups are quoted individually." },
      { q: "What is the cancellation policy?", a: "Free until the day before your session; from the day itself, including no-shows, the full price." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Learn the history of the ceremony and the etiquette of a guest", "Enter the tearoom the traditional way", "Watch a full temae, then whisk your own bowl of matcha", "Sit for a short meditation before questions and photographs"],
    master: { title: "Your host", bio: "The third generation of her family to teach tea, licensed as an instructor of the Sōhen school in 1993, with more than forty years in the practice. She teaches several hundred students a month and has welcomed visitors from abroad to this tearoom since the early days of hosted experiences.", quote: "One time, one meeting. This bowl of tea will never happen again." },
    itinerary: ["0:00 — Meet at the gallery", "0:10 — History and etiquette", "0:25 — Entering the tearoom", "0:35 — The host's temae", "1:00 — Your own bowl", "1:15 — Meditation, questions and photos", "1:30 — End of the session"],
    goodToKnow: ["About ninety minutes; light activity, beginner level.", "From age 5. Up to ten guests share a session.", "Sitting is on tatami; bring socks.", "Taught in English."],
    story: { heading: "One time, one meeting", body: "Ichigo ichie — this gathering, with these people, happens exactly once — is the heart of the tea ceremony. Everything in the room, from the scroll to the single flower, is chosen for this day. The bowl you whisk is part of it." },
  },
  {
    // SAMURAI TRIP (Park For Us Inc.): the kendo experience tour it runs in
    // Tokyo and other cities, from its e-mail of 2026-10-06 to us and its
    // public site (docs/EMAIL_TEMPLATES.md §K). Prices are its wholesale
    // adult rate with tax as a placeholder until ours is set; the operator
    // is not named on the page.
    slug: "tokyo-kendo-experience-tour", city: "tokyo", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience Tour in Tokyo with Dan-ranked Instructors",
    tagline: "A two-hour kendo session for groups of two to two hundred, led by instructors of fifth to seventh dan: into the armour, the bowing ceremony, what the samurai lived by, striking practice and a match. Weekday mornings in a working dojo in Arakawa, Tokyo; also run in Osaka, Kyoto and other cities.",
    overview: [
      "This is the kendo tour that schools, companies and travelling families book when the whole group wants to hold a sword. It is run by an operator that has taken visitors into Japanese dojos since 2016 under the supervision of the All Japan Kendo Federation, with instructors who hold fifth to seventh dan and more than thirty years of kendo, and it scales from a couple to a coachload: every participant is dressed in armour, bows the way a dojo bows, learns what the samurai lived by, practises strikes and ends with a match.",
      "Sessions run on weekday mornings, usually from 10:00, in a working kendo dojo in Higashi-Nippori, Arakawa, about ten to twelve minutes on foot from JR Uguisudani station. The session is in English and Japanese; uniform, armour and shinai are lent, and you leave with a tenugui towel. The same tour runs in Osaka, Kyoto, Nagoya, Okinawa, Kanazawa and Himeji — tell us where you will be.",
    ],
    duration: "About 1.5 to 2 hours", price: "¥19,800", priceUnit: "person", group: "Groups · 2–200 guests", ages: "Ages 9+ (reduced rate for ages 9–13)", area: "Tokyo (Arakawa, near Uguisudani station)",
    img: "/images/kendotour-line.jpg", alt: "A row of guests in kendo uniforms holding shinai out in front of them in a dojo, instructors beyond",
    gallery: [
      { img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up with shinai in a bright hall" },
      { img: "/images/kendotour-grip.jpg", alt: "A smiling instructor correcting a guest's grip, shinai crossed overhead" },
      { img: "/images/kendotour-sparring.jpg", alt: "Two guests in full armour sparring on the dojo floor while the group watches" },
      { img: "/images/kendotour-laugh.jpg", alt: "A guest in armour laughing as he clashes shinai with the instructor" },
      { img: "/images/kendotour-briefing.jpg", alt: "A group in kendo uniforms seated on the floor listening to the instructor's explanation" },
      { img: "/images/kendotour-seiza.jpg", alt: "Guests in dark uniforms kneeling in a row with eyes closed" },
    ],
    galleryNote: "Photos from the operator's tours.",
    partySize: { min: 2, max: 13 },
    scheduleNote: "Timings counted from the start of your session; the operator sets the exact flow for your group's size.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English and Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 15 days before; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment has been ordered for your group, the number of participants cannot be reduced for a refund. Groups of 70 or more book at least a month ahead, and their free cancellation ends a month before the date. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 15, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Full armour and shinai · Dan-ranked instructor · Tenugui to keep",
    highlights: [
      { icon: "group", title: "From two to two hundred", body: "The same session for a couple or a whole school year: every participant in armour, instructors added as the group grows." },
      { icon: "chat", title: "Instructors of fifth to seventh dan", body: "Kendo teachers with more than thirty years of practice, explaining in English and Japanese what the samurai lived by and why the dojo bows." },
      { icon: "brush", title: "Armour, bow, strike, match", body: "Dressing in the armour, the bowing ceremony, striking practice and a match to finish, in a working dojo." },
      { icon: "flag", title: "Tokyo, and six other cities", body: "Weekday mornings in Tokyo; the tour also runs in Osaka, Kyoto, Nagoya, Okinawa, Kanazawa and Himeji on request." },
    ],
    included: [
      "A session of about two hours led by dan-ranked instructors, in English and Japanese",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "The dojo in Arakawa",
      "A tenugui towel to keep, and a bottle of water for groups of up to ten",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the venue (the meeting point comes with your confirmation)",
      "Interpreters for languages other than English and Japanese — bring your own, or ask us",
    ],
    schedule: [
      { time: "0:00", title: "Into the armour", body: "Uniform, hakama and the protective armour, fitted with the instructors' help." },
      { time: "0:20", title: "The bowing ceremony", body: "How a dojo begins, and why." },
      { time: "0:30", title: "What the samurai lived by", body: "A short talk on the samurai, kendo and the spirit behind the bow.", img: "/images/kendotour-briefing.jpg" },
      { time: "0:45", title: "Striking practice", body: "Footwork, the swing and the strike, repeated until they land together." },
      { time: "1:20", title: "The match", body: "Bouts between participants in full armour, with the instructors refereeing.", img: "/images/kendotour-sparring.jpg" },
      { time: "1:45", title: "Closing bow, photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo in Higashi-Nippori, Arakawa, about 10–12 minutes on foot from the north exit of JR Uguisudani station — the dojo's name and exact meeting point come with your confirmation", "Weekday mornings, usually starting at 10:00; no weekends or Japanese public holidays", "Changing space on site; come in everyday clothes, the uniform is provided", "Two weeks before the date the operator needs everyone's gender and approximate height, to prepare the armour", "Private sessions for six adults or more, or for the price of six adults"],
      afterBooking: ["The venue's name, address and meeting point", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up in the hall",
    },
    notesLabel: "Everyone's age, and anything the instructors should know (optional)",
    notesHint: "e.g. two adults and two children of 10 and 12; a school group of 30; we would like Osaka instead of Tokyo",
    flow: [
      { title: "Choose a weekday and send your request", body: "Tell us your date, how many of you there are with everyone's age, and the city if it is not Tokyo. We check the date with the operator." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; the operator then books the venue, the instructors and the equipment, and cancellation terms start. Two weeks before the date we ask for everyone's gender and approximate height for the armour." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is run for beginners of every age and fitness level; the instructors take you from dressing in the armour to a match." },
      { q: "What do we actually do?", a: "Put on the uniform and armour, take part in the bowing ceremony, hear what the samurai lived by, practise strikes, and finish with a match between participants." },
      { q: "When does it run?", a: "Weekday mornings, usually from 10:00. The tour does not run on weekends or Japanese public holidays, so plan for a weekday. The exact start time follows the venue and is confirmed with your quote." },
      { q: "Where is the venue?", a: "A working kendo dojo in Higashi-Nippori, Arakawa, about 10–12 minutes on foot from JR Uguisudani station (north exit). The dojo's name and the meeting point come with your confirmation." },
      { q: "Can children join?", a: "From age 9. Children aged 9 to 13 pay a reduced rate; from 14, the adult rate. Tell us everyone's age in your request and the quote applies it." },
      { q: "How large can the group be?", a: "From two to two hundred. Groups of 14 or more are quoted individually, with lighter equipment options (uniform and shinai without armour, or shinai only) and more instructors." },
      { q: "Can we have the session to ourselves?", a: "Yes, for six adults or more, or for the price of six adults." },
      { q: "Which languages?", a: "English and Japanese. For another language, bring your own interpreter or ask us." },
      { q: "Does the tour run outside Tokyo?", a: "Yes: Osaka, Kyoto, Nagoya, Okinawa, Kanazawa and Himeji. Tell us the city in your request; Nagoya and Okinawa sessions start in the early afternoon." },
      { q: "Anything we should know before we come?", a: "Follow the instructors' and staff's directions throughout: the dojo is a place of training, so keep voices down and leave what you find there untouched. Take off earrings and other accessories when you change. The men, the helmet, is hard to wear over glasses and can damage them, so remove them or wear contact lenses. Valuables stay with you inside the dojo. Never swing or strike with the shinai carelessly, and take care with partners who are smaller than you. Equipment comes in limited sizes; if nothing fits safely, the instructors offer an adapted programme. Don't push yourself: drink water and rest when you need to. The session is in English and Japanese; for other languages, bring your own interpreter." },
      { q: "Why do you need our height and gender?", a: "To prepare armour and uniforms in the right sizes. The operator needs the list two weeks before the date, a month before for groups of 70 or more." },
      { q: "What is the cancellation policy?", a: "Free until 15 days before the session; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment is ordered, a smaller group is not refunded. Groups of 70 or more: free cancellation ends a month before." },
      { q: "How does booking work?", a: "Choose a weekday and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send; the operator then books the venue, instructors and equipment, and cancellation terms start." },
    ],
    whatYoullDo: ["Dress in kendo uniform and full armour", "Take part in the bowing ceremony and hear what the samurai lived by", "Practise footwork, the swing and the strike", "Finish with a match between participants, refereed by the instructors"],
    master: { title: "Your instructors", bio: "Kendo teachers of fifth to seventh dan with more than thirty years of practice, working for an operator that has brought visitors into Japanese dojos since 2016 and has been recognised with national tourism awards. The founder began kendo at five and competed through university and corporate kendo before starting the tour.", quote: "Unify your spirit, mind the manners, and kendo stays with you for life." },
    itinerary: ["0:00 — Into the armour", "0:20 — The bowing ceremony", "0:30 — What the samurai lived by", "0:45 — Striking practice", "1:20 — The match", "1:45 — Closing bow, photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About 1.5 to 2 hours, weekday mornings (no weekends or public holidays), in a dojo in Arakawa near Uguisudani station.", "From age 9; reduced rate for ages 9–13. Two to two hundred guests.", "Everyone's gender and approximate height are needed two weeks before, for the armour.", "English and Japanese."],
    story: { heading: "Ki, ken, tai", body: "A strike only counts in kendo when spirit, sword and body arrive together — ki-ken-tai-itchi. The instructors say it in the first ten minutes and you spend the rest of the session finding out what it means with your own hands." },
  },
  {
    // SAMURAI TRIP (Park For Us Inc.): the kendo experience tour it runs in
    // Osaka and other cities, from its e-mail of 2026-10-06 to us and its
    // public site (docs/EMAIL_TEMPLATES.md §K). Prices are its wholesale
    // adult rate with tax as a placeholder until ours is set; the operator
    // is not named on the page.
    slug: "osaka-kendo-experience-tour", city: "osaka", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience Tour in Osaka with Dan-ranked Instructors",
    tagline: "A two-hour kendo session for groups of two to two hundred, led by instructors of fifth to seventh dan: into the armour, the bowing ceremony, what the samurai lived by, striking practice and a match. Weekday mornings in a Osaka dojo arranged for your date; also run in Tokyo, Kyoto and other cities.",
    overview: [
      "This is the kendo tour that schools, companies and travelling families book when the whole group wants to hold a sword. It is run by an operator that has taken visitors into Japanese dojos since 2016 under the supervision of the All Japan Kendo Federation, with instructors who hold fifth to seventh dan and more than thirty years of kendo, and it scales from a couple to a coachload: every participant is dressed in armour, bows the way a dojo bows, learns what the samurai lived by, practises strikes and ends with a match.",
      "Sessions run on weekday mornings, usually from 10:00, in a working dojo or hall in Osaka that the operator chooses for your date from venues within thirty to fifty minutes of the city centre. The session is in English and Japanese; uniform, armour and shinai are lent, and you leave with a tenugui towel. The same tour runs in Tokyo, Kyoto, Nagoya, Okinawa, Kanazawa and Himeji — tell us where you will be.",
    ],
    duration: "About 1.5 to 2 hours", price: "¥19,800", priceUnit: "person", group: "Groups · 2–200 guests", ages: "Ages 9+ (reduced rate for ages 9–13)", area: "Osaka (dojo chosen for your date)",
    img: "/images/kendotour-line.jpg", alt: "A row of guests in kendo uniforms holding shinai out in front of them in a dojo, instructors beyond",
    gallery: [
      { img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up with shinai in a bright hall" },
      { img: "/images/kendotour-grip.jpg", alt: "A smiling instructor correcting a guest's grip, shinai crossed overhead" },
      { img: "/images/kendotour-sparring.jpg", alt: "Two guests in full armour sparring on the dojo floor while the group watches" },
      { img: "/images/kendotour-laugh.jpg", alt: "A guest in armour laughing as he clashes shinai with the instructor" },
      { img: "/images/kendotour-briefing.jpg", alt: "A group in kendo uniforms seated on the floor listening to the instructor's explanation" },
      { img: "/images/kendotour-seiza.jpg", alt: "Guests in dark uniforms kneeling in a row with eyes closed" },
    ],
    galleryNote: "Photos from the operator's tours.",
    partySize: { min: 2, max: 13 },
    scheduleNote: "Timings counted from the start of your session; the operator sets the exact flow for your group's size.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English and Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 15 days before; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment has been ordered for your group, the number of participants cannot be reduced for a refund. Groups of 70 or more book at least a month ahead, and their free cancellation ends a month before the date. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 15, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Full armour and shinai · Dan-ranked instructor · Tenugui to keep",
    highlights: [
      { icon: "group", title: "From two to two hundred", body: "The same session for a couple or a whole school year: every participant in armour, instructors added as the group grows." },
      { icon: "chat", title: "Instructors of fifth to seventh dan", body: "Kendo teachers with more than thirty years of practice, explaining in English and Japanese what the samurai lived by and why the dojo bows." },
      { icon: "brush", title: "Armour, bow, strike, match", body: "Dressing in the armour, the bowing ceremony, striking practice and a match to finish, in a working dojo." },
      { icon: "flag", title: "Osaka, and six other cities", body: "Weekday mornings in Osaka; the tour also runs in Tokyo, Kyoto, Nagoya, Okinawa, Kanazawa and Himeji on request." },
    ],
    included: [
      "A session of about two hours led by dan-ranked instructors, in English and Japanese",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "The dojo or hall, arranged for your date",
      "A tenugui towel to keep, and a bottle of water for groups of up to ten",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the venue (the meeting point comes with your confirmation)",
      "Interpreters for languages other than English and Japanese — bring your own, or ask us",
    ],
    schedule: [
      { time: "0:00", title: "Into the armour", body: "Uniform, hakama and the protective armour, fitted with the instructors' help." },
      { time: "0:20", title: "The bowing ceremony", body: "How a dojo begins, and why." },
      { time: "0:30", title: "What the samurai lived by", body: "A short talk on the samurai, kendo and the spirit behind the bow.", img: "/images/kendotour-briefing.jpg" },
      { time: "0:45", title: "Striking practice", body: "Footwork, the swing and the strike, repeated until they land together." },
      { time: "1:20", title: "The match", body: "Bouts between participants in full armour, with the instructors refereeing.", img: "/images/kendotour-sparring.jpg" },
      { time: "1:45", title: "Closing bow, photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo or sports hall in Osaka, chosen by the operator for your date from venues within thirty to fifty minutes of the city centre — the meeting point comes with your confirmation; the venue itself cannot be chosen", "Weekday mornings, usually starting at 10:00; no weekends or Japanese public holidays", "Changing space on site; come in everyday clothes, the uniform is provided", "Two weeks before the date the operator needs everyone's gender and approximate height, to prepare the armour", "Private sessions for six adults or more, or for the price of six adults"],
      afterBooking: ["The venue's name, address and meeting point", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up in the hall",
    },
    notesLabel: "Everyone's age, and anything the instructors should know (optional)",
    notesHint: "e.g. two adults and two children of 10 and 12; a school group of 30; we would like Kyoto instead of Osaka",
    flow: [
      { title: "Choose a weekday and send your request", body: "Tell us your date, how many of you there are with everyone's age, and the city if it is not Osaka. We check the date with the operator." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; the operator then books the venue, the instructors and the equipment, and cancellation terms start. Two weeks before the date we ask for everyone's gender and approximate height for the armour." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is run for beginners of every age and fitness level; the instructors take you from dressing in the armour to a match." },
      { q: "What do we actually do?", a: "Put on the uniform and armour, take part in the bowing ceremony, hear what the samurai lived by, practise strikes, and finish with a match between participants." },
      { q: "When does it run?", a: "Weekday mornings, usually from 10:00. The tour does not run on weekends or Japanese public holidays, so plan for a weekday. The exact start time follows the venue and is confirmed with your quote." },
      { q: "Where is the venue?", a: "A kendo dojo or hall in Osaka within thirty to fifty minutes of the city centre, chosen by the operator for your date; the meeting point comes with your confirmation. The venue cannot be chosen." },
      { q: "Can children join?", a: "From age 9. Children aged 9 to 13 pay a reduced rate; from 14, the adult rate. Tell us everyone's age in your request and the quote applies it." },
      { q: "How large can the group be?", a: "From two to two hundred. Groups of 14 or more are quoted individually, with lighter equipment options (uniform and shinai without armour, or shinai only) and more instructors." },
      { q: "Can we have the session to ourselves?", a: "Yes, for six adults or more, or for the price of six adults." },
      { q: "Which languages?", a: "English and Japanese. For another language, bring your own interpreter or ask us." },
      { q: "Does the tour run outside Osaka?", a: "Yes: Tokyo, Kyoto, Nagoya, Okinawa, Kanazawa and Himeji. Tell us the city in your request; Nagoya and Okinawa sessions start in the early afternoon." },
      { q: "Anything we should know before we come?", a: "Follow the instructors' and staff's directions throughout: the dojo is a place of training, so keep voices down and leave what you find there untouched. Take off earrings and other accessories when you change. The men, the helmet, is hard to wear over glasses and can damage them, so remove them or wear contact lenses. Valuables stay with you inside the dojo. Never swing or strike with the shinai carelessly, and take care with partners who are smaller than you. Equipment comes in limited sizes; if nothing fits safely, the instructors offer an adapted programme. Don't push yourself: drink water and rest when you need to. The session is in English and Japanese; for other languages, bring your own interpreter." },
      { q: "Why do you need our height and gender?", a: "To prepare armour and uniforms in the right sizes. The operator needs the list two weeks before the date, a month before for groups of 70 or more." },
      { q: "What is the cancellation policy?", a: "Free until 15 days before the session; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment is ordered, a smaller group is not refunded. Groups of 70 or more: free cancellation ends a month before." },
      { q: "How does booking work?", a: "Choose a weekday and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send; the operator then books the venue, instructors and equipment, and cancellation terms start." },
    ],
    whatYoullDo: ["Dress in kendo uniform and full armour", "Take part in the bowing ceremony and hear what the samurai lived by", "Practise footwork, the swing and the strike", "Finish with a match between participants, refereed by the instructors"],
    master: { title: "Your instructors", bio: "Kendo teachers of fifth to seventh dan with more than thirty years of practice, working for an operator that has brought visitors into Japanese dojos since 2016 and has been recognised with national tourism awards. The founder began kendo at five and competed through university and corporate kendo before starting the tour.", quote: "Unify your spirit, mind the manners, and kendo stays with you for life." },
    itinerary: ["0:00 — Into the armour", "0:20 — The bowing ceremony", "0:30 — What the samurai lived by", "0:45 — Striking practice", "1:20 — The match", "1:45 — Closing bow, photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About 1.5 to 2 hours, weekday mornings (no weekends or public holidays); the venue is chosen for your date.", "From age 9; reduced rate for ages 9–13. Two to two hundred guests.", "Everyone's gender and approximate height are needed two weeks before, for the armour.", "English and Japanese."],
    story: { heading: "Ki, ken, tai", body: "A strike only counts in kendo when spirit, sword and body arrive together — ki-ken-tai-itchi. The instructors say it in the first ten minutes and you spend the rest of the session finding out what it means with your own hands." },
  },
  {
    // SAMURAI TRIP (Park For Us Inc.): the kendo experience tour it runs in
    // Kyoto and other cities, from its e-mail of 2026-10-06 to us and its
    // public site (docs/EMAIL_TEMPLATES.md §K). Prices are its wholesale
    // adult rate with tax as a placeholder until ours is set; the operator
    // is not named on the page.
    slug: "kyoto-kendo-experience-tour", city: "kyoto", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience Tour in Kyoto with Dan-ranked Instructors",
    tagline: "A two-hour kendo session for groups of two to two hundred, led by instructors of fifth to seventh dan: into the armour, the bowing ceremony, what the samurai lived by, striking practice and a match. Weekday mornings in a Kyoto dojo arranged for your date; also run in Tokyo, Osaka and other cities.",
    overview: [
      "This is the kendo tour that schools, companies and travelling families book when the whole group wants to hold a sword. It is run by an operator that has taken visitors into Japanese dojos since 2016 under the supervision of the All Japan Kendo Federation, with instructors who hold fifth to seventh dan and more than thirty years of kendo, and it scales from a couple to a coachload: every participant is dressed in armour, bows the way a dojo bows, learns what the samurai lived by, practises strikes and ends with a match.",
      "Sessions run on weekday mornings, usually from 10:00, in a working dojo or hall in Kyoto that the operator chooses for your date from venues within thirty to fifty minutes of the city centre. The session is in English and Japanese; uniform, armour and shinai are lent, and you leave with a tenugui towel. The same tour runs in Tokyo, Osaka, Nagoya, Okinawa, Kanazawa and Himeji — tell us where you will be.",
    ],
    duration: "About 1.5 to 2 hours", price: "¥19,800", priceUnit: "person", group: "Groups · 2–200 guests", ages: "Ages 9+ (reduced rate for ages 9–13)", area: "Kyoto (dojo chosen for your date)",
    img: "/images/kendotour-line.jpg", alt: "A row of guests in kendo uniforms holding shinai out in front of them in a dojo, instructors beyond",
    gallery: [
      { img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up with shinai in a bright hall" },
      { img: "/images/kendotour-grip.jpg", alt: "A smiling instructor correcting a guest's grip, shinai crossed overhead" },
      { img: "/images/kendotour-sparring.jpg", alt: "Two guests in full armour sparring on the dojo floor while the group watches" },
      { img: "/images/kendotour-laugh.jpg", alt: "A guest in armour laughing as he clashes shinai with the instructor" },
      { img: "/images/kendotour-briefing.jpg", alt: "A group in kendo uniforms seated on the floor listening to the instructor's explanation" },
      { img: "/images/kendotour-seiza.jpg", alt: "Guests in dark uniforms kneeling in a row with eyes closed" },
    ],
    galleryNote: "Photos from the operator's tours.",
    partySize: { min: 2, max: 13 },
    scheduleNote: "Timings counted from the start of your session; the operator sets the exact flow for your group's size.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English and Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 15 days before; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment has been ordered for your group, the number of participants cannot be reduced for a refund. Groups of 70 or more book at least a month ahead, and their free cancellation ends a month before the date. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 15, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Full armour and shinai · Dan-ranked instructor · Tenugui to keep",
    highlights: [
      { icon: "group", title: "From two to two hundred", body: "The same session for a couple or a whole school year: every participant in armour, instructors added as the group grows." },
      { icon: "chat", title: "Instructors of fifth to seventh dan", body: "Kendo teachers with more than thirty years of practice, explaining in English and Japanese what the samurai lived by and why the dojo bows." },
      { icon: "brush", title: "Armour, bow, strike, match", body: "Dressing in the armour, the bowing ceremony, striking practice and a match to finish, in a working dojo." },
      { icon: "flag", title: "Kyoto, and six other cities", body: "Weekday mornings in Kyoto; the tour also runs in Tokyo, Osaka, Nagoya, Okinawa, Kanazawa and Himeji on request." },
    ],
    included: [
      "A session of about two hours led by dan-ranked instructors, in English and Japanese",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "The dojo or hall, arranged for your date",
      "A tenugui towel to keep, and a bottle of water for groups of up to ten",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the venue (the meeting point comes with your confirmation)",
      "Interpreters for languages other than English and Japanese — bring your own, or ask us",
    ],
    schedule: [
      { time: "0:00", title: "Into the armour", body: "Uniform, hakama and the protective armour, fitted with the instructors' help." },
      { time: "0:20", title: "The bowing ceremony", body: "How a dojo begins, and why." },
      { time: "0:30", title: "What the samurai lived by", body: "A short talk on the samurai, kendo and the spirit behind the bow.", img: "/images/kendotour-briefing.jpg" },
      { time: "0:45", title: "Striking practice", body: "Footwork, the swing and the strike, repeated until they land together." },
      { time: "1:20", title: "The match", body: "Bouts between participants in full armour, with the instructors refereeing.", img: "/images/kendotour-sparring.jpg" },
      { time: "1:45", title: "Closing bow, photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo or sports hall in Kyoto, chosen by the operator for your date from venues within thirty to fifty minutes of the city centre — the meeting point comes with your confirmation; the venue itself cannot be chosen", "Weekday mornings, usually starting at 10:00; no weekends or Japanese public holidays", "Changing space on site; come in everyday clothes, the uniform is provided", "Two weeks before the date the operator needs everyone's gender and approximate height, to prepare the armour", "Private sessions for six adults or more, or for the price of six adults"],
      afterBooking: ["The venue's name, address and meeting point", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up in the hall",
    },
    notesLabel: "Everyone's age, and anything the instructors should know (optional)",
    notesHint: "e.g. two adults and two children of 10 and 12; a school group of 30; we would like Osaka instead of Kyoto",
    flow: [
      { title: "Choose a weekday and send your request", body: "Tell us your date, how many of you there are with everyone's age, and the city if it is not Kyoto. We check the date with the operator." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; the operator then books the venue, the instructors and the equipment, and cancellation terms start. Two weeks before the date we ask for everyone's gender and approximate height for the armour." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is run for beginners of every age and fitness level; the instructors take you from dressing in the armour to a match." },
      { q: "What do we actually do?", a: "Put on the uniform and armour, take part in the bowing ceremony, hear what the samurai lived by, practise strikes, and finish with a match between participants." },
      { q: "When does it run?", a: "Weekday mornings, usually from 10:00. The tour does not run on weekends or Japanese public holidays, so plan for a weekday. The exact start time follows the venue and is confirmed with your quote." },
      { q: "Where is the venue?", a: "A kendo dojo or hall in Kyoto within thirty to fifty minutes of the city centre, chosen by the operator for your date; the meeting point comes with your confirmation. The venue cannot be chosen." },
      { q: "Can children join?", a: "From age 9. Children aged 9 to 13 pay a reduced rate; from 14, the adult rate. Tell us everyone's age in your request and the quote applies it." },
      { q: "How large can the group be?", a: "From two to two hundred. Groups of 14 or more are quoted individually, with lighter equipment options (uniform and shinai without armour, or shinai only) and more instructors." },
      { q: "Can we have the session to ourselves?", a: "Yes, for six adults or more, or for the price of six adults." },
      { q: "Which languages?", a: "English and Japanese. For another language, bring your own interpreter or ask us." },
      { q: "Does the tour run outside Kyoto?", a: "Yes: Tokyo, Osaka, Nagoya, Okinawa, Kanazawa and Himeji. Tell us the city in your request; Nagoya and Okinawa sessions start in the early afternoon." },
      { q: "Anything we should know before we come?", a: "Follow the instructors' and staff's directions throughout: the dojo is a place of training, so keep voices down and leave what you find there untouched. Take off earrings and other accessories when you change. The men, the helmet, is hard to wear over glasses and can damage them, so remove them or wear contact lenses. Valuables stay with you inside the dojo. Never swing or strike with the shinai carelessly, and take care with partners who are smaller than you. Equipment comes in limited sizes; if nothing fits safely, the instructors offer an adapted programme. Don't push yourself: drink water and rest when you need to. The session is in English and Japanese; for other languages, bring your own interpreter." },
      { q: "Why do you need our height and gender?", a: "To prepare armour and uniforms in the right sizes. The operator needs the list two weeks before the date, a month before for groups of 70 or more." },
      { q: "What is the cancellation policy?", a: "Free until 15 days before the session; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment is ordered, a smaller group is not refunded. Groups of 70 or more: free cancellation ends a month before." },
      { q: "How does booking work?", a: "Choose a weekday and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send; the operator then books the venue, instructors and equipment, and cancellation terms start." },
    ],
    whatYoullDo: ["Dress in kendo uniform and full armour", "Take part in the bowing ceremony and hear what the samurai lived by", "Practise footwork, the swing and the strike", "Finish with a match between participants, refereed by the instructors"],
    master: { title: "Your instructors", bio: "Kendo teachers of fifth to seventh dan with more than thirty years of practice, working for an operator that has brought visitors into Japanese dojos since 2016 and has been recognised with national tourism awards. The founder began kendo at five and competed through university and corporate kendo before starting the tour.", quote: "Unify your spirit, mind the manners, and kendo stays with you for life." },
    itinerary: ["0:00 — Into the armour", "0:20 — The bowing ceremony", "0:30 — What the samurai lived by", "0:45 — Striking practice", "1:20 — The match", "1:45 — Closing bow, photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About 1.5 to 2 hours, weekday mornings (no weekends or public holidays); the venue is chosen for your date.", "From age 9; reduced rate for ages 9–13. Two to two hundred guests.", "Everyone's gender and approximate height are needed two weeks before, for the armour.", "English and Japanese."],
    story: { heading: "Ki, ken, tai", body: "A strike only counts in kendo when spirit, sword and body arrive together — ki-ken-tai-itchi. The instructors say it in the first ten minutes and you spend the rest of the session finding out what it means with your own hands." },
  },
  {
    // SAMURAI TRIP (Park For Us Inc.): the kendo experience tour it runs in
    // Nagoya and other cities, from its e-mail of 2026-10-06 to us and its
    // public site (docs/EMAIL_TEMPLATES.md §K). Prices are its wholesale
    // adult rate with tax as a placeholder until ours is set; the operator
    // is not named on the page.
    slug: "nagoya-kendo-experience-tour", city: "nagoya", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience Tour in Nagoya with Dan-ranked Instructors",
    tagline: "A two-hour kendo session for groups of two to two hundred, led by instructors of fifth to seventh dan: into the armour, the bowing ceremony, what the samurai lived by, striking practice and a match. Weekday afternoons in a Nagoya dojo arranged for your date; also run in Tokyo, Osaka and other cities.",
    overview: [
      "This is the kendo tour that schools, companies and travelling families book when the whole group wants to hold a sword. It is run by an operator that has taken visitors into Japanese dojos since 2016 under the supervision of the All Japan Kendo Federation, with instructors who hold fifth to seventh dan and more than thirty years of kendo, and it scales from a couple to a coachload: every participant is dressed in armour, bows the way a dojo bows, learns what the samurai lived by, practises strikes and ends with a match.",
      "Sessions run on weekday afternoons, usually from 13:30, in a working dojo or hall in Nagoya that the operator chooses for your date from venues within thirty to fifty minutes of the city centre. The session is in English and Japanese; uniform, armour and shinai are lent, and you leave with a tenugui towel. The same tour runs in Tokyo, Osaka, Kyoto, Okinawa, Kanazawa and Himeji — tell us where you will be.",
    ],
    duration: "About 1.5 to 2 hours", price: "¥19,800", priceUnit: "person", group: "Groups · 2–200 guests", ages: "Ages 9+ (reduced rate for ages 9–13)", area: "Nagoya (dojo chosen for your date)",
    img: "/images/kendotour-line.jpg", alt: "A row of guests in kendo uniforms holding shinai out in front of them in a dojo, instructors beyond",
    gallery: [
      { img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up with shinai in a bright hall" },
      { img: "/images/kendotour-grip.jpg", alt: "A smiling instructor correcting a guest's grip, shinai crossed overhead" },
      { img: "/images/kendotour-sparring.jpg", alt: "Two guests in full armour sparring on the dojo floor while the group watches" },
      { img: "/images/kendotour-laugh.jpg", alt: "A guest in armour laughing as he clashes shinai with the instructor" },
      { img: "/images/kendotour-briefing.jpg", alt: "A group in kendo uniforms seated on the floor listening to the instructor's explanation" },
      { img: "/images/kendotour-seiza.jpg", alt: "Guests in dark uniforms kneeling in a row with eyes closed" },
    ],
    galleryNote: "Photos from the operator's tours.",
    partySize: { min: 2, max: 13 },
    scheduleNote: "Timings counted from the start of your session; the operator sets the exact flow for your group's size.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English and Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 15 days before; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment has been ordered for your group, the number of participants cannot be reduced for a refund. Groups of 70 or more book at least a month ahead, and their free cancellation ends a month before the date. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 15, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Full armour and shinai · Dan-ranked instructor · Tenugui to keep",
    highlights: [
      { icon: "group", title: "From two to two hundred", body: "The same session for a couple or a whole school year: every participant in armour, instructors added as the group grows." },
      { icon: "chat", title: "Instructors of fifth to seventh dan", body: "Kendo teachers with more than thirty years of practice, explaining in English and Japanese what the samurai lived by and why the dojo bows." },
      { icon: "brush", title: "Armour, bow, strike, match", body: "Dressing in the armour, the bowing ceremony, striking practice and a match to finish, in a working dojo." },
      { icon: "flag", title: "Nagoya, and six other cities", body: "Weekday afternoons in Nagoya; the tour also runs in Tokyo, Osaka, Kyoto, Okinawa, Kanazawa and Himeji on request." },
    ],
    included: [
      "A session of about two hours led by dan-ranked instructors, in English and Japanese",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "The dojo or hall, arranged for your date",
      "A tenugui towel to keep, and a bottle of water for groups of up to ten",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the venue (the meeting point comes with your confirmation)",
      "Interpreters for languages other than English and Japanese — bring your own, or ask us",
    ],
    schedule: [
      { time: "0:00", title: "Into the armour", body: "Uniform, hakama and the protective armour, fitted with the instructors' help." },
      { time: "0:20", title: "The bowing ceremony", body: "How a dojo begins, and why." },
      { time: "0:30", title: "What the samurai lived by", body: "A short talk on the samurai, kendo and the spirit behind the bow.", img: "/images/kendotour-briefing.jpg" },
      { time: "0:45", title: "Striking practice", body: "Footwork, the swing and the strike, repeated until they land together." },
      { time: "1:20", title: "The match", body: "Bouts between participants in full armour, with the instructors refereeing.", img: "/images/kendotour-sparring.jpg" },
      { time: "1:45", title: "Closing bow, photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo or sports hall in Nagoya, chosen by the operator for your date from venues within thirty to fifty minutes of the city centre — the meeting point comes with your confirmation; the venue itself cannot be chosen", "Weekday afternoons, usually starting at 13:30; no weekends or Japanese public holidays", "Changing space on site; come in everyday clothes, the uniform is provided", "Two weeks before the date the operator needs everyone's gender and approximate height, to prepare the armour", "Private sessions for six adults or more, or for the price of six adults"],
      afterBooking: ["The venue's name, address and meeting point", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up in the hall",
    },
    notesLabel: "Everyone's age, and anything the instructors should know (optional)",
    notesHint: "e.g. two adults and two children of 10 and 12; a school group of 30; we would like Osaka instead of Nagoya",
    flow: [
      { title: "Choose a weekday and send your request", body: "Tell us your date, how many of you there are with everyone's age, and the city if it is not Nagoya. We check the date with the operator." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; the operator then books the venue, the instructors and the equipment, and cancellation terms start. Two weeks before the date we ask for everyone's gender and approximate height for the armour." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is run for beginners of every age and fitness level; the instructors take you from dressing in the armour to a match." },
      { q: "What do we actually do?", a: "Put on the uniform and armour, take part in the bowing ceremony, hear what the samurai lived by, practise strikes, and finish with a match between participants." },
      { q: "When does it run?", a: "Weekday afternoons, usually from 13:30. The tour does not run on weekends or Japanese public holidays, so plan for a weekday. The exact start time follows the venue and is confirmed with your quote." },
      { q: "Where is the venue?", a: "A kendo dojo or hall in Nagoya within thirty to fifty minutes of the city centre, chosen by the operator for your date; the meeting point comes with your confirmation. The venue cannot be chosen." },
      { q: "Can children join?", a: "From age 9. Children aged 9 to 13 pay a reduced rate; from 14, the adult rate. Tell us everyone's age in your request and the quote applies it." },
      { q: "How large can the group be?", a: "From two to two hundred. Groups of 14 or more are quoted individually, with lighter equipment options (uniform and shinai without armour, or shinai only) and more instructors." },
      { q: "Can we have the session to ourselves?", a: "Yes, for six adults or more, or for the price of six adults." },
      { q: "Which languages?", a: "English and Japanese. For another language, bring your own interpreter or ask us." },
      { q: "Does the tour run outside Nagoya?", a: "Yes: Tokyo, Osaka, Kyoto, Okinawa, Kanazawa and Himeji. Tell us the city in your request; Okinawa also starts in the early afternoon; the other cities run in the morning." },
      { q: "Anything we should know before we come?", a: "Follow the instructors' and staff's directions throughout: the dojo is a place of training, so keep voices down and leave what you find there untouched. Take off earrings and other accessories when you change. The men, the helmet, is hard to wear over glasses and can damage them, so remove them or wear contact lenses. Valuables stay with you inside the dojo. Never swing or strike with the shinai carelessly, and take care with partners who are smaller than you. Equipment comes in limited sizes; if nothing fits safely, the instructors offer an adapted programme. Don't push yourself: drink water and rest when you need to. The session is in English and Japanese; for other languages, bring your own interpreter." },
      { q: "Why do you need our height and gender?", a: "To prepare armour and uniforms in the right sizes. The operator needs the list two weeks before the date, a month before for groups of 70 or more." },
      { q: "What is the cancellation policy?", a: "Free until 15 days before the session; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment is ordered, a smaller group is not refunded. Groups of 70 or more: free cancellation ends a month before." },
      { q: "How does booking work?", a: "Choose a weekday and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send; the operator then books the venue, instructors and equipment, and cancellation terms start." },
    ],
    whatYoullDo: ["Dress in kendo uniform and full armour", "Take part in the bowing ceremony and hear what the samurai lived by", "Practise footwork, the swing and the strike", "Finish with a match between participants, refereed by the instructors"],
    master: { title: "Your instructors", bio: "Kendo teachers of fifth to seventh dan with more than thirty years of practice, working for an operator that has brought visitors into Japanese dojos since 2016 and has been recognised with national tourism awards. The founder began kendo at five and competed through university and corporate kendo before starting the tour.", quote: "Unify your spirit, mind the manners, and kendo stays with you for life." },
    itinerary: ["0:00 — Into the armour", "0:20 — The bowing ceremony", "0:30 — What the samurai lived by", "0:45 — Striking practice", "1:20 — The match", "1:45 — Closing bow, photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About 1.5 to 2 hours, weekday afternoons (no weekends or public holidays); the venue is chosen for your date.", "From age 9; reduced rate for ages 9–13. Two to two hundred guests.", "Everyone's gender and approximate height are needed two weeks before, for the armour.", "English and Japanese."],
    story: { heading: "Ki, ken, tai", body: "A strike only counts in kendo when spirit, sword and body arrive together — ki-ken-tai-itchi. The instructors say it in the first ten minutes and you spend the rest of the session finding out what it means with your own hands." },
  },
  {
    // SAMURAI TRIP (Park For Us Inc.): the kendo experience tour it runs in
    // Okinawa and other cities, from its e-mail of 2026-10-06 to us and its
    // public site (docs/EMAIL_TEMPLATES.md §K). Prices are its wholesale
    // adult rate with tax as a placeholder until ours is set; the operator
    // is not named on the page.
    slug: "okinawa-kendo-experience-tour", city: "okinawa", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience Tour in Okinawa with Dan-ranked Instructors",
    tagline: "A two-hour kendo session for groups of two to two hundred, led by instructors of fifth to seventh dan: into the armour, the bowing ceremony, what the samurai lived by, striking practice and a match. Weekday afternoons in a Okinawa dojo arranged for your date; also run in Tokyo, Osaka and other cities.",
    overview: [
      "This is the kendo tour that schools, companies and travelling families book when the whole group wants to hold a sword. It is run by an operator that has taken visitors into Japanese dojos since 2016 under the supervision of the All Japan Kendo Federation, with instructors who hold fifth to seventh dan and more than thirty years of kendo, and it scales from a couple to a coachload: every participant is dressed in armour, bows the way a dojo bows, learns what the samurai lived by, practises strikes and ends with a match.",
      "Sessions run on weekday afternoons, usually from 13:00, in a working dojo or hall in Okinawa that the operator chooses for your date from venues within thirty to fifty minutes of the city centre. The session is in English and Japanese; uniform, armour and shinai are lent, and you leave with a tenugui towel. The same tour runs in Tokyo, Osaka, Kyoto, Nagoya, Kanazawa and Himeji — tell us where you will be.",
    ],
    duration: "About 1.5 to 2 hours", price: "¥19,800", priceUnit: "person", group: "Groups · 2–200 guests", ages: "Ages 9+ (reduced rate for ages 9–13)", area: "Okinawa (dojo chosen for your date)",
    img: "/images/kendotour-line.jpg", alt: "A row of guests in kendo uniforms holding shinai out in front of them in a dojo, instructors beyond",
    gallery: [
      { img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up with shinai in a bright hall" },
      { img: "/images/kendotour-grip.jpg", alt: "A smiling instructor correcting a guest's grip, shinai crossed overhead" },
      { img: "/images/kendotour-sparring.jpg", alt: "Two guests in full armour sparring on the dojo floor while the group watches" },
      { img: "/images/kendotour-laugh.jpg", alt: "A guest in armour laughing as he clashes shinai with the instructor" },
      { img: "/images/kendotour-briefing.jpg", alt: "A group in kendo uniforms seated on the floor listening to the instructor's explanation" },
      { img: "/images/kendotour-seiza.jpg", alt: "Guests in dark uniforms kneeling in a row with eyes closed" },
    ],
    galleryNote: "Photos from the operator's tours.",
    partySize: { min: 2, max: 13 },
    scheduleNote: "Timings counted from the start of your session; the operator sets the exact flow for your group's size.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English and Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 15 days before; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment has been ordered for your group, the number of participants cannot be reduced for a refund. Groups of 70 or more book at least a month ahead, and their free cancellation ends a month before the date. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 15, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Full armour and shinai · Dan-ranked instructor · Tenugui to keep",
    highlights: [
      { icon: "group", title: "From two to two hundred", body: "The same session for a couple or a whole school year: every participant in armour, instructors added as the group grows." },
      { icon: "chat", title: "Instructors of fifth to seventh dan", body: "Kendo teachers with more than thirty years of practice, explaining in English and Japanese what the samurai lived by and why the dojo bows." },
      { icon: "brush", title: "Armour, bow, strike, match", body: "Dressing in the armour, the bowing ceremony, striking practice and a match to finish, in a working dojo." },
      { icon: "flag", title: "Okinawa, and six other cities", body: "Weekday afternoons in Okinawa; the tour also runs in Tokyo, Osaka, Kyoto, Nagoya, Kanazawa and Himeji on request." },
    ],
    included: [
      "A session of about two hours led by dan-ranked instructors, in English and Japanese",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "The dojo or hall, arranged for your date",
      "A tenugui towel to keep, and a bottle of water for groups of up to ten",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the venue (the meeting point comes with your confirmation)",
      "Interpreters for languages other than English and Japanese — bring your own, or ask us",
    ],
    schedule: [
      { time: "0:00", title: "Into the armour", body: "Uniform, hakama and the protective armour, fitted with the instructors' help." },
      { time: "0:20", title: "The bowing ceremony", body: "How a dojo begins, and why." },
      { time: "0:30", title: "What the samurai lived by", body: "A short talk on the samurai, kendo and the spirit behind the bow.", img: "/images/kendotour-briefing.jpg" },
      { time: "0:45", title: "Striking practice", body: "Footwork, the swing and the strike, repeated until they land together." },
      { time: "1:20", title: "The match", body: "Bouts between participants in full armour, with the instructors refereeing.", img: "/images/kendotour-sparring.jpg" },
      { time: "1:45", title: "Closing bow, photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo or sports hall in Okinawa, chosen by the operator for your date from venues within thirty to fifty minutes of the city centre — the meeting point comes with your confirmation; the venue itself cannot be chosen", "Weekday afternoons, usually starting at 13:00; no weekends or Japanese public holidays", "Changing space on site; come in everyday clothes, the uniform is provided", "Two weeks before the date the operator needs everyone's gender and approximate height, to prepare the armour", "Private sessions for six adults or more, or for the price of six adults"],
      afterBooking: ["The venue's name, address and meeting point", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up in the hall",
    },
    notesLabel: "Everyone's age, and anything the instructors should know (optional)",
    notesHint: "e.g. two adults and two children of 10 and 12; a school group of 30; we would like Osaka instead of Okinawa",
    flow: [
      { title: "Choose a weekday and send your request", body: "Tell us your date, how many of you there are with everyone's age, and the city if it is not Okinawa. We check the date with the operator." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; the operator then books the venue, the instructors and the equipment, and cancellation terms start. Two weeks before the date we ask for everyone's gender and approximate height for the armour." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is run for beginners of every age and fitness level; the instructors take you from dressing in the armour to a match." },
      { q: "What do we actually do?", a: "Put on the uniform and armour, take part in the bowing ceremony, hear what the samurai lived by, practise strikes, and finish with a match between participants." },
      { q: "When does it run?", a: "Weekday afternoons, usually from 13:00. The tour does not run on weekends or Japanese public holidays, so plan for a weekday. The exact start time follows the venue and is confirmed with your quote." },
      { q: "Where is the venue?", a: "A kendo dojo or hall in Okinawa within thirty to fifty minutes of the city centre, chosen by the operator for your date; the meeting point comes with your confirmation. The venue cannot be chosen." },
      { q: "Can children join?", a: "From age 9. Children aged 9 to 13 pay a reduced rate; from 14, the adult rate. Tell us everyone's age in your request and the quote applies it." },
      { q: "How large can the group be?", a: "From two to two hundred. Groups of 14 or more are quoted individually, with lighter equipment options (uniform and shinai without armour, or shinai only) and more instructors." },
      { q: "Can we have the session to ourselves?", a: "Yes, for six adults or more, or for the price of six adults." },
      { q: "Which languages?", a: "English and Japanese. For another language, bring your own interpreter or ask us." },
      { q: "Does the tour run outside Okinawa?", a: "Yes: Tokyo, Osaka, Kyoto, Nagoya, Kanazawa and Himeji. Tell us the city in your request; Nagoya also starts in the early afternoon; the other cities run in the morning." },
      { q: "Anything we should know before we come?", a: "Follow the instructors' and staff's directions throughout: the dojo is a place of training, so keep voices down and leave what you find there untouched. Take off earrings and other accessories when you change. The men, the helmet, is hard to wear over glasses and can damage them, so remove them or wear contact lenses. Valuables stay with you inside the dojo. Never swing or strike with the shinai carelessly, and take care with partners who are smaller than you. Equipment comes in limited sizes; if nothing fits safely, the instructors offer an adapted programme. Don't push yourself: drink water and rest when you need to. The session is in English and Japanese; for other languages, bring your own interpreter." },
      { q: "Why do you need our height and gender?", a: "To prepare armour and uniforms in the right sizes. The operator needs the list two weeks before the date, a month before for groups of 70 or more." },
      { q: "What is the cancellation policy?", a: "Free until 15 days before the session; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment is ordered, a smaller group is not refunded. Groups of 70 or more: free cancellation ends a month before." },
      { q: "How does booking work?", a: "Choose a weekday and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send; the operator then books the venue, instructors and equipment, and cancellation terms start." },
    ],
    whatYoullDo: ["Dress in kendo uniform and full armour", "Take part in the bowing ceremony and hear what the samurai lived by", "Practise footwork, the swing and the strike", "Finish with a match between participants, refereed by the instructors"],
    master: { title: "Your instructors", bio: "Kendo teachers of fifth to seventh dan with more than thirty years of practice, working for an operator that has brought visitors into Japanese dojos since 2016 and has been recognised with national tourism awards. The founder began kendo at five and competed through university and corporate kendo before starting the tour.", quote: "Unify your spirit, mind the manners, and kendo stays with you for life." },
    itinerary: ["0:00 — Into the armour", "0:20 — The bowing ceremony", "0:30 — What the samurai lived by", "0:45 — Striking practice", "1:20 — The match", "1:45 — Closing bow, photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About 1.5 to 2 hours, weekday afternoons (no weekends or public holidays); the venue is chosen for your date.", "From age 9; reduced rate for ages 9–13. Two to two hundred guests.", "Everyone's gender and approximate height are needed two weeks before, for the armour.", "English and Japanese."],
    story: { heading: "Ki, ken, tai", body: "A strike only counts in kendo when spirit, sword and body arrive together — ki-ken-tai-itchi. The instructors say it in the first ten minutes and you spend the rest of the session finding out what it means with your own hands." },
  },
  {
    // SAMURAI TRIP (Park For Us Inc.): the kendo experience tour it runs in
    // Kanazawa and other cities, from its e-mail of 2026-10-06 to us and its
    // public site (docs/EMAIL_TEMPLATES.md §K). Prices are its wholesale
    // adult rate with tax as a placeholder until ours is set; the operator
    // is not named on the page.
    slug: "kanazawa-kendo-experience-tour", city: "kanazawa", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience Tour in Kanazawa with Dan-ranked Instructors",
    tagline: "A two-hour kendo session for groups of two to two hundred, led by instructors of fifth to seventh dan: into the armour, the bowing ceremony, what the samurai lived by, striking practice and a match. Weekday mornings in a Kanazawa dojo arranged for your date; also run in Tokyo, Osaka and other cities.",
    overview: [
      "This is the kendo tour that schools, companies and travelling families book when the whole group wants to hold a sword. It is run by an operator that has taken visitors into Japanese dojos since 2016 under the supervision of the All Japan Kendo Federation, with instructors who hold fifth to seventh dan and more than thirty years of kendo, and it scales from a couple to a coachload: every participant is dressed in armour, bows the way a dojo bows, learns what the samurai lived by, practises strikes and ends with a match.",
      "Sessions run on weekday mornings, usually from 10:00, in a working dojo or hall in Kanazawa that the operator chooses for your date from venues within thirty to fifty minutes of the city centre. The session is in English and Japanese; uniform, armour and shinai are lent, and you leave with a tenugui towel. The same tour runs in Tokyo, Osaka, Kyoto, Nagoya, Okinawa and Himeji — tell us where you will be.",
    ],
    duration: "About 1.5 to 2 hours", price: "¥19,800", priceUnit: "person", group: "Groups · 2–200 guests", ages: "Ages 9+ (reduced rate for ages 9–13)", area: "Kanazawa (dojo chosen for your date)",
    img: "/images/kendotour-line.jpg", alt: "A row of guests in kendo uniforms holding shinai out in front of them in a dojo, instructors beyond",
    gallery: [
      { img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up with shinai in a bright hall" },
      { img: "/images/kendotour-grip.jpg", alt: "A smiling instructor correcting a guest's grip, shinai crossed overhead" },
      { img: "/images/kendotour-sparring.jpg", alt: "Two guests in full armour sparring on the dojo floor while the group watches" },
      { img: "/images/kendotour-laugh.jpg", alt: "A guest in armour laughing as he clashes shinai with the instructor" },
      { img: "/images/kendotour-briefing.jpg", alt: "A group in kendo uniforms seated on the floor listening to the instructor's explanation" },
      { img: "/images/kendotour-seiza.jpg", alt: "Guests in dark uniforms kneeling in a row with eyes closed" },
    ],
    galleryNote: "Photos from the operator's tours.",
    partySize: { min: 2, max: 13 },
    scheduleNote: "Timings counted from the start of your session; the operator sets the exact flow for your group's size.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English and Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 15 days before; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment has been ordered for your group, the number of participants cannot be reduced for a refund. Groups of 70 or more book at least a month ahead, and their free cancellation ends a month before the date. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 15, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Full armour and shinai · Dan-ranked instructor · Tenugui to keep",
    highlights: [
      { icon: "group", title: "From two to two hundred", body: "The same session for a couple or a whole school year: every participant in armour, instructors added as the group grows." },
      { icon: "chat", title: "Instructors of fifth to seventh dan", body: "Kendo teachers with more than thirty years of practice, explaining in English and Japanese what the samurai lived by and why the dojo bows." },
      { icon: "brush", title: "Armour, bow, strike, match", body: "Dressing in the armour, the bowing ceremony, striking practice and a match to finish, in a working dojo." },
      { icon: "flag", title: "Kanazawa, and six other cities", body: "Weekday mornings in Kanazawa; the tour also runs in Tokyo, Osaka, Kyoto, Nagoya, Okinawa and Himeji on request." },
    ],
    included: [
      "A session of about two hours led by dan-ranked instructors, in English and Japanese",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "The dojo or hall, arranged for your date",
      "A tenugui towel to keep, and a bottle of water for groups of up to ten",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the venue (the meeting point comes with your confirmation)",
      "Interpreters for languages other than English and Japanese — bring your own, or ask us",
    ],
    schedule: [
      { time: "0:00", title: "Into the armour", body: "Uniform, hakama and the protective armour, fitted with the instructors' help." },
      { time: "0:20", title: "The bowing ceremony", body: "How a dojo begins, and why." },
      { time: "0:30", title: "What the samurai lived by", body: "A short talk on the samurai, kendo and the spirit behind the bow.", img: "/images/kendotour-briefing.jpg" },
      { time: "0:45", title: "Striking practice", body: "Footwork, the swing and the strike, repeated until they land together." },
      { time: "1:20", title: "The match", body: "Bouts between participants in full armour, with the instructors refereeing.", img: "/images/kendotour-sparring.jpg" },
      { time: "1:45", title: "Closing bow, photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo or sports hall in Kanazawa, chosen by the operator for your date from venues within thirty to fifty minutes of the city centre — the meeting point comes with your confirmation; the venue itself cannot be chosen", "Weekday mornings, usually starting at 10:00; no weekends or Japanese public holidays", "Changing space on site; come in everyday clothes, the uniform is provided", "Two weeks before the date the operator needs everyone's gender and approximate height, to prepare the armour", "Private sessions for six adults or more, or for the price of six adults"],
      afterBooking: ["The venue's name, address and meeting point", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up in the hall",
    },
    notesLabel: "Everyone's age, and anything the instructors should know (optional)",
    notesHint: "e.g. two adults and two children of 10 and 12; a school group of 30; we would like Osaka instead of Kanazawa",
    flow: [
      { title: "Choose a weekday and send your request", body: "Tell us your date, how many of you there are with everyone's age, and the city if it is not Kanazawa. We check the date with the operator." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; the operator then books the venue, the instructors and the equipment, and cancellation terms start. Two weeks before the date we ask for everyone's gender and approximate height for the armour." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is run for beginners of every age and fitness level; the instructors take you from dressing in the armour to a match." },
      { q: "What do we actually do?", a: "Put on the uniform and armour, take part in the bowing ceremony, hear what the samurai lived by, practise strikes, and finish with a match between participants." },
      { q: "When does it run?", a: "Weekday mornings, usually from 10:00. The tour does not run on weekends or Japanese public holidays, so plan for a weekday. The exact start time follows the venue and is confirmed with your quote." },
      { q: "Where is the venue?", a: "A kendo dojo or hall in Kanazawa within thirty to fifty minutes of the city centre, chosen by the operator for your date; the meeting point comes with your confirmation. The venue cannot be chosen." },
      { q: "Can children join?", a: "From age 9. Children aged 9 to 13 pay a reduced rate; from 14, the adult rate. Tell us everyone's age in your request and the quote applies it." },
      { q: "How large can the group be?", a: "From two to two hundred. Groups of 14 or more are quoted individually, with lighter equipment options (uniform and shinai without armour, or shinai only) and more instructors." },
      { q: "Can we have the session to ourselves?", a: "Yes, for six adults or more, or for the price of six adults." },
      { q: "Which languages?", a: "English and Japanese. For another language, bring your own interpreter or ask us." },
      { q: "Does the tour run outside Kanazawa?", a: "Yes: Tokyo, Osaka, Kyoto, Nagoya, Okinawa and Himeji. Tell us the city in your request; Nagoya and Okinawa sessions start in the early afternoon." },
      { q: "Anything we should know before we come?", a: "Follow the instructors' and staff's directions throughout: the dojo is a place of training, so keep voices down and leave what you find there untouched. Take off earrings and other accessories when you change. The men, the helmet, is hard to wear over glasses and can damage them, so remove them or wear contact lenses. Valuables stay with you inside the dojo. Never swing or strike with the shinai carelessly, and take care with partners who are smaller than you. Equipment comes in limited sizes; if nothing fits safely, the instructors offer an adapted programme. Don't push yourself: drink water and rest when you need to. The session is in English and Japanese; for other languages, bring your own interpreter." },
      { q: "Why do you need our height and gender?", a: "To prepare armour and uniforms in the right sizes. The operator needs the list two weeks before the date, a month before for groups of 70 or more." },
      { q: "What is the cancellation policy?", a: "Free until 15 days before the session; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment is ordered, a smaller group is not refunded. Groups of 70 or more: free cancellation ends a month before." },
      { q: "How does booking work?", a: "Choose a weekday and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send; the operator then books the venue, instructors and equipment, and cancellation terms start." },
    ],
    whatYoullDo: ["Dress in kendo uniform and full armour", "Take part in the bowing ceremony and hear what the samurai lived by", "Practise footwork, the swing and the strike", "Finish with a match between participants, refereed by the instructors"],
    master: { title: "Your instructors", bio: "Kendo teachers of fifth to seventh dan with more than thirty years of practice, working for an operator that has brought visitors into Japanese dojos since 2016 and has been recognised with national tourism awards. The founder began kendo at five and competed through university and corporate kendo before starting the tour.", quote: "Unify your spirit, mind the manners, and kendo stays with you for life." },
    itinerary: ["0:00 — Into the armour", "0:20 — The bowing ceremony", "0:30 — What the samurai lived by", "0:45 — Striking practice", "1:20 — The match", "1:45 — Closing bow, photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About 1.5 to 2 hours, weekday mornings (no weekends or public holidays); the venue is chosen for your date.", "From age 9; reduced rate for ages 9–13. Two to two hundred guests.", "Everyone's gender and approximate height are needed two weeks before, for the armour.", "English and Japanese."],
    story: { heading: "Ki, ken, tai", body: "A strike only counts in kendo when spirit, sword and body arrive together — ki-ken-tai-itchi. The instructors say it in the first ten minutes and you spend the rest of the session finding out what it means with your own hands." },
  },
  {
    // SAMURAI TRIP (Park For Us Inc.): the kendo experience tour it runs in
    // Himeji and other cities, from its e-mail of 2026-10-06 to us and its
    // public site (docs/EMAIL_TEMPLATES.md §K). Prices are its wholesale
    // adult rate with tax as a placeholder until ours is set; the operator
    // is not named on the page.
    slug: "himeji-kendo-experience-tour", city: "himeji", category: "kendo", bookingType: "request", status: "preview",
    title: "Kendo Experience Tour in Himeji with Dan-ranked Instructors",
    tagline: "A two-hour kendo session for groups of two to two hundred, led by instructors of fifth to seventh dan: into the armour, the bowing ceremony, what the samurai lived by, striking practice and a match. Weekday mornings in a Himeji dojo arranged for your date; also run in Tokyo, Osaka and other cities.",
    overview: [
      "This is the kendo tour that schools, companies and travelling families book when the whole group wants to hold a sword. It is run by an operator that has taken visitors into Japanese dojos since 2016 under the supervision of the All Japan Kendo Federation, with instructors who hold fifth to seventh dan and more than thirty years of kendo, and it scales from a couple to a coachload: every participant is dressed in armour, bows the way a dojo bows, learns what the samurai lived by, practises strikes and ends with a match.",
      "Sessions run on weekday mornings, usually from 10:00, in a working dojo or hall in Himeji that the operator chooses for your date from venues within thirty to fifty minutes of the city centre. The session is in English and Japanese; uniform, armour and shinai are lent, and you leave with a tenugui towel. The same tour runs in Tokyo, Osaka, Kyoto, Nagoya, Okinawa and Kanazawa — tell us where you will be.",
    ],
    duration: "About 1.5 to 2 hours", price: "¥19,800", priceUnit: "person", group: "Groups · 2–200 guests", ages: "Ages 9+ (reduced rate for ages 9–13)", area: "Himeji (dojo chosen for your date)",
    img: "/images/kendotour-line.jpg", alt: "A row of guests in kendo uniforms holding shinai out in front of them in a dojo, instructors beyond",
    gallery: [
      { img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up with shinai in a bright hall" },
      { img: "/images/kendotour-grip.jpg", alt: "A smiling instructor correcting a guest's grip, shinai crossed overhead" },
      { img: "/images/kendotour-sparring.jpg", alt: "Two guests in full armour sparring on the dojo floor while the group watches" },
      { img: "/images/kendotour-laugh.jpg", alt: "A guest in armour laughing as he clashes shinai with the instructor" },
      { img: "/images/kendotour-briefing.jpg", alt: "A group in kendo uniforms seated on the floor listening to the instructor's explanation" },
      { img: "/images/kendotour-seiza.jpg", alt: "Guests in dark uniforms kneeling in a row with eyes closed" },
    ],
    galleryNote: "Photos from the operator's tours.",
    partySize: { min: 2, max: 13 },
    scheduleNote: "Timings counted from the start of your session; the operator sets the exact flow for your group's size.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English and Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 15 days before; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment has been ordered for your group, the number of participants cannot be reduced for a refund. Groups of 70 or more book at least a month ahead, and their free cancellation ends a month before the date. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 15, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "2-hour session · Full armour and shinai · Dan-ranked instructor · Tenugui to keep",
    highlights: [
      { icon: "group", title: "From two to two hundred", body: "The same session for a couple or a whole school year: every participant in armour, instructors added as the group grows." },
      { icon: "chat", title: "Instructors of fifth to seventh dan", body: "Kendo teachers with more than thirty years of practice, explaining in English and Japanese what the samurai lived by and why the dojo bows." },
      { icon: "brush", title: "Armour, bow, strike, match", body: "Dressing in the armour, the bowing ceremony, striking practice and a match to finish, in a working dojo." },
      { icon: "flag", title: "Himeji, and six other cities", body: "Weekday mornings in Himeji; the tour also runs in Tokyo, Osaka, Kyoto, Nagoya, Okinawa and Kanazawa on request." },
    ],
    included: [
      "A session of about two hours led by dan-ranked instructors, in English and Japanese",
      "Kendo uniform, protective armour and shinai, all lent on site",
      "The dojo or hall, arranged for your date",
      "A tenugui towel to keep, and a bottle of water for groups of up to ten",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to the venue (the meeting point comes with your confirmation)",
      "Interpreters for languages other than English and Japanese — bring your own, or ask us",
    ],
    schedule: [
      { time: "0:00", title: "Into the armour", body: "Uniform, hakama and the protective armour, fitted with the instructors' help." },
      { time: "0:20", title: "The bowing ceremony", body: "How a dojo begins, and why." },
      { time: "0:30", title: "What the samurai lived by", body: "A short talk on the samurai, kendo and the spirit behind the bow.", img: "/images/kendotour-briefing.jpg" },
      { time: "0:45", title: "Striking practice", body: "Footwork, the swing and the strike, repeated until they land together." },
      { time: "1:20", title: "The match", body: "Bouts between participants in full armour, with the instructors refereeing.", img: "/images/kendotour-sparring.jpg" },
      { time: "1:45", title: "Closing bow, photos and changing" },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["A working kendo dojo or sports hall in Himeji, chosen by the operator for your date from venues within thirty to fifty minutes of the city centre — the meeting point comes with your confirmation; the venue itself cannot be chosen", "Weekday mornings, usually starting at 10:00; no weekends or Japanese public holidays", "Changing space on site; come in everyday clothes, the uniform is provided", "Two weeks before the date the operator needs everyone's gender and approximate height, to prepare the armour", "Private sessions for six adults or more, or for the price of six adults"],
      afterBooking: ["The venue's name, address and meeting point", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/kendotour-guests.jpg", alt: "Guests in armour lined up in the hall",
    },
    notesLabel: "Everyone's age, and anything the instructors should know (optional)",
    notesHint: "e.g. two adults and two children of 10 and 12; a school group of 30; we would like Osaka instead of Himeji",
    flow: [
      { title: "Choose a weekday and send your request", body: "Tell us your date, how many of you there are with everyone's age, and the city if it is not Himeji. We check the date with the operator." },
      { title: "We reply within 24 hours", body: "With the start time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; the operator then books the venue, the instructors and the equipment, and cancellation terms start. Two weeks before the date we ask for everyone's gender and approximate height for the armour." },
    ],
    faq: [
      { q: "Do I need any kendo experience?", a: "No. The session is run for beginners of every age and fitness level; the instructors take you from dressing in the armour to a match." },
      { q: "What do we actually do?", a: "Put on the uniform and armour, take part in the bowing ceremony, hear what the samurai lived by, practise strikes, and finish with a match between participants." },
      { q: "When does it run?", a: "Weekday mornings, usually from 10:00. The tour does not run on weekends or Japanese public holidays, so plan for a weekday. The exact start time follows the venue and is confirmed with your quote." },
      { q: "Where is the venue?", a: "A kendo dojo or hall in Himeji within thirty to fifty minutes of the city centre, chosen by the operator for your date; the meeting point comes with your confirmation. The venue cannot be chosen." },
      { q: "Can children join?", a: "From age 9. Children aged 9 to 13 pay a reduced rate; from 14, the adult rate. Tell us everyone's age in your request and the quote applies it." },
      { q: "How large can the group be?", a: "From two to two hundred. Groups of 14 or more are quoted individually, with lighter equipment options (uniform and shinai without armour, or shinai only) and more instructors." },
      { q: "Can we have the session to ourselves?", a: "Yes, for six adults or more, or for the price of six adults." },
      { q: "Which languages?", a: "English and Japanese. For another language, bring your own interpreter or ask us." },
      { q: "Does the tour run outside Himeji?", a: "Yes: Tokyo, Osaka, Kyoto, Nagoya, Okinawa and Kanazawa. Tell us the city in your request; Nagoya and Okinawa sessions start in the early afternoon." },
      { q: "Anything we should know before we come?", a: "Follow the instructors' and staff's directions throughout: the dojo is a place of training, so keep voices down and leave what you find there untouched. Take off earrings and other accessories when you change. The men, the helmet, is hard to wear over glasses and can damage them, so remove them or wear contact lenses. Valuables stay with you inside the dojo. Never swing or strike with the shinai carelessly, and take care with partners who are smaller than you. Equipment comes in limited sizes; if nothing fits safely, the instructors offer an adapted programme. Don't push yourself: drink water and rest when you need to. The session is in English and Japanese; for other languages, bring your own interpreter." },
      { q: "Why do you need our height and gender?", a: "To prepare armour and uniforms in the right sizes. The operator needs the list two weeks before the date, a month before for groups of 70 or more." },
      { q: "What is the cancellation policy?", a: "Free until 15 days before the session; from 14 to 3 days before, half the price; from 2 days before, including no-shows, the full price. Once the equipment is ordered, a smaller group is not refunded. Groups of 70 or more: free cancellation ends a month before." },
      { q: "How does booking work?", a: "Choose a weekday and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send; the operator then books the venue, instructors and equipment, and cancellation terms start." },
    ],
    whatYoullDo: ["Dress in kendo uniform and full armour", "Take part in the bowing ceremony and hear what the samurai lived by", "Practise footwork, the swing and the strike", "Finish with a match between participants, refereed by the instructors"],
    master: { title: "Your instructors", bio: "Kendo teachers of fifth to seventh dan with more than thirty years of practice, working for an operator that has brought visitors into Japanese dojos since 2016 and has been recognised with national tourism awards. The founder began kendo at five and competed through university and corporate kendo before starting the tour.", quote: "Unify your spirit, mind the manners, and kendo stays with you for life." },
    itinerary: ["0:00 — Into the armour", "0:20 — The bowing ceremony", "0:30 — What the samurai lived by", "0:45 — Striking practice", "1:20 — The match", "1:45 — Closing bow, photos and changing", "2:00 — End of the session"],
    goodToKnow: ["About 1.5 to 2 hours, weekday mornings (no weekends or public holidays); the venue is chosen for your date.", "From age 9; reduced rate for ages 9–13. Two to two hundred guests.", "Everyone's gender and approximate height are needed two weeks before, for the armour.", "English and Japanese."],
    story: { heading: "Ki, ken, tai", body: "A strike only counts in kendo when spirit, sword and body arrive together — ki-ken-tai-itchi. The instructors say it in the first ten minutes and you spend the rest of the session finding out what it means with your own hands." },
  },
  {
    // Golf partner's condition sheet 2026-10-06 (costs internal); v4 brief
    // 2026-10-10: one page, two areas, published prices for two to four golfers
    // (lib/golf-prices.ts), a specific course quoted individually, one request
    // form. The guide assists and does not play.
    slug: "mt-fuji-golf-day", city: "tokyo", category: "golf", bookingType: "request", status: "live",
    title: "Private Golf Day from Tokyo",
    seoTitle: "Private Golf Day from Tokyo | Mt. Fuji & Tokyo Area | KAMEHAME JAPAN",
    metaDescription: "Private golf near Tokyo or Mt. Fuji for 2–4 golfers. Hotel transfers with driver, green fees, golf cart, rental clubs and shoes, lunch and English-speaking assistance included.",
    tagline: "Play 18 holes near Tokyo or in the Mt. Fuji region, with private hotel transfers, green fees, golf cart, rental clubs and shoes, lunch and English-speaking assistance arranged for you.",
    overview: [
      "Play 18 holes near Tokyo or in the Mt. Fuji region. We arrange your course, a premium private car with its own driver, the golf cart, rental clubs and shoes, with English-speaking assistance for a smooth start to your round.",
      "Your English-speaking assistant helps with check-in, rental arrangements and communication at the clubhouse. Your group plays the round independently; the assistant does not normally play or accompany you on the course.",
    ],
    duration: "Full day, hotel to hotel", price: "¥250,000", priceUnit: "group", group: "Private car and assistant · 2–4 golfers", ages: "Ages 18+", area: "Tokyo area or Mt. Fuji region (pick-up at your Tokyo hotel)",
    img: "/images/golf-gallery-01-fuji-aerial.webp", alt: "Snow-capped Mt. Fuji above a sweeping mountain golf course, seen from the air",
    // Ten photos supplied by the owner (2026-10-15): one fixed set for both areas, the hero first; the operator confirms the actual course, meals and facilities with each proposal.
    // 11 (2026-10-15): the transfer car with its chauffeur, supplied by the owner (IMAGE_CREDITS.md), last in the set.
    gallery: [
      { img: "/images/golf-gallery-02-golf-swing.webp", alt: "A golfer in a blue shirt finishing a tee shot on a tree-lined course" },
      { img: "/images/golf-gallery-03-clubhouse-lobby.webp", alt: "A clubhouse lobby with a timber ceiling and a reception desk" },
      { img: "/images/golf-gallery-04-japanese-lunch.webp", alt: "A Japanese golf-club lunch: sushi, grilled fish and side dishes" },
      { img: "/images/golf-gallery-05-bath.webp", alt: "A spacious clubhouse bath with a garden view through its windows" },
      { img: "/images/golf-gallery-06-golf-cart.webp", alt: "Four golfers riding together in a golf cart" },
      { img: "/images/golf-gallery-07-fuji-fairway.webp", alt: "A green fairway with snow-capped Mt. Fuji beyond the trees" },
      { img: "/images/golf-gallery-08-lounge.webp", alt: "A bright clubhouse lounge with tall windows onto the course" },
      { img: "/images/golf-gallery-09-tonkatsu-lunch.webp", alt: "A tonkatsu lunch set at a clubhouse restaurant" },
      { img: "/images/golf-gallery-10-golf-course.webp", alt: "A course with bunkers and distant hills under a clear sky" },
      { img: "/images/golf-gallery-11-transfer-minivan.webp", alt: "A chauffeur in a dark suit holding the door of a black premium minivan at a clubhouse entrance, golf bags beside it" },
    ],
    // Four golfers pre-selected: the lowest per-person figure, with the group total beside it.
    partySize: { min: 2, max: 4, default: 4 },
    pricing: { tiers: golfTiers("tokyo") },
    variants: [
      {
        id: "tokyo", title: "Tokyo Area Golf Day", short: "Tokyo Area", tagline: "Golf courses near Tokyo",
        tiers: golfTiers("tokyo"),
        img: "/images/golf-gallery-10-golf-course.webp", alt: "A course with bunkers and distant hills under a clear sky",
        defaultTime: "07:00",
      },
      {
        id: "fuji", title: "Mt. Fuji Golf Day", short: "Mt. Fuji Area", tagline: "Golf in the Mt. Fuji region",
        tiers: golfTiers("fuji"),
        img: "/images/golf-gallery-01-fuji-aerial.webp", alt: "Snow-capped Mt. Fuji above a sweeping mountain golf course, seen from the air",
        defaultTime: "06:00",
      },
    ],
    defaultVariant: "fuji",
    availability: { daily: true, startTimes: ["05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00"], defaultTime: "06:00", cutoffDays: 3, cutoffTime: "18:00" },
    taxIncluded: true,
    interpreter: false,
    langTag: "English-speaking golf assistant",
    skipSiteFaq: true,
    timeLabel: "Preferred departure time",
    scheduleNote: "Sample timings for a 6:00 departure to the Mt. Fuji region; a course near Tokyo is usually nearer. Choose any departure between 5:00 and 8:00 when you enquire; we propose a tee time to match, and the rest of the day moves with the confirmed course, tee time and traffic.",
    cta: {
      label: "Check Availability",
      note: "No payment required to enquire.",
      heading: "Request Availability",
      lead: "Tell us your date, your hotel and your golfers. No payment is required now.",
    },
    includedShort: "Private transfers with driver · 18 holes, cart, clubs and shoes · Lunch and English-speaking support",
    cancellation: "Days are counted to the date of your round, Japan time; free cancellation ends at 6:00 pm JST seven days before. The date can be changed up to 14 days before if another tee time is free, and the number of golfers reduced up to 7 days before. If the course closes for weather, it decides on the day and you are refunded everything except costs already incurred, such as the car if it has already set out.",
    cancellationTiers: [{ until: 7, rate: 0 }, { until: 2, rate: 50 }, { until: 0, rate: 100 }],
    included: [
      "Private round-trip hotel transfers in a premium vehicle with a dedicated driver",
      "18-hole green fees and course booking (our recommended course)",
      "Golf cart",
      "Rental golf clubs (standard set) and rental golf shoes",
      "English-speaking assistant: transfers, check-in and rental arrangements",
      "Locker room and bath at the clubhouse",
      "Clubhouse lunch within the meal allowance",
      "Taxes and standard service charges",
    ],
    notIncluded: [
      "Golf wear and gloves (bring your own)",
      "Additional food and drinks",
      "Premium equipment and personal purchases",
      "A playing guide or course caddie, unless specifically arranged",
    ],
    addOns: [
      // Partner terms 2026-10-06: film ¥80,000 per group of 2–3 (not for 4; can be
      // added on the day), marker ¥5,000 per golfer (confirmed 2 weeks ahead); +20%.
      { id: "highlight-film", name: "Highlight film of your day", description: "A short film of your round, shot on the day and delivered about a week later. ¥96,000 per group of two or three golfers (not available for parties of four). You can also decide on the day.", price: 96000, maxParty: 3 },
      { id: "kanji-marker", name: "Ball marker with your name in kanji", description: "Handed to you on the day. ¥6,000 per golfer. Order it when you book — it needs your booking confirmed at least two weeks before your date.", price: 6000, perGuest: true },
    ],
    schedule: [
      { time: "05:55", title: "Meet in your hotel lobby", body: "Your assistant and driver meet you five minutes before the departure time you chose." },
      { time: "06:00", title: "Leave Tokyo", body: "Typically one to one and a half hours by private car to a course near Tokyo; about two hours to the Mt. Fuji region, depending on the course and traffic." },
      { time: "07:30–08:00", title: "Arrive and check in", body: "Your assistant checks you in, sorts the rental clubs and shoes and explains the course and the clubhouse customs." },
      { time: "Tee off", title: "Your round", body: "Your group plays the 18 holes at its own pace, with a golf cart." },
      { time: "Lunch", title: "Clubhouse lunch", body: "Included within the package allowance. Depending on the course, lunch comes between the two nines or after the round." },
      { time: "Afternoon", title: "Back to your hotel", body: "A bath at the clubhouse if you like, then the car takes you back to Tokyo." },
    ],
    venue: {
      heading: "Your course, personally arranged",
      knownHeading: "Before you pay", afterHeading: "After you book",
      known: ["The proposed course and its tee time, sent with your quote", "The final price for your party", "Pick-up and drop-off at your hotel in Tokyo, departing at the time you choose between 5:00 and 8:00"],
      afterBooking: ["Where to meet in your hotel lobby — with your confirmation", "Your assistant's name and phone number, and the car and driver details — the day before your round"],
    },
    flow: [
      { title: "Send your request", body: "Choose your area and group size, then tell us your date, hotel and golfers in the form. Sending the request costs nothing and books nothing." },
      { title: "Review your proposal", body: "We confirm your request within 24 hours. The proposed course, tee time, included services and final price usually follow within one business day; for requests sent at the weekend, the tee time may be confirmed on Monday." },
      { title: "Pay to confirm the arrangements", body: "Accept the proposal and pay through the link we send; cancellation terms start then." },
    ],
    faq: [
      { q: "Which course will we play?", a: "For our recommended-course package, we select a suitable course in your chosen area for your date and group size. You will receive the course name and tee time before payment." },
      { q: "Can I request a specific course?", a: "Yes. Select “Request a specific golf course” in the form and enter the course name. We will check availability and send a separate quote. Access to private or members-only clubs is not guaranteed." },
      { q: "Are there published prices for three or four golfers?", a: "Yes. Our recommended-course packages have published group prices for two, three and four golfers. Select your group size to see the per-person reference price and the exact group total." },
      { q: "Is the price per person or per group?", a: "The main price is shown per person for your selected group size. The full group total appears directly below it. For three golfers, the per-person amount is rounded for reference; the group total is the amount used for the package price." },
      { q: "Are weekend green fees included?", a: "The standard starting prices apply to recommended-course packages on regular weekdays and weekends. If no suitable course is available at that rate, we will propose alternatives and confirm any revised price before payment." },
      { q: "Is payment required when I send the form?", a: "No. We first check availability and share the course, tee time, included services and final price. Payment is requested only after you accept the proposal." },
      { q: "Will the assistant play with us?", a: "No. Your assistant assists with local arrangements and clubhouse procedures. Your group plays independently. A playing guide or course caddie is not included in the standard package." },
      { q: "Will we see Mt. Fuji?", a: "Mt. Fuji views depend on the selected course and the weather and cannot be guaranteed. The Tokyo Area package does not include a promise of Mt. Fuji views." },
      { q: "When and where do you pick us up?", a: "At your hotel in Tokyo, at the departure time you choose between 5:00 and 8:00. A course near Tokyo is typically one to one and a half hours away; the Mt. Fuji region about two hours, depending on the course and traffic. Tell us the hotel in your request; if it is not decided yet, give us the approximate area and confirm the name later." },
      { q: "Which departure time should we choose?", a: "An earlier departure means an earlier tee time and more of the afternoon free; a later departure means a later tee off and a later return. If you have no preference, choose “No preference” and we propose a tee time to match the course." },
      { q: "Can we play as a group of two?", a: "Yes — two golfers is the standard package. We prioritise courses that accept two golfers; any pairing requirements are explained before you confirm." },
      { q: "Is there a dress code?", a: "Most Japanese clubs ask for smart clothing on arrival — a jacket is still customary at many — and a collared shirt on the course. We tell you the confirmed course's rules with your proposal, and your assistant explains the rest on the day." },
      { q: "Are clubs and shoes included? What about gloves?", a: "Yes. A standard set of rental clubs and rental golf shoes are included: tell us each golfer's handedness and any preferences in the form, and each golfer's shoe size in the same step. Rental clubs are ¥5,000 per golfer and already in the price; a golfer who brings their own clubs pays ¥5,000 less. Golf wear and gloves are not provided, so bring your own." },
      { q: "Is a golf cart included? What about the clubhouse facilities?", a: "Yes. The cart fee is included, as are the locker room and bath at the clubhouse. Cart type and whether carts may drive on the fairway vary by course; we confirm the details of your course with your proposal." },
      { q: "Who can join?", a: "Golfers aged 18 and over, two to four per booking, all at the published package prices." },
      { q: "What if it rains?", a: "If the course closes for weather, the course decides on the day; you are refunded everything except costs already incurred, such as the car if it has already set out." },
      { q: "What if we are late?", a: "The car waits 15 minutes at your hotel. After that we may miss the tee time and not be able to play, and the cancellation terms apply as for a no-show." },
      { q: "How far ahead should we book?", a: "At least 30 days ahead if you can — the earlier you enquire, the wider the choice of courses and tee times. Requests close at 6:00 pm JST three days before; within seven days of the date we can confirm only if a tee time can still be found." },
    ],
    variantCopy: {
      benefits: ["Private transfers with driver", "18 holes & golf cart", "English-speaking assistant", "Clubs, shoes & lunch included"],
      crumb: "Private Golf Day",
      photoNote: "Example courses shown. Your course is confirmed before payment. Mt. Fuji views depend on the course and weather.",
      inclusions: {
        heading: "What's Included in Your Golf Day",
        sub: "From hotel pick-up to your final putt, we take care of every detail.",
        includedLabel: "Included", notIncludedLabel: "Not included",
        items: [
          { id: "round", label: "18-Hole Golf Round", note: "Green fees at our recommended course" },
          { id: "clubs", label: "Golf Club Rental", note: "Standard set, right- or left-handed · ¥5,000 per golfer, included · −¥5,000 per golfer if you bring your own" },
          { id: "shoes", label: "Golf Shoe Rental", note: "Tell us your sizes" },
          { id: "transfer", label: "Premium Private Transfer", note: "Round trip, your hotel to the course and back" },
          { id: "driver", label: "Private Driver", note: "With you for the whole day" },
          { id: "assistant", label: "English Assistant", note: "Transfers, check-in and rentals" },
          { id: "cart", label: "Golf Cart", note: "Cart fee included" },
          { id: "locker", label: "Locker Room", note: "At the clubhouse" },
          { id: "bath", label: "Bath", note: "At clubhouses that have one; confirmed with your course" },
          { id: "lunch", label: "Lunch", note: "At the clubhouse, within the allowance" },
          { id: "taxes", label: "Taxes & Service Fees", note: "No surprises at the clubhouse" },
          { id: "wear", label: "Golf Wear Rental", note: "Bring your own wear and gloves" },
        ],
        footnote: "Please bring your own golf wear and gloves. Golf shoes and clubs are provided. Bringing your own clubs? We deduct ¥5,000 per golfer from the price.",
        courseNote: "Cart type, cart rules and clubhouse facilities vary by course; the details of your confirmed course come with your proposal.",
        alsoNot: "Not included: food and drinks beyond lunch, personal purchases, and a playing guide or course caddie (available on request).",
      },
      transfer: {
        heading: "Travel in Comfort, From Door to Door",
        body: "Enjoy private round-trip transfers between your hotel and the golf course in a premium vehicle, with a dedicated driver and English-speaking assistance. Relax and enjoy the journey while we take care of the details.",
        photo: { img: "/images/golf-transfer-car.webp", alt: "A chauffeur holding the door of a black premium minivan at a clubhouse entrance, golf bags ready beside it" },
        points: [
          { title: "Hotel pick-up and drop-off", body: "Round trip between your Tokyo hotel and the course, departing at the time you choose between 5:00 and 8:00." },
          { title: "Your own driver", body: "A dedicated driver for the day. The car stays at the course while you play and takes you straight back afterwards." },
          { title: "English-speaking assistant", body: "Rides with you, handles check-in and the rentals, and is on hand at the clubhouse. The round itself is yours." },
        ],
        note: "The vehicle shown is an example of the premium minivan class we use; the model on the day may vary.",
      },
      options: {
        heading: "Choose your golf day", golfersLegend: "Golfers", areaLegend: "Area", golfers: "{n} golfers",
        from: "From", approx: "approx.", perPerson: " / person",
        total: "{total} total · {n} golfers", totalShort: "{total} total", perPersonRef: "{price} / person",
        customQuote: "Custom quote", customQuoteLine: "Specific course · {n} golfers",
        includes: "Includes private transfers with driver, 18 holes, golf cart, rental clubs and shoes, English-speaking assistance, locker room, bath and lunch.",
        note: "Recommended-course package. Course, tee time and final price confirmed before payment.",
        assure: { heading: "Know Your Golf Course Before You Pay", body: "We'll propose a suitable golf course, available tee time and total price for your approval before payment. Your tee time will be secured once your booking is confirmed, subject to availability." },
        customNote: "A specific course is quoted individually. Untick it in the form to see the package price again.",
        ctaNote: "No payment required to enquire.",
        allPrices: "View all group prices",
      },
      intro: {
        heading: "Your private golf day, arranged.",
        guideNote: "Your English-speaking assistant helps with check-in, rental arrangements and communication at the clubhouse. Your group plays the round independently; the assistant does not normally play or accompany you on the course.",
      },
      day: {
        steps: [
          { title: "Hotel pick-up", body: "Your assistant and driver meet you in the lobby at the departure time you chose, and the private car takes you to the course." },
          { title: "Check-in, clubs & shoes", body: "Your assistant handles check-in, sorts your rental clubs and shoes, and explains the clubhouse customs." },
          { title: "18 holes & clubhouse lunch", body: "Your group plays at its own pace, with a golf cart. Lunch is included within the allowance — between the nines or after the round, depending on the course." },
          { title: "Bath & return to your hotel", body: "Freshen up in the clubhouse bath, then the private car brings you back to your hotel in Tokyo." },
        ],
        note: "Departure, lunch arrangements and return time depend on the confirmed course, tee time and traffic.",
        timingsH: "Sample timings",
        bookingH: "How booking works",
      },
      prices: {
        heading: "View all group prices",
        only: "Recommended-course packages only. Prices are the total for your private group.",
        golfersCol: "Golfers", perPersonCol: "Per person", totalCol: "Group total",
        approxNote: "Per-person amounts are for reference and rounded for three golfers; the group total is the package price.",
        notes: [
          "Standard starting prices apply on regular weekdays and weekends. If no suitable course is available at that rate, we propose alternatives and confirm any revised price before payment.",
          "Rental clubs (¥5,000 per golfer) are included in every package. Golfers who bring their own clubs pay ¥5,000 less each; tell us in the form and the total updates.",
          "A specific course requested by you is quoted individually.",
          "Nothing is paid when you request availability. You pay only after accepting the proposed course, tee time and final price.",
        ],
      },
      form: {
        summaryH: "Your selection", change: "Change",
        steps: { dates: "Date & departure", course: "Golf course", hotel: "Hotel / pick-up", group: "Golfers & rental clubs", contact: "Contact" },
        departure: "Preferred departure time", noPreference: "No preference",
        specificCourse: "Request a specific golf course (custom quote)",
        specificCourseNote: "Our team normally selects the course. Requesting a specific course requires a separate quote.",
        specificCourseQuote: "We check availability at that course and send a separate quote. Access to private or members-only clubs is not guaranteed.",
        courseName: "Preferred course name", courseUrl: "Course website or location (optional)",
        pickup: "Hotel / pick-up location in Tokyo", pickupHint: "e.g. Park Hyatt Tokyo, Shinjuku",
        hotelUndecided: "Hotel not decided yet", hotelArea: "Approximate hotel area (optional)", hotelAreaHint: "e.g. Shinjuku, Ginza, near Tokyo Station",
        experience: "Golf experience", experienceSelect: "Select…",
        experienceOpts: { casual: "Casual", regular: "Regular", experienced: "Experienced", unsure: "Not sure" },
        handicap: "Handicap (optional)", handicapHint: "e.g. 12 and 20, or none",
        rentalH: "Rental clubs & shoes",
        rental: "Rental clubs", rentalOpts: { required: "Required", own: "Bringing own (−¥5,000)", unsure: "Not sure" },
        rentalNote: "Rental clubs are ¥5,000 per golfer and included in the price. Bring your own and we deduct ¥5,000 per golfer.",
        ownClubsLine: "Own clubs × {n}: −{amount}", ownClubsTotal: "Total with your own clubs",
        shoes: "Shoe size", shoeOpts: { own: "Own shoes", unsure: "Size later" }, shoeSize: "{n} cm",
        handed: "Handedness", handedOpts: { right: "Right-handed", left: "Left-handed", unsure: "Not sure" },
        golferN: "Golfer {n}",
        clubSpecs: "Preferred club specifications (optional)", clubSpecsHint: "e.g. regular flex, a ladies' set — or decide later",
        whatsapp: "WhatsApp number (optional)", whatsappHint: "With country code, e.g. +44 7700 900123",
        requests: "Special requests (optional)", requestsHint: "Dietary needs for lunch, transfer or playing requests, anything else we should know",
        extras: "Optional extras", extrasNote: "Added to the package price and confirmed with your proposal.", notForFour: "Not available for parties of four",
        confirmH: "Before you send", confirmNote: "Package price for our recommended course; extras shown separately.",
        perPersonRef: "reference", package: "Package", recommendedCourse: "Our recommended course",
        cta: "Send Golf Day Request",
        note: "No payment now.",
        terms: "Booking & cancellation terms",
        sentNote: "Your booking is not confirmed yet. We will contact you with the proposed arrangements and payment instructions.",
      },
      headings: { about: "Your private golf day, arranged.", included: "What's included", day: "A day on the course", faq: "Frequently asked questions", terms: "Booking & cancellation terms", request: "Request Availability" },
    },
    whatYoullDo: ["Ride from your hotel to the course in a private car", "Play 18 holes near Tokyo or in the Mt. Fuji region, the day's details arranged for you", "Lunch at the clubhouse", "Ride back to Tokyo"],
    master: { title: "Your English-speaking assistant", bio: "An English-speaking assistant from our golf partner who rides with you, handles check-in, rental clubs and shoes and the clubhouse procedures, and is on hand while you play. The assistant does not play the round.", quote: "" },
    itinerary: ["05:55 — Meet in your hotel lobby (five minutes before your departure)", "06:00 — Leave Tokyo", "07:30–08:00 — Arrive and check in", "Tee off — Your round", "Lunch — At the clubhouse", "Afternoon — Back to your hotel"],
    goodToKnow: ["Ages 18 and over; two to four golfers per booking, all at published package prices.", "Pick-up from your Tokyo hotel at the departure time you choose, between 5:00 and 8:00.", "Clubhouse dress: smart clothing on arrival, a collared shirt on the course; the confirmed course's rules come with your proposal.", "Rental clubs, golf shoes and the cart are included; bring your own golf wear and gloves.", "A specific course requested by you is quoted individually."],
    story: { heading: "Golf, the Japanese way", body: "In Japan golf comes with its own rituals: the jacket on arrival, the care taken of the course, the unhurried lunch. Near Tokyo or in sight of Mt. Fuji on a clear morning, it is a different game." },
  },

  {
    // Trip in real Japan (TRJK), Tokyo: samurai street walk in Kitasenju plus
    // a sword workshop. Built 2026-10-14 from the operator's public page; the
    // operator's name, the venue name and the instructor's name stay off the
    // page. Public price ¥40,000 per person (2–5), solo ¥55,000; our sale price
    // and wholesale are not agreed, so the page stays in "preview".
    slug: "samurai-street-walk-kitasenju", city: "tokyo", category: "samurai", bookingType: "request", status: "preview",
    title: "Samurai Street Walk & Bushido Experience in Kitasenju, Tokyo",
    tagline: "Dress in samurai attire, walk the old post-town streets of Kitasenju for an hour, then train with a sword-fighting instructor and learn what bushido asked of the people who lived by it. About two and a half hours, finished with Japanese tea.",
    overview: [
      "Kitasenju was the first post town on the road north out of Edo, and its back streets still keep the scale of that time. This experience puts you in samurai dress and walks you through them with a professional samurai performer, past the old gateway of Senju-juku, local shops and a temple, before returning to the venue for the hands-on part.",
      "Back inside, the instructor, trained in Yagyu Shinkage-ryu swordsmanship, teaches the posture, the grip and the basic cuts, and talks about the code behind them. The session ends with commemorative photos in costume and a cup of Japanese tea. It runs for one to five guests, so it is always your own group.",
    ],
    duration: "About 2.5 hours", price: "¥40,000", priceUnit: "person", group: "Private · 1–5 guests", ages: "Ages 6+ (children with an adult; solo guests 18+)", area: "Tokyo (Kitasenju, Adachi)",
    img: "/images/samurai-walk-performers.jpg", alt: "Costumed samurai performers in armour and hakama performing in front of a crowd",
    gallery: [
      { img: "/images/samurai-senju-street.jpg", alt: "A quiet street in Senju with a sign marking the old post town and a willow tree" },
      { img: "/images/samurai-sword-practice.jpg", alt: "People practising sword strikes with wooden swords under trees in a Tokyo park" },
      { img: "/images/city-tokyo.jpg", alt: "The gate of Senso-ji temple lit at night" },
    ],
    galleryNote: "Placeholder photos (Wikimedia Commons). The partner's own photos replace them before this page is published.",
    partySize: { min: 1, max: 5 },
    availability: { daily: false, startTimes: ["16:00"], cutoffDays: 7, cutoffTime: "18:00" },
    availabilityNote: "Runs on selected dates from August to December 2026; tell us your preferred date and we confirm the nearest one.",
    scheduleNote: "Timings counted from the 4:00 pm start; the walk is about an hour.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English guidance",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the experience, Japan time. Free cancellation ends 7 days before; from 6 to 2 days before, 30% of the price; the day before, 50%; on the day or without notice, 100%. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 7, rate: 0 }, { until: 2, rate: 30 }, { until: 1, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "Samurai attire and dressing · Street walk · Sword workshop · Japanese tea",
    highlights: [
      { icon: "flag", title: "An old post town, in costume", body: "An hour on foot through Kitasenju in samurai dress, with a performer who knows the district's Edo-period story." },
      { icon: "spark", title: "A real sword school", body: "The workshop is taught by a performer and instructor trained in Yagyu Shinkage-ryu, one of the classical schools of swordsmanship." },
      { icon: "group", title: "Always your own group", body: "One to five guests, never mixed with other parties. Children from six join with an adult." },
    ],
    included: [
      "Samurai attire rental and help dressing",
      "The street walk and the samurai workshop with bushido talk",
      "Commemorative photos in costume",
      "Japanese tea at the end",
      "Tax included — nothing is added on the day",
    ],
    notIncluded: [
      "Transport to and from the meeting point",
      "Meals and drinks other than the tea",
      "Personal expenses",
    ],
    schedule: [
      { time: "0:00", title: "Dress as a samurai", body: "Change into samurai attire with the staff's help; about twenty minutes." },
      { time: "0:20", title: "Street walk", body: "An hour through Kitasenju: the old gateway of Senju-juku, local shops and a historic temple.", img: "/images/samurai-senju-street.jpg" },
      { time: "1:20", title: "Back at the venue", body: "A short break before the workshop." },
      { time: "1:30", title: "Samurai workshop and bushido", body: "Posture, grip and basic cuts with the instructor, and the ideas behind them; about an hour." },
      { time: "2:20", title: "Photos and tea", body: "Commemorative photos in costume, then Japanese tea." },
      { time: "2:30", title: "Change and finish" },
    ],
    venue: {
      known: ["A traditional-style venue in Kitasenju, Adachi, Tokyo — the exact address and meeting point come with your confirmation", "The walk is on public streets: wear shoes you can walk in for an hour", "Solo guests pay the single-participant rate (¥55,000); children aged 6 to 11 join with an adult aged 18 or over; under 6 cannot take part"],
      afterBooking: ["The venue's name and address", "Directions from Kitasenju station", "A phone number for the day"],
      img: "/images/samurai-walk-performers.jpg", alt: "Costumed samurai performers in front of a crowd",
    },
    notesLabel: "Anything we should know (optional)",
    notesHint: "e.g. heights for costume sizes; a child in the group; the dates you can make",
    flow: [
      { title: "Choose a date and send your request", body: "The experience runs on selected dates; tell us your preferred date and how many of you there are." },
      { title: "We reply within 24 hours", body: "With the nearest available date, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The meeting point comes with your confirmation." },
    ],
    faq: [
      { q: "What do we actually do?", a: "You dress in samurai attire, walk Kitasenju's old streets with a samurai performer for about an hour, then take a sword workshop with a bushido talk back at the venue. Photos in costume and Japanese tea close the session." },
      { q: "Is it taught in English?", a: "The experience is run for international guests with English guidance. Tell us your language when you request and we will confirm what is available for your date." },
      { q: "Can children join?", a: "From age 6, accompanied by an adult aged 18 or over. Children pay the same price as adults. Under 6 cannot take part." },
      { q: "I'm travelling alone. Can I book?", a: "Yes, from age 18. A single participant pays ¥55,000; groups of two to five pay ¥40,000 per person." },
      { q: "When does it run?", a: "On selected dates from August to December 2026, from 4:00 pm to about 6:30 pm. Tell us your preferred date and we confirm the nearest one that runs." },
      { q: "What should I wear?", a: "Comfortable clothes you can change out of easily, and shoes you can walk in: the samurai attire goes on at the venue and the walk lasts about an hour." },
      { q: "What is the cancellation policy?", a: "Free cancellation ends 7 days before; from 6 to 2 days before, 30%; the day before, 50%; on the day or without notice, 100%." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the date, the price and the conditions. Your booking is confirmed when you pay through the link we send." },
    ],
    whatYoullDo: ["Dress in samurai attire", "Walk Kitasenju's old post-town streets for an hour", "Train with a sword-fighting instructor and hear about bushido", "Photos in costume and Japanese tea"],
    master: { title: "Your instructor", bio: "A samurai performer and sword-fighting instructor trained in Yagyu Shinkage-ryu swordsmanship, who has guided international guests through Kitasenju for years.", quote: "" },
    itinerary: ["0:00 — Dress as a samurai", "0:20 — Street walk through Kitasenju", "1:20 — Back at the venue", "1:30 — Samurai workshop and bushido", "2:20 — Photos and tea", "2:30 — Change and finish"],
    goodToKnow: ["About 2.5 hours, 4:00 pm to 6:30 pm, on selected dates from August to December 2026.", "Private, 1–5 guests. Solo guests pay ¥55,000; two to five pay ¥40,000 each.", "Children from 6 with an adult; under 6 cannot take part.", "English guidance."],
    story: { heading: "The first town on the road north", body: "Travellers leaving Edo for the north spent their first night at Senju-juku. The poet Basho set off from here on his Narrow Road. Walking it in samurai dress, with someone who can read the street for you, puts you inside that story rather than in front of it." },
  },
  {
    // Trip in real Japan (TRJK), Tokyo: private tate (stage sword combat) with
    // a performer from a Tokyo sword-performance school (name off the page). Built 2026-10-14 from the public
    // page; operator, venue and performer names stay off the page. Public "tour
    // fee" ¥33,000 — whether per person or per group is still to confirm, as is
    // the booking cutoff; wholesale not agreed. Preview until then.
    slug: "tokyo-tate-samurai-sword-experience", city: "tokyo", category: "samurai", bookingType: "request", status: "preview",
    title: "Private Samurai Experience in Tokyo: Authentic Tate Sword Choreography",
    tagline: "Learn tate, the choreographed sword combat of Japanese stage and film, from a professional performer: costume, posture, timing and a partner duel you perform at the end. With a master's sword-dance performance, a short calligraphy session and matcha with sweets. About two hours, private.",
    overview: [
      "Tate is the art behind every sword fight you have seen in a Japanese film: not real combat, but precision, rhythm, posture and trust between partners. In this private session a performer from a classical sword-performance school dresses you in samurai costume, gives a short introduction to bushido, and teaches the movements and timing of a fight scene step by step.",
      "You rehearse with a partner, then perform a short duel together. The master then performs kenbu, the sword dance, for you; you try a few characters with a brush and keep the sheet; and the session closes with matcha and traditional sweets. Groups are private, two to six guests, every day from September to November 2026.",
    ],
    duration: "About 2 hours", price: "¥33,000", priceUnit: "person", group: "Private · 2–6 guests", ages: "Ages 6+ (younger children on request)", area: "Tokyo (Adachi, Tobu Skytree Line)",
    img: "/images/tate-kata-performance.jpg", alt: "Two swordsmen in black hakama performing a paired sword kata before an audience",
    gallery: [
      { img: "/images/samurai-sword-practice.jpg", alt: "People practising sword strikes with wooden swords in a Tokyo park" },
      { img: "/images/cat-tea.jpg", alt: "A bowl of matcha being prepared" },
      { img: "/images/cat-sword.jpg", alt: "A katana blade against a dark background" },
    ],
    galleryNote: "Placeholder photos (Wikimedia Commons). The partner's own photos replace them before this page is published.",
    partySize: { min: 2, max: 6 },
    availability: { daily: true, startTimes: ["10:00", "13:00", "15:00"], cutoffDays: 3, cutoffTime: "18:00" },
    availabilityNote: "Every day from 1 September to 30 November 2026; sessions start at 10:00, 13:00 or 15:00.",
    scheduleNote: "Timings counted from the meeting time; the workshop itself is up to 90 minutes.",
    taxIncluded: true,
    interpreter: false,
    langTag: "Basic English guidance",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the experience, Japan time. Free cancellation ends 7 days before; from 6 to 2 days before, 30% of the price; the day before, 50%; on the day or without notice, 100%. If the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 7, rate: 0 }, { until: 2, rate: 30 }, { until: 1, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "Costume · Tate workshop · Kenbu performance · Calligraphy · Matcha and sweets",
    highlights: [
      { icon: "spark", title: "Taught by a professional performer", body: "Your instructor performs and teaches tate with a classical sword-performance school and has guided many international guests." },
      { icon: "dance", title: "You perform the scene", body: "After the workshop you and your partner perform the duel you learned, then watch the master's kenbu sword dance." },
      { icon: "meal", title: "Brush, matcha and sweets", body: "A short calligraphy session, with the sheet to keep, and matcha with traditional sweets to finish." },
    ],
    included: [
      "Samurai costume dressing",
      "The tate workshop with partner practice and the final duel scene",
      "The master's kenbu (sword dance) performance",
      "A short calligraphy session; you keep your work",
      "Matcha and traditional sweets",
      "Tax included",
    ],
    notIncluded: [
      "Transport to the meeting point",
      "Drinks and personal expenses",
      "A professional English interpreter (optional, quoted on request)",
    ],
    schedule: [
      { time: "0:00", title: "Meet at the station", body: "Your host meets you at the station named in your confirmation and walks you to the venue." },
      { time: "0:15", title: "Costume", body: "Dress in samurai costume with help from the staff." },
      { time: "0:30", title: "Bushido in five minutes", body: "A short introduction to the code before the swords come out." },
      { time: "0:35", title: "Tate workshop", body: "Movement, timing and partner choreography, built up step by step.", img: "/images/samurai-sword-practice.jpg" },
      { time: "1:20", title: "The duel", body: "Perform the scene you learned with your partner or group." },
      { time: "1:30", title: "Kenbu performance", body: "The master performs the sword dance." },
      { time: "1:40", title: "Calligraphy, matcha and sweets", body: "Try a few characters with a brush, then sit down to matcha and traditional sweets." },
      { time: "2:00", title: "End of the session" },
    ],
    venue: {
      known: ["One of three venues in Adachi, Tokyo, each a short walk or bus ride from a Tobu line station — the venue and meeting point for your date come with your confirmation", "Private groups only, two to six guests; never mixed with other parties", "Basic English guidance is provided; a professional interpreter can be added for a fee"],
      afterBooking: ["Which venue, and the meeting station (Umejima or Daishi-mae)", "Walking directions from the station", "A phone number for the day"],
      img: "/images/tate-kata-performance.jpg", alt: "A paired sword kata performed before an audience",
    },
    notesLabel: "Anything we should know (optional)",
    notesHint: "e.g. heights for costume sizes; a child in the group; whether you would like a professional interpreter",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date between 1 September and 30 November 2026 and a start time — 10:00, 13:00 or 15:00 — and tell us how many of you there are." },
      { title: "We reply within 24 hours", body: "With the venue, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The meeting station and directions come with your confirmation." },
    ],
    faq: [
      { q: "What is tate?", a: "The choreographed sword combat of Japanese theatre and film. It is a performing art, not a fighting one: the point is precision, rhythm, posture and trust between partners." },
      { q: "Do I need any experience?", a: "No. The movements are built up slowly and everyone performs at the end, whatever their level." },
      { q: "Is it taught in English?", a: "Basic English guidance is provided, with translation tools where needed. A professional English interpreter can be added for a fee; ask when you request." },
      { q: "Can children join?", a: "From age 6. Younger children may be possible on request; tell us their ages." },
      { q: "How many of us can come?", a: "Two to six guests, as a private group. Larger groups are quoted individually." },
      { q: "When does it run?", a: "Every day from 1 September to 30 November 2026, meeting at 10:00 am, 1:00 pm or 3:00 pm." },
      { q: "What is the cancellation policy?", a: "Free cancellation ends 7 days before; from 6 to 2 days before, 30%; the day before, 50%; on the day or without notice, 100%." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the venue, the price and the conditions. Your booking is confirmed when you pay through the link we send." },
    ],
    whatYoullDo: ["Dress in samurai costume", "Learn the movements and timing of a sword fight scene", "Perform a duel with your partner", "Watch a kenbu sword-dance performance", "Try calligraphy, then matcha and sweets"],
    master: { title: "Your instructor", bio: "A professional performer and instructor of tate with a classical sword-performance school, who specialises in authentic samurai sword choreography and has taught many guests from abroad.", quote: "" },
    itinerary: ["0:00 — Meet at the station", "0:15 — Costume", "0:30 — Bushido in five minutes", "0:35 — Tate workshop", "1:20 — The duel", "1:30 — Kenbu performance", "1:40 — Calligraphy, matcha and sweets", "2:00 — End of the session"],
    goodToKnow: ["About 2 hours including the walk from the station; the workshop is up to 90 minutes.", "Every day from 1 September to 30 November 2026, at 10:00, 13:00 or 15:00.", "Private, 2–6 guests. From age 6.", "Basic English guidance; a professional interpreter can be added for a fee."],
    story: { heading: "Every sword fight you have ever seen", body: "The duels in Japanese film and on the kabuki stage are tate, and the people who perform them train for years. Learning one scene, slowly, with one of them, shows you how much of a fight is really a conversation." },
  },
  {
    // Trip in real Japan (TRJK), Tokyo: a two-hour Japanese cuisine seminar
    // with a professional chef in a cooking studio in Kichijoji. Built
    // 2026-10-14 from the operator's public page; the operator, the venue's
    // name (a soy-sauce maker's dining brand) and the chef's name stay off the
    // page. Public price ¥18,500 per person; a seminar of 8, on announced
    // dates. Wholesale not agreed. Preview until then.
    slug: "kichijoji-japanese-cuisine-class", city: "tokyo", category: "cooking", bookingType: "request", status: "preview",
    title: "Learn Japanese Cuisine from a Professional Chef in Kichijoji, Tokyo",
    tagline: "A two-hour seminar with a chef who has cooked Japanese food on both sides of the Pacific: sushi rice from scratch, rolls and nigiri, a dish built on fermented seasonings, a wagyu roast-beef roll, then a meal of chef-made chirashi sushi. In a cooking studio five minutes from Kichijoji station.",
    overview: [
      "This is a small cooking seminar, not a show: a professional chef demonstrates, then you cook. You start with sushi rice — washing, cooking and seasoning it properly — and go on to a dish using shibazuke pickles and crunchy soy-sauce almonds, a roll with Japanese wagyu roast beef, and nigiri with a chef's demonstration alongside.",
      "Then you sit down to eat: premium chirashi sushi with seasonal fish prepared by the chef, and a soft-serve dessert made with moromi, the soy-sauce mash. The chef began his career running a Japanese restaurant in Los Angeles, cooked across the United States and launched a hotel sushi bar in Beverly Hills before coming home to teach. The seminar is designed for international visitors and runs for eight guests on announced dates.",
    ],
    duration: "2 hours", price: "¥18,500", priceUnit: "person", group: "Seminar · 8 guests", ages: "Ages 10+", area: "Tokyo (Kichijoji, 5 minutes from the station)",
    img: "/images/cooking-sushi-lesson.jpg", alt: "A chef in whites demonstrating sushi preparation to a group gathered around the counter",
    gallery: [
      { img: "/images/exp-sushi.jpg", alt: "A sushi counter with seats and a chef's station" },
      { img: "/images/kichijoji-inokashira.jpg", alt: "Greenery and a path in Inokashira Park, a few minutes from Kichijoji station" },
    ],
    galleryNote: "Placeholder photos (Wikimedia Commons). The partner's own photos replace them before this page is published.",
    partySize: { min: 1, max: 8 },
    availability: { daily: false, startTimes: ["13:00"], cutoffDays: 14, cutoffTime: "18:00", dates: [
      { date: "2026-11-21", times: ["13:00"] }, { date: "2026-12-10", times: ["13:00"] }, { date: "2027-01-14", times: ["13:00"] }, { date: "2027-02-14", times: ["13:00"] },
    ] },
    availabilityNote: "Announced dates only; meet at 12:30 pm for a 1:00 pm start.",
    scheduleNote: "Timings counted from the 1:00 pm start; meet at 12:30 pm.",
    taxIncluded: true,
    interpreter: false,
    langTag: "For international guests",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the seminar, Japan time. Free cancellation ends 10 days before; from 9 days before, the full price. The seminar needs eight guests to run: if that number is not reached 14 days before the date, it is cancelled and you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 10, rate: 0 }, { until: 0, rate: 100 }],
    includedShort: "2-hour seminar · Ingredients · The meal · A gift to take home",
    highlights: [
      { icon: "meal", title: "Cook, then eat", body: "Sushi rice, rolls and nigiri you make yourself, then a chef-made chirashi of seasonal fish and a moromi soft-serve to finish." },
      { icon: "chat", title: "A chef who has taught abroad", body: "Years of restaurants and catering in the United States, and of teaching sushi to everyone from beginners to professional cooks." },
      { icon: "spark", title: "Fermentation, explained", body: "Soy sauce, shibazuke and moromi: the seasonings that make Japanese food taste Japanese, used in dishes you can repeat at home." },
    ],
    included: [
      "The two-hour seminar with the chef",
      "All ingredients for the hands-on cooking",
      "The meal after the seminar: chirashi sushi and dessert",
      "One product from the venue's soy-sauce snack range to take home",
      "Tax included",
    ],
    notIncluded: [
      "Transport to the studio (meet on site)",
      "Drinks",
      "Personal expenses",
    ],
    schedule: [
      { time: "-0:30", title: "Meet at the studio", body: "Check in and wash up; the chef introduces the menu." },
      { time: "0:00", title: "Sushi rice", body: "Washing, cooking and seasoning the rice: the base of everything that follows." },
      { time: "0:25", title: "A fermented-seasoning dish", body: "A quick dish with shibazuke pickles and crunchy soy-sauce almonds." },
      { time: "0:45", title: "Rolls", body: "Roll sushi, including a wagyu roast-beef roll, with the chef showing each step.", img: "/images/cooking-sushi-lesson.jpg" },
      { time: "1:10", title: "Nigiri", body: "Press nigiri yourself as the chef demonstrates the professional hand." },
      { time: "1:30", title: "The meal", body: "Premium chirashi sushi with seasonal fish, prepared by the chef, and a moromi soft-serve dessert." },
      { time: "2:00", title: "End of the seminar" },
    ],
    venue: {
      known: ["A cooking studio in Kichijoji, about five minutes on foot from Kichijoji station (JR Chuo Line and Keio Inokashira Line) — the exact address comes with your confirmation", "Knives and cooking equipment are used: guests follow the chef's safety instructions", "Food allergies: tell us when you request; some cannot be accommodated. Halal menus are not available"],
      afterBooking: ["The studio's name and address", "Directions from Kichijoji station", "A phone number for the day"],
      img: "/images/kichijoji-inokashira.jpg", alt: "Inokashira Park, a few minutes from the studio",
    },
    notesLabel: "Allergies and requests (optional)",
    notesHint: "e.g. a shellfish allergy; vegetarian in the group",
    flow: [
      { title: "Choose a date and send your request", body: "Pick one of the announced dates and tell us how many of you there are and any allergies." },
      { title: "We reply within 24 hours", body: "With the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The studio's address comes with your confirmation." },
    ],
    faq: [
      { q: "What do we cook?", a: "Sushi rice from scratch, a dish with shibazuke pickles and crunchy soy-sauce almonds, roll sushi including a wagyu roast-beef roll, and nigiri. The chef then serves premium chirashi sushi with seasonal fish and a moromi soft-serve dessert." },
      { q: "Is it in English?", a: "The seminar is designed for international visitors and foreign residents. Tell us your language when you request and we will confirm what is available for your date." },
      { q: "Can children join?", a: "From age 10." },
      { q: "I have a food allergy.", a: "Tell us when you request. Some allergies can be accommodated and some cannot; we confirm before you pay. Halal menus are not available." },
      { q: "How many people take part?", a: "The seminar runs for eight guests. If fewer than eight have booked 14 days before the date, it is cancelled with a full refund." },
      { q: "When does it run?", a: "On announced dates: 21 November and 10 December 2026, 14 January and 14 February 2027. Meet at 12:30 pm; the seminar runs from 1:00 pm to 3:00 pm." },
      { q: "What is the cancellation policy?", a: "Free cancellation ends 10 days before the seminar; from 9 days before, the full price is charged." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the price and the conditions. Your booking is confirmed when you pay through the link we send." },
    ],
    whatYoullDo: ["Wash, cook and season sushi rice", "Make a dish with fermented Japanese seasonings", "Roll sushi, including a wagyu roast-beef roll, and press nigiri", "Eat chef-made chirashi sushi and a moromi soft-serve"],
    master: { title: "Your chef", bio: "Born in Tokyo, he began his career running a Japanese restaurant in Los Angeles, cooked across the United States and launched a hotel sushi bar in Beverly Hills. He now teaches sushi and Japanese cuisine in Tokyo and around the country.", quote: "" },
    itinerary: ["12:30 — Meet at the studio", "13:00 — Sushi rice", "13:25 — A fermented-seasoning dish", "13:45 — Rolls", "14:10 — Nigiri", "14:30 — The meal", "15:00 — End of the seminar"],
    goodToKnow: ["2 hours, 1:00 pm to 3:00 pm, on announced dates; meet at 12:30 pm.", "A seminar of 8 guests; cancelled with a full refund if the minimum is not reached 14 days before.", "From age 10. Tell us about allergies when you request; no halal menu.", "For international guests."],
    story: { heading: "The rice first", body: "Ask any sushi chef and the answer is the same: the rice matters more than the fish. Two hours with someone who has cooked it for American diners and Japanese ones alike is the fastest way to find out why." },
  },
  {
    // Trip in real Japan (TRJK) with the English Rakugo Association, Tokyo:
    // an English rakugo performance in Asakusa plus a guided walk. Built
    // 2026-10-14 from the public page; operator and performer names stay off
    // the page. Public price ¥12,000; second and fourth Sundays, Oct–Dec 2026.
    // Wholesale not agreed. Preview until then.
    slug: "asakusa-english-rakugo-walk", city: "tokyo", category: "rakugo", bookingType: "request", status: "preview",
    title: "English Rakugo & Asakusa Cultural Walk, Tokyo",
    tagline: "A live rakugo performance in English — Japan's comic storytelling, one performer and a whole cast of characters — with traditional variety acts, followed by an hour's guided walk through Asakusa. About four hours on a Sunday afternoon.",
    overview: [
      "Rakugo is one of Japan's oldest living performing arts: a storyteller on a cushion, a fan and a hand towel for props, and every character played by the same voice. In Asakusa, the district where Tokyo's popular entertainment grew up, an association of performers presents it entirely in English, together with traditional variety entertainment, at a public venue a few steps from the Kaminarimon gate.",
      "After the performance, an English-speaking guide walks you through Asakusa for an hour: the well-known landmarks, and the streets linked to the theatres and entertainers of old Tokyo. The afternoon ends near the stations. It runs on the second and fourth Sundays from October to December 2026, for two to ten guests.",
    ],
    duration: "About 4 hours", price: "¥12,000", priceUnit: "person", group: "2–10 guests", ages: "Ages 6+", area: "Tokyo (Asakusa)",
    img: "/images/rakugo-stage.jpg", alt: "A rakugo performer in a dark kimono kneeling on a cushion on stage, gesturing to the audience",
    gallery: [
      { img: "/images/asakusa-kaminarimon.jpg", alt: "Crowds in front of the Kaminarimon gate and its great red lantern" },
      { img: "/images/city-tokyo.jpg", alt: "Senso-ji temple in Asakusa lit at night" },
    ],
    galleryNote: "Placeholder photos (Wikimedia Commons). The partner's own photos replace them before this page is published.",
    partySize: { min: 2, max: 10 },
    availability: { daily: false, startTimes: ["13:30"], cutoffDays: 7, cutoffTime: "18:00", dates: [
      { date: "2026-10-25", times: ["13:30"] }, { date: "2026-11-08", times: ["13:30"] }, { date: "2026-11-22", times: ["13:30"] }, { date: "2026-12-13", times: ["13:30"] }, { date: "2026-12-27", times: ["13:30"] },
    ] },
    availabilityNote: "Second and fourth Sundays, October to December 2026; meet at 1:30 pm.",
    scheduleNote: "Timings for the 1:30 pm meeting; the performance begins at 2:00 pm.",
    taxIncluded: true,
    interpreter: false,
    langTag: "Performed and guided in English",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the experience, Japan time. Free cancellation ends 7 days before; from 6 to 2 days before, 30% of the price; the day before, 50%; on the day or without notice, 100%. The walk goes ahead in light rain; in severe weather it may be changed or cancelled, and if the operator has to cancel you receive a full refund.",
    cancellationTiers: [{ until: 7, rate: 0 }, { until: 2, rate: 30 }, { until: 1, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "Rakugo performance in English · Variety acts · Guided Asakusa walk",
    highlights: [
      { icon: "chat", title: "Rakugo you can actually follow", body: "A regular public performance by an association of rakugo performers who work in English, with traditional variety acts between the stories." },
      { icon: "flag", title: "Asakusa with a guide", body: "An hour on foot through the landmarks and the back streets where Tokyo's theatres and entertainers made their living." },
      { icon: "group", title: "Small and easy", body: "Two to ten guests, from age 6, on Sunday afternoons. Comfortable shoes are the only equipment." },
    ],
    included: [
      "Admission (unreserved seating) to the association's regular English rakugo performance",
      "The English-guided cultural walk through Asakusa",
      "Tax included",
    ],
    notIncluded: [
      "Transport to and from Asakusa",
      "Food and drinks",
      "Shopping and personal expenses",
    ],
    schedule: [
      { time: "0:00", title: "Meet in Asakusa", body: "Check in at the tourist information centre's ground-floor lobby, opposite the Kaminarimon gate." },
      { time: "0:30", title: "English rakugo", body: "Two hours of stories and traditional variety entertainment, performed entirely in English.", img: "/images/rakugo-stage.jpg" },
      { time: "2:30", title: "Break", body: "Half an hour before the walk." },
      { time: "3:00", title: "Asakusa walk", body: "An hour with your guide: the famous sights and the streets of old Tokyo's entertainment district." },
      { time: "4:00", title: "End near the stations" },
    ],
    venue: {
      known: ["The performance is at the Asakusa Culture Tourist Information Center, across from the Kaminarimon gate; the walk is on public streets nearby", "Late arrivals may not be admitted to the performance: please be at the meeting point by 1:30 pm", "The walk goes ahead in light rain; the route may change with the weather or local conditions"],
      afterBooking: ["Exactly where to meet in the lobby", "A phone number for the day"],
      img: "/images/asakusa-kaminarimon.jpg", alt: "The Kaminarimon gate, across from the meeting point",
    },
    notesLabel: "Anything we should know (optional)",
    notesHint: "e.g. children in the group; mobility needs for the walk",
    flow: [
      { title: "Choose a date and send your request", body: "Pick one of the Sunday dates and tell us how many of you there are." },
      { title: "We reply within 24 hours", body: "With the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The meeting details come with your confirmation." },
    ],
    faq: [
      { q: "What is rakugo?", a: "Comic storytelling, performed solo: the storyteller kneels on a cushion and plays every character with voice, a fan and a hand towel. It has been performed for more than three hundred years." },
      { q: "Will I understand it?", a: "Yes: the whole performance is in English, by performers who specialise in English rakugo. Performers vary from one date to another." },
      { q: "Can children join?", a: "From age 6. Under 6 cannot take part." },
      { q: "When does it run?", a: "Second and fourth Sundays from October to December 2026, meeting at 1:30 pm and ending around 5:30 pm." },
      { q: "What should I bring?", a: "Comfortable walking shoes; the walk lasts about an hour." },
      { q: "What if it rains?", a: "The walk goes ahead in light rain. In severe weather it may be changed or cancelled; the performance is indoors." },
      { q: "What is the cancellation policy?", a: "Free cancellation ends 7 days before; from 6 to 2 days before, 30%; the day before, 50%; on the day or without notice, 100%." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the price and the conditions. Your booking is confirmed when you pay through the link we send." },
    ],
    whatYoullDo: ["Watch a two-hour rakugo performance in English, with variety acts", "Walk Asakusa for an hour with an English-speaking guide", "See the Kaminarimon gate, the five-storey pagoda and Denboin-dori"],
    master: { title: "The performers", bio: "An association of rakugo performers who present the art entirely in English at regular public performances in Asakusa, joined by performers of traditional variety entertainment. The line-up changes from date to date.", quote: "" },
    itinerary: ["13:30 — Meet in Asakusa", "14:00 — English rakugo and variety acts", "16:00 — Break", "16:30 — Asakusa walk", "17:30 — End near the stations"],
    goodToKnow: ["About 4 hours, 1:30 pm to 5:30 pm, on the second and fourth Sundays from October to December 2026.", "2–10 guests, from age 6.", "Comfortable walking shoes. Light rain does not stop the walk.", "Performed and guided in English."],
    story: { heading: "One voice, a whole town", body: "A rakugo story has no set, no costume change and no second actor. A fan becomes chopsticks, a towel a purse, and the same voice plays the merchant, his wife and the fool who outwits them both. Hearing it in English, in the district that made it popular, is the easiest way into the form." },
  },
  {
    // Partner: a Tokyo company offering ninja-style meditation (hand seals,
    // breathing, body work), condition sheet 2026-10 (basic information only;
    // product conditions still to come). Public price ¥30,000 per person, a
    // three-hour afternoon session for up to 15, from November 2026; English
    // with interpretation; meeting near Tokyo Tower. Company, instructor and
    // brand names stay off the page. Preview until the conditions are agreed.
    slug: "tokyo-ninja-zen-meditation", city: "tokyo", category: "ninja", bookingType: "request", status: "preview",
    title: "Ninja Zen Meditation in Tokyo: Breathing, Hand Seals and Stillness",
    tagline: "Three hours with a master of ninjutsu on the mental side of the art: the nine hand seals, the breathing that steadies the body, the silent step, and a meditation built on the five elements. Taught in Japanese with English interpretation, near Tokyo Tower.",
    overview: [
      "The ninja were not acrobats; they were people who had to stay calm, decide fast and keep going. The practice behind that has three parts — hand seals, breathing and body work — organised around the five elements of earth, water, fire, wind and void. This afternoon session teaches it as a meditation method, with no religious content, led by a ninjutsu master with more than ten years of teaching, in Japan and abroad.",
      "You learn the nine seals of the kuji in order, from preparing to face yourself to finding a wider awareness; practise yin and yang breathing and the ninja's silent footwork; and sit — on a cushion or a chair — through a meditation on the elements. Sessions run from 1:30 pm to 4:30 pm for up to fifteen guests aged sixteen and over, in Japanese with English interpretation.",
    ],
    duration: "3 hours", price: "¥30,000", priceUnit: "person", group: "Up to 15 guests", ages: "Ages 16+", area: "Tokyo (near Tokyo Tower, Minato)",
    img: "/images/zen-meditation-hall.jpg", alt: "The entrance of a temple meditation hall with a black curtain bearing the characters for zazen",
    gallery: [
      { img: "/images/tokyo-tower-red.jpg", alt: "Tokyo Tower lit red above the night skyline" },
    ],
    galleryNote: "Placeholder photos (Wikimedia Commons). The partner's own photos replace them before this page is published.",
    partySize: { min: 1, max: 15 },
    availability: { daily: false, startTimes: ["13:30"], cutoffDays: 3, cutoffTime: "18:00" },
    availabilityNote: "Afternoon sessions from November 2026, 1:30 pm to 4:30 pm; tell us your dates and we confirm the nearest session.",
    scheduleNote: "Timings counted from the 1:30 pm start.",
    taxIncluded: true,
    interpreter: false,
    langTag: "Japanese with English interpretation",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of the session, Japan time. Free cancellation ends 30 days before; from 29 to 2 days before, 30% of the price; the day before, 50%; on the day or without notice, 100%. If a session does not reach its minimum number of guests, or the operator has to cancel, you receive a full refund to your original payment method.",
    cancellationTiers: [{ until: 30, rate: 0 }, { until: 2, rate: 30 }, { until: 1, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "3-hour session · English interpretation",
    highlights: [
      { icon: "spark", title: "The nine seals", body: "Kuji-in, the hand seals of the ninja, taught in order and explained: what each one is for and how to use it when you need it." },
      { icon: "chat", title: "A teacher, interpreted", body: "Led in Japanese by a ninjutsu master with a decade of teaching, with simultaneous interpretation into English." },
      { icon: "group", title: "No religion, no gymnastics", body: "A method for the mind and the breath. Sit cross-legged, on a cushion or on a chair; comfortable clothes are all you need." },
    ],
    included: [
      "The three-hour session with the master",
      "English interpretation",
      "Tax included",
    ],
    notIncluded: [
      "Transport to the meeting point",
      "Meals and drinks",
    ],
    schedule: [
      { time: "0:00", title: "Meet and begin", body: "An introduction to the practice: seals, breath and body, and the five elements." },
      { time: "0:20", title: "Breathing", body: "Yin and yang breathing, and the breath that steadies the body." },
      { time: "0:50", title: "The nine seals", body: "Kuji-in, learned one by one, with their meaning and their use.", img: "/images/zen-meditation-hall.jpg" },
      { time: "1:50", title: "Body work", body: "The ninja's silent step and the postures that hold the mind still." },
      { time: "2:20", title: "Meditation on the elements", body: "Earth, water, fire, wind and void: stability, flexibility, energy, breath and calm." },
      { time: "3:00", title: "End of the session" },
    ],
    venue: {
      known: ["The meeting point is near Tokyo Tower in Minato, Tokyo — the exact place comes with your confirmation", "Wear comfortable clothes; if sitting cross-legged is difficult, a chair or a floor chair is fine", "Participants should be sixteen or over, interested in the ninja's inner culture, and able to follow a lecture"],
      afterBooking: ["The meeting point and the room", "Directions from the nearest station", "A phone number for the day"],
      img: "/images/tokyo-tower-red.jpg", alt: "Tokyo Tower, near the meeting point",
    },
    notesLabel: "Anything we should know (optional)",
    notesHint: "e.g. a knee that makes sitting on the floor hard; the dates you can make",
    flow: [
      { title: "Choose a date and send your request", body: "Tell us your dates in Tokyo and how many of you there are; sessions run in the afternoon from November 2026." },
      { title: "We reply within 24 hours", body: "With the nearest session, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The meeting point comes with your confirmation." },
    ],
    faq: [
      { q: "Is this a martial arts class?", a: "No. There are no acrobatics and no fighting techniques. It is the mental side of ninjutsu — hand seals, breathing, body awareness and meditation — taught as a method for calm and focus." },
      { q: "Is it religious?", a: "No. Some elements echo Buddhist thought, but the practice has no religious content." },
      { q: "Which language is it in?", a: "The master teaches in Japanese, with simultaneous interpretation into English." },
      { q: "Do I need to sit cross-legged?", a: "No. If it is difficult, you can sit on a chair or a floor chair." },
      { q: "Can children join?", a: "The session is for ages 16 and over." },
      { q: "How many people take part?", a: "Up to fifteen. If a session does not reach its minimum, it is cancelled with a full refund." },
      { q: "What is the cancellation policy?", a: "Free cancellation ends 30 days before; from 29 to 2 days before, 30%; the day before, 50%; on the day or without notice, 100%." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the session, the price and the conditions. Your booking is confirmed when you pay through the link we send." },
    ],
    whatYoullDo: ["Learn the nine hand seals of the kuji and what each is for", "Practise yin and yang breathing", "Try the ninja's silent step and the postures of stillness", "Sit through a meditation on the five elements"],
    master: { title: "Your teacher", bio: "A ninjutsu practitioner based near Tokyo who has studied martial arts since childhood, teaches at culture centres and has taught abroad, and was certified as a master instructor in 2019. He also trains in mountains and under waterfalls.", quote: "" },
    itinerary: ["0:00 — Meet and begin", "0:20 — Breathing", "0:50 — The nine seals", "1:50 — Body work", "2:20 — Meditation on the elements", "3:00 — End of the session"],
    goodToKnow: ["3 hours, 1:30 pm to 4:30 pm, from November 2026.", "Ages 16+. Up to 15 guests.", "Comfortable clothes; a chair is fine if sitting on the floor is difficult.", "Japanese with English interpretation."],
    story: { heading: "What the ninja practised when no one was watching", body: "The throwing stars are the famous part. The breathing, the seals and the stillness are the part that kept them alive, and the part you can take home." },
  },
  {
    // Viyago Japan (the ramen partner), Kyoto: a 60-minute ninja experience in
    // its Arashiyama studio. Built 2026-10-14 from the partner's public page;
    // the studio's name and address stay off the page (owner policy, as for
    // the ramen classes). Public prices are set in the booking calendar and
    // were not available; ¥7,000 (costume plan, from a listing) is a
    // placeholder, to be replaced once the selling price is decided.
    // 2026-10-16: facts aligned with the partner's condition sheet (45–60 min,
    // all ages, 1–12 per regular session / up to 16 private, daily, requests
    // close the day before, start time arranged around the group's day) and
    // the partner's cancellation scale (regular vs private/20+). The sheet's
    // "costume included" answer against the basic/costume plans is still
    // unconfirmed, so both plans stay. Preview.
    slug: "arashiyama-ninja-experience", city: "kyoto", category: "ninja", bookingType: "request", status: "preview",
    title: "Ninja Experience in Arashiyama, Kyoto: Blowpipe, Shuriken and Hand Seals",
    tagline: "Forty-five to sixty minutes in a ninja training room in Arashiyama: the blowpipe, throwing stars at the targets, and the hand seals of the ninja, taught by an instructor in English or Japanese. Change into a ninja costume for the photos if you like.",
    overview: [
      "A few minutes from the bamboo grove, up a flight of stairs, is a room built for this: a row of targets along one wall, blowpipes and throwing stars in their boxes, and an instructor who teaches in English and Japanese. In 45 to 60 minutes you try the blowpipe, learn to throw shuriken so they stick, and are taught the hand seals — the in-musubi — that the ninja used to steady themselves.",
      "The costume plan adds a ninja outfit to change into, worn through the session and the photos. Nothing is needed beyond comfortable clothes and closed shoes, and children are welcome with an adult.",
    ],
    duration: "45–60 minutes", price: "¥7,000", priceUnit: "person", group: "1 to 12 per session · private sessions up to 16", ages: "All ages (children with an adult)", area: "Kyoto (Arashiyama)",
    img: "/images/ninja-arashiyama-hero.jpg", alt: "Three guests in black ninja costumes striking poses in a wood-panelled training room",
    gallery: [
      { img: "/images/ninja-blowgun.jpg", alt: "A guest in a ninja costume aiming a blowpipe at the targets" },
      { img: "/images/ninja-shuriken-throw.jpg", alt: "A guest laughing as she pulls a throwing star from the target" },
      { img: "/images/ninja-pose.jpg", alt: "Three guests in ninja costume making hand seals in front of the targets" },
      { img: "/images/ninja-shuriken-box.jpg", alt: "A wooden box of black throwing stars on a table" },
    ],
    galleryNote: "Photos from the partner's studio.",
    partySize: { min: 1, max: 16 },
    availability: { daily: true, startTimes: ["10:00", "11:30", "13:00", "14:30", "16:00"], cutoffDays: 1, cutoffTime: "18:00" },
    timeLabel: "Preferred start time",
    availabilityNote: "Runs every day; the start time is arranged around your day and confirmed with your date. Requests close the day before. Please be at the studio by your start time.",
    scheduleNote: "Timings counted from the start of your session; sessions run 45 to 60 minutes.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English or Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of your session, Japan time. Regular sessions of up to 19 guests: free cancellation ends 30 days before; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free cancellation ends 45 days before; from 44 to 29 days before, half the price; from 28 days before, the full price. The date can be changed once, free of charge, up to 14 days before (29 days before for private sessions and groups of 20 or more) if another time has room. Final numbers are due 14 days before; a smaller group after that is charged in full. If the studio has to cancel, you hear by the day before, by phone or email, and are refunded to your original payment method.",
    cancellationTiers: [{ until: 30, rate: 0 }, { until: 14, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "45–60-minute session · Blowpipe, shuriken and hand seals · Photos",
    highlights: [
      { icon: "spark", title: "Real tools, real targets", body: "Blowpipes and throwing stars, with an instructor who shows you how to hit the target." },
      { icon: "photo", title: "Costume for the photos", body: "The costume plan dresses you as a ninja for the session and the photos; the outfit is returned the same day." },
      { icon: "chat", title: "English or Japanese", body: "Instructors teach in both, so families and mixed groups follow easily." },
    ],
    included: [
      "The session (45 to 60 minutes): blowpipe, throwing stars and hand-seal training",
      "An instructor who teaches in English and Japanese",
      "Photographs during the session",
      "Ninja costume rental on the costume plan",
      "Tax included",
    ],
    notIncluded: [
      "Transport to the studio (meet on site)",
      "Ninja costume on the basic plan",
    ],
    schedule: [
      { time: "-0:15", title: "Arrive and check in", body: "Change into your costume if you chose the costume plan." },
      { time: "0:00", title: "Blowpipe", body: "Aim and breath: the blowpipe at the targets." },
      { time: "0:20", title: "Shuriken", body: "How to hold and throw a shuriken so it sticks.", img: "/images/ninja-shuriken-throw.jpg" },
      { time: "0:40", title: "Hand seals", body: "The in-musubi, the ninja's hand seals, with the instructor." },
      { time: "0:50", title: "Photos", body: "Photos in the training room, in costume if you are wearing one." },
      { time: "1:00", title: "End of the session" },
    ],
    venue: {
      known: ["A ninja training studio on an upper floor of a building in central Arashiyama, Kyoto, a short walk from the station and the bamboo grove — the exact address and entrance come with your confirmation", "Please be at the studio by your start time: the instructor can wait about 5 to 10 minutes, after which the session may go ahead without you", "Check in with the name or booking number on your confirmation", "Regular sessions may include other guests; a private session takes your group only (up to 16)", "Not accessible for wheelchairs or strollers", "Comfortable clothes and closed-toe shoes"],
      afterBooking: ["The studio's name, address and entrance instructions", "Directions from Arashiyama's stations", "A phone number for the day"],
      img: "/images/ninja-target-room.jpg", alt: "The training room with its row of targets",
    },
    notesLabel: "Requests (optional)",
    notesHint: "e.g. costume plan for all of us; children's ages",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date and tell us how many of you there are and whether you would like the costume plan." },
      { title: "We reply within 24 hours", body: "With the session time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The studio's address comes with your confirmation." },
    ],
    faq: [
      { q: "What do we do?", a: "The blowpipe, throwing stars at the targets, and the hand seals of the ninja, with an instructor. The session lasts 45 to 60 minutes, with photos at the end." },
      { q: "Is the costume included?", a: "On the costume plan, yes: you change into a ninja outfit for the session and the photos and return it the same day. The basic plan is without costume." },
      { q: "Which language is it in?", a: "English or Japanese; the instructors teach in both." },
      { q: "Can children join?", a: "Yes, all ages with an adult. Tell us their ages when you request and we confirm what suits them." },
      { q: "Can we have a private session?", a: "Yes, on request. Regular sessions take up to 12 and may include other guests; a private session takes your group only, up to 16, and is quoted when you request. Private sessions follow the second set of cancellation terms below." },
      { q: "What if we are late?", a: "Please be there by your start time. The instructor can wait about 5 to 10 minutes; after that you may not be able to join, so call the number on your confirmation if you are delayed." },
      { q: "Is the studio accessible?", a: "No: it is up a flight of stairs and cannot take wheelchairs or strollers." },
      { q: "What is the cancellation policy?", a: "Regular sessions of up to 19 guests: free until 30 days before the date; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free until 45 days before; from 44 to 29 days before, half; from 28 days before, the full price. One free date change up to 14 days before (29 days before for private sessions and groups of 20 or more), if another time has room. Days are counted in Japan time." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Try the blowpipe at the targets", "Learn to throw shuriken so they stick", "Learn the ninja's hand seals", "Photos in the training room, in costume if you like"],
    master: { title: "Your instructor", bio: "Instructors at the studio teach the blowpipe, shuriken and hand seals in English and Japanese to guests of all ages.", quote: "" },
    itinerary: ["-0:15 — Arrive and check in", "0:00 — Blowpipe", "0:20 — Shuriken", "0:40 — Hand seals", "0:50 — Photos", "1:00 — End of the session"],
    goodToKnow: ["45 to 60 minutes, every day; the start time is arranged with your date. Be there by your start time (the instructor can wait about 5 to 10 minutes).", "All ages, children with an adult. Regular sessions may include other guests; private sessions up to 16 on request.", "Not accessible for wheelchairs or strollers.", "English or Japanese."],
    story: { heading: "Up the stairs in Arashiyama", body: "Most visitors to Arashiyama see the bamboo and the river. A few know about the room upstairs with the targets on the wall. An hour there is the most fun you will have in Kyoto with a throwing star." },
  },
  {
    // Viyago Japan, Kyoto: 45-minute stone-mill matcha grinding on a covered
    // terrace in Arashiyama. Built 2026-10-14 from the partner's public page;
    // ¥5,000 is a placeholder until the selling price is decided.
    // 2026-10-16: the partner's condition sheet lists the product as on sale
    // and accepting guests (45–60 min, all ages, 1–40, daily, requests close
    // the day before, start time arranged around the group's day) with the
    // partner's cancellation scale. Venue name stays off the page. Preview.
    slug: "arashiyama-stone-mill-matcha", city: "kyoto", category: "tea-ceremony", bookingType: "request", status: "preview",
    title: "Stone-Mill Matcha Grinding in Arashiyama, Kyoto",
    tagline: "Turn a granite mill by hand to grind tencha leaves into matcha, whisk it with a bamboo chasen, and drink the bowl you made on a covered terrace in Arashiyama. Forty-five to sixty minutes, in English or Japanese.",
    overview: [
      "Matcha is tea leaf ground to a powder fine enough to drink, and the grinding is the slow part. On a covered terrace in Arashiyama you turn a traditional stone mill yourself, feel how little comes out of each turn, and understand why good matcha costs what it does.",
      "Then you whisk the powder you made into a bowl with a bamboo chasen and drink it, looking out over the street. The session takes 45 to 60 minutes and is taught in English or Japanese; the tencha, the mill and the utensils are provided.",
    ],
    duration: "45–60 minutes", price: "¥5,000", priceUnit: "person", group: "1 to 40 guests · private sessions on request", ages: "All ages (children with an adult)", area: "Kyoto (Arashiyama)",
    img: "/images/matcha-stone-mill.jpg", alt: "Hands turning a granite stone mill with bright green matcha powder gathering in the groove",
    gallery: [
      { img: "/images/matcha-whisk.jpg", alt: "Whisking matcha in a bowl with a bamboo chasen" },
      { img: "/images/matcha-powder.jpg", alt: "Freshly ground matcha powder falling from a stone mill" },
      { img: "/images/matcha-sweets.jpg", alt: "A bowl of matcha and a plate of seasonal Japanese sweets by a window" },
    ],
    galleryNote: "Photos from the partner's terrace.",
    partySize: { min: 1, max: 40 },
    availability: { daily: true, startTimes: ["10:00", "11:00", "13:00", "14:00", "15:00"], cutoffDays: 1, cutoffTime: "18:00" },
    timeLabel: "Preferred start time",
    availabilityNote: "Runs every day; the start time is arranged around your day and confirmed with your date. Requests close the day before. Please be at the terrace by your start time.",
    scheduleNote: "Timings counted from the start of your session; sessions run 45 to 60 minutes.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English or Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of your session, Japan time. Regular sessions of up to 19 guests: free cancellation ends 30 days before; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free cancellation ends 45 days before; from 44 to 29 days before, half the price; from 28 days before, the full price. The date can be changed once, free of charge, up to 14 days before (29 days before for private sessions and groups of 20 or more) if another time has room. Final numbers are due 14 days before; a smaller group after that is charged in full. If the venue has to cancel, you hear by the day before, by phone or email, and are refunded to your original payment method.",
    cancellationTiers: [{ until: 30, rate: 0 }, { until: 14, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "45–60-minute session · Tencha and utensils · The bowl you make",
    highlights: [
      { icon: "brush", title: "Grind it yourself", body: "A traditional granite mill, turned by hand: the slow, satisfying part of matcha that nobody shows you." },
      { icon: "meal", title: "Drink what you made", body: "Whisk your own powder with a bamboo chasen and drink it on the terrace." },
      { icon: "chat", title: "English or Japanese", body: "Instruction in both languages, in a small group." },
    ],
    included: [
      "The session (45 to 60 minutes) with instruction",
      "Use of the stone mill and tea utensils",
      "Tencha leaves and the bowl of matcha you make",
      "Tax included",
    ],
    notIncluded: [
      "Transport to the terrace (meet on site)",
      "Sweets and other food and drinks (available on the day)",
    ],
    schedule: [
      { time: "-0:15", title: "Arrive and check in" },
      { time: "0:00", title: "The mill", body: "How the stone mill works and how to turn it; then grind your tencha.", img: "/images/matcha-powder.jpg" },
      { time: "0:25", title: "Whisk", body: "Sift the powder, add hot water and whisk with the chasen." },
      { time: "0:35", title: "Drink", body: "Your bowl of matcha on the terrace." },
      { time: "0:45", title: "End of the session" },
    ],
    venue: {
      known: ["A café terrace on an upper floor of a building in central Arashiyama, Kyoto — the exact address and entrance come with your confirmation", "The terrace is covered but semi-outdoor: dress for the weather", "Please be at the terrace by your start time: the instructor can wait about 5 to 10 minutes, after which the session may go ahead without you", "Check in with the name or booking number on your confirmation", "Not accessible for wheelchairs or strollers"],
      afterBooking: ["The venue's name, address and entrance instructions", "Directions from Arashiyama's stations", "A phone number for the day"],
      img: "/images/matcha-sweets.jpg", alt: "Matcha and sweets on the terrace",
    },
    notesLabel: "Requests (optional)",
    notesHint: "e.g. children's ages; a preferred time of day",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date and tell us how many of you there are." },
      { title: "We reply within 24 hours", body: "With the session time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The address comes with your confirmation." },
    ],
    faq: [
      { q: "What is tencha?", a: "The shade-grown tea leaf that becomes matcha once it is ground. You grind it yourself in the session." },
      { q: "How long does the grinding take?", a: "About twenty minutes of turning for one bowl: the mill is slow by design, which is why matcha is precious." },
      { q: "Can children join?", a: "Yes, with an adult; the mill is easy to turn and the bowl is small." },
      { q: "Which language is it in?", a: "English or Japanese." },
      { q: "Can we have a private session?", a: "Yes, on request: a private session takes your group only and is quoted when you request. Private sessions and groups of 20 or more follow the second set of cancellation terms below." },
      { q: "What if we are late?", a: "Please be there by your start time. The instructor can wait about 5 to 10 minutes; after that you may not be able to join, so call the number on your confirmation if you are delayed." },
      { q: "Is the terrace accessible?", a: "No: it is up a flight of stairs and cannot take wheelchairs or strollers." },
      { q: "What is the cancellation policy?", a: "Regular sessions of up to 19 guests: free until 30 days before the date; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free until 45 days before; from 44 to 29 days before, half; from 28 days before, the full price. One free date change up to 14 days before (29 days before for private sessions and groups of 20 or more), if another time has room. Days are counted in Japan time." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Grind tencha into matcha on a stone mill", "Whisk it with a bamboo chasen", "Drink your bowl on a covered terrace"],
    master: { title: "Your instructor", bio: "The terrace's staff teach the mill and the whisk in English and Japanese.", quote: "" },
    itinerary: ["-0:15 — Arrive and check in", "0:00 — The mill", "0:25 — Whisk", "0:35 — Drink", "0:45 — End of the session"],
    goodToKnow: ["45 to 60 minutes, every day; the start time is arranged with your date. Be there by your start time.", "All ages with an adult. Groups of 1 to 40; private sessions on request.", "Semi-outdoor terrace; not accessible for wheelchairs or strollers.", "English or Japanese."],
    story: { heading: "Why matcha is slow", body: "A stone mill turning at the right speed gives a few grams of powder in twenty minutes. Once you have turned it yourself, every bowl of matcha you drink afterwards tastes of that time." },
  },
  {
    // Viyago Japan, Kyoto: a 60-minute Japanese knife workshop in Arashiyama,
    // two plans (custom knife making: choose a blade, sharpen it, fit the
    // handle; beginner sharpening). Built 2026-10-14 from the partner's public
    // page; prices are set in the booking calendar and were not available, so
    // ¥15,000 is a placeholder until the selling price is decided.
    // 2026-10-16: facts aligned with the partner's condition sheet (about 60
    // min, ages 6+, 1–40, daily, requests close the day before, start time
    // arranged around the group's day, finished knife taken home the same
    // day, not in cabin baggage) and the partner's cancellation scale. How the
    // custom/beginner plans and engraving map to the sheet is unconfirmed, so
    // the existing wording stays. Venue name off the page. Preview.
    slug: "arashiyama-japanese-knife-workshop", city: "kyoto", category: "knife-making", bookingType: "request", status: "preview",
    title: "Japanese Knife Making & Sharpening Workshop in Arashiyama, Kyoto",
    tagline: "Choose a blade, sharpen it on a whetstone and fit its handle, then take home a Japanese kitchen knife you finished yourself. Or learn to sharpen properly on a knife that is already handled. An hour in a workshop in Arashiyama, in English or Japanese.",
    overview: [
      "A Japanese kitchen knife is made in stages by different hands, and the last of them — sharpening and fitting the handle — is the one you can do yourself. In a workshop in Arashiyama you choose from several blades, learn the angle and the rhythm on the whetstone, attach a prepared handle and leave with the knife.",
      "If you would rather learn the skill than build the knife, the beginner plan teaches sharpening on a knife that already has its handle, and you take that knife home instead. Both plans take about an hour, in English or Japanese, with no experience needed. Engraving can be added on the custom plan for a fee.",
    ],
    duration: "About 60 minutes", price: "¥15,000", priceUnit: "person", group: "1 to 40 guests · private sessions on request", ages: "Ages 6+", area: "Kyoto (Arashiyama)",
    img: "/images/knife-arashiyama-hero.jpg", alt: "An instructor in an apron smiling behind a table of Japanese kitchen knives and wooden handles",
    gallery: [
      { img: "/images/knife-sharpening.jpg", alt: "Hands sharpening a blade on a wet whetstone" },
      { img: "/images/knife-paper-test.jpg", alt: "The instructor testing an edge on a sheet of paper" },
      { img: "/images/knife-tomato.jpg", alt: "A finished knife slicing cleanly through a tomato" },
    ],
    galleryNote: "Photos from the partner's workshop.",
    partySize: { min: 1, max: 40 },
    availability: { daily: true, startTimes: ["10:00", "11:30", "13:00", "14:30", "16:00"], cutoffDays: 1, cutoffTime: "18:00" },
    timeLabel: "Preferred start time",
    availabilityNote: "Runs every day; the start time is arranged around your day and confirmed with your date. Requests close the day before. Please be at the workshop by your start time.",
    scheduleNote: "Timings counted from the start of your session (custom plan).",
    taxIncluded: true,
    interpreter: false,
    langTag: "English or Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of your session, Japan time. Regular sessions of up to 19 guests: free cancellation ends 30 days before; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free cancellation ends 45 days before; from 44 to 29 days before, half the price; from 28 days before, the full price. The date can be changed once, free of charge, up to 14 days before (29 days before for private sessions and groups of 20 or more) if another time has room. Final numbers are due 14 days before; a smaller group after that is charged in full. If the workshop has to cancel, you hear by the day before, by phone or email, and are refunded to your original payment method.",
    cancellationTiers: [{ until: 30, rate: 0 }, { until: 14, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "60-minute workshop · Tools · The knife you take home",
    highlights: [
      { icon: "brush", title: "Your own knife to keep", body: "On the custom plan you choose the blade, sharpen it and fit the handle; the knife goes home with you." },
      { icon: "spark", title: "Or just learn to sharpen", body: "The beginner plan teaches the whetstone properly on a handled knife — the skill most home cooks never learn." },
      { icon: "chat", title: "English or Japanese", body: "Instruction in both, with no experience needed; follow the instructor's safety guidance with the blades." },
    ],
    included: [
      "The 60-minute workshop with instruction",
      "Use of whetstones and tools",
      "The knife: your chosen blade with a prepared handle (custom plan) or the handled knife you sharpened (beginner plan)",
      "Tax included",
    ],
    notIncluded: [
      "Transport to the workshop (meet on site)",
      "Engraving (custom plan only; a paid option)",
      "Choice of handle (handles are prepared in advance)",
    ],
    schedule: [
      { time: "-0:15", title: "Arrive and check in" },
      { time: "0:00", title: "Choose your blade", body: "Several blade shapes to pick from; the instructor explains what each is for." },
      { time: "0:10", title: "Sharpen", body: "The angle, the pressure and the rhythm on the whetstone, with the instructor beside you.", img: "/images/knife-sharpening.jpg" },
      { time: "0:40", title: "Fit the handle", body: "Attach the prepared handle and finish the knife." },
      { time: "0:55", title: "Test the edge", body: "Paper, then a tomato." },
      { time: "1:00", title: "End of the workshop" },
    ],
    venue: {
      known: ["A workshop on an upper floor of a building in central Arashiyama, Kyoto — the exact address and entrance come with your confirmation", "Knives are sharp: follow the instructor's safety instructions; from age 6", "Please be at the workshop by your start time: the instructor can wait about 5 to 10 minutes, after which the session may go ahead without you", "Check in with the name or booking number on your confirmation", "You take the finished knife home the same day; it cannot go in cabin baggage", "Not accessible for wheelchairs or strollers"],
      afterBooking: ["The workshop's name, address and entrance instructions", "Directions from Arashiyama's stations", "A phone number for the day", "Advice on packing the knife in checked luggage"],
      img: "/images/knife-craftsman.jpg", alt: "A craftsman inspecting a blade",
    },
    notesLabel: "Requests (optional)",
    notesHint: "e.g. custom plan for two, beginner plan for one; left-handed",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date, tell us how many of you there are, and which plan each of you would like: custom knife making or beginner sharpening." },
      { title: "We reply within 24 hours", body: "With the session time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The address comes with your confirmation." },
    ],
    faq: [
      { q: "What is the difference between the two plans?", a: "Custom knife making: choose a blade from several, sharpen it and fit a prepared handle; you take that knife home. Beginner sharpening: learn to sharpen on a knife that already has its handle; you take that knife home. Blade and handle choice, handle replacement and engraving are not part of the beginner plan." },
      { q: "Can I choose the handle?", a: "No: handles are prepared in advance. The blade is your choice on the custom plan." },
      { q: "Can I have it engraved?", a: "On the custom plan, as a paid option; ask when you request." },
      { q: "Can I take the knife on the plane?", a: "Not in cabin baggage: pack it in your checked luggage. We send packing advice with your confirmation. Rules on bringing a knife into your home country are yours to check." },
      { q: "Can children join?", a: "From age 6, following the instructor's safety instructions." },
      { q: "Which language is it in?", a: "English or Japanese." },
      { q: "Can we have a private session?", a: "Yes, on request: a private session takes your group only and is quoted when you request. Private sessions and groups of 20 or more follow the second set of cancellation terms below." },
      { q: "What if we are late?", a: "Please be there by your start time. The instructor can wait about 5 to 10 minutes; after that you may not be able to join, so call the number on your confirmation if you are delayed." },
      { q: "What is the cancellation policy?", a: "Regular sessions of up to 19 guests: free until 30 days before the date; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free until 45 days before; from 44 to 29 days before, half; from 28 days before, the full price. One free date change up to 14 days before (29 days before for private sessions and groups of 20 or more), if another time has room. Days are counted in Japan time." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Choose a blade (custom plan)", "Sharpen it on a whetstone with the instructor", "Fit the prepared handle and finish the knife", "Take the knife home"],
    master: { title: "Your instructor", bio: "The workshop's instructors teach sharpening and knife finishing in English and Japanese to beginners and cooks alike.", quote: "" },
    itinerary: ["-0:15 — Arrive and check in", "0:00 — Choose your blade", "0:10 — Sharpen", "0:40 — Fit the handle", "0:55 — Test the edge", "1:00 — End of the workshop"],
    goodToKnow: ["About 60 minutes, every day; the start time is arranged with your date. Be there by your start time.", "From age 6. Groups of 1 to 40; private sessions on request. Two plans: custom knife making or beginner sharpening.", "Not accessible for wheelchairs or strollers. The knife goes home with you the same day, in checked luggage.", "English or Japanese."],
    story: { heading: "The last pair of hands", body: "A Japanese knife passes through a forger, a grinder and a handle-maker before it reaches a kitchen. Doing the final sharpening yourself, and fitting the handle, makes it yours in a way no shop can." },
  },
  {
    // Viyago Japan, Kyoto: cast your own metal shuriken (standard or mini) in
    // 60 minutes in the Arashiyama studio. Built 2026-10-14 from the partner's
    // public page; prices are set in the booking calendar and were not
    // available, so ¥8,000 is a placeholder until the selling price is decided.
    // 2026-10-16: facts aligned with the partner's condition sheet (about 60
    // min, ages 6+ because of the hot metal, 1–12, daily, requests close the
    // day before, start time arranged around the group's day, finished piece
    // taken home the same day) and the partner's cancellation scale. How the
    // standard/mini plans map to the sheet, and how the piece travels, are
    // unconfirmed. Venue name off the page. Preview.
    slug: "arashiyama-shuriken-casting", city: "kyoto", category: "ninja", bookingType: "request", status: "preview",
    title: "Cast Your Own Metal Shuriken in Arashiyama, Kyoto",
    tagline: "Design the shape, prepare the mould, pour the metal and polish the result: a throwing star you made yourself, standard size or a mini version to carry. An hour in a ninja studio in Arashiyama, in English or Japanese.",
    overview: [
      "The shuriken is the ninja's most famous tool, and it is cast, not forged. In an hour in a studio in Arashiyama you design the shape of yours, prepare the mould in casting sand, watch the metal poured, quench it and polish it until it shines. You leave with it in your hand.",
      "Choose the standard size or a mini shuriken about half as large, small enough to carry. On some days other weapon shapes or a necklace finish are available; ask the staff on the day. The session is taught in English or Japanese.",
    ],
    duration: "About 60 minutes", price: "¥8,000", priceUnit: "person", group: "1 to 12 guests · private sessions on request", ages: "Ages 6+ (hot metal is handled by the instructor)", area: "Kyoto (Arashiyama)",
    img: "/images/shuriken-arashiyama-hero.jpg", alt: "A guest in a leather apron holding up a freshly cast metal shuriken in front of the targets",
    gallery: [
      { img: "/images/shuriken-pour.jpg", alt: "Molten metal poured from a ladle into a sand mould" },
      { img: "/images/shuriken-quench.jpg", alt: "Hands quenching a cast shuriken in a wooden tub of water" },
      { img: "/images/shuriken-finished.jpg", alt: "A finished four-pointed shuriken on an anvil" },
    ],
    galleryNote: "Photos from the partner's studio.",
    partySize: { min: 1, max: 12 },
    availability: { daily: true, startTimes: ["10:00", "11:30", "13:00", "14:30", "16:00"], cutoffDays: 1, cutoffTime: "18:00" },
    timeLabel: "Preferred start time",
    availabilityNote: "Runs every day; the start time is arranged around your day and confirmed with your date. Requests close the day before. Please be at the studio by your start time.",
    scheduleNote: "Timings counted from the start of your session.",
    taxIncluded: true,
    interpreter: false,
    langTag: "English or Japanese",
    skipSiteFaq: true,
    cancellation: "Days are counted to the date of your session, Japan time. Regular sessions of up to 19 guests: free cancellation ends 30 days before; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free cancellation ends 45 days before; from 44 to 29 days before, half the price; from 28 days before, the full price. The date can be changed once, free of charge, up to 14 days before (29 days before for private sessions and groups of 20 or more) if another time has room. Final numbers are due 14 days before; a smaller group after that is charged in full. If the studio has to cancel, you hear by the day before, by phone or email, and are refunded to your original payment method.",
    cancellationTiers: [{ until: 30, rate: 0 }, { until: 14, rate: 50 }, { until: 0, rate: 100 }],
    includedShort: "60-minute session · Materials · The shuriken you cast",
    highlights: [
      { icon: "spark", title: "Molten metal, your design", body: "Shape the mould yourself, then watch the pour: the part of the ninja's craft nobody else offers." },
      { icon: "brush", title: "Polish it to a shine", body: "Quench, file and polish until the star is finished and yours to keep." },
      { icon: "chat", title: "English or Japanese", body: "Instruction in both; aprons and gloves provided." },
    ],
    included: [
      "The 60-minute casting session with instruction",
      "Materials, mould, apron and gloves",
      "The finished shuriken (standard or mini) to take home",
      "Tax included",
    ],
    notIncluded: [
      "Transport to the studio (meet on site)",
      "Necklace finish or other shapes, where offered on the day (paid options)",
    ],
    schedule: [
      { time: "-0:15", title: "Arrive and check in" },
      { time: "0:00", title: "Design and mould", body: "Choose standard or mini, shape the design and prepare the sand mould." },
      { time: "0:20", title: "The pour", body: "The instructor pours the molten metal into your mould.", img: "/images/shuriken-pour.jpg" },
      { time: "0:30", title: "Quench and polish", body: "Cool the star in water, then file and polish it.", img: "/images/shuriken-quench.jpg" },
      { time: "1:00", title: "End of the session" },
    ],
    venue: {
      known: ["A ninja studio on an upper floor of a building in central Arashiyama, Kyoto — the exact address and entrance come with your confirmation", "Hot metal is handled by the instructor; guests wear aprons and gloves and follow the safety instructions; from age 6", "Please be at the studio by your start time: the instructor can wait about 5 to 10 minutes, after which the session may go ahead without you", "Check in with the name or booking number on your confirmation", "You take the finished shuriken home the same day", "Not accessible for wheelchairs or strollers"],
      afterBooking: ["The studio's name, address and entrance instructions", "Directions from Arashiyama's stations", "A phone number for the day", "Advice on carrying the shuriken home, confirmed with the studio"],
      img: "/images/ninja-target-room.jpg", alt: "The studio's training room",
    },
    notesLabel: "Requests (optional)",
    notesHint: "e.g. two standard, one mini; children's ages",
    flow: [
      { title: "Choose a date and send your request", body: "Pick a date and tell us how many of you there are and whether you would like standard or mini shuriken." },
      { title: "We reply within 24 hours", body: "With the session time, the price for your group and the conditions." },
      { title: "Pay to confirm", body: "Your booking is confirmed when your payment arrives; cancellation terms start then. The address comes with your confirmation." },
    ],
    faq: [
      { q: "Do I handle the molten metal?", a: "No: the instructor pours. You design the shape, prepare the mould, quench the cast star and polish it, with an apron and gloves." },
      { q: "Standard or mini?", a: "The standard shuriken is about twice the size of the mini. The mini is small enough to carry." },
      { q: "Can I take it home on the plane?", a: "You take it with you the same day. A metal blade does not belong in cabin baggage; we confirm the packing advice for your shuriken with the studio and send it with your confirmation. Rules in your home country are yours to check." },
      { q: "Can children join?", a: "From age 6. The instructor handles the hot metal; guests wear aprons and gloves and follow the safety instructions." },
      { q: "Which language is it in?", a: "English or Japanese." },
      { q: "Can we have a private session?", a: "Yes, on request: a private session takes your group only and is quoted when you request. Private sessions and groups of 20 or more follow the second set of cancellation terms below." },
      { q: "What if we are late?", a: "Please be there by your start time. The instructor can wait about 5 to 10 minutes; after that you may not be able to join, so call the number on your confirmation if you are delayed." },
      { q: "What is the cancellation policy?", a: "Regular sessions of up to 19 guests: free until 30 days before the date; from 29 to 14 days before, half the price; from 13 days before, including no-shows, the full price. Private sessions and groups of 20 or more: free until 45 days before; from 44 to 29 days before, half; from 28 days before, the full price. One free date change up to 14 days before (29 days before for private sessions and groups of 20 or more), if another time has room. Days are counted in Japan time." },
      { q: "How does booking work?", a: "Choose a date and send a request; it costs nothing. We reply within 24 hours with the start time, the price and the conditions. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    whatYoullDo: ["Design your shuriken and prepare the mould", "Watch the metal poured", "Quench, file and polish the star", "Take it home"],
    master: { title: "Your instructor", bio: "The studio's instructors teach the casting process in English and Japanese and handle the hot metal themselves.", quote: "" },
    itinerary: ["-0:15 — Arrive and check in", "0:00 — Design and mould", "0:20 — The pour", "0:30 — Quench and polish", "1:00 — End of the session"],
    goodToKnow: ["About 60 minutes, every day; the start time is arranged with your date. Be there by your start time.", "From age 6. Groups of 1 to 12; private sessions on request. Standard or mini shuriken; aprons and gloves provided.", "Not accessible for wheelchairs or strollers. You take the star home the same day; ask us about carrying it.", "English or Japanese."],
    story: { heading: "Cast, not thrown", body: "Every ninja film shows the throw. Almost none shows the making: the sand, the pour, the hiss of the quench. An hour in Arashiyama gives you the part the films leave out, and the star to prove it." },
  },
  {
    slug: "sushi-masterclass", city: "tokyo", category: "sushi",
    partySize: { min: 1, max: 6 },
    map: { lat: 35.6654, lng: 139.7707, zoom: 14 },
    title: "Edo-mae Sushi Masterclass",
    tagline: "Craft nigiri with a third-generation chef at his own counter",
    duration: "2.5 hours", price: "¥45,000", group: "Private · up to 6", ages: "Ages 8+", area: "Tokyo (Tsukiji area)",
    img: "/images/exp-sushi.jpg", alt: "Quiet hinoki-wood omakase sushi counter",
    gallery: [{ img: "/images/cat-sushi.jpg", alt: "Sushi chef slicing fish on a wooden board" }],
    whatYoullDo: [
      "Take a seat at the chef's own counter — closed to the public for your session.",
      "Learn to shape shari, season neta and press nigiri under his hands-on correction.",
      "Taste each piece the moment it is made, the way Edo-mae sushi is meant to be eaten.",
      "Finish with the chef's own selection, served to you as his guests.",
    ],
    master: { quote: "My grandfather held my hands over the rice. Today, I hold yours.", title: "A third-generation Edo-mae sushi chef", bio: "He trained under his father and grandfather at the same counter where you will stand, in a neighbourhood shaped by the old Tsukiji market. He rarely takes students; this session is the exception. His shop's name is shared once your booking is confirmed." },
    itinerary: ["10:00 — Meet your interpreter guide near the venue", "10:15 — Introductions, apron on, knife work and shari", "11:15 — Shaping nigiri at the counter", "12:00 — Tasting and the chef's finishing course", "12:30 — End of the experience"],
    goodToKnow: ["Held in the morning before the shop opens; exact days depend on the chef's schedule.", "Raw fish is central to the session — tell us about allergies and we will adapt.", "Hands-on and standing for most of the session; aprons are provided.", "Photography is welcome; we ask that the shopfront and signage stay out of frame."],
    story: { heading: "The story of Edo-mae sushi", body: "Edo-mae — 'in front of Edo' — once meant fish pulled from Tokyo Bay and cured, pressed or seared to last a day without ice. The techniques survived refrigeration because they taste better, not because they are old. What you learn at this counter is that repertoire: vinegar, salt, kombu and time, applied piece by piece." },
  },
  {
    slug: "sumo-morning-practice", city: "tokyo", category: "sumo",
    partySize: { min: 1, max: 8 },
    map: { lat: 35.6967, lng: 139.7933, zoom: 14 },
    title: "Inside Sumo Morning Practice",
    tagline: "Ringside at a working stable as the day's training unfolds",
    duration: "2 hours", price: "¥38,000", group: "Small group · up to 8", ages: "Ages 10+", area: "Tokyo (Ryogoku area)",
    img: "/images/exp-sumo.jpg", alt: "Sumo wrestlers training in the ring of a Tokyo stable",
    gallery: [{ img: "/images/cat-sumo.jpg", alt: "Sumo wrestlers performing the ring-entering ceremony" }],
    whatYoullDo: [
      "Enter a working sumo stable with your guide before the city wakes.",
      "Watch keiko — morning practice — from tatami seats a few metres from the ring.",
      "Learn the meaning of each drill and ritual as it happens, in your language.",
      "Meet the wrestlers briefly after practice, as their schedule allows.",
    ],
    master: { quote: "Practice is not a show. But this morning, the door is open for you.", title: "A sumo stable in the Ryogoku district", bio: "The stable has trained ranked wrestlers for decades in Tokyo's historic sumo quarter. Visits are limited so that practice is never disturbed; your guide will brief you on etiquette before you enter. The stable's name is shared once your booking is confirmed." },
    itinerary: ["07:30 — Meet your interpreter guide in Ryogoku", "07:45 — Etiquette briefing, enter the stable", "08:00 — Morning practice, observed from tatami seats", "09:15 — Short greeting with the wrestlers (schedule permitting)", "09:30 — End of the experience"],
    goodToKnow: ["Practice follows the tournament calendar; some weeks are unavailable.", "Silence is required during training; your guide translates in a whisper.", "You will sit on tatami for up to 90 minutes; cushions are provided.", "Dress modestly; no flash photography inside the stable."],
    story: { heading: "The world inside a sumo stable", body: "Professional sumo is lived, not just performed. Wrestlers share a roof, a kitchen and a strict hierarchy, and the morning ring is where all of it becomes visible — juniors sweeping the dohyo, seniors taking the last and hardest bouts. Seeing keiko is seeing the sport's whole society at once." },
  },
  {
    slug: "kimono-photo-walk", city: "tokyo", category: "kimono",
    partySize: { min: 1, max: 4 },
    map: { lat: 35.7147, lng: 139.7966, zoom: 14 },
    title: "Kimono Dressing & Garden Photo Walk",
    tagline: "Dressed by a professional stylist, then a stroll through a classic garden",
    duration: "3 hours", price: "¥40,000", group: "Private · up to 4", ages: "All ages", area: "Tokyo (traditional garden district)",
    img: "/images/exp-kimono.jpg", alt: "Woman in a red kimono beside a koi pond in a Japanese garden",
    gallery: [{ img: "/images/cat-kimono.jpg", alt: "Antique silk kimono with pheasant and peony motif" }],
    whatYoullDo: [
      "Choose from a curated wardrobe of silk kimono matched to the season.",
      "Be dressed properly — every layer, fold and knot — by a professional stylist.",
      "Walk a classic strolling garden while your guide shares its design and history.",
      "Have unhurried time for photographs at the garden's best vantage points.",
    ],
    master: { quote: "A kimono is not worn — it is built. And I will build it on you.", title: "A professional kimono stylist", bio: "She has dressed clients for weddings, ceremonies and film for over twenty years, and chooses each ensemble to suit the wearer and the season rather than from a costume rack. Her studio's location is shared once your booking is confirmed." },
    itinerary: ["10:00 — Meet your interpreter guide at the studio", "10:15 — Kimono selection and dressing", "11:15 — Garden walk and photography", "12:45 — Return, change, and tea", "13:00 — End of the experience"],
    goodToKnow: ["Kimono are available in a wide range of sizes; let us know your height in advance.", "Comfortable walking is part of the experience; tabi socks are provided.", "In rain, the walk moves under the garden's covered paths and teahouse.", "A professional photographer can be added on request."],
    story: { heading: "Why dressing matters", body: "A kimono is not put on; it is built — layer over layer, adjusted to the body until the silhouette is right. Done properly it changes how you stand and walk, which is exactly why the garden comes after the dressing room. The garden was designed for people moving at a kimono's pace." },
  },
  {
    slug: "katana-forge-visit", city: "tokyo", category: "swordsmith",
    partySize: { min: 1, max: 4 },
    map: { lat: 35.6895, lng: 139.6917, zoom: 14 },
    title: "Katana: Visit a Swordsmith's Forge",
    tagline: "Watch a licensed swordsmith fold steel the traditional way",
    duration: "3 hours", price: "¥90,000", group: "Private · up to 4", ages: "Ages 12+", area: "Greater Tokyo (workshop district)",
    img: "/images/cat-sword.jpg", alt: "Polished katana blade photographed on black",
    gallery: [],
    whatYoullDo: [
      "Travel with your guide to a working forge rarely opened to visitors.",
      "Watch tamahagane steel heated, hammered and folded at the anvil.",
      "Handle finished blades and learn how a polisher reveals the hamon.",
      "Ask the smith anything — your guide translates the full conversation.",
    ],
    master: { quote: "Steel remembers every strike. Come and watch it remember.", title: "A licensed Japanese swordsmith", bio: "One of a small number of smiths licensed to forge nihonto today, he works in the traditional charcoal forge with a single apprentice. Forging days are irregular, so dates are confirmed individually. His forge's location is shared once your booking is confirmed." },
    itinerary: ["09:30 — Meet your interpreter guide; travel to the forge together", "10:30 — Introduction to the forge and its tools", "11:00 — Forging demonstration at the anvil", "12:00 — Blade handling, questions with the smith", "12:30 — End of the experience (return travel with your guide)"],
    goodToKnow: ["The forge is hot and loud during demonstrations; ear protection is provided.", "Closed-toe shoes and natural-fibre clothing are required near the fire.", "Forging dates depend on the smith's production schedule — book early.", "Blades are handled only under the smith's direct supervision."],
    story: { heading: "A thousand years in one curve", body: "The Japanese sword survives because its making was never simplified. The same steel is still smelted from iron sand, folded to drive out impurities, and quenched in water to create the curve and the hamon in a single moment of risk. Every licensed smith working today is a direct line to that unbroken method." },
  },
  {
    slug: "anime-nail-art-session", city: "tokyo", category: "anime-nail-art",
    partySize: { min: 1, max: 2 },
    map: { lat: 35.6702, lng: 139.7027, zoom: 14 },
    title: "Anime Nail Art Session",
    tagline: "Your favourite character, painted by a Tokyo nail artist",
    duration: "2 hours", price: "¥18,000", group: "Private · up to 2", ages: "All ages", area: "Tokyo (Akihabara / Harajuku area)",
    img: "/images/cat-nail.jpg", alt: "Neon-lit street in Akihabara at night",
    gallery: [],
    whatYoullDo: [
      "Share your favourite characters or artwork with the artist in advance.",
      "Watch tiny hand-painted illustrations take shape nail by nail.",
      "Chat with the artist about Tokyo's nail and fan-art culture as she works.",
      "Leave with durable gel art — and the artist's care instructions.",
    ],
    master: { quote: "Bring me your favourite character. I will fit them on eight millimetres.", title: "A Tokyo character-art nail artist", bio: "Her order book is filled by fans who fly in for her hand-painted character work, from classic franchises to this season's releases. She paints freehand with brushes finer than a pencil lead. Her salon's location is shared once your booking is confirmed." },
    itinerary: ["14:00 — Meet your interpreter guide at the salon", "14:10 — Design consultation over your references", "14:30 — Painting session", "15:50 — Finishing coat and aftercare", "16:00 — End of the experience"],
    goodToKnow: ["Send reference images at booking so the artist can prepare colours.", "Gel art typically lasts three to four weeks with normal wear.", "Complex designs may extend the session; timing is confirmed in advance.", "This experience sits in a lighter price band than our masterclasses — it is no less crafted."],
    story: { heading: "Fan art you can wear", body: "Nail art grew up alongside Japan's character culture, and in Tokyo the two merged into a genre of its own: micro-illustration, painted on a moving canvas smaller than a stamp. The best artists are booked out weeks ahead by locals. This session opens one of those chairs to you." },
  },
  {
    slug: "evening-with-geiko", city: "kyoto", category: "geisha", bookingType: "request", status: "live",
    partySize: { min: 2, max: 40 },
    pricing: {
      // Repriced 2026-10-06 to test demand: the house's party-size list price
      // less 10% (wholesale) plus ¥35k / 40k / 45k / 55k for 2 / 3 / 4 / 5
      // guests, rounded up to the thousand. Live shamisen and a second
      // performer are flat supplements (house: ¥60,500 each, same in both
      // seasons, also less 10%, plus ¥15k / 25k). Six or more are quoted.
      tiers: [{ party: 2, total: 161000 }, { party: 3, total: 182000 }, { party: 4, total: 195000 }, { party: 5, total: 226000 }],
      highSeason: {
        tiers: [{ party: 2, total: 179000 }, { party: 3, total: 209000 }, { party: 4, total: 231000 }, { party: 5, total: 271000 }],
        windows: [{ from: "03-15", to: "05-31" }, { from: "10-01", to: "11-30" }],
      },
      plans: [
        { id: "select", supplement: 0 },
        { id: "signature", supplement: 70000 },
        { id: "reserve", supplement: 135000 },
      ],
    },
    taxIncluded: true,
    interactionTime: "about 1 hour 45 minutes",
    interactionNote: "2 hours in total; your geiko or maiko is at your table for about 1 hour 45 minutes of it.",
    mapNote: "The pin marks Gion-Shijo Station (Keihan line); the venue is about 8 minutes on foot from there. The exact address comes with your confirmation.",
    availability: { daily: true, startTimes: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "20:30"], cutoffDays: 1, cutoffTime: "17:00", closed: [{ from: "12-29", to: "01-03" }] },
    availabilityNote: "Closed over the New Year holidays.",
    map: { lat: 35.0037, lng: 135.7723, zoom: 15 },
    title: "Private Geisha Dining in Kyoto",
    tagline: "Spend two private hours in Kyoto with a geiko or maiko. Share a seasonal Japanese dinner, talk across the table, watch a traditional dance and play ozashiki games together — with an interpreter guide throughout, in English, Spanish or French.",
    duration: "2 hours", price: "¥161,000", priceUnit: "group", group: "Private · 2–40 guests", ages: "All ages", area: "Kyoto (Gion / Higashiyama area)",
    img: "/images/geiko-photo-together.jpg", alt: "Two guests and a maiko smiling for a commemorative photo in a private Kyoto room",
    gallery: [
      { img: "/images/geiko-conversation.jpg", alt: "Conversation over dinner, with your interpreter carrying both sides", caption: "Conversation over dinner, with your interpreter carrying both sides" },
      { img: "/images/geiko-maiko-seated.jpg", alt: "A maiko settles in beside your table", caption: "A maiko settles in beside your table" },
      { img: "/images/geiko-dance.jpg", alt: "A dance performed before the gold screen", caption: "A dance performed before the gold screen" },
      { img: "/images/geiko-dinner-set.jpg", alt: "The multi-course Japanese dinner (the menu changes with the season)", caption: "The multi-course Japanese dinner (the menu changes with the season)" },
      { img: "/images/geiko-maiko-smile.jpg", alt: "A maiko in the private room", caption: "A maiko in the private room" },
      { img: "/images/geiko-pouring.jpg", alt: "Your host pours; ask her anything", caption: "Your host pours; ask her anything" },
      { img: "/images/geiko-games-table.jpg", alt: "Ozashiki parlour games at the table", caption: "Ozashiki parlour games at the table" },
      { img: "/images/geiko-game-toratora.jpg", alt: "Tora-tora, rock-paper-scissors played with the whole body", caption: "Tora-tora, rock-paper-scissors played with the whole body" },
      { img: "/images/geiko-room-upstairs.jpg", alt: "An upstairs room built in the style of a Gion teahouse", caption: "An upstairs room built in the style of a Gion teahouse" },
      { img: "/images/geiko-room-garden.jpg", alt: "A ground-floor room looking onto the inner garden", caption: "A ground-floor room looking onto the inner garden" },
    ],
    cancellation: "Days are counted to the date of the experience, Japan time. Date changes follow the same scale, and reducing your party applies the fee to the seats released; refunds go back by the method you paid. If no geiko or maiko can be secured for your date, you receive a full refund whatever the timing.",
    cancellationTiers: [{ until: 14, rate: 0 }, { until: 4, rate: 50 }, { until: 0, rate: 100 }],
    dietary: ["standard", "vegetarian", "glutenFree", "steakSet"],
    whatYoullDo: [
      "Settle into your own private banquet room — never shared with other guests.",
      "Dine on seasonal Kyoto cuisine as your geiko or maiko joins your table for conversation.",
      "Watch a dance performed an arm's length away, then try ozashiki parlour games together.",
      "Finish with commemorative photos with your hosts.",
    ],
    master: { quote: "For one evening, this room is yours. Come, let us talk.", title: "Geiko and maiko of Kyoto's hanamachi", bio: "Your evening is hosted by working geiko or maiko of Kyoto's flower-and-willow world, arranged especially for your date. The venue is a private banquet house in the Gion / Higashiyama district; its name and address are shared once your booking is confirmed." },
    itinerary: ["10 min before — Arrive at the venue with your guide (address in your confirmation)", "0:00 — Welcome to your private room; the banquet begins", "0:30 — Geiko and maiko join your table; conversation over dinner", "1:00 — Dance performance and ozashiki parlour games", "1:50 — Commemorative photos", "2:00 — End of the evening"],
    goodToKnow: [
      "Held every day except the New Year holidays, with start times from 12:00 to 20:30 — requests close at 5:00 pm JST the day before.",
      "Priced by party size: 2 guests ¥161,000, 3 guests ¥182,000, 4 guests ¥195,000, 5 guests ¥226,000; six or more on request. Live shamisen adds ¥70,000 and two performers with shamisen add ¥135,000, whatever the size of your party.",
      "Peak-season rates apply Mar 15 – May 31 and Oct 1 – Nov 30: 2 guests ¥179,000, 3 guests ¥209,000, 4 guests ¥231,000, 5 guests ¥271,000.",
      "Children: 2 and under join free without a meal, ages 3–11 half the adult rate, 12 and over the adult rate with the full course.",
      "Allergies and dietary restrictions are catered for — tell us when you book.",
      "Want live music or a fuller room? Choose With Live Shamisen (a jikata playing shamisen live) or Two Performers (two geiko or maiko plus the jikata).",
    ],
    story: { heading: "The world of the karyukai", body: "Kyoto's 'flower and willow world' has run on introduction and trust for three centuries. A geiko is not a performer for hire but an artist whose evenings are extended through relationships between teahouses and patrons. Being seated in that room, with conversation flowing in your own language, is the rarest kind of access Kyoto offers." },
    includedShort: "Private room · Meal and drinks · Interpreter guide (EN / ES / FR)",
    planText: {
      select: { label: "The Evening", name: "Private Geisha Evening", performers: "One geiko or maiko", blurb: "The essential evening; the dance is performed to recorded music." },
      signature: { label: "With Live Shamisen", name: "Private Geisha Evening with Live Shamisen", performers: "Geiko or maiko + live shamisen", blurb: "One geiko or maiko, joined by a jikata playing shamisen live." },
      reserve: { label: "Two Performers", name: "The Complete Geisha Evening", performers: "Two performers + live shamisen", blurb: "Two geiko or maiko, joined by a jikata for live shamisen. The fullest version of the evening." },
    },
    galleryNote: "The room and the dishes shown are examples; both vary by date and season.",
    highlights: [
      { icon: "group", title: "The room is yours", body: "A private banquet room for your party only — never shared with other guests." },
      { icon: "chat", title: "Conversation, not just a show", body: "Your geiko or maiko joins your table to talk, dances an arm's length away, then plays ozashiki games with you." },
      { icon: "interpreter", title: "Ask anything", body: "An interpreter guide carries the conversation both ways, so your questions reach the room and the answers reach you." },
    ],
    included: [
      "A private tatami room for your party — upstairs rooms are built like a Gion teahouse, ground-floor rooms look onto the inner garden",
      "A multi-course Japanese dinner: seasonal obanzai, sashimi, a meat course, tempura, rice and soup, dessert (changes with the market)",
      "Free-flow drinks throughout — beer, sake, shochu, wine, highballs, umeshu and soft drinks",
      "Your geiko or maiko hosting your table: conversation, one or two dances, and the parlour games Konpira Funefune and Tora-tora (performers by plan)",
      "Photographs and video are welcome, the dance included — no flash, no tripods, and your guide explains the house rules — plus commemorative photos with your host",
      "Four menus to choose from: the standard kaiseki course, vegetarian (with a no-fish-stock option), gluten-free, or a meat-only wagyu steak set — tell us when you request your date",
      "An interpreter guide — English, Spanish or French, your choice — with you from arrival to farewell: they welcome you in, explain Kyoto and the flower-town culture, the dance and each dish, and carry the conversation with your host both ways",
      "Tax and service charge — nothing is added on the day",
    ],
    notIncluded: [
      "Interpreters in languages other than English, Spanish or French: ask when you request your date",
      "Parties of six or more are quoted individually — up to 40 guests, larger groups on request",
    ],
    schedule: [
      { time: "17:50", title: "Arrive with your guide", body: "The address is in your confirmation. Your guide meets you nearby and walks you in." },
      { time: "18:00", title: "Your private room", body: "You are seated on tatami; the first courses and drinks arrive.", img: "/images/geiko-room-upstairs.jpg" },
      { time: "18:15", title: "Your geiko or maiko arrives", body: "She joins the table straight from the okiya and stays about 1 hour 45 minutes. Conversation over dinner, with your interpreter carrying both sides.", img: "/images/geiko-conversation.jpg" },
      { time: "19:00", title: "The dance", body: "One or two dances before the gold screen, from about 19:00 to 19:30 — to recorded music on The Evening, to live shamisen on the two plans with a jikata. Cameras are welcome.", img: "/images/geiko-dance.jpg" },
      { time: "19:30", title: "Ozashiki games", body: "Konpira Funefune, a rhythm game, and Tora-tora, rock-paper-scissors played with the whole body.", img: "/images/geiko-game-toratora.jpg" },
      { time: "19:50", title: "Photographs", body: "Commemorative photos with your host.", img: "/images/geiko-photo-together.jpg" },
      { time: "20:00", title: "End of the evening" },
    ],
    venue: {
      known: ["Gion / Higashiyama, Kyoto — about 8 minutes on foot from Gion-Shijo Station (Keihan line)", "A private room in a traditional dining house: teahouse-style rooms upstairs, garden-view rooms downstairs", "Seating is on tatami", "Meet on site — no transfers are arranged"],
      afterBooking: ["The house's name and street address", "A map and walking directions from the station", "Your guide's contact for the evening"],
      img: "/images/geiko-room-garden.jpg", alt: "A ground-floor tatami room looking onto the inner garden",
    },
    faq: [
      { q: "Will it be a geiko or a maiko?", a: "One geiko or maiko is arranged for your date. The house cannot take requests for a particular person, or for a maiko over a geiko; if you have a preference we will pass it on, without promising." },
      { q: "How long until the date is confirmed?", a: "We reply within 24 hours with whether the room is free, the price and the conditions — that reply is not yet a booking. Your booking is confirmed when you accept those conditions by paying through the link we send; cancellation terms apply from that moment. The house then secures your geiko or maiko: the formal request is placed no later than 14 days before your date (straight away for closer dates). If none can be secured, you receive a full refund." },
      { q: "Can we add live shamisen or a second host?", a: "Yes — that is what the plans are for. With Live Shamisen adds a jikata playing shamisen live (+¥70,000); Two Performers has two geiko or maiko plus the jikata (+¥135,000). The supplement is the same for any party size. Choose the plan when you request your date." },
      { q: "Can we take photographs during the dance?", a: "Yes. Photos and video are welcome at any point, the dance included — without flash or tripods, following the house rules your guide explains — and time is set aside at the end for commemorative photos with your host." },
      { q: "Are drinks included? Is there a dress code?", a: "Drinks are free-flow — beer, sake, shochu, wine, highballs, soft drinks — and included, as are tax and service charge. There is no dress code." },
      { q: "Will our host eat and drink with us?", a: "Usually not. Many maiko are under twenty, and by custom geiko and maiko do not eat at the table: they pour, talk, dance and play. Please do not press food or drink on them — it is the one etiquette point your guide will mention." },
      { q: "Can dietary needs and allergies be catered for?", a: "Yes. Choose from the standard kaiseki course, a vegetarian menu (fish stock can be left out), a gluten-free menu, or a wagyu steak set for guests who eat no fish (salad, steak and rice, served all at once, so its pace differs from the other courses). For allergies or religious restrictions, name the ingredients you cannot eat and the kitchen swaps them within the course; there is no certified halal or kosher menu, and cross-contamination cannot be ruled out entirely. Swaps are for allergies and religious needs, not preferences. Tell us in your request and the kitchen's answer comes back with the conditions, before you pay." },
      { q: "Can children join? What do they pay?", a: "Yes. Children aged 2 and under join free without a meal; ages 3 to 11 pay half the adult rate; 12 and over pay the adult rate. Children of 3 and over are served the same course as adults — there is no children's menu. Count everyone in the number of guests and tell us the children's ages in your request; the quote we send applies the reduction." },
      { q: "How far ahead must we book?", a: "By 5:00 pm JST the day before at the latest. For a date in the next few days we reply as quickly as we can, and can confirm only if a geiko or maiko is free at such short notice; a booking made less than 4 days ahead cannot be refunded once paid, unless none can be secured. 10 to 14 days ahead is the comfortable window, and spring and autumn (March–April, October–November) fill first. During Miyako Odori (April) the house may only be able to confirm close to the date. The final time slot is confirmed with your availability reply." },
    ],
  },
  {
    slug: "tea-ceremony-with-master", city: "kyoto", category: "tea-ceremony",
    partySize: { min: 1, max: 6 },
    map: { lat: 35.0116, lng: 135.7681, zoom: 14 },
    title: "Tea Ceremony with a Tea Master",
    tagline: "A quiet hour of temae in a Kyoto tearoom, whisked bowl by bowl",
    duration: "1.5 hours", price: "¥30,000", group: "Private · up to 6", ages: "All ages", area: "Kyoto (temple district)",
    img: "/images/craft-hands.jpg", alt: "Tea ceremony host placing a tea bowl on tatami before seated guests",
    gallery: [{ img: "/images/cat-tea.jpg", alt: "Host preparing matcha at an outdoor tea gathering" }],
    whatYoullDo: [
      "Enter a working tearoom through its garden path, as guests have for centuries.",
      "Watch a full temae — the choreography of charcoal, water, whisk and bowl.",
      "Whisk your own bowl of matcha under the master's guidance.",
      "Learn how utensils, scroll and flowers are chosen for this day and season.",
    ],
    master: { quote: "One time, one meeting. This bowl of tea will never happen again.", title: "A practising Kyoto tea master", bio: "Licensed in one of the major schools of tea, she has practised for more than three decades and hosts gatherings through the year. Her tearoom sits near one of Kyoto's temple districts; its exact location is shared once your booking is confirmed." },
    itinerary: ["10:00 — Meet your interpreter guide near the tearoom", "10:10 — Garden path, purification and entering the room", "10:20 — The master's temae, first bowls and sweets", "10:50 — Whisk your own bowl; utensil viewing and conversation", "11:30 — End of the experience"],
    goodToKnow: ["Sitting is on tatami; legs may be stretched and low stools are available.", "White socks are appreciated; we will remind you the day before.", "The sweets contain no animal products; other needs are met with notice.", "Movement and photography pause during the temae itself — your guide will cue you."],
    story: { heading: "One time, one meeting", body: "Ichigo ichie — the idea that this gathering, with these people, happens exactly once — is the heart of the tea ceremony. Everything in the room is an answer to the day: the scroll, the flower, the bowl's glaze against the season. The ritual is not performance but attention, offered to guests one bowl at a time." },
  },
  {
    slug: "kimono-higashiyama-walk", city: "kyoto", category: "kimono",
    partySize: { min: 1, max: 4 },
    map: { lat: 34.9985, lng: 135.781, zoom: 14 },
    title: "Kimono & Higashiyama Lantern Walk",
    tagline: "Dressed in silk, then through Kyoto's most storied lanes at golden hour",
    duration: "3 hours", price: "¥40,000", group: "Private · up to 4", ages: "All ages", area: "Kyoto (Higashiyama area)",
    img: "/images/cat-kimono.jpg", alt: "Antique silk kimono with pheasant and peony motif",
    gallery: [{ img: "/images/city-kyoto.jpg", alt: "Lantern-lined Yasaka-dori street at dawn with the Yasaka pagoda" }],
    whatYoullDo: [
      "Be dressed in season-matched silk by a Kyoto kitsuke professional.",
      "Walk the stone lanes of Higashiyama as the lanterns come on.",
      "Hear the history of the pagoda streets from your guide as you go.",
      "Pause for photographs where the crowds thin and the light is best.",
    ],
    master: { quote: "Walk these lanes in silk at lantern hour — you will see why we still dress this way.", title: "A Kyoto kitsuke (kimono dressing) professional", bio: "Trained in formal dressing for Kyoto's ceremony seasons, she selects from a wardrobe of vintage and contemporary silk rather than rental polyester. Her studio in Higashiyama is a short walk from the route; the address is shared once your booking is confirmed." },
    itinerary: ["15:30 — Meet your interpreter guide at the studio", "15:45 — Selection and dressing", "16:45 — Higashiyama walk: stone lanes, pagoda views, lantern light", "18:15 — Return and change", "18:30 — End of the experience"],
    goodToKnow: ["The route is cobbled and gently sloped; sturdy zori are fitted to you.", "Golden-hour slots are limited — book early for autumn and spring.", "In rain the walk continues with traditional umbrellas (they photograph beautifully).", "A professional photographer can be added on request."],
    story: { heading: "Streets built for silk", body: "Higashiyama's lanes were shaped by pilgrims, teahouses and craft shops over five centuries, and their scale still fits a person on foot in kimono. Walking them in silk at lantern hour is not dressing up; it is seeing the streets the way they were designed to be seen." },
  },
  {
    slug: "kyoto-sushi-class", city: "kyoto", category: "sushi",
    partySize: { min: 1, max: 6 },
    map: { lat: 35.0047, lng: 135.763, zoom: 14 },
    title: "Kyoto-style Sushi & Obanzai Class",
    tagline: "Pressed saba-zushi and Kyoto home cooking with a veteran chef",
    duration: "2.5 hours", price: "¥35,000", group: "Private · up to 6", ages: "Ages 8+", area: "Kyoto (city centre)",
    img: "/images/cat-sushi.jpg", alt: "Chef slicing fish on a wooden counter",
    gallery: [],
    whatYoullDo: [
      "Learn why landlocked Kyoto built its own sushi tradition around cured fish.",
      "Press your own saba-zushi — mackerel sushi — in a wooden mould.",
      "Cook two or three obanzai, Kyoto's everyday side dishes, alongside the chef.",
      "Sit down together to eat what you have made, with seasonal tea.",
    ],
    master: { quote: "Kyoto had no ocean, so we invented our own sushi. I will teach you the trick.", title: "A veteran Kyoto chef", bio: "He has cooked Kyoto's home-style cuisine professionally for over thirty years and teaches the pressed-sushi techniques the city developed far from the sea. His kitchen's location is shared once your booking is confirmed." },
    itinerary: ["10:30 — Meet your interpreter guide at the kitchen", "10:45 — Introduction: Kyoto's sushi, cured not raw", "11:00 — Pressing saba-zushi; obanzai cooking", "12:15 — Lunch together at the counter", "13:00 — End of the experience"],
    goodToKnow: ["Cured mackerel is the centrepiece; alternatives are available for allergies.", "Fully hands-on; aprons and all equipment are provided.", "Recipes are provided in English to take home.", "Market-fresh ingredients mean the obanzai dishes change with the season."],
    story: { heading: "Sushi, far from the sea", body: "Before railways, fresh seawater fish could not reach Kyoto — so the city perfected preservation instead. Mackerel salted on the coast travelled the 'saba kaido', the mackerel highway, and was pressed into rice as saba-zushi. Kyoto's sushi is the taste of that geography, and it is still made at home today." },
  },
];

export const tours: Tour[] = [
  {
    slug: "tokyo-private-day-tour", city: "tokyo", bookingType: "request",
    title: "Tokyo Private Day Tour",
    tagline: "Eight hours with a licensed guide, shaped around your interests",
    duration: "8 hours", price: "¥60,000", group: "Private group",
    img: "/images/city-tokyo.jpg", alt: "Kaminarimon gate of Senso-ji temple at night",
    description: "A full day in Tokyo with a private licensed guide, planned around what you care about — food, craft, architecture, pop culture — and able to fold any of our Tokyo masterclasses into the route. Travel, timing and reservations are handled for you; you just walk out of the hotel lobby.",
  },
  {
    slug: "kyoto-private-day-tour", city: "kyoto", bookingType: "request",
    title: "Kyoto Private Day Tour",
    tagline: "Temples, tea and backstreets with a licensed guide who knows the quiet hours",
    duration: "8 hours", price: "¥60,000", group: "Private group",
    img: "/images/tour-journey.jpg", alt: "Vermilion torii gates along a path at Fushimi Inari shrine",
    description: "A full day in Kyoto with a private licensed guide who plans around the crowds — early gates, quiet gardens, the right streets at the right hour. Combine with our tea ceremony, kimono or geiko experiences to build a day that feels like one story rather than a checklist.",
  },
];

// --- language-aware access -------------------------------------------------

import { CANCELLATION_ES, categoriesEs, citiesEs, experiencesEs, toursEs } from "@/lib/catalog.es";
import { CANCELLATION_JA, categoriesJa, citiesJa, experiencesJa, toursJa } from "@/lib/catalog.ja";
import { CANCELLATION_FR, categoriesFr, citiesFr, experiencesFr, toursFr } from "@/lib/catalog.fr";
import { CANCELLATION_ZH, categoriesZh, citiesZh, experiencesZh, toursZh } from "@/lib/catalog.zh-tw";
import type { Lang } from "@/lib/i18n";
import { golfTiers } from "@/lib/golf-prices";
import { applyGolfBookingCopy } from "@/lib/golf-booking-copy";

/** Locale files carry text only; numbers, media and flags come from the
 *  English entry with the same slug so they cannot drift between languages. */
const STRUCTURAL: StructuralKeys[] = ["partySize", "pricing", "video", "status", "bookingType", "priceUnit", "availability", "map", "taxIncluded", "cancellationTiers", "dietary", "interpreter", "skipSiteFaq"];
function withStructure(localized: Experience[]): Experience[] {
  return localized.map((e) => {
    const base = experiences.find((x) => x.slug === e.slug);
    if (!base) return e;
    const merged: Experience = { ...e };
    for (const k of STRUCTURAL) if (base[k] !== undefined) (merged as unknown as Record<string, unknown>)[k] = base[k];
    if (base.variants) {
      merged.defaultVariant = base.defaultVariant;
      merged.variants = base.variants.map((v) => {
        const text = e.variants?.find((x) => x.id === v.id);
        // Structure always from the English entry, whatever the locale file says.
        return { ...v, ...text, tiers: v.tiers, img: v.img, defaultTime: v.defaultTime };
      });
      // Which area each photo shows is structure too.
      merged.gallery = e.gallery.map((g) => ({ ...g, area: base.gallery.find((x) => x.img === g.img)?.area ?? g.area }));
    }
    return merged;
  });
}

/** A page in preview that has no text in a locale yet shows the English text
 *  there, so every preview URL resolves in every language for sign-off. Live
 *  pages are translated before publication, so nothing live falls through. */
function withFallback(localized: Experience[]): Experience[] {
  const missing = experiences.filter((e) => isPreview(e) && !localized.some((l) => l.slug === e.slug));
  return [...withStructure(localized), ...missing];
}

function fullCatalog(lang: Lang) {
  const published = <T,>(list: T[]) => (TOURS_PUBLISHED ? list : []);
  if (lang === "es") return { cities: citiesEs, categories: categoriesEs, experiences: withFallback(experiencesEs), tours: published(toursEs) };
  if (lang === "ja") return { cities: citiesJa, categories: categoriesJa, experiences: withFallback(experiencesJa), tours: published(toursJa) };
  if (lang === "fr") return { cities: citiesFr, categories: categoriesFr, experiences: withFallback(experiencesFr), tours: published(toursFr) };
  if (lang === "zh-tw") return { cities: citiesZh, categories: categoriesZh, experiences: withFallback(experiencesZh), tours: published(toursZh) };
  return { cities, categories, experiences, tours: published(tours) };
}

/** The catalog as the site shows it. With PLACEHOLDERS_PUBLISHED off this is
 *  the signed experiences only, plus the cities and categories they belong to. */
export function catalogFor(lang: Lang) {
  const base = fullCatalog(lang);
  const full = { ...base, experiences: base.experiences.map((e) => applyGolfBookingCopy(e, lang)) };
  if (PLACEHOLDERS_PUBLISHED) return full;
  const experiences = full.experiences.filter(isLive);
  return {
    ...full,
    experiences,
    cities: full.cities.filter((c) => experiences.some((e) => e.city === c.slug)),
    categories: full.categories.filter((c) => experiences.some((e) => e.category === c.slug)),
  };
}

/** Experiences in "preview": built, reachable by URL for sign-off, never listed. */
export function previewsFor(lang: Lang) {
  const base = fullCatalog(lang);
  const full = { ...base, experiences: base.experiences.map((e) => applyGolfBookingCopy(e, lang)) };
  return { experiences: full.experiences.filter(isPreview), cities: full.cities };
}

const CANCELLATIONS: Record<Lang, string> = {
  en: CANCELLATION, es: CANCELLATION_ES, ja: CANCELLATION_JA, fr: CANCELLATION_FR, "zh-tw": CANCELLATION_ZH,
};
export const cancellationFor = (lang: Lang) => CANCELLATIONS[lang];

// --- lookups ---------------------------------------------------------------

export const cityBySlug = (slug: string, lang: Lang = "en") => catalogFor(lang).cities.find((c) => c.slug === slug);
export const categoryBySlug = (slug: string, lang: Lang = "en") => catalogFor(lang).categories.find((c) => c.slug === slug);
export const experienceBySlug = (slug: string, lang: Lang = "en") => catalogFor(lang).experiences.find((e) => e.slug === slug);
export const tourBySlug = (slug: string, lang: Lang = "en") => catalogFor(lang).tours.find((t) => t.slug === slug);

export const experiencesInCity = (city: CitySlug, lang: Lang = "en") => catalogFor(lang).experiences.filter((e) => e.city === city);
export const experiencesInCategory = (category: string, lang: Lang = "en") => catalogFor(lang).experiences.filter((e) => e.category === category);
export const toursInCity = (city: CitySlug, lang: Lang = "en") => catalogFor(lang).tours.filter((t) => t.city === city);
