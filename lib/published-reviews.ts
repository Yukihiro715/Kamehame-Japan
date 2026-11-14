// Newly approved direct reviews are separate from the unchanged partner archive.
import { REVIEWS_PUBLISHED, reviewsFor as archivedReviewsFor, type Review, type Aggregate } from "@/lib/reviews";
export { REVIEWS_PUBLISHED, reviewDate, sampleReviewsFor, featuredReviews } from "@/lib/reviews";
export type { Review, Aggregate } from "@/lib/reviews";

const DIRECT_REVIEWS: Review[] = [
  // Direct submission on 14 Nov, matched to the completed 10 Nov golf booking.
  // Original English text preserved; first name only.
  {
    id: "neil-golf-2026-11", experience: "mt-fuji-golf-day", rating: 5,
    author: "Neil", country: "", source: "direct", verified: true, date: "2026-11-10",
    body: "Wasn't sure what to expect from the day after booking a few days before the round. Toshi our driver and guide was extremely helpful and helped me navigate golf etiquette in Japan and the different style of play I'm accustomed to in America. It was a long day but Toshi kept us on schedule and allowed time for breaks during the bus ride. The course was in excellent condition even though it rained the night before. I would highly recommend this trip for anyone wanting to experience golf in Japan.",
  },
  // Direct submission on 13 Nov, matched to the confirmed 12 Nov kendo booking.
  // Original English text preserved; first name only, no uploaded media.
  {
    id: "hui-nihonbashi-kendo-2026-11", experience: "nihonbashi-kendo-experience", rating: 5,
    author: "Hui", country: "", source: "direct", verified: true, date: "2026-11-12",
    body: "The teachers were really nice and patient. Course material (hard copy guide and all the armors) was sufficiently provided.",
    i18n: {
      ja: { body: "先生方はとても親切で、根気よく教えてくれました。教材（紙のガイドと防具一式）も十分に用意されていました。" },
      es: { body: "Los profesores fueron muy amables y pacientes. El material del curso (la guía impresa y todo el equipo de protección) se proporcionó en cantidad suficiente." },
      fr: { body: "Les enseignants étaient vraiment gentils et patients. Le matériel du cours (le guide imprimé et toutes les pièces d’armure) était fourni en quantité suffisante." },
      "zh-tw": { body: "老師們非常親切，也很有耐心。課程教材（紙本指南及全套護具）都準備得很充足。" },
    },
  },
  // Direct submission matched to the review invitation and confirmed booking
  // for Takane Country Club, 4 Nov 2026. Site/SNS photo consent received 7 Nov.
  // Keep the guest's original English wording and first name only.
  {
    id: "tyler-takane-2026-11", experience: "mt-fuji-golf-day", rating: 5,
    author: "Tyler", country: "", source: "direct", verified: true, date: "2026-11-04",
    body: "I tried booking golf for an upcoming Japan trip myself… to no avail. Time and time again, no tee times were available, or language barriers were getting in the way.\n\nI then figured, why not reach out to a pro? And tried Kamehame. Not only DID they book me my golf, but the booking process was quick, easy, informative, and they got me on an awesome course!\n\nEven up until the day of, they responded to emails rapidly, and helped me every step of the way. They are so, so awesome. Let them help you, you won’t regret it!!!",
    photos: ["/images/reviews/tyler-2026-11/group.webp", "/images/reviews/tyler-2026-11/tee-shot.webp", "/images/reviews/tyler-2026-11/course.webp"],
  },
];

export const reviewsFor = (experience: string): Review[] => REVIEWS_PUBLISHED
  ? [...DIRECT_REVIEWS.filter((r) => r.experience === experience), ...archivedReviewsFor(experience)]
  : [];

/** How many reviews gave each star, 5 down to 1, for the breakdown bars. */
export function distributionFor(experience: string, scope?: "partner"): { stars: number; count: number; share: number }[] {
  const rs = ratingReviewsFor(experience, scope);
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = rs.filter((r) => Math.round(r.rating) === stars).length;
    return { stars, count, share: rs.length ? count / rs.length : 0 };
  });
}

/** Only reviews written through our own booking flow count toward the rating
 *  we declare to search engines. */
export const ownReviewsFor = (experience: string): Review[] => reviewsFor(experience).filter((r) => r.verified === true && r.source !== "venue" && r.source !== "partner" && r.source !== "sample");

/** Once direct verified feedback exists, never blend it with partner ratings. */
export function ratingReviewsFor(experience: string, scope?: "partner"): Review[] {
  const list = reviewsFor(experience);
  if (scope === "partner") return list.filter((r) => r.source === "partner");
  const own = ownReviewsFor(experience);
  return own.length ? own : list;
}

/** Rating from our own verified reviews only — what structured data may declare. */
export function ownAggregateFor(experience: string): Aggregate | null {
  const rs = ownReviewsFor(experience);
  if (!rs.length) return null;
  return { average: Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10, count: rs.length };
}

export function aggregateFor(experience: string, scope?: "partner"): Aggregate | null {
  const list = ratingReviewsFor(experience, scope);
  if (list.length === 0) return null;
  const total = list.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / list.length) * 10) / 10, count: list.length };
}

