// Catalog of cities, categories, experiences and guided tours.
// Prices, durations and operating conditions are placeholders pending
// confirmation with each partner venue (see CLAUDE_HANDOFF.md). Venue
// names and exact addresses stay private until a booking is confirmed.

export type CitySlug = "tokyo" | "kyoto";

/** How a booking is confirmed. Instant products are bookable straight from the
 *  calendar; request products are held until the venue confirms the date. */
export type BookingType = "instant" | "request";

/** Whether an experience is backed by a signed partner ("live") or is still a
 *  placeholder awaiting one ("soon"). Undefined counts as "soon". */
export type ExperienceStatus = "live" | "soon";
export const isLive = (e: { status?: ExperienceStatus }) => e.status === "live";

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
    plans?: { id: string; regular: number; peak: number; recommended?: boolean }[];
    extraGuest?: { regular: number; peak: number; included: number; upTo: number };
    peakWindows?: { from: string; to: string }[];
  };
  /** Localised text for `pricing.plans`, keyed by plan id. */
  planText?: Record<string, { label: string; name: string; performers: string; blurb: string }>;
  /** Optional extras chosen in the request form. No `price` means "on request". */
  addOns?: { id: string; name: string; description: string; price?: number }[];
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
  availability?: { daily: boolean; startTimes: string[]; cutoffDays: number; cutoffTime: string; closed?: { from: string; to: string }[] };
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
  /** Three value cards. Falls back to the site-wide trio when absent. */
  highlights?: { title: string; body: string; icon: "group" | "chat" | "interpreter" | "dance" | "meal" | "photo" }[];
  /** Confirmed with the venue. Absent means "not confirmed" and nothing is
   *  claimed — never "all inclusive" by default. */
  included?: string[];
  notIncluded?: string[];
  /** Vertical timeline. Falls back to `itinerary` (time — text) when absent. */
  schedule?: { time: string; title: string; body?: string; img?: string }[];
  /** Time actually spent with the practitioner, when shorter than `duration`. */
  interactionTime?: string;
  /** What is known before booking vs. shared only in the confirmation. */
  venue?: { known: string[]; afterBooking: string[]; img?: string; alt?: string };
  /** Product-specific questions, confirmed with the venue. Site-level
   *  questions (interpreter, dietary, booking flow) are appended by the page. */
  faq?: { q: string; a: string }[];
}

/** Fields that are authored once (English) and shared by every locale. */
export type StructuralKeys = "partySize" | "pricing" | "video" | "status" | "bookingType" | "priceUnit" | "availability" | "map" | "taxIncluded" | "cancellationTiers" | "dietary";

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
    lead: "Tokyo holds its traditions close, behind quiet doors a few streets from the neon. Our Tokyo masterclasses seat you beside the people who keep those traditions alive — a sushi chef at his own counter, wrestlers at morning practice, a swordsmith at the forge — always with a private interpreter guide at your side.",
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
    lead: "Tokyo's nail artists treat a fingernail like a canvas. Bring your favourite character or design and leave with wearable fan art by an artist who does this every day — a lighter, playful side of Japanese craft." },
];

