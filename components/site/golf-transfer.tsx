import { CarFront, Languages, UserRound } from "lucide-react";
import type { VariantPageCopy } from "@/lib/catalog";

import type { Lang } from "@/lib/i18n";

const arrivalCaption: Record<Lang, string> = {
  en: "Snow on Mt. Fuji, seen from the clubhouse when our guests arrived on November 10, 2026.",
  ja: "2026年11月10日、お客様が送迎先のクラブハウスに到着したときに見えた、雪化粧の富士山。",
  es: "El monte Fuji nevado, visto desde la casa club cuando llegaron nuestros visitantes el 10 de noviembre de 2026.",
  fr: "Le mont Fuji enneigé, vu du club-house à l’arrivée de nos clients le 10 novembre 2026.",
  "zh-tw": "2026 年 11 月 10 日，客人搭車抵達會館時，看見了白雪覆頂的富士山。",
};

type Copy = VariantPageCopy["transfer"];
const POINT_ICONS = [CarFront, UserRound, Languages];

/** "Travel in Comfort, From Door to Door": the private car, the driver and the
 *  assistant as their own section — the photo large beside short text on wide
 *  screens, stacked on phones. The images carry their size so nothing shifts
 *  while they load, and load lazily since the section sits below the fold. */
export function GolfTransfer({ copy, lang }: { copy: Copy; lang: Lang }) {
  return (
    <section className="xp-section gt" id="transfer" aria-labelledby="gt-heading">
      <h2 id="gt-heading" className="gt-h">{copy.heading}</h2>
      <div className="gt-media">
        <img src={copy.photo.img} alt={copy.photo.alt} width={1600} height={900} loading="lazy" decoding="async" />
        {copy.photo2 && <img className="gt-photo2" src={copy.photo2.img} alt={copy.photo2.alt} width={800} height={600} loading="lazy" decoding="async" />}
      </div>
      <div className="gt-text">
        <p className="gt-lede">{copy.body}</p>
        <ul className="gt-points">
          {copy.points.map((pt, i) => {
            const Icon = POINT_ICONS[i % POINT_ICONS.length];
            return <li key={pt.title}><span className="gt-pt-icon" aria-hidden="true"><Icon size={18} /></span><div><b>{pt.title}</b><p>{pt.body}</p></div></li>;
          })}
        </ul>
        <p className="gt-note">{copy.note}</p>
      </div>
      <figure className="gt-arrival">
        <img src="/images/golf-nov10/arrival.webp" alt="" width={1280} height={960} loading="lazy" decoding="async" />
        <figcaption>{arrivalCaption[lang]}</figcaption>
      </figure>
    </section>
  );
}
