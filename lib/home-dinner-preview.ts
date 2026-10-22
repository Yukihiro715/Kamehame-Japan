// Concept preview: "Japanese Home-Cooked Dinner at Your Stay".
//
// A visiting-host service (a Japanese home cook shops, cooks and cleans up in
// the guest's Airbnb or apartment-hotel kitchen), Tokyo first. Not a catalog
// product: nothing here is listed, priced for sale or wired to the enquiry
// API. Hosts, dishes, photos and prices are illustrative samples, and the
// page says so. The page lives at /previews/home-cooked-dinner-f4bc9d7306/
// (unlisted, noindex) and is English-only for now.

export const HOME_DINNER_PATH = "/previews/home-cooked-dinner-f4bc9d7306/";

export const HOME_DINNER = {
  title: "Japanese Home-Cooked Dinner at Your Stay",
  tagline: "A Japanese home cook comes to your Airbnb or apartment hotel in Tokyo, shops for the ingredients, cooks an everyday family dinner in your kitchen, eats and talks with you, and leaves the kitchen as they found it. Two to three hours; no cooking required from you.",
  overview: [
    "Restaurants show you what Japan serves to guests. This is what Japanese families eat on a weeknight: simmered meat and potatoes, a rolled omelette, miso soup, rice, pickles, a seasonal vegetable dish — the food most visitors never get to taste. The host cooks it the way they cook it at home, in your kitchen, and sits down to eat with you.",
    "It is a visiting-host service, not a cooking class: you can watch, help or simply wait with a drink. The host handles the shopping, the cooking and the basic clean-up. Menus are planned around your group and your dietary needs, and confirmed with you before the day.",
  ],
  conditions: ["Tokyo", "2–3 hours", "2–8 guests", "English-speaking host", "In your accommodation's kitchen"],
  includedShort: "Host visit · Groceries · Cooking and clean-up · Dinner together",
  /** Sample prices: a group of two, plus a flat amount per further guest. */
  price: { base: 34800, baseGuests: 2, extraAdult: 6000, extraChild: 3000, maxGuests: 8 },
  highlights: [
    { icon: "home", title: "In your own accommodation", body: "No reservation to find, no taxi back. The dinner happens where you are staying, around your own table." },
    { icon: "meal", title: "Everyday Japanese dishes", body: "Home cooking, not restaurant cooking: the dishes families make on a weeknight, cooked by someone who makes them every week." },
    { icon: "chat", title: "Good food, real conversation", body: "The host eats with you. Ask about the food, the neighbourhood, the school run — whatever you are curious about." },
    { icon: "leaf", title: "Dietary needs, planned ahead", body: "Vegetarian, vegan, pork-free and other requests are planned into the menu and confirmed with you before the day." },
  ],
  flow: [
    { title: "Tell us your date, group and dietary needs", body: "Send the form with your date, head count, where you are staying and what you can and cannot eat." },
    { title: "We confirm a host and the kitchen", body: "We check which host is free, that your accommodation allows a visiting cook, and that the kitchen has what is needed." },
    { title: "The host shops and comes to you", body: "On the day the host buys fresh ingredients and arrives at your accommodation at the agreed time." },
    { title: "Dinner together", body: "The host cooks an everyday Japanese dinner in your kitchen and eats it with you." },
    { title: "Clean-up, and goodnight", body: "The host washes up, puts the kitchen back as it was, and leaves." },
  ],
  hosts: [
    {
      id: "yumi", name: "Yumi", age: "50s", img: "/images/hcd-host-yumi.webp", alt: "Illustrative photo of a Japanese home cook in an apron (sample host)",
      area: "Shinjuku, Tokyo", languages: "English", specialities: "Nikujaga, tamagoyaki, family classics",
      bio: "Cooks the dinners that make everyone relax: simmered meat and potatoes, a fluffy rolled omelette, miso soup. Lived abroad for several years and likes cooking with children around.",
      dietary: "Vegetarian on request · Kid-friendly",
    },
    {
      id: "keiko", name: "Keiko", age: "50s", img: "/images/hcd-host-keiko.webp", alt: "Illustrative photo of a Japanese home cook (sample host)",
      area: "Asakusa, Tokyo", languages: "English, basic French", specialities: "Seasonal vegetables, handmade onigiri, miso soup",
      bio: "Shops by the season and builds the meal around what looked good at the greengrocer that morning. Her favourite dish is whatever brings people around one table.",
      dietary: "Vegetarian on request · Pescatarian on request",
    },
    {
      id: "aki", name: "Aki", age: "30s", img: "/images/hcd-host-aki.webp", alt: "Illustrative photo of a Japanese home cook (sample host)",
      area: "Shibuya, Tokyo", languages: "English, Spanish", specialities: "Vegetable-forward dishes, tofu, mushroom rice",
      bio: "Wants visitors to discover the Japanese food people really eat at home. Cooks vegetable-forward and is comfortable planning a plant-based menu without fish stock.",
      dietary: "Vegan possible · Vegetarian · No fish dashi on request",
    },
  ],
  menus: [
    { id: "classic", title: "Traditional Japanese Home Dinner", img: "/images/hcd-home-table.webp", alt: "Homestyle nikujaga, miso soup, rice and tamagoyaki", dishes: "Nikujaga (simmered meat and potatoes), tamagoyaki rolled omelette, miso soup, rice, pickles and seasonal greens.", tags: "Meat and egg · The most common Japanese home dinner" },
    { id: "comfort", title: "Japanese Comfort Food", img: "/images/hcd-karaage.webp", alt: "Japanese karaage fried chicken, rice, soup and side dishes", dishes: "Karaage fried chicken or pork shogayaki, cabbage salad, home-style Japanese curry, rice and miso soup.", tags: "Chicken or pork · Popular with families" },
    { id: "plant", title: "Plant-Based Japanese Dinner", img: "/images/hcd-plant-based.webp", alt: "Plant-forward Japanese home cooking with mushroom rice, simmered vegetables and tofu", dishes: "Mushroom rice, simmered root vegetables, tofu dishes, greens with sesame, and a kombu-based broth instead of fish stock.", tags: "Vegetarian · Vegan on request, confirmed in advance" },
  ],
  menuNote: "Menus are directions, not fixed sets: the host adjusts the dishes to the season, your requests and what the kitchen allows. Traditional miso soup, sauces and dashi can contain fish, soy, wheat or egg, so we ask about restrictions in detail before confirming a menu. Vegan, halal-related and allergy requests are checked with the host first and are not guaranteed; we cannot promise an allergen-free kitchen.",
  included: [
    "The host's visit to your accommodation (Tokyo)",
    "Menu planning around your group and dietary needs",
    "Grocery shopping and the ingredients",
    "Cooking in your kitchen, serving, and eating together",
    "Basic clean-up: dishes washed and the kitchen put back",
  ],
  notIncluded: [
    "Drinks and alcohol (bring your own, or ask the host to pick some up at cost)",
    "Cooking equipment your kitchen does not have (we check this with you first)",
    "Travel outside Tokyo, and late-night finishes (quoted individually)",
  ],
  faq: [
    { q: "Can we do this at an Airbnb or an apartment hotel?", a: "Usually, yes — but the property must allow a visiting cook, and some hotels and rentals do not. Tell us where you are staying and we confirm with you (and, if needed, with the property) before anything is booked." },
    { q: "What does the kitchen need?", a: "A stove with at least two burners, a fridge, a few pots and pans, a knife and a chopping board, and enough plates and bowls for the group. Tell us what you know in the form; the host can bring small items, and we say if something is missing." },
    { q: "Can you cook vegan, or around an allergy?", a: "Vegetarian and vegan menus are possible with the right host and are planned in advance. Allergies and halal-related requests are checked with the host first: Japanese dashi, soy sauce and many sauces contain fish, wheat or soy, so we confirm each ingredient with you rather than promise. We cannot guarantee an allergen-free kitchen." },
    { q: "Can children join?", a: "Yes — this is family cooking. Tell us the children's ages and the host plans dishes they will actually eat. Children under 12 are priced lower in the sample prices." },
    { q: "Can we choose the host?", a: "You can name a preferred host in the form, or leave it to us. Hosts have their own calendars, so we confirm who is free for your date." },
    { q: "Which languages do the hosts speak?", a: "All hosts speak English; some also speak Spanish or French. Say in the form if another language matters to you." },
    { q: "Do we have to cook?", a: "No. The host cooks. You can help, watch or just sit down when it is ready." },
    { q: "How does cancelling or changing the date work?", a: "Sample terms for this concept: free until 48 hours before, then the groceries and the host's time are charged. The host buys the ingredients on the day, so the final terms will follow that." },
  ],
  cancellation: "Sample terms for this concept, not final: free cancellation until 48 hours before the dinner; after that, the groceries and the host's time are charged. Date changes are free when the host has room. If we cannot confirm a host or the property does not allow a visiting cook, nothing is charged.",
  venue: {
    known: ["Your accommodation in Tokyo: an Airbnb, an apartment hotel or a house with a usable kitchen", "The property must allow a visiting cook; we confirm this before booking", "The host arrives at the agreed time with the groceries and leaves after cleaning up"],
    afterBooking: ["The host's name and a short profile", "The menu, confirmed around your requests", "The arrival time and what to have ready in the kitchen"],
  },
} as const;

export type HomeDinner = typeof HOME_DINNER;

/** Sample total for a party: a base for two, then a flat amount per further adult or child. */
export function homeDinnerTotal(adults: number, children: number): number {
  const p = HOME_DINNER.price;
  const a = Math.max(0, adults), c = Math.max(0, children);
  const extraAdults = Math.max(0, a - p.baseGuests);
  // Children count towards the base pair first, then at the child rate.
  const seatsLeft = Math.max(0, p.baseGuests - a);
  const extraChildren = Math.max(0, c - seatsLeft);
  return p.base + extraAdults * p.extraAdult + extraChildren * p.extraChild;
}
