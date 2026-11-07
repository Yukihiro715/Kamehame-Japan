import { ArrowRight, ShieldCheck } from "lucide-react";
import { Stars } from "@/components/site/reviews";
import { reviewDate, reviewsFor } from "@/lib/published-reviews";
import { t, type Lang } from "@/lib/i18n";
import styles from "./golf-guest-review.module.css";

const copy = {
  en: { eyebrow: "BOOKED WITH KAMEHAME JAPAN", title: "A golf day worth sharing", read: "Read Tyler’s review", full: "Read full review", original: "Original review in English", photos: "Photos shared by Tyler · Takane Country Club, Saitama", swipe: "Swipe to see all 3 photos · Tap to enlarge", service: "Golf course booking service", partner: "Reviews from our golf partner’s guests", own: "1 review from a verified KAMEHAME booking", alts: ["Three guests smiling together on the course at Takane Country Club", "A guest preparing a tee shot at Takane Country Club", "A tree-lined fairway at Takane Country Club"] },
  ja: { eyebrow: "KAMEHAME JAPANでご予約のお客様", title: "お客様の写真と、ゴルフ体験の声", read: "Tylerさんの口コミを見る", full: "口コミを全文読む", original: "英語の原文を掲載", photos: "Tylerさん提供の写真 · 高根カントリークラブ（埼玉）", swipe: "スワイプで全3枚表示・タップで拡大", service: "ゴルフ場予約手配サービス", partner: "ゴルフ提携先のお客様の口コミ", own: "KAMEHAME予約確認済みの口コミ1件", alts: ["高根カントリークラブで笑顔を見せる3人のお客様", "高根カントリークラブでティーショットを構えるお客様", "高根カントリークラブの木々に囲まれたフェアウェイ"] },
  es: { eyebrow: "RESERVADO CON KAMEHAME JAPAN", title: "Un día de golf para recordar", read: "Leer la opinión de Tyler", full: "Leer la opinión completa", original: "Opinión original en inglés", photos: "Fotos de Tyler · Takane Country Club, Saitama", swipe: "Desliza para ver las 3 fotos · Toca para ampliar", service: "Servicio de reserva de campos de golf", partner: "Opiniones de clientes de nuestro colaborador de golf", own: "1 opinión de una reserva verificada de KAMEHAME", alts: ["Tres visitantes sonriendo en Takane Country Club", "Una visitante preparando su golpe de salida en Takane Country Club", "Una calle rodeada de árboles en Takane Country Club"] },
  fr: { eyebrow: "RÉSERVÉ AVEC KAMEHAME JAPAN", title: "Une journée de golf à partager", read: "Lire l’avis de Tyler", full: "Lire l’avis complet", original: "Avis original en anglais", photos: "Photos de Tyler · Takane Country Club, Saitama", swipe: "Faites défiler les 3 photos · Touchez pour agrandir", service: "Service de réservation de parcours de golf", partner: "Avis des clients de notre partenaire golf", own: "1 avis d’une réservation KAMEHAME vérifiée", alts: ["Trois visiteurs souriants au Takane Country Club", "Une visiteuse préparant son départ au Takane Country Club", "Un fairway bordé d’arbres au Takane Country Club"] },
  "zh-tw": { eyebrow: "透過KAMEHAME JAPAN預訂的旅客", title: "值得分享的高爾夫體驗", read: "閱讀Tyler的評價", full: "閱讀完整評價", original: "英文原文評價", photos: "Tyler提供的照片 · 高根鄉村俱樂部（埼玉）", swipe: "左右滑動查看3張照片・點擊放大", service: "高爾夫球場預訂服務", partner: "高爾夫合作夥伴的旅客評價", own: "1則KAMEHAME已驗證預訂評價", alts: ["三位旅客在高根鄉村俱樂部開心合照", "旅客在高根鄉村俱樂部準備開球", "高根鄉村俱樂部綠樹環繞的球道"] },
} satisfies Record<Lang, { eyebrow: string; title: string; read: string; full: string; original: string; photos: string; swipe: string; service: string; partner: string; own: string; alts: string[] }>;

