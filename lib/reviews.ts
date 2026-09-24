// Guest reviews.
//
// Only reviews that were actually written by guests belong here. Two kinds:
//   - source "venue": collected by the host venue from its own guests, before
//     KAMEHAME listed the evening. Shown with that provenance, no verified
//     badge, and left out of the rating declared in structured data.
//   - source "direct" with verified: true: written through the review link
//     sent to a confirmed KAMEHAME booking. These carry the badge and, once
//     they exist, are the only ones behind the AggregateRating.
// Never add invented reviews: publishing them is deceptive (and unlawful
// under Japan's stealth-marketing rules) and breaks Google's review policy.

import type { Lang } from "@/lib/i18n";

export const REVIEWS_PUBLISHED = true;

export interface Review {
  id: string;
  /** Experience slug this review belongs to. */
  experience: string;
  /** Whole or half stars, 1–5. */
  rating: number;
  /** Optional headline; venue-collected reviews usually have none. */
  title?: string;
  body: string;
  /** Initials only — we never publish a guest's full name. */
  author: string;
  /** ISO 3166-1 alpha-2, used for the flag beside the initials. */
  country: string;
  /** ISO date of the experience, not of the review; omitted when unknown. */
  date?: string;
  /** Where it came from, so we can show "verified" only where it is true.
   *  "venue": a guest of the host venue before KAMEHAME listed the evening —
   *  shown with that provenance, never with the verified-booking badge, and
   *  left out of the aggregate rating in structured data. */
  source: "google" | "bokun" | "direct" | "venue" | "sample";
  /** Who came: shown as a small tag beside the initials. */
  party?: "couple" | "family" | "friends" | "solo" | "business";
  /** Provenance note, e.g. that the guest attended as a monitor. */
  note?: string;
  /** True when the review was written through the link sent to a confirmed booking. */
  verified?: boolean;
  /** Guest photos, site-root-relative, published with permission. */
  photos?: string[];
}

const REVIEWS: Review[] = [
  {
    id: "v1", experience: "evening-with-geiko", rating: 5, author: "Emily", country: "US", source: "venue",
    body: "We honestly didn't know what to expect, but this ended up being one of our favorite nights in Kyoto. Being able to actually talk with the maiko made it feel very different from just watching a show. The games were fun too — much more relaxed than we expected.",
  },
  {
    id: "v2", experience: "evening-with-geiko", rating: 5, author: "Daniel", country: "AU", source: "venue",
    body: "Really special experience. We had plenty of time to ask questions and take photos, and the interpreter made everything easy. The dinner was good, but the best part was definitely the conversation and dancing.",
  },
  {
    id: "v3", experience: "evening-with-geiko", rating: 5, author: "Sophie", country: "FR", source: "venue",
    body: "Very intimate and well organized. It never felt rushed, and we liked that it was just our group. I was a little worried it might feel too touristy, but it didn't.",
  },
  {
    id: "v4", experience: "evening-with-geiko", rating: 5, author: "Michael", country: "SG", source: "venue",
    body: "We booked this for our last night in Kyoto and were really glad we did. The ozashiki games were probably our favorite part. Everyone was laughing by the end. It felt much more personal than we expected.",
  },
  {
    id: "v5", experience: "evening-with-geiko", rating: 4, author: "Anna", country: "DE", source: "venue",
    body: "Beautiful evening and definitely something we'll remember. It is expensive, so I wasn't sure at first, but having the private room, dinner, drinks and interpreter made it feel worth it. I would have loved a little more time for photos at the end.",
  },
];

/** Layout samples for experiences in "preview" only (see isPreview in the
 *  catalog). They are not reviews: they never enter REVIEWS, the ratings, the
 *  home page or structured data, and each card is labelled as a sample. They
 *  are deleted when the partner's real reviews arrive and the page goes live. */
const SAMPLE_REVIEWS: Review[] = [
  { id: "s1", experience: "kanji-name-calligraphy", rating: 5, author: "Sample A", country: "—", source: "sample",
    body: "Placeholder text. A guest's review of the class will appear here: what they wrote, which kanji they chose for their name, and how the teacher helped." },
  { id: "s2", experience: "kanji-name-calligraphy", rating: 5, author: "Sample B", country: "—", source: "sample",
    body: "Placeholder text. Second review slot, to check how two or three reviews sit beside the booking box on a phone and on a wide screen." },
  { id: "s3", experience: "kanji-name-calligraphy", rating: 4, author: "Sample C", country: "—", source: "sample",
    body: "Placeholder text. Third review slot. Real reviews from the teacher's monitor sessions replace all three before the page is published." },
];

/** Samples for a page in preview; the caller checks the status. */
export const sampleReviewsFor = (experience: string): Review[] => SAMPLE_REVIEWS.filter((r) => r.experience === experience);

/** Empty while unpublished, so no caller has to know about the flag. */
export const reviewsFor = (experience: string): Review[] =>
  REVIEWS_PUBLISHED ? REVIEWS.filter((r) => r.experience === experience) : [];

export interface Aggregate { average: number; count: number }

/** How many reviews gave each star, 5 down to 1, for the breakdown bars. */
export function distributionFor(experience: string): { stars: number; count: number; share: number }[] {
  const rs = reviewsFor(experience);
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = rs.filter((r) => Math.round(r.rating) === stars).length;
    return { stars, count, share: rs.length ? count / rs.length : 0 };
  });
}

/** Only reviews written through our own booking flow count toward the rating
 *  we declare to search engines. */
export const ownReviewsFor = (experience: string): Review[] => reviewsFor(experience).filter((r) => r.source !== "venue");

/** Rating from our own verified reviews only — what structured data may declare. */
export function ownAggregateFor(experience: string): Aggregate | null {
  const rs = ownReviewsFor(experience);
  if (!rs.length) return null;
  return { average: Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10, count: rs.length };
}

export function aggregateFor(experience: string): Aggregate | null {
  const list = reviewsFor(experience);
  if (list.length === 0) return null;
  const total = list.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / list.length) * 10) / 10, count: list.length };
}

/** Highest-rated reviews across the catalog, for the home page. */
export const featuredReviews = (limit = 3): Review[] =>
  REVIEWS_PUBLISHED ? [...REVIEWS].sort((a, b) => b.rating - a.rating).slice(0, limit) : [];

/** Locale-aware date for display beneath a review. */
const DATE_LOCALE: Record<Lang, string> = { en: "en-GB", es: "es-ES", ja: "ja-JP", fr: "fr-FR", "zh-tw": "zh-TW" };
export const reviewDate = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(DATE_LOCALE[lang], { year: "numeric", month: "long", timeZone: "UTC" });
