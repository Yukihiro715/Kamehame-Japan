import { ShieldCheck } from "lucide-react";
import { Stars, RatingSummary } from "@/components/site/reviews";
import { ownReviewsFor, reviewDate } from "@/lib/published-reviews";
import { golfReviewTranslationFor } from "@/lib/review-translations";
import { t, type Lang } from "@/lib/i18n";
import { enquiryTotal, yen } from "@/lib/golfpaq";
import styles from "./golf-guest-review.module.css";

const copy = {
  en: { title: "Shared bus golf tour reviews", trip: "Shared bus tour from Shinjuku · Tochigi", course: "Taiheiyo Club Mashiko PGA Course", original: "View original in English", translated: "Translated from English" },
  ja: { title: "乗合バスゴルフツアーの口コミ", trip: "新宿発着の乗合バスツアー・栃木", course: "太平洋クラブ益子PGAコース", original: "英語の原文を見る", translated: "英語からの翻訳" },
  es: { title: "Opiniones de los tours de golf en autobús compartido", trip: "Tour en autobús compartido desde Shinjuku · Tochigi", course: "Taiheiyo Club Mashiko PGA Course", original: "Ver original en inglés", translated: "Traducido del inglés" },
  fr: { title: "Avis sur les excursions de golf en bus partagé", trip: "Excursion en bus partagé au départ de Shinjuku · Tochigi", course: "Taiheiyo Club Mashiko PGA Course", original: "Voir l’original en anglais", translated: "Traduit de l’anglais" },
  "zh-tw": { title: "高爾夫共乘巴士行程評價", trip: "新宿出發的共乘巴士行程・栃木", course: "太平洋俱樂部益子PGA球場", original: "查看英文原文", translated: "由英文翻譯" },
} satisfies Record<Lang, { title: string; trip: string; course: string; original: string; translated: string }>;

const rentalExample = {
  en: (base: string, total: string) => `Current price example for one golfer with rental clubs and shoes: ${base} tour fare, ${total} total. Lunch depends on the departure.`,
  ja: (base: string, total: string) => `現在の料金例（1名、クラブ・シューズのレンタル付き）は、ツアー代${base}、合計${total}です。昼食の有無は出発便によって異なります。`,
  es: (base: string, total: string) => `Ejemplo de precio actual para una persona con palos y zapatos de alquiler: ${base} por el tour, ${total} en total. El almuerzo depende de la salida.`,
  fr: (base: string, total: string) => `Exemple de prix actuel pour une personne avec location des clubs et chaussures : ${base} pour le circuit, ${total} au total. Le déjeuner dépend du départ.`,
  "zh-tw": (base: string, total: string) => `目前一人租借球桿及球鞋的價格範例為行程費 ${base}、合計 ${total}。午餐是否包含依出發班次而定。`,
} satisfies Record<Lang, (base: string, total: string) => string>;

export function BusGuestReview({ lang, tourFare }: { lang: Lang; tourFare: number | null }) {
  const reviews = ownReviewsFor("golf-bus");
  if (!reviews.length) return null;
  const c = copy[lang];
  return (
    <section className={`xp-section ${styles.feature}`} id="reviews" aria-labelledby="bus-reviews-title">
      <h2 id="bus-reviews-title">{c.title}</h2>
      <RatingSummary experience="golf-bus" lang={lang} />
      {reviews.map((review) => {
        const translation = golfReviewTranslationFor(review, lang);
        const paragraphs = (translation?.body ?? review.body).split("\n\n");
        return (
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
            {translation && <p className={styles.original}>{c.translated}</p>}
            <blockquote lang={translation ? lang : "en"}>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</blockquote>
            {translation && <details className={styles.originalDetails}>
              <summary>{c.original}</summary>
              <blockquote lang="en">{review.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</blockquote>
            </details>}
          </article>
        );
      })}
      {tourFare !== null && <p>{rentalExample[lang](yen(tourFare), yen(enquiryTotal(tourFare, 1, 1, 1).total))}</p>}
    </section>
  );
}
