// Ofukuro Dinner — "Japanese Home Cooking, Made for You".
//
// A visiting home cook shops for the ingredients, then cooks, serves and
// tidies up in the kitchen of the guest's accommodation: about two hours
// from arrival to clean-up, one menu per group chosen from seven. Content
// follows the implementation brief of 2026-10-22 (v1.0). Nothing here is a
// catalog product: no price, area, party limit or cancellation term is
// published, because none is agreed yet; the page says what is confirmed
// with a request. Photos are AI-generated placeholders (asset manifest in
// docs/PLACEHOLDER_PHOTOS.md); the cook profiles are fictional samples with
// no names. The page lives at /previews/home-cooked-dinner-f4bc9d7306/
// (unlisted, noindex), English only for now.

export const OFUKURO_PATH = "/previews/home-cooked-dinner-f4bc9d7306/";

export interface OfukuroMenu {
  id: string;
  name: string;
  /** The set, as the brief registers it; sides and soups vary by cook and season. */
  set: string;
  blurb: string;
  img: string;
  alt: string;
}

export const OFUKURO_MENUS: OfukuroMenu[] = [
  { id: "curry", name: "Japanese Curry Rice", set: "Curry rice, salad, soup and one small side dish", blurb: "A comforting curry with rice and simple sides.", img: "/images/ofukuro-menu-curry.webp", alt: "Example Japanese curry rice set with salad, soup and one small side dish (illustrative)" },
  { id: "karaage", name: "Chicken Karaage", set: "Karaage, vegetable garnish, rice, miso soup and one small side dish", blurb: "Crisp Japanese fried chicken with a home-style meal.", img: "/images/ofukuro-menu-karaage.webp", alt: "Example chicken karaage set with rice, miso soup and one small side dish (illustrative)" },
  { id: "hamburg", name: "Japanese Hamburg Steak", set: "Japanese-style hamburg steak, vegetable garnish, rice, miso soup and one small side dish", blurb: "A juicy Japanese-style hamburg steak, without a bun.", img: "/images/ofukuro-menu-hamburg.webp", alt: "Example Japanese hamburg steak set with rice, miso soup and one small side dish (illustrative)" },
  { id: "nikujaga", name: "Nikujaga", set: "Nikujaga, rice, miso soup and two small side dishes", blurb: "A gentle simmer of meat, potatoes and vegetables.", img: "/images/ofukuro-menu-nikujaga.webp", alt: "Example nikujaga set with rice, miso soup and two small side dishes (illustrative)" },
  { id: "grilled-fish", name: "Grilled Fish", set: "Grilled fish, rice, miso soup and two small side dishes", blurb: "Simply grilled fish with rice, soup and small sides.", img: "/images/ofukuro-menu-grilled-fish.webp", alt: "Example grilled fish set with rice, miso soup and two small side dishes (illustrative)" },
  { id: "gyoza", name: "Gyoza", set: "Gyoza, rice, soup and two small side dishes", blurb: "Pan-fried dumplings served as a full home-style meal.", img: "/images/ofukuro-menu-gyoza.webp", alt: "Example gyoza set with rice, soup and two small side dishes (illustrative)" },
  { id: "okonomiyaki", name: "Okonomiyaki", set: "Okonomiyaki, soup and two small side dishes (no extra rice)", blurb: "A savory Japanese pancake with soup and small sides.", img: "/images/ofukuro-menu-okonomiyaki.webp", alt: "Example okonomiyaki set with soup and two small side dishes (illustrative)" },
];

export const menuById = (id: string | null | undefined) => OFUKURO_MENUS.find((m) => m.id === id) ?? null;

