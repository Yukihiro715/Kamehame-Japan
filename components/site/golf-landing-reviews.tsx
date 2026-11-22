import { ownReviewsFor, reviewDate, type Review } from "@/lib/published-reviews";
import { SITE_GOLF_REVIEW_ID } from "@/lib/site-reviewed-golf";
import { verifiedPrivateGolfReviews } from "@/lib/site-golf-reviews-context";
import { golfReviewTranslationFor } from "@/lib/review-translations";
import type { Lang } from "@/lib/i18n";
import { GolfReviewCarousel, type GolfReviewSlide } from "./golf-review-carousel";
const services = {
  en: ["Golf course booking service", "Shared bus golf tour · Tochigi"],
  ja: ["ゴルフ場予約手配サービス", "乗合バスゴルフツアー・栃木"],
  es: ["Servicio de reserva de campos de golf", "Tour de golf en autobús compartido · Tochigi"],
  fr: ["Service de réservation de parcours de golf", "Golf en bus partagé · Tochigi"],
  "zh-tw": ["高爾夫球場預訂服務", "高爾夫共乘巴士行程・栃木"],
};
export function golfLandingSlides(lang: Lang, privateReviews: Review[]): GolfReviewSlide[] {
  return [privateReviews, ownReviewsFor("golf-bus")].flatMap((reviews, group) => reviews.map(review => {
    const translation = golfReviewTranslationFor(review, lang);
    const originalExcerpt = review.id === "tyler-takane-2026-11" ? "the booking process was quick, easy, informative, and they got me on an awesome course!" : review.id === SITE_GOLF_REVIEW_ID ? review.body.split("\n\n")[0] : review.body;
    return { id:review.id, author:review.author, date:review.date ? reviewDate(review.date,lang) : "", rating:review.rating, service:services[lang][group], excerpt:translation?.excerpt ?? originalExcerpt, language:translation ? lang : "en", translated:!!translation, photo:review.photos?.[0]?.replace(/\.webp$/, "-600.webp"), href:group === 0 ? `/${lang}/tokyo/mt-fuji-golf-day/#${review.id === SITE_GOLF_REVIEW_ID ? review.id : "reviews"}` : `/${lang}/golf-bus/#reviews` };
  }));
}

export async function GolfLandingReviews({ lang }: { lang: Lang }) {
  const slides = golfLandingSlides(lang, await verifiedPrivateGolfReviews());
  return <GolfReviewCarousel lang={lang} slides={slides} />;
}
