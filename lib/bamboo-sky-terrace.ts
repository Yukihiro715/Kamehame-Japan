import type { Lang } from "@/lib/i18n";

export const terraceName = "Bamboo Sky Terrace";
export const terraceSlug = "bamboo-sky-terrace";
export const terracePath = (lang: Lang) => `/${lang}/kyoto/${terraceSlug}/`;

export const terraceCopy = {
  en: {
    kyoto: "Kyoto",
    lead: "A private terrace in Arashiyama, Kyoto, for receptions, welcome gatherings and group breaks.",
    details: "Venue details",
    facts: [
      ["Capacity", "Up to 50 guests, depending on the layout."],
      ["Hours", "Available by arrangement between 10:00 and 18:00."],
      ["Venue hire", "Each event is quoted individually, with no minimum spend for venue hire. Food and drinks are quoted separately."],
    ],
    quote: "Enquire about a quote",
    prompt: "Tell us your preferred date, start time, length of use and number of guests. We’ll confirm availability and terms with your quote.",
  },
  ja: {
    kyoto: "京都",
    lead: "京都・嵐山の貸切テラス。レセプションや歓迎会、団体での休憩にご利用いただけます。",
    details: "会場のご案内",
    facts: [
      ["定員", "最大50名。レイアウトにより異なります。"],
      ["利用時間", "10:00〜18:00の範囲で調整します。"],
      ["会場利用料", "案件ごとの個別見積もりです。会場利用の最低保証額はありません。飲食は別途お見積もりします。"],
    ],
    quote: "お見積もりのご相談",
    prompt: "ご希望の利用日・開始時刻・利用時間・人数をお知らせください。空き状況と利用条件はお見積もり時にご案内します。",
  },
  es: {
    kyoto: "Kioto",
    lead: "Una terraza privada en Arashiyama, Kioto, para recepciones, encuentros de bienvenida y pausas en grupo.",
    details: "Información del espacio",
    facts: [
      ["Aforo", "Hasta 50 personas, según la distribución."],
      ["Horario", "Entre las 10:00 y las 18:00, previa consulta."],
      ["Alquiler", "El presupuesto se prepara para cada evento, sin gasto mínimo por el alquiler del espacio. La comida y las bebidas se presupuestan por separado."],
    ],
    quote: "Consulta de presupuesto",
    prompt: "Indícanos la fecha, la hora de inicio, la duración y el número de asistentes. Te confirmaremos la disponibilidad y las condiciones con el presupuesto.",
  },
  fr: {
    kyoto: "Kyoto",
    lead: "Une terrasse privatisable à Arashiyama, à Kyoto, pour les réceptions, les accueils et les pauses en groupe.",
    details: "Informations sur le lieu",
    facts: [
      ["Capacité", "Jusqu’à 50 personnes, selon la disposition."],
      ["Horaires", "Créneau à convenir entre 10 h et 18 h."],
      ["Location", "Chaque événement fait l’objet d’un devis, sans montant minimum pour la location. La restauration et les boissons sont chiffrées séparément."],
    ],
    quote: "Demander un devis",
    prompt: "Indiquez la date, l’heure de début, la durée et le nombre de personnes. Nous préciserons les disponibilités et les conditions dans le devis.",
  },
  "zh-tw": {
    kyoto: "京都",
    lead: "位於京都嵐山的包場露臺，適合舉辦接待活動、迎賓聚會，或安排團體休息。",
    details: "場地資訊",
    facts: [
      ["容納人數", "最多 50 人，實際人數依場地配置而定。"],
      ["使用時間", "可在 10:00 至 18:00 之間協調時段。"],
      ["場地費用", "依活動個別報價，場地租用無最低消費門檻。餐飲另行報價。"],
    ],
    quote: "洽詢報價",
    prompt: "請提供希望使用的日期、開始時間、使用時長及人數。我們會在報價時確認可用時段與使用條件。",
  },
} satisfies Record<Lang, { kyoto: string; lead: string; details: string; facts: [string, string][]; quote: string; prompt: string }>;
