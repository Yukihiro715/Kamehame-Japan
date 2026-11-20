import { headers } from "next/headers";
import { ownReviewsFor } from "./published-reviews";
import type { Aggregate, Review } from "./reviews";
import { SITE_GOLF_REVIEW_HEADER, siteGolfReview } from "./site-reviewed-golf";

export const PRIVATE_GOLF_EXPERIENCE = "mt-fuji-golf-day";

/** Resolve the reviewed public projection once per render. The Worker only
 * sets this gate on the approved canonical site pages, never on staging. */
export async function verifiedPrivateGolfReviews(): Promise<Review[]> {
  const existing = ownReviewsFor(PRIVATE_GOLF_EXPERIENCE);
  const incoming = (await headers()).get(SITE_GOLF_REVIEW_HEADER) === "1" ? await siteGolfReview() : null;
  return incoming ? [incoming, ...existing] : existing;
}

export function verifiedGolfAggregate(reviews: Review[]): Aggregate | null {
  const ratings = reviews.filter(r => r.experience === PRIVATE_GOLF_EXPERIENCE && r.verified === true && !["partner", "venue", "sample"].includes(r.source));
  if (!ratings.length) return null;
  return { count: ratings.length, average: Math.round(ratings.reduce((total, r) => total + r.rating, 0) / ratings.length * 10) / 10 };
}


// Both Explore and the home cards use the same resolved rating instead of
// the catalog's build-time count for the private service.
export function withPrivateGolfRating<T extends { slug: string; rating: Aggregate | null }>(item: T, rating: Aggregate | null): T {
  return item.slug === PRIVATE_GOLF_EXPERIENCE && rating ? { ...item, rating } : item;
}