export const experiences: Experience[] = [
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
      plans: [
        { id: "select", regular: 219800, peak: 249800 },
        { id: "signature", regular: 379800, peak: 429800, recommended: true },
        { id: "reserve", regular: 498000, peak: 559800 },
      ],
      extraGuest: { regular: 39800, peak: 49800, included: 2, upTo: 5 },
      peakWindows: [{ from: "03-15", to: "05-31" }, { from: "10-01", to: "11-30" }],
    },
    taxIncluded: true,
    interactionTime: "about 1 hour 45 minutes",
    availability: { daily: true, startTimes: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "20:30"], cutoffDays: 7, cutoffTime: "17:00", closed: [{ from: "12-29", to: "01-03" }] },
    availabilityNote: "Closed over the New Year holidays.",
    map: { lat: 35.0037, lng: 135.7723, zoom: 15 },
    title: "Private Geisha Dining in Kyoto",
    tagline: "Spend two private hours in Kyoto with a geiko or maiko. Share a seasonal Japanese dinner, talk across the table, watch a traditional dance and play ozashiki games together — with an interpreter guide throughout, in English, Spanish or French.",
    duration: "2 hours", price: "¥219,800", priceUnit: "group", group: "Private · 2–40 guests", ages: "All ages", area: "Kyoto (Gion / Higashiyama area)",
    img: "/images/geiko-photo-together.jpg", alt: "Two guests and a maiko smiling for a commemorative photo in a private Kyoto room",
    gallery: [
      { img: "/images/geiko-conversation.jpg", alt: "Conversation over dinner, with your interpreter carrying both sides", caption: "Conversation over dinner, with your interpreter carrying both sides" },
      { img: "/images/geiko-maiko-seated.jpg", alt: "A maiko settles in beside your table", caption: "A maiko settles in beside your table" },
      { img: "/images/geiko-dance.jpg", alt: "A dance performed before the gold screen", caption: "A dance performed before the gold screen" },
      { img: "/images/geiko-dinner-course.jpg", alt: "The multi-course Japanese dinner (the menu changes with the season)", caption: "The multi-course Japanese dinner (the menu changes with the season)" },
      { img: "/images/geiko-maiko-smile.jpg", alt: "A maiko in the private room", caption: "A maiko in the private room" },
      { img: "/images/geiko-pouring.jpg", alt: "Your host pours; ask her anything", caption: "Your host pours; ask her anything" },
      { img: "/images/geiko-game-table.jpg", alt: "Ozashiki parlour games at the table", caption: "Ozashiki parlour games at the table" },
      { img: "/images/geiko-game-toratora.jpg", alt: "Tora-tora, rock-paper-scissors played with the whole body", caption: "Tora-tora, rock-paper-scissors played with the whole body" },
      { img: "/images/geiko-room-upstairs.jpg", alt: "An upstairs room built in the style of a Gion teahouse", caption: "An upstairs room built in the style of a Gion teahouse" },
      { img: "/images/geiko-room-garden.jpg", alt: "A ground-floor room looking onto the inner garden", caption: "A ground-floor room looking onto the inner garden" },
    ],
    cancellation: "Days are counted to the date of the experience, Japan time. Date changes follow the same scale, and reducing your party applies the fee to the seats released; refunds go back by the method you paid. If no geiko or maiko can be secured for your date, you receive a full refund whatever the timing.",
    cancellationTiers: [{ until: 14, rate: 0 }, { until: 4, rate: 50 }, { until: 0, rate: 100 }],
    dietary: ["vegetarian", "glutenFree", "dashiFree"],
    whatYoullDo: [
      "Settle into your own private banquet room — never shared with other guests.",
      "Dine on seasonal Kyoto cuisine as geiko and maiko join your table for conversation.",
      "Watch a dance performed an arm's length away, then try ozashiki parlour games together.",
      "Finish with commemorative photos with your hosts.",
    ],
    master: { quote: "For one evening, this room is yours. Come, let us talk.", title: "Geiko and maiko of Kyoto's hanamachi", bio: "Your evening is hosted by working geiko or maiko of Kyoto's flower-and-willow world, arranged especially for your date. The venue is a private banquet house in the Gion / Higashiyama district; its name and address are shared once your booking is confirmed." },
    itinerary: ["10 min before — Arrive at the venue with your guide (address in your confirmation)", "0:00 — Welcome to your private room; the banquet begins", "0:30 — Geiko and maiko join your table; conversation over dinner", "1:15 — Dance performance and ozashiki parlour games", "1:50 — Commemorative photos", "2:00 — End of the evening"],
    goodToKnow: [
      "Held every day except the New Year holidays, with start times from 12:00 to 20:30 — book at least 3 days ahead (5pm Japan time cutoff).",
      "Three plans, each priced for up to 2 guests: Select from ¥219,800, Signature (live shamisen) from ¥379,800, Private Reserve (two performers and shamisen) from ¥498,000. Each additional guest up to 5: ¥39,800; six or more on request.",
      "Peak-season rates apply Mar 15 – May 31 and Oct 1 – Nov 30 (Select from ¥249,800; additional guests ¥49,800 each).",
      "Children: 2 and under join free without a meal, ages 3–11 half the adult rate, 12 and over the adult rate with the full course.",
      "Allergies and dietary restrictions are catered for — tell us when you book.",
      "Want live music or a fuller room? Choose Signature (a jikata playing shamisen live) or Private Reserve (two geiko or maiko plus the jikata).",
    ],
    story: { heading: "The world of the karyukai", body: "Kyoto's 'flower and willow world' has run on introduction and trust for three centuries. A geiko is not a performer for hire but an artist whose evenings are extended through relationships between teahouses and patrons. Being seated in that room, with conversation flowing in your own language, is the rarest kind of access Kyoto offers." },
    includedShort: "Private room · Meal and drinks · Interpreter guide (EN / ES / FR)",
    planText: {
      select: { label: "Select", name: "Private Geisha Evening", performers: "One geiko or maiko", blurb: "The essential evening; the dance is performed to recorded music." },
      signature: { label: "Signature", name: "Private Geisha Evening with Live Shamisen", performers: "Geiko or maiko + live shamisen", blurb: "One geiko or maiko, joined by a jikata playing shamisen live." },
      reserve: { label: "Private Reserve", name: "The Complete Geisha Evening", performers: "Two performers + live shamisen", blurb: "Two geiko or maiko, joined by a jikata for live shamisen. The fullest version of the evening." },
    },
    galleryNote: "The room and the dishes shown are examples; both vary by date and season.",
    highlights: [
      { icon: "group", title: "The room is yours", body: "A private banquet room for your party only — never shared with other guests." },
      { icon: "chat", title: "Conversation, not just a show", body: "Geiko and maiko join your table to talk, then dance an arm's length away, then play ozashiki games with you." },
      { icon: "interpreter", title: "Ask anything", body: "An interpreter guide carries the conversation both ways, so your questions reach the room and the answers reach you." },
    ],
    included: [
      "A private tatami room for your party — upstairs rooms are built like a Gion teahouse, ground-floor rooms look onto the inner garden",
      "A multi-course Japanese dinner: seasonal obanzai, sashimi, a meat course, tempura, rice and soup, dessert (changes with the market)",
      "Free-flow drinks throughout — beer, sake, shochu, wine, highballs, umeshu and soft drinks",
      "Your geiko or maiko hosting your table: conversation, one dance, and the parlour games Konpira Funefune and Tora-tora (performers by plan)",
      "Photographs and video are welcome, the dance included — no flash, no tripods, and your guide explains the house rules — plus commemorative photos with your host",
      "Vegetarian, gluten-free and dashi-free (no fish stock) menus on request — tell us when you request your date",
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
      { time: "19:00", title: "The dance", body: "One dance before the gold screen — to recorded music on Select, to live shamisen on Signature and Private Reserve. Cameras are welcome.", img: "/images/geiko-dance.jpg" },
      { time: "19:15", title: "Ozashiki games", body: "Konpira Funefune, a rhythm game, and Tora-tora, rock-paper-scissors played with the whole body.", img: "/images/geiko-game-toratora.jpg" },
      { time: "19:50", title: "Photographs", body: "Commemorative photos with your host.", img: "/images/geiko-photo-together.jpg" },
      { time: "20:00", title: "End of the evening" },
    ],
    venue: {
      known: ["Gion / Higashiyama, Kyoto — about 3 minutes on foot from Gion-Shijo Station (Keihan line)", "A private room in a traditional dining house: teahouse-style rooms upstairs, garden-view rooms downstairs", "Seating is on tatami", "Meet on site — no transfers are arranged"],
      afterBooking: ["The house's name and street address", "A map and walking directions from the station", "Your guide's contact for the evening"],
      img: "/images/geiko-room-garden.jpg", alt: "A ground-floor tatami room looking onto the inner garden",
    },
    faq: [
      { q: "Will it be a geiko or a maiko?", a: "One geiko or maiko is arranged for your date. The house cannot take requests for a particular person, or for a maiko over a geiko; if you have a preference we will pass it on, without promising." },
      { q: "How long until the date is confirmed?", a: "We reply within 24 hours with whether the room is free, the price and the conditions — that reply is not yet a booking. Your booking is confirmed when you accept those conditions by paying through the link we send; cancellation terms apply from that moment. The house then secures your geiko or maiko: the formal request is placed no later than 14 days before your date (straight away for closer dates). If none can be secured, you receive a full refund." },
      { q: "Can we add live shamisen or a second host?", a: "Yes — that is what the plans are for. Signature adds a jikata playing shamisen live; Private Reserve has two geiko or maiko plus the jikata. Choose the plan when you request your date." },
      { q: "Can we take photographs during the dance?", a: "Yes. Photos and video are welcome at any point, the dance included — without flash or tripods, following the house rules your guide explains — and time is set aside at the end for commemorative photos with your host." },
      { q: "Are drinks included? Is there a dress code?", a: "Drinks are free-flow — beer, sake, shochu, wine, highballs, soft drinks — and included, as are tax and service charge. There is no dress code." },
      { q: "Will our host eat and drink with us?", a: "Usually not. Many maiko are under twenty, and by custom geiko and maiko do not eat at the table: they pour, talk, dance and play. Please do not press food or drink on them — it is the one etiquette point your guide will mention." },
      { q: "Can dietary needs and allergies be catered for?", a: "Yes. Vegetarian, gluten-free and dashi-free (no fish stock) menus are prepared on request — tell us when you request your date. For allergies or any other need, ask in the same message and the kitchen's answer comes back with the conditions, before you pay." },
      { q: "How far ahead must we book?", a: "By 17:00 Japan time seven days before at the latest; 10 to 14 days ahead is the comfortable window, and spring and autumn (March–April, October–November) fill first. During Miyako Odori (April) the house may only be able to confirm close to the date. The final time slot is confirmed with your availability reply." },
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
const STRUCTURAL: StructuralKeys[] = ["partySize", "pricing", "video", "status", "bookingType", "priceUnit", "availability", "map", "taxIncluded", "cancellationTiers", "dietary"];
function withStructure(localized: Experience[]): Experience[] {
  return localized.map((e) => {
    const base = experiences.find((x) => x.slug === e.slug);
    if (!base) return e;
    const merged: Experience = { ...e };
    for (const k of STRUCTURAL) if (base[k] !== undefined) (merged as unknown as Record<string, unknown>)[k] = base[k];
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
