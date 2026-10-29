import { ArrowUpRight, FileText } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import styles from "./golf-guide-sample.module.css";

const copy = {
  en: {
    eyebrow: "YOUR PERSONAL GOLF GUIDE",
    title: "Your golf day, clearly planned.",
    body: "Getting to the course, your schedule, rental equipment and what to pay on the day — your booking comes with a guide tailored to your arrangements.",
    pages: ["Your day at a glance", "Step-by-step directions", "Costs & essentials"],
    button: "View the sample guide",
    meta: "English PDF · 3 pages · opens in a new tab",
    note: "An anonymised example based on a real booking. Prices and times are illustrative, not a current offer or travel timetable. Cover artwork is an illustration.",
    alt: "Preview of sample golf guide page",
  },
  ja: {
    eyebrow: "ご予約後に届く専用ガイド",
    title: "当日の流れがわかる、あなたのゴルフガイド。",
    body: "コースへの行き方、当日のスケジュール、レンタル用品、現地でのお支払いまで。ご予約内容に合わせたガイドをお送りします。",
    pages: ["当日の概要", "詳しいアクセス案内", "費用と持ち物"],
    button: "ガイドのサンプルを見る",
    meta: "英語PDF・全3ページ・別タブで開きます",
    note: "実際の手配をもとに個人情報を削除したサンプルです。料金・時刻は参考例で、現在の販売条件や運行時刻ではありません。表紙はイラストです。",
    alt: "ゴルフガイドのサンプルページ",
  },
  es: {
    eyebrow: "SU GUÍA PERSONAL DE GOLF",
    title: "Su día de golf, bien organizado.",
    body: "Cómo llegar al campo, el horario, el equipo de alquiler y los pagos del día: su reserva incluye una guía adaptada a los servicios confirmados.",
    pages: ["Su día de un vistazo", "Cómo llegar, paso a paso", "Costes y preparativos"],
    button: "Ver la guía de ejemplo",
    meta: "PDF en inglés · 3 páginas · se abre en otra pestaña",
    note: "Ejemplo anonimizado basado en una reserva real. Los precios y horarios son ilustrativos; no constituyen una oferta vigente ni un horario de transporte actual. La portada es una ilustración.",
    alt: "Vista previa de una página de la guía de golf",
  },
  fr: {
    eyebrow: "VOTRE GUIDE DE GOLF PERSONNALISÉ",
    title: "Votre journée de golf, bien préparée.",
    body: "L’accès au parcours, le programme, le matériel de location et les frais à régler sur place : votre réservation comprend un guide adapté aux prestations confirmées.",
    pages: ["Votre journée en un coup d’œil", "Votre trajet, étape par étape", "Budget et préparatifs"],
    button: "Voir le guide d’exemple",
    meta: "PDF en anglais · 3 pages · nouvel onglet",
    note: "Exemple anonymisé tiré d’une réservation réelle. Les tarifs et horaires sont indicatifs et ne constituent ni une offre actuelle ni des horaires de transport à jour. La couverture est une illustration.",
    alt: "Aperçu d’une page du guide de golf",
  },
  "zh-tw": {
    eyebrow: "預訂後的專屬高爾夫指南",
    title: "讓您的高爾夫行程，一目了然。",
    body: "從球場交通、當日流程、租借球具到現場付款，我們會依照您的預訂安排提供專屬指南。",
    pages: ["當日行程概覽", "詳細交通指引", "費用與行前準備"],
    button: "查看指南範例",
    meta: "英文PDF・共3頁・於新分頁開啟",
    note: "此範例根據實際預訂製作，已移除個人資料。價格及時間僅供示意，並非目前報價或最新交通時刻。封面為插畫。",
    alt: "高爾夫指南範例頁面預覽",
  },
} satisfies Record<Lang, { eyebrow: string; title: string; body: string; pages: string[]; button: string; meta: string; note: string; alt: string }>;

const pdf = "/guides/kamehame-golf-day-sample.pdf";

export function GolfGuideSample({ lang }: { lang: Lang }) {
  const c = copy[lang];
  return (
    <section className={`xp-section ${styles.section}`} id="sample-guide" aria-labelledby="sample-guide-title">
      <div className={styles.intro}>
        <span className={styles.eyebrow}>{c.eyebrow}</span>
        <h2 id="sample-guide-title">{c.title}</h2>
        <p>{c.body}</p>
      </div>
      <div className={styles.pages}>
        {c.pages.map((label, i) => (
          <a key={label} className={styles.page} href={`${pdf}#page=${i + 1}`} target="_blank" rel="noopener noreferrer" aria-label={`${label} — ${c.meta}`}>
            <img src={`/images/golf-guide/sample-page-${i + 1}.webp`} width={540} height={760} alt={`${c.alt} ${i + 1}`} loading="lazy" decoding="async" />
            <span><small>0{i + 1}</small>{label}<ArrowUpRight size={15} aria-hidden="true" /></span>
          </a>
        ))}
      </div>
      <div className={styles.action}>
        <a className={styles.button} href={pdf} target="_blank" rel="noopener noreferrer"><FileText size={18} aria-hidden="true" />{c.button}<ArrowUpRight size={17} aria-hidden="true" /></a>
        <p className={styles.meta}>{c.meta}</p>
      </div>
      <p className={styles.note}>{c.note}</p>
    </section>
  );
}
