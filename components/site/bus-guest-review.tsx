import { ShieldCheck } from "lucide-react";
import { Stars, RatingSummary } from "@/components/site/reviews";
import { ownReviewsFor, reviewDate } from "@/lib/published-reviews";
import { t, type Lang } from "@/lib/i18n";
import styles from "./golf-guest-review.module.css";

const copy = {
  en: { title: "Shared bus golf tour reviews", trip: "Shared bus tour from Shinjuku · Tochigi", course: "Taiheiyo Club Mashiko PGA Course" },
  ja: { title: "乗合バスゴルフツアーの口コミ", trip: "新宿発着の乗合バスツアー・栃木", course: "太平洋クラブ益子PGAコース" },
  es: { title: "Opiniones de los tours de golf en autobús compartido", trip: "Tour en autobús compartido desde Shinjuku · Tochigi", course: "Taiheiyo Club Mashiko PGA Course" },
  fr: { title: "Avis sur les excursions de golf en bus partagé", trip: "Excursion en bus partagé au départ de Shinjuku · Tochigi", course: "Taiheiyo Club Mashiko PGA Course" },
  "zh-tw": { title: "高爾夫共乘巴士行程評價", trip: "新宿出發的共乘巴士行程・栃木", course: "太平洋俱樂部益子PGA球場" },
} satisfies Record<Lang, { title: string; trip: string; course: string }>;

export function BusGuestReview({ lang }: { lang: Lang }) {
  const reviews = ownReviewsFor("golf-bus");
  if (!reviews.length) return null;
  const c = copy[lang];
  return (
    <section className={`xp-section ${styles.feature}`} id="reviews" aria-labelledby="bus-reviews-title">
      <h2 id="bus-reviews-title">{c.title}</h2>
      <RatingSummary experience="golf-bus" lang={lang} />
      {reviews.map((review) => (
        <article className={styles.story} key={review.id}>
          <header className={styles.storyHeader}>
            <Stars rating={review.rating} size={17} />
            <div className={styles.meta}>
              <b>{review.author}</b>
              {review.date && <time dateTime={review.date}>{reviewDate(review.date, lang)}</time>}
              <span className={styles.verified}><ShieldCheck size={14} aria-hidden="true" />{t(lang).reviewVerified}</span>
            </div>
            {review.id === "neil-golf-2026-11" && <p className={styles.meta}>{c.trip} · {c.course}</p>}
          </header>
          <blockquote lang="en">{review.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</blockquote>
        </article>
      ))}
    </section>
  );
}
