import { cancellationFor, isLive, isPreview, SITE_ORIGIN, type Experience } from "@/lib/catalog";
import { type Lang, t } from "@/lib/i18n";
import { listPrice, pricingFor, yen } from "@/lib/pricing";
import type { Aggregate } from "@/lib/reviews";
import { productJsonLd } from "@/lib/seo";

export const FACT_COPY = {
  en: { heading: "Before you book", area: "Location", duration: "Duration", group: "Group size", ages: "Age requirements", language: "Language support", price: "Starting price", included: "Included", excluded: "Additional costs / not included", cancellation: "Cancellation", cutoff: "Booking deadline" },
  ja: { heading: "予約前に確認したい基本情報", area: "開催エリア", duration: "所要時間", group: "参加人数", ages: "対象年齢", language: "対応言語", price: "基本料金", included: "含まれるもの", excluded: "別料金・含まれないもの", cancellation: "キャンセル条件", cutoff: "予約受付期限" },
  es: { heading: "Antes de reservar", area: "Ubicación", duration: "Duración", group: "Tamaño del grupo", ages: "Edad", language: "Asistencia lingüística", price: "Precio desde", included: "Incluido", excluded: "Costes adicionales / no incluido", cancellation: "Cancelación", cutoff: "Plazo de reserva" },
  fr: { heading: "Avant de réserver", area: "Lieu", duration: "Durée", group: "Taille du groupe", ages: "Âge", language: "Accompagnement linguistique", price: "Tarif à partir de", included: "Inclus", excluded: "Frais supplémentaires / non inclus", cancellation: "Annulation", cutoff: "Date limite de réservation" },
  "zh-tw": { heading: "預訂前須知", area: "舉辦地區", duration: "所需時間", group: "參加人數", ages: "年齡限制", language: "語言支援", price: "起始價格", included: "包含項目", excluded: "額外費用／不包含項目", cancellation: "取消條件", cutoff: "預訂截止時間" },
} satisfies Record<Lang, Record<string, string>>;

/** The visible summary and machine-readable properties share catalog facts.
 * Never infer a private address, language, travel time or an inclusion. */
export function experienceFacts(exp: Experience, lang: Lang) {
  const C = FACT_COPY[lang], T = t(lang), D = T.detail;
  const price = listPrice(exp, lang);
  const priceText = exp.consultationOnly ? D.consultOnlyPrice
    : exp.pricePending || exp.bookingPaused ? exp.bookingNotice ?? exp.price
    : `${price.price} ${price.unit === "group" ? T.perGroupShort : T.perPerson}${price.note ? ` · ${price.note}` : ""}`;
  const facts = [
    { name: C.area, value: exp.area }, { name: C.duration, value: exp.duration },
    { name: C.group, value: exp.group }, { name: C.ages, value: exp.ages },
    ...(exp.langTag ? [{ name: C.language, value: exp.langTag }] : exp.interpreter === false ? [] : [{ name: C.language, value: T.interpreterGuide }]),
    { name: C.price, value: priceText },
    ...(exp.included?.length ? [{ name: C.included, value: exp.included.join(" · ") }] : exp.includedShort ? [{ name: C.included, value: exp.includedShort }] : []),
    ...(exp.notIncluded?.length ? [{ name: C.excluded, value: exp.notIncluded.join(" · ") }] : []),
    ...(exp.availability ? [{ name: C.cutoff, value: exp.availability.cutoffHours ? D.availCutoffHours(exp.availability.cutoffHours) : D.availCutoff(exp.availability.cutoffDays, exp.availability.cutoffTime) }] : []),
    { name: C.cancellation, value: exp.cancellation ?? cancellationFor(lang) },
  ];
  return facts.filter(f => f.value);
}

export function faqJsonLd(faq: { q: string; a: string }[], url: string, lang: Lang) {
  return { "@context": "https://schema.org", "@type": "FAQPage", "@id": `${SITE_ORIGIN}${url}#faq`, inLanguage: lang,
    mainEntity: faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

export function experienceJsonLd(exp: Experience, lang: Lang, faq: { q: string; a: string }[] = [], aggregate?: Aggregate | null) {
  if (isPreview(exp)) return null;
  const url = `/${lang}/${exp.city}/${exp.slug}/`;
  const priced = isLive(exp) && !exp.consultationOnly && !exp.pricePending && !exp.bookingPaused;
  const pricing = pricingFor(exp, lang);
  const amounts = exp.variants?.flatMap(v => v.tiers.map(t => t.total));
  const first = pricing.rows[0];
  const amount = amounts?.length ? Math.min(...amounts) : exp.priceUnit === "group" ? first?.total : Number(exp.price.replace(/[^\d]/g, ""));
  const product = productJsonLd(exp.title, exp.metaDescription ?? exp.tagline, exp.img, url, yen(amount || 0), exp.slug, undefined, undefined, aggregate);
  const unit = exp.priceUnit === "group" ? `${t(lang).perGroupShort} · ${t(lang).detail.estimateFor(exp.partySize?.min ?? first?.party ?? 1)}` : t(lang).perPerson;
  // Booking requests are open, with availability confirmed for the requested date.
  const availability = "https://schema.org/LimitedAvailability";
  const offer = (price: number, name?: string) => ({ "@type": "Offer", url: `${SITE_ORIGIN}${url}`, priceCurrency: "JPY", price, availability, ...(name ? { name } : {}),
    seller: { "@id": `${SITE_ORIGIN}/#organization` },
    priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "JPY", unitText: unit, ...(exp.taxIncluded ? { valueAddedTaxIncluded: true } : {}) },
  });
  const variantOffers = exp.variants?.flatMap(v => v.tiers.map(tier => ({ ...offer(tier.total, `${v.title} · ${t(lang).detail.estimateFor(tier.party)}`), priceSpecification: { ...offer(tier.total).priceSpecification, unitText: `${t(lang).perGroupShort} · ${t(lang).detail.estimateFor(tier.party)}` } })));
  const entity = {
    ...(priced ? product : {}),
    "@type": priced ? ["Product", "Service"] : "Service",
    "@id": `${SITE_ORIGIN}${url}#experience`, name: exp.title,
    description: exp.metaDescription ?? exp.tagline, url: `${SITE_ORIGIN}${url}`,
    image: new URL(exp.img, SITE_ORIGIN).href,
    provider: { "@id": `${SITE_ORIGIN}/#organization` },
    areaServed: { "@type": "Place", name: exp.area },
    additionalProperty: experienceFacts(exp, lang).map(f => ({ "@type": "PropertyValue", name: f.name, value: f.value })),
    ...(priced && amount > 0 ? { offers: variantOffers?.length ? {
      "@type": "AggregateOffer", url: `${SITE_ORIGIN}${url}`, priceCurrency: "JPY", availability,
      lowPrice: String(Math.min(...variantOffers.map(o => o.price))), highPrice: String(Math.max(...variantOffers.map(o => o.price))), offerCount: variantOffers.length, offers: variantOffers,
    } : offer(amount) } : {}),
  };
  return { "@context": "https://schema.org", "@graph": [
    entity,
    { "@type": "WebPage", "@id": `${SITE_ORIGIN}${url}#webpage`, url: `${SITE_ORIGIN}${url}`, name: exp.title, inLanguage: lang, mainEntity: { "@id": entity["@id"] }, isPartOf: { "@id": `${SITE_ORIGIN}/#website` } },
    ...(faq.length ? [faqJsonLd(faq, url, lang)] : []),
  ] };
}
