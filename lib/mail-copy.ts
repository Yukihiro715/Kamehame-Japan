// Copy for the automatic acknowledgement a visitor receives right after
// sending an enquiry. Plain text on purpose: it lands in every client, and
// it reads as a person's note rather than a marketing template.

import type { Lang } from "@/lib/i18n";
import type { Enquiry } from "@/lib/contact";

interface AckCopy {
  subject: string;
  subjectTrade: string;
  hello: (name: string) => string;
  thanks: (experience?: string) => string;
  thanksTrade: string;
  notYet: string;
  echoH: string;
  labels: { dates: string; party: string; company: string; country: string; message: string; plan: string; extras: string; estimate: string };
  addMore: string;
  sign: string;
}

const COPY: Record<Lang, AckCopy> = {
  en: {
    subject: "We've received your request — KAMEHAME JAPAN",
    subjectTrade: "We've received your enquiry — KAMEHAME JAPAN",
    hello: (n) => `Hello ${n},`,
    thanks: (x) => x
      ? `Thank you for your request about "${x}". A person will reply within 24 hours, Japan time.`
      : "Thank you for your message. A person will reply within 24 hours, Japan time.",
    thanksTrade: "Thank you for your enquiry. A person will reply within 24 hours, Japan time, with our trade conditions.",
    notYet: "This is not a booking confirmation yet. We first check the date with the host, then send you the price and the conditions. Nothing is charged until you have seen them and chosen to go ahead.",
    echoH: "What you sent us:",
    labels: { dates: "Dates", party: "Guests", company: "Company", country: "Country", message: "Notes", plan: "Plan", extras: "Extras", estimate: "Estimate" },
    addMore: "If you want to add anything, just reply to this email.",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  ja: {
    subject: "お問い合わせを受け付けました — KAMEHAME JAPAN",
    subjectTrade: "お問い合わせを受け付けました — KAMEHAME JAPAN",
    hello: (n) => `${n} 様`,
    thanks: (x) => x
      ? `「${x}」についてお問い合わせいただき、ありがとうございます。担当者が日本時間24時間以内にご返信します。`
      : "お問い合わせいただき、ありがとうございます。担当者が日本時間24時間以内にご返信します。",
    thanksTrade: "お問い合わせいただき、ありがとうございます。担当者が日本時間24時間以内に、取引条件をご案内します。",
    notYet: "この時点では予約は確定していません。まず受け入れ先に日程を確認し、料金と条件をお送りします。内容をご確認のうえお申込みいただくまで、お支払いは発生しません。",
    echoH: "お送りいただいた内容:",
    labels: { dates: "日程", party: "人数", company: "会社名", country: "国", message: "備考", plan: "プラン", extras: "オプション", estimate: "概算" },
    addMore: "追加でお伝えいただくことがあれば、このメールにそのまま返信してください。",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  es: {
    subject: "Hemos recibido su solicitud — KAMEHAME JAPAN",
    subjectTrade: "Hemos recibido su consulta — KAMEHAME JAPAN",
    hello: (n) => `Hola ${n}:`,
    thanks: (x) => x
      ? `Gracias por su solicitud sobre «${x}». Una persona le responderá en un plazo de 24 horas, hora de Japón.`
      : "Gracias por su mensaje. Una persona le responderá en un plazo de 24 horas, hora de Japón.",
    thanksTrade: "Gracias por su consulta. Una persona le responderá en un plazo de 24 horas, hora de Japón, con nuestras condiciones para agencias.",
    notYet: "Esto no es todavía una confirmación de reserva. Primero comprobamos la fecha con el anfitrión y después le enviamos el precio y las condiciones. No se cobra nada hasta que las haya visto y decida seguir adelante.",
    echoH: "Lo que nos ha enviado:",
    labels: { dates: "Fechas", party: "Personas", company: "Empresa", country: "País", message: "Notas", plan: "Plan", extras: "Extras", estimate: "Estimación" },
    addMore: "Si quiere añadir algo, responda simplemente a este correo.",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  fr: {
    subject: "Nous avons bien reçu votre demande — KAMEHAME JAPAN",
    subjectTrade: "Nous avons bien reçu votre demande — KAMEHAME JAPAN",
    hello: (n) => `Bonjour ${n},`,
    thanks: (x) => x
      ? `Merci pour votre demande concernant « ${x} ». Une personne vous répondra sous 24 heures, heure du Japon.`
      : "Merci pour votre message. Une personne vous répondra sous 24 heures, heure du Japon.",
    thanksTrade: "Merci pour votre demande. Une personne vous répondra sous 24 heures, heure du Japon, avec nos conditions professionnelles.",
    notYet: "Ce n'est pas encore une confirmation de réservation. Nous vérifions d'abord la date auprès de l'hôte, puis nous vous envoyons le prix et les conditions. Rien n'est débité avant que vous les ayez vus et décidé de poursuivre.",
    echoH: "Ce que vous nous avez envoyé :",
    labels: { dates: "Dates", party: "Personnes", company: "Société", country: "Pays", message: "Remarques", plan: "Formule", extras: "Options", estimate: "Estimation" },
    addMore: "Pour ajouter quelque chose, répondez simplement à cet e-mail.",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  "zh-tw": {
    subject: "已收到您的詢問 — KAMEHAME JAPAN",
    subjectTrade: "已收到您的詢問 — KAMEHAME JAPAN",
    hello: (n) => `${n} 您好：`,
    thanks: (x) => x
      ? `感謝您對「${x}」的詢問。我們的同仁將於日本時間 24 小時內回覆。`
      : "感謝您的來信。我們的同仁將於日本時間 24 小時內回覆。",
    thanksTrade: "感謝您的詢問。我們的同仁將於日本時間 24 小時內回覆並提供業者合作條件。",
    notYet: "目前尚未成立預約。我們會先向店家確認日期，再將價格與條件寄給您；在您確認並決定進行之前，不會產生任何費用。",
    echoH: "您送出的內容：",
    labels: { dates: "日期", party: "人數", company: "公司", country: "國家", message: "備註", plan: "方案", extras: "加購", estimate: "預估" },
    addMore: "若需補充，直接回覆此郵件即可。",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
};

const isLang = (l: string): l is Lang => l in COPY;

/** Subject and plain-text body of the acknowledgement, in the visitor's language. */
export function acknowledgement(e: Enquiry, experienceTitle?: string): { subject: string; text: string } {
  const c = COPY[isLang(e.lang) ? e.lang : "en"];
  const trade = e.kind === "trade";
  const echo = [
    e.company && `${c.labels.company}: ${e.company}`,
    e.country && `${c.labels.country}: ${e.country}`,
    e.plan && `${c.labels.plan}: ${e.plan}`,
    e.dates && `${c.labels.dates}: ${e.dates}`,
    e.party && `${c.labels.party}: ${e.party}`,
    e.addons && `${c.labels.extras}: ${e.addons}`,
    e.estimate && `${c.labels.estimate}: ${e.estimate}`,
    e.message && `${c.labels.message}: ${e.message}`,
  ].filter((l): l is string => typeof l === "string");
  const text = [
    c.hello(e.name),
    "",
    trade ? c.thanksTrade : c.thanks(experienceTitle),
    "",
    ...(trade ? [] : [c.notYet, ""]),
    ...(echo.length ? [c.echoH, ...echo.map((l) => `  ${l}`), ""] : []),
    c.addMore,
    "",
    "--",
    c.sign,
  ].join("\n");
  return { subject: trade ? c.subjectTrade : c.subject, text };
}