export const OFUKURO = {
  title: "Ofukuro Dinner",
  subtitle: "Japanese Home Cooking, Made for You",
  lede: "Enjoy a comforting Japanese home-cooked meal, prepared by a local cook in the kitchen at your accommodation.",
  note: "A usable kitchen is required. Your cook is matched to your date, area and menu.",
  conditions: ["At your accommodation", "About 2 hours", "One menu per group", "Ingredients included"],
  intro: {
    heading: "A taste of everyday Japan",
    body: [
      "In Japan, “ofukuro no aji” brings to mind the comforting food of home. Ofukuro Dinner brings that everyday warmth to your stay, with a freshly cooked meal and time to connect with a local home cook.",
      "Choose one menu for your group. Your cook shops for the ingredients before arriving, then cooks, serves your meal and tidies the kitchen they use.",
    ],
  },
  menuNote: "Side dishes and soups vary by cook and season. We will confirm any dietary requests and ingredient changes before your booking is confirmed.",
  included: {
    body: "Ingredients and shopping, cooking at your accommodation, serving the meal, and cleaning the kitchen area and equipment used by your cook.",
    time: "Allow around two hours for the visit, including cooking, conversation, serving and cleanup. Shopping takes place before arrival.",
    items: ["Ingredients and shopping before the visit", "Cooking at your accommodation", "Serving the meal", "Cleaning the kitchen area and the equipment your cook used"],
    price: "The price for your group, and the conditions, are confirmed with your request before any payment. Ingredients are included in the agreed prepaid price: there is no cash payment for groceries on the day.",
  },
  flow: [
    { time: "Before the visit", cook: "Buys the ingredients at a nearby supermarket", guest: "Groceries are included in the prepaid price" },
    { time: "0–10 min", cook: "Says hello and checks the kitchen and equipment", guest: "Show the equipment and the work space" },
    { time: "10–70 min", cook: "Cooks, chatting where the cooking allows", guest: "Watch, chat, or simply relax" },
    { time: "70–90 min", cook: "Plates up and explains the dishes", guest: "Start eating as the dishes are ready" },
    { time: "90–120 min", cook: "Tidies the equipment and the cooking space", guest: "Keep eating while the clean-up happens; the end time is a guide" },
  ],
  kitchen: {
    heading: "What we check before booking",
    items: [
      "Your accommodation allows a visiting cook to come in and cook. Hotel rooms are not assumed to qualify.",
      "A usable stove, sink, work space, ventilation, a fridge, and the pots, pans and tableware the menu needs; we confirm the specifics for your menu and cook.",
      "Allergies, dietary needs, children's ages, foods you do not eat, and how you would like to communicate on the day.",
    ],
    condition: "A usable kitchen and permission from your accommodation are required. Tell us about your kitchen, allergies and dietary needs when you request a booking so we can check whether we can arrange your dinner.",
  },
  cooks: {
    heading: "Meet the people behind the meals",
    lead: "Your cook is matched to your date, area and selected menu. Individual cook selection is not available.",
    profiles: [
      { img: "/images/ofukuro-cook-sample-01.webp", alt: "Fictional home cook portrait for layout preview, sample 1 (AI-generated image)", role: "Home cook · sample profile", lines: "Cooks weeknight dinners for a family and likes simmered dishes and miso soup done properly. Comfortable cooking in a small apartment kitchen." },
      { img: "/images/ofukuro-cook-sample-02.webp", alt: "Fictional home cook portrait for layout preview, sample 2 (AI-generated image)", role: "Home cook · sample profile", lines: "Shops by what looks good that morning and builds the side dishes around it. Happy to explain each dish as it comes out." },
      { img: "/images/ofukuro-cook-sample-03.webp", alt: "Fictional home cook portrait for layout preview, sample 3 (AI-generated image)", role: "Home cook · sample profile", lines: "Everyday family cooking, generous portions, and a tidy kitchen afterwards. Likes having guests who ask questions." },
    ],
    sampleNote: "Sample profiles for layout only: fictional, with no names, histories or reviews. Real cook profiles are added only after each cook has confirmed their own.",
  },
  faq: [
    { q: "Can I choose my cook?", a: "We match a cook to your date, area and menu. You cannot select a specific cook." },
    { q: "Do I need a kitchen?", a: "Yes. Your accommodation must have a usable kitchen and allow a visiting cook. If you are unsure about the facilities, tell us in your request." },
    { q: "Are ingredients included?", a: "Yes. Ingredients are included in your agreed prepaid price. There is no separate cash payment for groceries on the day." },
    { q: "Can you accommodate allergies or dietary needs?", a: "Please tell us before booking. We will check with the cook before confirming whether your request can be accommodated." },
    { q: "Can children join?", a: "Please include each child’s age and any food needs in your request. We will confirm suitable portions and any applicable pricing before payment." },
    { q: "Will my cook speak English?", a: "Language skills vary. Tell us your communication needs in advance so we can confirm what support is available." },
    { q: "Is this a cooking class?", a: "This is a home-cooked dinner experience. You are welcome to watch and chat, but a structured hands-on lesson is not included." },
    { q: "How do payment and confirmation work?", a: "Send a request first. We check the arrangements with a cook, then confirm the price and conditions with you and send a prepayment link. Your booking is not confirmed until we say so." },
  ],
  /** The states a live request moves through; shown with the form so "paid" and "confirmed" are never read as the same thing. */
  states: ["Request received", "Checking arrangements", "Awaiting payment", "Paid", "Booking confirmed"],
  unable: "Unable to arrange",
  received: "Thanks. We’ve received your request and will check the arrangements with a cook. Your booking is not confirmed yet.",
} as const;
