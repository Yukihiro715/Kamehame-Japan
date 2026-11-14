"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import styles from "./golf-review-carousel.module.css";

export interface GolfReviewSlide {
  id: string; author: string; date: string; rating: number; service: string;
  excerpt: string; language: string; href: string; photo?: string; translated: boolean;
}
const copy = {
  en: { heading: "Guest reviews", hint: "Swipe to explore", read: "Read full review", previous: "Previous review", next: "Next review", verified: "Verified booking", translated: "Translated from English" },
  ja: { heading: "お客様の口コミ", hint: "横にスワイプして見る", read: "口コミ全文を見る", previous: "前の口コミ", next: "次の口コミ", verified: "予約確認済み", translated: "英語からの翻訳" },
  es: { heading: "Opiniones de nuestros clientes", hint: "Desliza para ver más", read: "Leer opinión completa", previous: "Opinión anterior", next: "Siguiente opinión", verified: "Reserva verificada", translated: "Traducido del inglés" },
  fr: { heading: "Avis de nos clients", hint: "Faites glisser pour découvrir", read: "Lire l’avis complet", previous: "Avis précédent", next: "Avis suivant", verified: "Réservation vérifiée", translated: "Traduit de l’anglais" },
  "zh-tw": { heading: "旅客評價", hint: "左右滑動查看更多", read: "閱讀完整評價", previous: "上一則評價", next: "下一則評價", verified: "已驗證預訂", translated: "由英文翻譯" },
};
export function GolfReviewCarousel({ lang, slides }: { lang: Lang; slides: GolfReviewSlide[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const c = copy[lang];
  if (!slides.length) return null;
  const move = (index: number) => {
    const root = rail.current, card = root?.children[index] as HTMLElement | undefined;
    if (root && card) root.scrollTo({ left: card.offsetLeft - (root.children[0] as HTMLElement).offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return <section className={styles.section} aria-labelledby="golf-reviews-heading" aria-roledescription="carousel">
    <header className={styles.header}><div><h2 id="golf-reviews-heading">{c.heading}</h2><p>{c.hint}</p></div><div className={styles.controls}>
      <button type="button" aria-label={c.previous} disabled={active === 0} onClick={() => move(active - 1)}><ArrowLeft size={19} /></button>
      <span aria-live="polite">{active + 1} / {slides.length}</span>
      <button type="button" aria-label={c.next} disabled={active === slides.length - 1} onClick={() => move(active + 1)}><ArrowRight size={19} /></button>
    </div></header>
    <div className={styles.rail} ref={rail} onScroll={() => {
      const root = rail.current; if (!root) return;
      if (root.scrollLeft >= root.scrollWidth - root.clientWidth - 2) { setActive(slides.length - 1); return; }
      const first = (root.children[0] as HTMLElement).offsetLeft;
      let nearest = 0, distance = Infinity;
      Array.from(root.children).forEach((el, i) => { const d = Math.abs((el as HTMLElement).offsetLeft - first - root.scrollLeft); if (d < distance) { nearest = i; distance = d; } });
      setActive(nearest);
    }}>
      {slides.map((slide, i) => <article key={slide.id} className={styles.card} aria-label={`${i + 1} / ${slides.length}`}>
        <div className={styles.top}>{slide.photo && <img src={slide.photo} alt="" width={64} height={64} loading="lazy" />}<div><p className={styles.service}>{slide.service}</p><span className={styles.stars} aria-label={`${slide.rating} / 5`}>★★★★★</span></div></div>
        <blockquote lang={slide.language}>{slide.excerpt}</blockquote>
        <div className={styles.meta}><b>{slide.author}</b><span>{slide.date}</span><span><ShieldCheck size={13} />{c.verified}</span></div>
        <div className={styles.bottom}><a href={slide.href}>{c.read}<ArrowRight size={16} /></a>{slide.translated && <small>{c.translated}</small>}</div>
      </article>)}
    </div>
  </section>;
}
