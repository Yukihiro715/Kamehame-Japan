import { Star, ShieldCheck } from "lucide-react";
import { aggregateFor, reviewDate, reviewsFor, type Review } from "@/lib/reviews";
import { t, type Lang } from "@/lib/i18n";

/** Five stars with the last one clipped to the fractional part. */
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${rating} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <span className="star" key={i} style={{ width: size, height: size }}>
            <Star size={size} className="star-bg" aria-hidden="true" />
            <span className="star-fg" style={{ width: `${fill * 100}%` }}>
              <Star size={size} aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Compact "★★★★★ 4.9 (12)" for cards and page headings. */
export function RatingSummary({
  experience, lang, href, size = 14,
}: { experience: string; lang: Lang; href?: string; size?: number }) {
  const agg = aggregateFor(experience);
  if (!agg) return null;
  const T = t(lang);
  const inner = (
    <>
      <Stars rating={agg.average} size={size} />
      <b>{agg.average.toFixed(1)}</b>
      <span>{T.reviewCount(agg.count)}</span>
    </>
  );
  return href
    ? <a className="rating-summary" href={href}>{inner}</a>
    : <span className="rating-summary">{inner}</span>;
}

function ReviewCard({ review, lang }: { review: Review; lang: Lang }) {
  const T = t(lang);
  return (
    <article className="review-card">
      <header>
        <Stars rating={review.rating} />
        <time dateTime={review.date}>{reviewDate(review.date, lang)}</time>
      </header>
      <h3>{review.title}</h3>
      <p>{review.body}</p>
      <footer>
        <span className="review-author">{review.author}</span>
        <span className="review-country">{review.country}</span>
        {review.source !== "direct" && (
          <span className="review-verified"><ShieldCheck size={12} /> {T.reviewVerified}</span>
        )}
      </footer>
    </article>
  );
}

/** Review list for an experience page, or the pre-launch note when empty. */
export function ReviewSection({ experience, lang }: { experience: string; lang: Lang }) {
  const T = t(lang);
  const list = reviewsFor(experience);

  return (
    <section id="reviews" className="reviews-section">
      <h2>{T.reviewsH}</h2>
      {list.length === 0 ? (
        <div className="reviews-empty">
          <ShieldCheck size={18} />
          <p>{T.reviewsEmpty}</p>
        </div>
      ) : (
        <div className="review-list">
          {list.map((r) => <ReviewCard key={r.id} review={r} lang={lang} />)}
        </div>
      )}
    </section>
  );
}
