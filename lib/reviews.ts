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
  source: "google" | "bokun" | "direct" | "venue" | "partner" | "sample";
  /** Who came: shown as a small tag beside the initials. */
  party?: "couple" | "family" | "friends" | "solo" | "business";
  /** Provenance note, e.g. that the guest attended as a monitor. */
  note?: string;
  /** True when the review was written through the link sent to a confirmed booking. */
  verified?: boolean;
  /** Guest photos, site-root-relative, published with permission. */
  photos?: string[];
  /** The same review in another page language, when the partner supplied it. */
  i18n?: Partial<Record<Lang, { title?: string; body: string }>>;
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
  // source "partner": real guests of the calligraphy teacher's classes booked
  // through other channels, supplied by the partner. Shown with that label, no
  // verified badge, and left out of the rating declared in structured data.
  {
    id: "t1", experience: "kanji-name-calligraphy", rating: 5, author: "Emily R.", country: "US", source: "partner",
    title: "My own name became a very special Japanese souvenir",
    body: "What stayed with me most was choosing kanji to match my name. Because we learned the meaning before writing — not just how the character looks — I felt attached to the finished piece. Unlike a souvenir from a shop, I got to take home the time I spent making it, too.",
    i18n: { ja: { title: "自分の名前が、特別な日本のお土産になりました", body: "名前に合わせて漢字を選ぶところが、いちばん印象に残っています。文字の見た目だけでなく、意味を知ってから書くので、完成した作品にも愛着が湧きました。お店で買うお土産とは違って、自分でつくった時間まで思い出として持ち帰れる体験でした。" } },
  },
  {
    id: "t2", experience: "kanji-name-calligraphy", rating: 5, author: "Lucas M.", country: "FR", source: "partner",
    title: "My first time holding a brush, and I loved it",
    body: "At first the amount of ink and how to move the brush were hard, but I got used to it little by little as we practised. I was nervous writing on the final board, but I was happy with a piece that felt like mine. It wasn't only about writing neatly — I enjoyed expressing the character.",
    i18n: { ja: { title: "筆を持つのは初めてでも、楽しめました", body: "最初は墨の量や筆の動かし方が難しかったのですが、練習するうちに少しずつ慣れてきました。本番の色紙に書く瞬間は緊張しましたが、自分らしい一枚ができてうれしかったです。きれいに書くことだけではなく、文字を表現する楽しさを感じられました。" } },
  },
  {
    id: "t3", experience: "kanji-name-calligraphy", rating: 5, author: "Olivia B.", country: "AU", source: "partner",
    title: "Comparing our pieces was part of the fun",
    body: "We came as two. We each chose different kanji and designs, so the same class ended in completely different pieces, which was fun. Showing each other along the way, we talked about the meanings of our names — something we rarely do. A travel memory of making something together.",
    i18n: { ja: { title: "二人で見比べる時間も、楽しい思い出に", body: "二人で参加しました。それぞれ違う漢字やデザインを選ぶので、同じ体験でもまったく違う作品になるのが面白かったです。途中で見せ合いながら、普段はあまり話さない名前の意味について話せたのもよかったです。二人で何かをつくる旅行の思い出になりました。" } },
  },
  {
    id: "t4", experience: "kanji-name-calligraphy", rating: 4, author: "Daniel W.", country: "GB", source: "partner",
    title: "A calm, focused break from sightseeing",
    body: "Unlike walking around the sights, it was refreshing to sit down and focus on one thing. Choosing the kanji, practising with the brush and finishing the piece with my own hands was enjoyable. Good for anyone who wants to actually do something rather than just watch.",
    i18n: { ja: { title: "観光の合間に、ゆっくり集中できる時間", body: "観光地を歩き回る時間とは違って、座って一つのことに集中できたのが新鮮でした。漢字を選び、筆を練習し、作品を仕上げるまで、自分の手で進めていくのが楽しかったです。ただ見学するだけではなく、実際にやってみたい人に向いていると思います。" } },
  },
  {
    id: "t5", experience: "kanji-name-calligraphy", rating: 5, author: "Sophie L.", country: "CA", source: "partner",
    title: "Loved taking home a piece I can display",
    body: "Besides the class itself, being able to take the finished piece home is what drew me in. On the wooden stand it looks different from when I was practising. The slightly uneven lines feel charming because I wrote them myself — I'm looking forward to putting it up at home.",
    i18n: { ja: { title: "飾れる作品を持ち帰れるのがよかったです", body: "体験そのものはもちろん、完成した作品を持ち帰れるところに魅力を感じて参加しました。木製の台座に置くと、練習していたときとはまた違った雰囲気になります。少し不揃いな線も自分で書いたからこその味に感じられて、部屋に飾るのが楽しみです。" } },
  },
];

/** Layout samples for experiences in "preview" only (see isPreview in the
 *  catalog). They are not reviews: they never enter REVIEWS, the ratings, the
 *  home page or structured data, and each card is labelled as a sample. They
 *  are deleted when the partner's real reviews arrive and the page goes live. */
const SAMPLE_REVIEWS: Review[] = [
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
export const ownReviewsFor = (experience: string): Review[] => reviewsFor(experience).filter((r) => r.source !== "venue" && r.source !== "partner");

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
export const featuredReviews = (limit = 3, listed?: string[]): Review[] =>
  REVIEWS_PUBLISHED ? [...REVIEWS].filter((r) => !listed || listed.includes(r.experience)).sort((a, b) => b.rating - a.rating).slice(0, limit) : [];

/** Locale-aware date for display beneath a review. */
const DATE_LOCALE: Record<Lang, string> = { en: "en-GB", es: "es-ES", ja: "ja-JP", fr: "fr-FR", "zh-tw": "zh-TW" };
export const reviewDate = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(DATE_LOCALE[lang], { year: "numeric", month: "long", timeZone: "UTC" });
