// Guest reviews.
//
// PLACEHOLDER DATA. Everything in SAMPLE_REVIEWS below was written to design
// and test the layout — no guest has said any of it. Publishing invented
// testimonials on a live commercial site is deceptive, and inventing an
// aggregate rating additionally breaks Google's structured-data policy, which
// risks a manual penalty on the whole domain.
//
// So REVIEWS_PUBLISHED stays false until real reviews exist. With it false the
// site renders the "reviews open after launch" state everywhere; nothing here
// reaches a visitor and no rating is emitted in structured data.
//
// To go live: replace SAMPLE_REVIEWS with collected reviews, set
// REVIEWS_PUBLISHED to true, and the stars, counts, review lists and
// AggregateRating appear together.

import type { Lang } from "@/lib/i18n";

export const REVIEWS_PUBLISHED = false;

export interface Review {
  id: string;
  /** Experience slug this review belongs to. */
  experience: string;
  /** Whole or half stars, 1–5. */
  rating: number;
  title: string;
  body: string;
  /** Initials only — we never publish a guest's full name. */
  author: string;
  /** ISO 3166-1 alpha-2, used for the flag beside the initials. */
  country: string;
  /** ISO date of the experience, not of the review. */
  date: string;
  /** Where it came from, so we can show "verified" only where it is true. */
  source: "google" | "bokun" | "direct";
}

const SAMPLE_REVIEWS: Review[] = [
  {
    id: "s1", experience: "evening-with-geiko", rating: 5,
    title: "The evening we keep talking about",
    body: "We had braced ourselves for something staged and got the opposite. The room was ours, the conversation was real, and our guide translated the jokes as well as the explanations — which turned out to matter more than we expected.",
    author: "M.L.", country: "FR", date: "2026-04-18", source: "direct",
  },
  {
    id: "s2", experience: "evening-with-geiko", rating: 5,
    title: "Worth planning the trip around",
    body: "Booking took an email exchange rather than a click, and the team came back the same day with the date confirmed. The dance at arm's length is something photographs do not prepare you for.",
    author: "J.K.", country: "US", date: "2026-03-29", source: "direct",
  },
  {
    id: "s3", experience: "evening-with-geiko", rating: 4.5,
    title: "Exceptional, though it ends quickly",
    body: "Two hours goes faster than you think once the games start. Our only regret is not booking the longer option. The food was genuinely good rather than decorative.",
    author: "A.R.", country: "ES", date: "2026-05-02", source: "direct",
  },
  {
    id: "s4", experience: "sushi-masterclass", rating: 5,
    title: "He corrected my hands three times",
    body: "This is a lesson, not a demonstration. The chef reshaped my nigiri until it was right and explained why the rice is at body temperature. I have made it twice at home since.",
    author: "T.H.", country: "AU", date: "2026-04-06", source: "direct",
  },
  {
    id: "s5", experience: "sushi-masterclass", rating: 5,
    title: "The best two hours of our week in Tokyo",
    body: "Six of us, the shop closed to everyone else, and a chef who clearly enjoyed the questions. Our interpreter knew the vocabulary of the craft, which made the difference.",
    author: "C.B.", country: "GB", date: "2026-02-21", source: "direct",
  },
  {
    id: "s6", experience: "sumo-morning-practice", rating: 5,
    title: "Silent, close and completely absorbing",
    body: "You sit a few metres from the ring and nobody performs for you. Our guide whispered what each drill meant as it happened. Be ready for an early start and ninety minutes on tatami.",
    author: "D.M.", country: "DE", date: "2026-03-11", source: "direct",
  },
  {
    id: "s7", experience: "sumo-morning-practice", rating: 4.5,
    title: "Remarkable access, spartan comfort",
    body: "Exactly as described — this is their training, not a show. The cushions help but my legs still complained. Entirely worth it.",
    author: "S.N.", country: "SG", date: "2026-04-24", source: "direct",
  },
  {
    id: "s8", experience: "tea-ceremony-with-master", rating: 5,
    title: "An hour that slowed everything down",
    body: "She explained why that scroll and that flower were chosen for that particular day, and the whole thing rearranged itself into something I understood. Whisking my own bowl badly was part of the fun.",
    author: "E.V.", country: "NL", date: "2026-05-15", source: "direct",
  },
  {
    id: "s9", experience: "kimono-higashiyama-walk", rating: 5,
    title: "The lanterns came on as we turned the corner",
    body: "Being dressed properly takes an hour and changes how you walk. The timing of the route was clearly planned by someone who knows when Higashiyama empties out.",
    author: "R.P.", country: "IT", date: "2026-04-30", source: "direct",
  },
  {
    id: "s10", experience: "katana-forge-visit", rating: 5,
    title: "Heat, noise and a thousand years",
    body: "Watching the steel folded, then holding a finished blade and being shown what the polisher had revealed — our guide translated a long technical conversation without losing any of it.",
    author: "P.O.", country: "CA", date: "2026-03-05", source: "direct",
  },
];

/** Empty while unpublished, so no caller has to know about the flag. */
export const reviewsFor = (experience: string): Review[] =>
  REVIEWS_PUBLISHED ? SAMPLE_REVIEWS.filter((r) => r.experience === experience) : [];

export interface Aggregate { average: number; count: number }

export function aggregateFor(experience: string): Aggregate | null {
  const list = reviewsFor(experience);
  if (list.length === 0) return null;
  const total = list.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / list.length) * 10) / 10, count: list.length };
}

/** Highest-rated reviews across the catalog, for the home page. */
export const featuredReviews = (limit = 3): Review[] =>
  REVIEWS_PUBLISHED ? [...SAMPLE_REVIEWS].sort((a, b) => b.rating - a.rating).slice(0, limit) : [];

/** Locale-aware date for display beneath a review. */
export const reviewDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "es" ? "es-ES" : "en-GB", {
    year: "numeric", month: "long",
  });