export const golfPartnerReviewsHeading = (lang: Lang) => copy[lang].partner;
const guestReview = () => reviewsFor("mt-fuji-golf-day").find((r) => r.id === "tyler-takane-2026-11" && r.source === "direct" && r.verified);
const excerpt = "the booking process was quick, easy, informative, and they got me on an awesome course!";
const smallPhoto = (src: string) => src.replace(/\.webp$/, "-600.webp");

/** On the golf landing this explicitly describes the booking service, not a bus tour. */
export function GolfGuestQuote({ lang, landing = false }: { lang: Lang; landing?: boolean }) {
  const review = guestReview();
  if (!review) return null;
  const c = copy[lang];
  const href = landing ? `/${lang}/tokyo/mt-fuji-golf-day/#reviews` : "#reviews";
  return (
    <aside className={`${styles.quote} ${landing ? styles.landing : ""}`} aria-label={c.eyebrow}>
      {landing && review.photos?.[0] && <img className={styles.thumbnail} src={smallPhoto(review.photos[0])} width={120} height={160} alt={c.alts[0]} loading="lazy" />}
      <div>
        <p className={styles.eyebrow}>{landing ? c.service : c.eyebrow}</p>
        <Stars rating={review.rating} />
        <blockquote lang="en">“{excerpt}”</blockquote>
        <div className={styles.meta}><b>{review.author}</b><span>·</span><time dateTime={review.date}>{reviewDate(review.date!, lang)}</time><span className={styles.verified}><ShieldCheck size={13} aria-hidden="true" />{t(lang).reviewVerified}</span></div>
        <a className={styles.read} href={href}>{c.read}<ArrowRight size={14} aria-hidden="true" /></a>
      </div>
    </aside>
  );
}

export function GolfGuestReview({ lang, ctaLabel }: { lang: Lang; ctaLabel: string }) {
  const review = guestReview();
  if (!review) return null;
  const c = copy[lang];
  const [first, ...rest] = review.body.split("\n\n");
  return (
    <section className={`xp-section ${styles.feature}`} id="reviews" aria-labelledby="golf-guest-title">
      <p className={styles.eyebrow}>{c.eyebrow}</p>
      <h2 id="golf-guest-title">{c.title}</h2>
      <figure className={styles.figure}>
        <div className={styles.photos} role="group" aria-label={c.photos} tabIndex={0}>
          {review.photos?.map((src, i) => <a key={src} href={src} target="_blank" rel="noopener noreferrer" className={styles.photo}>
            <img src={src} srcSet={`${smallPhoto(src)} 600w, ${src} 1200w`} sizes={i === 0 ? "(max-width: 600px) 80vw, 400px" : "(max-width: 600px) 80vw, 220px"} width={1200} height={1600} alt={c.alts[i]} loading="lazy" decoding="async" />
            <span aria-hidden="true">{i + 1} / 3</span>
          </a>)}
        </div>
        <figcaption>{c.photos}<span className={styles.swipe}>{c.swipe}</span></figcaption>
      </figure>
      <article className={styles.story}>
        <header className={styles.storyHeader}>
          <div><Stars rating={review.rating} size={17} /><span className={styles.ownCount}>{c.own}</span></div>
          <div className={styles.meta}><b>{review.author}</b><span>·</span><time dateTime={review.date}>{reviewDate(review.date!, lang)}</time><span className={styles.verified}><ShieldCheck size={14} aria-hidden="true" />{t(lang).reviewVerified}</span></div>
        </header>
        {lang !== "en" && <p className={styles.original}>{c.original}</p>}
        <blockquote lang="en"><p>{first}</p></blockquote>
        <details className={styles.details}>
          <summary>{c.full}</summary>
          <blockquote lang="en">{rest.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</blockquote>
        </details>
      </article>
      <a className={styles.cta} href="#request-form">{ctaLabel}<ArrowRight size={16} aria-hidden="true" /></a>
    </section>
  );
}
