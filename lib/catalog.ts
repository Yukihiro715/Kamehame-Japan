// Catalog of cities, categories, experiences and guided tours.
// Prices, durations and operating conditions are placeholders pending
// confirmation with each partner venue (see CLAUDE_HANDOFF.md). Venue
// names and exact addresses stay private until a booking is confirmed.

export type CitySlug = "tokyo" | "kyoto";

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
 *  or in the Mt. Fuji region): the visitor picks one, and the price, photo
 *  and the request follow the choice. Text fields are per locale; the price,
 *  photos and pre-selected time come from the English catalog. */
export interface ExperienceVariant {
  id: string;
  /** "Tokyo Area Golf Day" */
  title: string;
  /** "Tokyo Area Golf" — the compact price card in the hero */
  cardTitle: string;
  /** "Tokyo Area" — the sticky bar and the summary line */
  short: string;
  /** One line under the price in the hero card */
  tagline: string;
  bullets: string[];
  /** "Select Tokyo Area" */
  select: string;
  /** Whole-group price for `basePartySize` guests; other party sizes are quoted. */
  price: number;
  basePartySize: number;
  img: string; alt: string;
  gallery?: { img: string; alt: string }[];
  /** Pre-selected start/departure time for this variant. */
  defaultTime?: string;
}

/** Copy for the two-plan page: section headings, the course choice and the
 *  stepped request form. All text, authored per locale. */
export interface VariantPageCopy {
  /** Hero benefit chips, e.g. "Private Hotel Transfers". */
  benefits: string[];
  variantsH: string; variantsLead: string;
  coursePreference: {
    heading: string; lead?: string;
    options: { id: "recommended" | "preferred"; title: string; badge: string; body: string; note?: string }[];
    courseName: string; courseUrl: string;
  };
  /** Price display: "From", "Custom Quote" and the rules under the table. */
  /** Price display. `golfers` is a template with {n}, e.g. "{n} golfers" (plain text, so it can cross to client components). */
  pricing: { heading: string; packageCol: string; /** Word before the price ("From"); empty where the language puts it after. */ from: string; /** After the price ("〜"). */ fromSuffix?: string; customQuote: string; customQuoteNote: string; perGolferNote: string; golfers: string; notes: string[] };
  form: {
    steps: { area: string; course: string; dates: string; group: string; contact: string };
    altDate: string; golfers: string;
    experience: string; experienceHint: string;
    rental: string; rentalOpts: { all: string; some: string; none: string };
    handed: string; handedHint: string;
    pickup: string; pickupHint: string; whatsapp: string;
    requests: string; requestsHint: string;
    summaryH: string; cta: string; note: string;
  };
  headings?: Partial<Record<"included" | "highlights" | "flow" | "faq" | "terms" | "request", string>>;
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
  gallery: { img: string; alt: string; caption?: string }[];
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

