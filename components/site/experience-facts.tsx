import { type Experience } from "@/lib/catalog";
import { type Lang } from "@/lib/i18n";
import { experienceFacts, FACT_COPY } from "@/lib/experience-seo";
import styles from "./experience-facts.module.css";

export function ExperienceFacts({ exp, lang }: { exp: Experience; lang: Lang }) {
  return <BookingFacts facts={experienceFacts(exp, lang)} lang={lang} />;
}

export function BookingFacts({ facts, lang }: { facts: { name: string; value: string }[]; lang: Lang }) {
  return <section className={`xp-section ${styles.facts}`} id="booking-facts" aria-labelledby="booking-facts-heading">
    <h2 id="booking-facts-heading">{FACT_COPY[lang].heading}</h2>
    <dl>{facts.map(f => <div key={f.name}><dt>{f.name}</dt><dd>{f.value}</dd></div>)}</dl>
  </section>;
}
