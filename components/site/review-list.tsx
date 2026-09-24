"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { Review } from "@/lib/reviews";
import { reviewDate } from "@/lib/reviews";
import { Stars } from "@/components/site/reviews";
import { t, type Lang } from "@/lib/i18n";

/** First few reviews open; the rest behind "show more". Only rendered when
 *  real reviews exist — the caller decides that. */
export function ReviewList({ reviews, lang, initial = 3 }: { reviews: Review[]; lang: Lang; initial?: number }) {
  const T = t(lang);
  const D = T.detail;
  const [shown, setShown] = useState(initial);
  const visible = reviews.slice(0, shown);

  return (
    <div className="review-list">
      {visible.map((r) => (
        <article className="review-card" key={r.id}>
          <header>
            <Stars rating={r.rating} />
            {r.date && <time dateTime={r.date}>{reviewDate(r.date, lang)}</time>}
          </header>
          {r.title && <h3>{r.title}</h3>}
          <p>{r.body}</p>
          {r.photos && r.photos.length > 0 && (
            <div className="review-photos">{r.photos.map((src) => <img key={src} src={src} alt="" loading="lazy" />)}</div>
          )}
          <footer>
            <span className="review-author">{r.author}</span>
            {r.source !== "sample" && <span className="review-country">{r.country}</span>}
            {r.party && <span className="review-party">{D.reviewParty[r.party] ?? r.party}</span>}
            {r.source === "sample"
              ? <span className="review-sample-tag">{D.reviewSample}</span>
              : r.source === "venue"
              ? <span className="review-note-tag">{T.reviewVenueGuest}</span>
              : (r.verified || r.source !== "direct") && <span className="review-verified"><ShieldCheck size={12} /> {T.reviewVerified}</span>}
            {r.note && <span className="review-note-tag">{r.note}</span>}
          </footer>
        </article>
      ))}
      {shown < reviews.length && (
        <button type="button" className="review-more" onClick={() => setShown(reviews.length)}>{D.reviewsMore}</button>
      )}
    </div>
  );
}