  /** Smallest and largest party the venue takes. Drives the pricing table. */
  partySize?: { min: number; max: number };
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
  addOns?: { id: string; name: string; description: string; price?: number; /** The price is the lowest of several (shown as "From …"). */ priceFrom?: boolean }[];
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
    lead: "Tokyo keeps its traditions close, a few streets from the neon. We start with a private brush-calligraphy class in Shinjuku: kanji chosen for the meaning of your name, taught in English by a brush-lettering teacher. From Tokyo, there is also a golf day near Mt. Fuji, with a private car from your hotel. More Tokyo experiences are on the way.",
  },
  {
    slug: "kyoto", title: "Kyoto", jp: "京都", img: "/images/city-kyoto.jpg",
    lead: "Discover a different side of Kyoto through its living traditions. Spend a private evening with a geiko or maiko — dinner, a dance and conversation in your own room — with more Kyoto experiences in food, craft and special access on the way.",
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
    lead: "Tokyo's nail artists treat a fingernail like a canvas. Bring your favourite character or design and leave with wearable fan art by an artist who does this every day — a lighter, playful side of Japanese craft." },  { slug: "calligraphy", title: "Calligraphy", tag: "Arts & crafts", mark: "書", img: "/images/kanji-works-table.jpg",
    lead: "A brush, black ink and one character. Learn the strokes from a teacher, choose kanji that carry your name's meaning, and take home a piece you made yourself." },
  { slug: "golf", title: "Golf", tag: "Sport", mark: "球", img: "/images/golf-flag-fuji.jpg",
    lead: "Golf in Japan has its own customs and some of the country's finest views. A private golf day in the Mt. Fuji region, with your course and tee time arranged for you, a private car from your Tokyo hotel and English-speaking support." },
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
      { q: "Can we book at short notice?", a: "Yes, until 18:00 Japan time the day before. The teacher and the studio are booked when your request comes in, so we confirm once both are free for your date — for a class in the next few days, only if they still are." },
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
    // Two products on one page since 2026-10-10 (LP spec v2): a golf day
    // near Tokyo and one in the Mt. Fuji region, both with a private hire car,
    // an English-speaking guide who does not play, green fee, rental clubs and
    // lunch. ¥250,000 / ¥270,000 for two golfers; three and four are quoted
    // until the partner's new costs are approved, and a preferred course is
    // always a custom quote. Earlier: live 2026-09-30 at ¥180k/220k/280k with
    // the guide playing (docs/EMAIL_TEMPLATES.md keeps the history).
    // The owner is handling the travel-business registration question raised
    // by the hotel transfers.
    slug: "mt-fuji-golf-day", city: "tokyo", category: "golf", bookingType: "request", status: "live",
    title: "Private Golf Day from Tokyo — Mt. Fuji or Tokyo Area",
    seoTitle: "Private Golf Day from Tokyo | Mt. Fuji & Tokyo Area | KAMEHAME JAPAN",
    metaDescription: "Enjoy a private golf day near Tokyo or Mt. Fuji. Includes hotel transfers, green fees, rental clubs and English-speaking assistance. Request availability.",
    tagline: "Enjoy an unforgettable round of golf in Japan, with private hotel transfers, English-speaking assistance, green fees and rental clubs — all arranged for you.",
    overview: [
      "Make golf one of the highlights of your time in Japan. Choose a convenient course near Tokyo or a scenic round in the Mt. Fuji region: either way you travel by private car from your Tokyo hotel, with the course booked, rental clubs ready and an English-speaking guide to smooth the day.",
      "Your guide helps with check-in, rental arrangements and local golf course procedures; your group enjoys the round independently. You see the proposed course, tee time and final price before you pay.",
    ],
    duration: "Full day, hotel to hotel", price: "¥250,000", priceUnit: "group", group: "Private car and guide · 2–4 golfers", ages: "Ages 18+", area: "Tokyo area or Mt. Fuji region (pick-up at your Tokyo hotel)",
    img: "/images/golf-flag-fuji.jpg", alt: "A green with its flag, Mt. Fuji rising behind the pines",
    gallery: [
      { img: "/images/golf-tokyo-clubhouse.jpg", alt: "A green beside the clubhouse pond at a course in the Kanto countryside" },
      { img: "/images/golf-fuji-clouds.jpg", alt: "Mt. Fuji above the clouds, seen from the course" },
      { img: "/images/golf-tokyo-tee.jpg", alt: "A tee box under a pine, the Yokohama skyline in the distance" },
      { img: "/images/golf-tokyo-terrace.jpg", alt: "The green and fairway seen from a clubhouse terrace, Kanto" },
      { img: "/images/golf-fairway.jpg", alt: "A fairway and bunker below Mt. Fuji in early summer" },
      { img: "/images/golf-pond.jpg", alt: "Mt. Fuji reflected in a pond beside the fairway" },
      { img: "/images/golf-green.jpg", alt: "Golfers on the green, with Mt. Fuji beyond" },
      { img: "/images/golf-swing.jpg", alt: "A tee shot towards Mt. Fuji" },
    ],
    galleryNote: "Photos show courses near Tokyo and in the Mt. Fuji region. Your course is proposed for your date, and Mt. Fuji shows only on a clear day.",
    partySize: { min: 2, max: 4 },
    pricing: { tiers: [{ party: 2, total: 250000 }] },
    variants: [
      {
        id: "tokyo", title: "Tokyo Area Golf Day", cardTitle: "Tokyo Area Golf", short: "Tokyo Area",
        tagline: "Convenient golf near Tokyo, with less time spent travelling.",
        bullets: ["Shorter journey from Tokyo", "Carefully selected golf courses", "Private transport and English-speaking assistance", "18-hole round and rental clubs included"],
        select: "Select Tokyo Area",
        price: 250000, basePartySize: 2,
        img: "/images/golf-tokyo-clubhouse.jpg", alt: "A green beside the clubhouse pond at a course in the Kanto countryside",
        gallery: [
          { img: "/images/golf-tokyo-tee.jpg", alt: "A tee box under a pine, the Yokohama skyline in the distance" },
          { img: "/images/golf-tokyo-terrace.jpg", alt: "The green and fairway seen from a clubhouse terrace, Kanto" },
          { img: "/images/golf-tokyo-clubhouse.jpg", alt: "A green beside the clubhouse pond at a course in the Kanto countryside" },
        ],
        defaultTime: "07:00",
      },
      {
        id: "fuji", title: "Mt. Fuji Golf Day", cardTitle: "Mt. Fuji Area Golf", short: "Mt. Fuji Area",
        tagline: "A scenic golf experience in the beautiful Mt. Fuji region.",
        bullets: ["Beautiful golf courses around Mt. Fuji", "Scenic surroundings", "Private hotel transfers", "18-hole round and rental clubs included"],
        select: "Select Mt. Fuji Area",
        price: 270000, basePartySize: 2,
        img: "/images/golf-flag-fuji.jpg", alt: "A green with its flag, Mt. Fuji rising behind the pines",
        gallery: [
          { img: "/images/golf-fuji-clouds.jpg", alt: "Mt. Fuji above the clouds, seen from the course" },
          { img: "/images/golf-pond.jpg", alt: "Mt. Fuji reflected in a pond beside the fairway" },
          { img: "/images/golf-green.jpg", alt: "Golfers on the green, with Mt. Fuji beyond" },
        ],
        defaultTime: "06:00",
      },
    ],
    defaultVariant: "fuji",
    availability: { daily: true, startTimes: ["05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00"], defaultTime: "06:00", cutoffDays: 3, cutoffTime: "18:00" },
    taxIncluded: true,
    interpreter: false,
    langTag: "English-speaking golf guide",
    skipSiteFaq: true,
    timeLabel: "Preferred departure time",
    scheduleNote: "Times shown for a 6:00 departure to the Mt. Fuji region; a Tokyo-area course is about an hour nearer. Choose any departure between 5:00 and 8:00 when you enquire; we propose a tee time to match, and the rest of the day moves with it.",
    cta: {
      label: "Check Availability",
      note: "No payment required to enquire.",
      heading: "Request Availability",
      lead: "We'll check your date and send you a proposal with the golf course, tee time and final price. No payment is required now.",
    },
    includedShort: "Private hotel transfers · 18 holes with English-speaking support · Clubs and lunch",
    cancellation: "Days are counted to the date of your round, Japan time; free cancellation ends at 18:00 seven days before. The date can be changed up to 14 days before if another tee time is free, and the number of golfers reduced up to 7 days before. If the course closes for weather, it decides on the day and you are refunded everything except costs already incurred, such as the car if it has already set out.",
    cancellationTiers: [{ until: 7, rate: 0 }, { until: 2, rate: 50 }, { until: 0, rate: 100 }],
    highlights: [
      { icon: "flag", title: "Easy Golf Booking", body: "We find and arrange a suitable golf course for your date, so you don't have to navigate Japanese booking systems." },
      { icon: "car", title: "Private Door-to-Door Transport", body: "Travel comfortably from your Tokyo hotel to the golf course and back." },
      { icon: "interpreter", title: "English-Speaking Support", body: "Enjoy help with check-in, local procedures and communication at the golf course." },
      { icon: "spark", title: "Everything Arranged in Advance", body: "Review your proposed golf course, tee time and final price before making a payment." },
    ],
    included: [
      "Private round-trip transportation from your Tokyo hotel",
      "English-speaking guide and local assistance",
      "18-hole golf round and green fees",
      "Golf club rental",
      "Lunch at the clubhouse within the included allowance",
      "Golf course booking arrangements",
      "Applicable taxes and standard service charges",
    ],
    notIncluded: [
      "Golf shoes and gloves",
      "Premium golf balls and personal purchases",
      "Additional food and drinks",
      "A guide playing the round with you",
      "Special arrangements not included in the confirmed quotation",
    ],
    addOns: [
      // Partner terms 2026-10-06: film ¥80,000 per group of 2–3 (not for 4; can be
      // added on the day), marker ¥5,000 per golfer (confirmed 2 weeks ahead); +20%.
      { id: "highlight-film", name: "Highlight film of your day", description: "A short film of your round, shot on the day and delivered about a week later. ¥96,000 per group of two or three golfers (not available for parties of four). You can also decide on the day.", price: 96000 },
      { id: "kanji-marker", name: "Ball marker with your name in kanji", description: "Handed to you on the day. ¥6,000 per golfer. Order it when you book — it needs your booking confirmed at least two weeks before your date.", price: 6000 },
    ],
    schedule: [
      { time: "05:55", title: "Meet in your hotel lobby", body: "Your guide and driver meet you five minutes before the departure time you chose." },
      { time: "06:00", title: "Leave Tokyo", body: "About one to one and a half hours by private car to a course near Tokyo; about two hours to the Mt. Fuji region." },
      { time: "07:30–08:00", title: "Arrive and check in", body: "Your guide checks you in, sorts rental clubs and explains the course and the clubhouse customs." },
      { time: "Tee off", title: "Your round", body: "Your group plays the 18 holes at its own pace; your guide is on hand at the clubhouse for anything you need." },
      { time: "After the round", title: "Lunch at the clubhouse", body: "Lunch is included, within the package allowance." },
      { time: "Afternoon", title: "Back to your hotel", body: "The car takes you back to Tokyo." },
    ],
    venue: {
      heading: "Your Course, Personally Arranged",
      knownHeading: "Before you pay", afterHeading: "After you book",
      known: ["The proposed course and its tee time, sent with your quote", "The final price for your party", "Pick-up and drop-off at your hotel in Tokyo, departing at the time you choose between 5:00 and 8:00"],
      afterBooking: ["Where to meet in your hotel lobby — with your confirmation", "Your guide's name and phone number, and the car and driver details — the day before your round"],
    },
    notesLabel: "Special requests (optional)",
    notesHint: "Course preferences, dietary needs for lunch, anything else we should know",
    flow: [
      { title: "Tell us your date and preferences", body: "Choose your area and a date, tell us how many golfers and your hotel, and whether you'd like us to pick the course or already have one in mind. Sending the request costs nothing." },
      { title: "A first reply within 24 hours", body: "We confirm your request and check courses for your date. The proposed course, tee time and final price usually follow within one business day; for requests sent at the weekend, the tee time may be confirmed on Monday." },
      { title: "Review, then pay to confirm", body: "Look over the course, tee time and price. Your booking is confirmed when your payment arrives, and cancellation terms start then. Your confirmation gives the meeting point in your hotel lobby; your guide's name and phone number and the car details come the day before your round." },
    ],
    faq: [
      { q: "What's the difference between the Tokyo Area and Mt. Fuji Area packages?", a: "The Tokyo Area package focuses on convenient access to golf courses near Tokyo. The Mt. Fuji package offers a scenic golf experience in the Mt. Fuji region, with a longer journey from Tokyo. Both include private transfers, green fees, rental clubs and English-speaking assistance." },
      { q: "Can I choose a specific golf course?", a: "Yes. We can check your preferred golf course and provide a customised quotation. Availability and booking restrictions vary by course." },
      { q: "Are weekend green fees included?", a: "Our recommended-course packages have the same starting price for regular weekdays and weekends, subject to availability. If a suitable course cannot be arranged at the standard rate, we will offer alternative options and confirm any revised price before payment." },
      { q: "Will my guide play golf with us?", a: "No. Your guide assists with the arrangements and local procedures, while your group plays independently." },
      { q: "Will I know the course before paying?", a: "Yes. We will send you the proposed course, tee time, included services and final price before payment." },
      { q: "Can we play as a group of two?", a: "We prioritise courses that accept two golfers. Any pairing requirements or additional conditions will be explained before you confirm." },
      { q: "When and where do you pick us up?", a: "At your hotel in Tokyo, at the departure time you choose between 5:00 and 8:00. A course near Tokyo is about one to one and a half hours away; the Mt. Fuji region about two hours. Tell us the hotel in your request; for hotels outside central Tokyo, ask and we will check." },
      { q: "Which departure time should we choose?", a: "An earlier departure means an earlier tee time and more of the afternoon free; a later departure means a later tee off and a later return. We propose a tee time to match your departure and tell you if the course only has other times." },
      { q: "Is there a dress code?", a: "Yes. Japanese clubs expect a jacket when you arrive at the clubhouse and a collared shirt on the course. Your guide explains the rest on the day." },
      { q: "Are clubs included? What about shoes?", a: "Rental clubs are included. Bring your own golf shoes and gloves; if you need to rent shoes, tell us your size and we will check with the course." },
      { q: "Who can join?", a: "Golfers aged 18 and over, two to four per booking. Two golfers are priced on this page; three or four are quoted individually." },
      { q: "What if it rains?", a: "If the course closes for weather, the course decides on the day; you are refunded everything except costs already incurred, such as the car if it has already set out." },
      { q: "What if we are late?", a: "The car waits 15 minutes at your hotel. After that we may miss the tee time and not be able to play, and the cancellation terms apply as for a no-show." },
      { q: "How far ahead should we book?", a: "At least 30 days ahead if you can — the earlier you enquire, the wider the choice of courses and tee times. Requests close at 18:00 Japan time three days before; within seven days of the date we can confirm only if a tee time can still be found." },
      { q: "How does booking work?", a: "Choose your area and a date and send a request; it costs nothing. We reply within 24 hours, and send the proposed course, tee time and final price before you pay. Your booking is confirmed when you pay through the link we send, and cancellation terms start then." },
    ],
    variantCopy: {
      benefits: ["Private Hotel Transfers", "18-Hole Golf", "English-Speaking Guide", "Green Fees & Rental Clubs Included"],
      variantsH: "Choose Your Golf Experience",
      variantsLead: "Whether you prefer a convenient golf day near Tokyo or a scenic round in the Mt. Fuji region, we'll take care of the arrangements.",
      coursePreference: {
        heading: "Choose How We Arrange Your Golf Course",
        options: [
          { id: "recommended", title: "Let Us Choose the Best Available Course", badge: "Recommended · Standard Package", body: "We select a suitable golf course from our recommended options based on your preferred date and availability.", note: "We will share the course name and tee time with you before payment." },
          { id: "preferred", title: "I Have a Preferred Golf Course", badge: "Custom Quote", body: "Already have a course in mind? Tell us where you'd like to play, and we'll check availability and provide a personalised quotation.", note: "Premium courses, members' clubs and courses outside our usual selection are quoted individually." },
        ],
        courseName: "Preferred golf course name", courseUrl: "Website or location (optional)",
      },
      pricing: {
        heading: "Pricing & Booking", packageCol: "Package", from: "From", customQuote: "Custom Quote",
        customQuoteNote: "We check your date and send a personalised quotation before any payment.",
        perGolferNote: "per golfer", golfers: "{n} golfers",
        notes: [
          "Prices are the total for your private group, for two golfers on a recommended course.",
          "Three or four golfers, and any preferred course, are quoted individually.",
          "Nothing is paid when you request availability. We send the course, tee time and final price first, and you pay only once you have accepted them.",
          "If our recommended courses have no availability at the standard rate on your date, we offer alternatives and confirm any revised price with you before payment.",
        ],
      },
      form: {
        steps: { area: "Step 1 — Choose Your Golf Area", course: "Step 2 — Choose Your Golf Course Preference", dates: "Step 3 — Select Your Date", group: "Step 4 — Group Information", contact: "Step 5 — Contact Information" },
        altDate: "Alternative date (optional)", golfers: "Number of golfers",
        experience: "Golf experience / handicap", experienceHint: "e.g. handicaps 12 and 20, or casual golfers",
        rental: "Rental clubs required", rentalOpts: { all: "Yes, for everyone", some: "For some of us", none: "No, we bring our own" },
        handed: "Right- or left-handed (for rental clubs)", handedHint: "e.g. 2 right-handed, 1 left-handed",
        pickup: "Hotel or pick-up location in Tokyo", pickupHint: "e.g. Park Hyatt Tokyo, Shinjuku", whatsapp: "WhatsApp (optional)",
        requests: "Special requests (optional)", requestsHint: "Course preferences, dietary needs for lunch, anything else we should know",
        summaryH: "Your request", cta: "Request Availability",
        note: "We'll check your date and send you a proposal with the golf course, tee time and final price. No payment is required now.",
      },
      headings: { included: "What's Included", highlights: "Why Golf with KAMEHAME JAPAN", flow: "How Your Golf Day Works", faq: "Frequently Asked Questions", terms: "Booking & Cancellation Terms", request: "Request Availability" },
    },
    whatYoullDo: ["Ride from your hotel to the course in a private car", "Play 18 holes near Tokyo or in the Mt. Fuji region, the day's details arranged for you", "Lunch at the clubhouse", "Ride back to Tokyo"],
    master: { title: "Your golf guide", bio: "An English-speaking guide from our golf partner who rides with you, handles check-in, rental clubs and the clubhouse procedures, and is on hand while you play. The guide does not play the round.", quote: "" },
    itinerary: ["05:55 — Meet in your hotel lobby (five minutes before your departure)", "06:00 — Leave Tokyo", "07:30–08:00 — Arrive and check in", "Tee off — Your round", "After the round — Lunch at the clubhouse", "Afternoon — Back to your hotel"],
    goodToKnow: ["Ages 18 and over; two to four golfers per booking.", "Pick-up from your Tokyo hotel at the departure time you choose, between 5:00 and 8:00.", "Clubhouse dress code: a jacket on arrival, a collared shirt on the course.", "Rental clubs are included; bring golf shoes and gloves.", "A preferred course, and parties of three or four, are quoted individually."],
    story: { heading: "Golf, the Japanese way", body: "In Japan golf comes with its own rituals: the jacket on arrival, the care taken of the course, the unhurried lunch. Near Tokyo or in sight of Mt. Fuji on a clear morning, it is a different game." },
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
      "Held every day except the New Year holidays, with start times from 12:00 to 20:30 — requests close at 5pm Japan time the day before.",
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
      { q: "How far ahead must we book?", a: "By 17:00 Japan time the day before at the latest. For a date in the next few days we reply as quickly as we can, and can confirm only if a geiko or maiko is free at such short notice; a booking made less than 4 days ahead cannot be refunded once paid, unless none can be secured. 10 to 14 days ahead is the comfortable window, and spring and autumn (March–April, October–November) fill first. During Miyako Odori (April) the house may only be able to confirm close to the date. The final time slot is confirmed with your availability reply." },
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
        return {
          ...v, ...text,
          // Structure always from the English entry, whatever the locale file says.
          price: v.price, basePartySize: v.basePartySize, img: v.img, defaultTime: v.defaultTime,
          gallery: v.gallery?.map((g, i) => ({ ...g, alt: text?.gallery?.[i]?.alt ?? g.alt })),
        };
      });
    }
    return merged;
  });
}

function fullCatalog(lang: Lang) {
  const published = <T,>(list: T[]) => (TOURS_PUBLISHED ? list : []);
  if (lang === "es") return { cities: citiesEs, categories: categoriesEs, experiences: withStructure(experiencesEs), tours: published(toursEs) };
  if (lang === "ja") return { cities: citiesJa, categories: categoriesJa, experiences: withStructure(experiencesJa), tours: published(toursJa) };
  if (lang === "fr") return { cities: citiesFr, categories: categoriesFr, experiences: withStructure(experiencesFr), tours: published(toursFr) };
  if (lang === "zh-tw") return { cities: citiesZh, categories: categoriesZh, experiences: withStructure(experiencesZh), tours: published(toursZh) };
  return { cities, categories, experiences, tours: published(tours) };
}

/** The catalog as the site shows it. With PLACEHOLDERS_PUBLISHED off this is
 *  the signed experiences only, plus the cities and categories they belong to. */
export function catalogFor(lang: Lang) {
  const full = fullCatalog(lang);
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
  const full = fullCatalog(lang);
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
