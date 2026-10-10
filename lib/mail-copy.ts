// Copy for the automatic acknowledgement a visitor receives right after
// sending an enquiry. Plain text on purpose: it lands in every client, and
// it reads as a person's note rather than a marketing template.

import type { Lang } from "@/lib/i18n";
import type { Enquiry } from "@/lib/contact";

interface AckCopy {
  /** One subject for the whole exchange — acknowledgement, the follow-up and
   *  the team's copy — so a reply from the mailbox lands in the visitor's
   *  existing thread without anyone retyping the subject. */
  subject: (experience?: string, dates?: string) => string;
  subjectTrade: string;
  /** The personal follow-up sent a little after the acknowledgement. */
  followUp: { intro: string; golf: (when: string) => string; other: (experience: string, when: string) => string; wait: string; reply: string; sign: string };
  hello: (name: string) => string;
  thanks: (experience?: string) => string;
  thanksTrade: string;
  notYet: string;
  echoH: string;
  labels: { dates: string; party: string; company: string; country: string; message: string; plan: string; extras: string; estimate: string; interpreter: string; area: string; course: string; courseRecommended: string; courseSpecific: string; level: string; rental: string; clubs: string; pickup: string; whatsapp: string };
  addMore: string;
  sign: string;
}

const COPY: Record<Lang, AckCopy> = {
  en: {
    subject: (x, d) => `Your request${x ? ` — ${x}` : ""}${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`,
    subjectTrade: "We've received your enquiry — KAMEHAME JAPAN",
    hello: (n) => `Hello ${n},`,
    thanks: (x) => x
      ? `Thank you for your request about "${x}". A person will reply within 24 hours, Japan time.`
      : "Thank you for your message. A person will reply within 24 hours, Japan time.",
    thanksTrade: "Thank you for your enquiry. A person will reply within 24 hours, Japan time, with our trade conditions.",
    notYet: "This is not a booking confirmation yet. We first check the date with the host, then send you the price and the conditions. Nothing is charged until you have seen them and chosen to go ahead.",
    echoH: "What you sent us:",
    labels: { dates: "Dates", party: "Guests", company: "Company", country: "Country", message: "Notes", plan: "Plan", extras: "Extras", estimate: "Estimate", interpreter: "Interpreter", area: "Golf area", course: "Course", courseRecommended: "Our recommended course (package price)", courseSpecific: "Specific course requested (quoted individually)", level: "Golf experience", rental: "Rental clubs", clubs: "Club preferences", pickup: "Pick-up", whatsapp: "WhatsApp" },
    followUp: {
      intro: "I'm Yukihiro, support staff at KAMEHAME JAPAN, and I'll be looking after your request from here.",
      golf: (when) => `I'm now arranging your golf course${when ? ` for ${when}` : ""}. Once the course and tee time are set, I'll send you the details together with the payment instructions.`,
      other: (x, when) => `I'm now checking the date with the host for "${x}"${when ? ` (${when})` : ""}. Once it's confirmed, I'll send you the details together with the payment instructions.`,
      wait: "The course is usually confirmed within 6 to 12 hours, though it can take up to about 24 hours. Thank you for your patience. I'll do my best to make it a day you'll remember.",
      reply: "If anything changes on your side, or a question comes up in the meantime, just reply to this email.",
      sign: "Best regards,\nYukihiro\nKAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com",
    },
    addMore: "If you want to add anything, just reply to this email.",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  ja: {
    subject: (x, d) => `お問い合わせ${x ? ` — ${x}` : ""}${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`,
    subjectTrade: "お問い合わせを受け付けました — KAMEHAME JAPAN",
    hello: (n) => `${n} 様`,
    thanks: (x) => x
      ? `「${x}」についてお問い合わせいただき、ありがとうございます。担当者が日本時間24時間以内にご返信します。`
      : "お問い合わせいただき、ありがとうございます。担当者が日本時間24時間以内にご返信します。",
    thanksTrade: "お問い合わせいただき、ありがとうございます。担当者が日本時間24時間以内に、取引条件をご案内します。",
    notYet: "この時点では予約は確定していません。まず受け入れ先に日程を確認し、料金と条件をお送りします。内容をご確認のうえお申込みいただくまで、お支払いは発生しません。",
    echoH: "お送りいただいた内容:",
    labels: { dates: "日程", party: "人数", company: "会社名", country: "国", message: "備考", plan: "プラン", extras: "オプション", estimate: "概算", interpreter: "通訳", area: "エリア", course: "コース", courseRecommended: "おすすめコース(標準料金)", courseSpecific: "希望コース指定(個別見積もり)", level: "ゴルフ経験", rental: "レンタルクラブ", clubs: "クラブのご希望", pickup: "お迎え場所", whatsapp: "WhatsApp" },
    followUp: {
      intro: "KAMEHAME JAPAN サポートスタッフのゆきひろと申します。このたびのご依頼を担当させていただきます。",
      golf: (when) => `現在、${when ? `${when}の` : ""}ゴルフ場を手配しております。コースとスタート時刻が決まり次第、ご案内とお支払い方法をお送りします。`,
      other: (x, when) => `現在、「${x}」${when ? `(${when})` : ""}の日程を受け入れ先に確認しております。確定次第、ご案内とお支払い方法をお送りします。`,
      wait: "コースは通常6〜12時間ほどで確定しますが、24時間程度かかる場合もあります。ご満足いただける一日になるよう精一杯手配いたしますので、今しばらくお待ちください。",
      reply: "ご予定の変更やご質問がありましたら、このメールにそのまま返信してください。",
      sign: "ゆきひろ\nKAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com",
    },
    addMore: "追加でお伝えいただくことがあれば、このメールにそのまま返信してください。",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  es: {
    subject: (x, d) => `Su solicitud${x ? ` — ${x}` : ""}${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`,
    subjectTrade: "Hemos recibido su consulta — KAMEHAME JAPAN",
    hello: (n) => `Hola ${n}:`,
    thanks: (x) => x
      ? `Gracias por su solicitud sobre «${x}». Una persona le responderá en un plazo de 24 horas, hora de Japón.`
      : "Gracias por su mensaje. Una persona le responderá en un plazo de 24 horas, hora de Japón.",
    thanksTrade: "Gracias por su consulta. Una persona le responderá en un plazo de 24 horas, hora de Japón, con nuestras condiciones para agencias.",
    notYet: "Esto no es todavía una confirmación de reserva. Primero comprobamos la fecha con el anfitrión y después le enviamos el precio y las condiciones. No se cobra nada hasta que las haya visto y decida seguir adelante.",
    echoH: "Lo que nos ha enviado:",
    labels: { dates: "Fechas", party: "Personas", company: "Empresa", country: "País", message: "Notas", plan: "Plan", extras: "Extras", estimate: "Estimación", interpreter: "Intérprete", area: "Zona de golf", course: "Campo", courseRecommended: "Campo recomendado por nosotros (precio del paquete)", courseSpecific: "Campo concreto solicitado (presupuesto individual)", level: "Nivel de golf", rental: "Palos de alquiler", clubs: "Preferencias de palos", pickup: "Recogida", whatsapp: "WhatsApp" },
    followUp: {
      intro: "Soy Yukihiro, del equipo de atención de KAMEHAME JAPAN, y me ocuparé de su solicitud a partir de ahora.",
      golf: (when) => `Estoy organizando su campo de golf${when ? ` para el ${when}` : ""}. En cuanto el campo y la hora de salida estén fijados, le enviaré los detalles junto con las instrucciones de pago.`,
      other: (x, when) => `Estoy confirmando la fecha con el anfitrión para «${x}»${when ? ` (${when})` : ""}. En cuanto esté confirmada, le enviaré los detalles junto con las instrucciones de pago.`,
      wait: "El campo suele confirmarse en un plazo de 6 a 12 horas, aunque puede tardar hasta unas 24 horas. Gracias por su paciencia. Haré todo lo posible para que sea un día inolvidable.",
      reply: "Si algo cambia por su parte o le surge alguna duda, responda simplemente a este correo.",
      sign: "Un cordial saludo,\nYukihiro\nKAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com",
    },
    addMore: "Si quiere añadir algo, responda simplemente a este correo.",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  fr: {
    subject: (x, d) => `Votre demande${x ? ` — ${x}` : ""}${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`,
    subjectTrade: "Nous avons bien reçu votre demande — KAMEHAME JAPAN",
    hello: (n) => `Bonjour ${n},`,
    thanks: (x) => x
      ? `Merci pour votre demande concernant « ${x} ». Une personne vous répondra sous 24 heures, heure du Japon.`
      : "Merci pour votre message. Une personne vous répondra sous 24 heures, heure du Japon.",
    thanksTrade: "Merci pour votre demande. Une personne vous répondra sous 24 heures, heure du Japon, avec nos conditions professionnelles.",
    notYet: "Ce n'est pas encore une confirmation de réservation. Nous vérifions d'abord la date auprès de l'hôte, puis nous vous envoyons le prix et les conditions. Rien n'est débité avant que vous les ayez vus et décidé de poursuivre.",
    echoH: "Ce que vous nous avez envoyé :",
    labels: { dates: "Dates", party: "Personnes", company: "Société", country: "Pays", message: "Remarques", plan: "Formule", extras: "Options", estimate: "Estimation", interpreter: "Interprète", area: "Zone de golf", course: "Parcours", courseRecommended: "Parcours recommandé par nos soins (prix du forfait)", courseSpecific: "Parcours précis demandé (devis individuel)", level: "Niveau de golf", rental: "Clubs de location", clubs: "Préférences de clubs", pickup: "Prise en charge", whatsapp: "WhatsApp" },
    followUp: {
      intro: "Je suis Yukihiro, de l'équipe d'assistance de KAMEHAME JAPAN, et je m'occupe de votre demande à partir de maintenant.",
      golf: (when) => `Je réserve actuellement votre parcours de golf${when ? ` pour le ${when}` : ""}. Dès que le parcours et l'heure de départ seront fixés, je vous enverrai les détails ainsi que les instructions de paiement.`,
      other: (x, when) => `Je vérifie actuellement la date auprès de l'hôte pour « ${x} »${when ? ` (${when})` : ""}. Dès qu'elle sera confirmée, je vous enverrai les détails ainsi que les instructions de paiement.`,
      wait: "Le parcours est généralement confirmé sous 6 à 12 heures, mais cela peut prendre jusqu'à 24 heures environ. Merci de votre patience. Je ferai de mon mieux pour que cette journée soit mémorable.",
      reply: "Si quelque chose change de votre côté ou si vous avez une question entre-temps, répondez simplement à cet e-mail.",
      sign: "Bien cordialement,\nYukihiro\nKAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com",
    },
    addMore: "Pour ajouter quelque chose, répondez simplement à cet e-mail.",
    sign: "KAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com\nhttps://kamehame-japan.com/",
  },
  "zh-tw": {
    subject: (x, d) => `您的詢問${x ? ` — ${x}` : ""}${d ? ` · ${d}` : ""} — KAMEHAME JAPAN`,
    subjectTrade: "已收到您的詢問 — KAMEHAME JAPAN",
    hello: (n) => `${n} 您好：`,
    thanks: (x) => x
      ? `感謝您對「${x}」的詢問。我們的同仁將於日本時間 24 小時內回覆。`
      : "感謝您的來信。我們的同仁將於日本時間 24 小時內回覆。",
    thanksTrade: "感謝您的詢問。我們的同仁將於日本時間 24 小時內回覆並提供業者合作條件。",
    notYet: "目前尚未成立預約。我們會先向店家確認日期，再將價格與條件寄給您；在您確認並決定進行之前，不會產生任何費用。",
    echoH: "您送出的內容：",
    labels: { dates: "日期", party: "人數", company: "公司", country: "國家", message: "備註", plan: "方案", extras: "加購", estimate: "預估", interpreter: "口譯", area: "高爾夫區域", course: "球場", courseRecommended: "我們推薦的球場(套裝價格)", courseSpecific: "指定球場(個別報價)", level: "高爾夫經驗", rental: "租借球桿", clubs: "球桿需求", pickup: "接送地點", whatsapp: "WhatsApp" },
    followUp: {
      intro: "我是 KAMEHAME JAPAN 的客服人員 Yukihiro，接下來由我負責您的這次預約。",
      golf: (when) => `我正在為您安排${when ? ` ${when} ` : ""}的高爾夫球場。球場與開球時間確定後，我會將詳細資訊與付款方式一併寄給您。`,
      other: (x, when) => `我正在向店家確認「${x}」${when ? `(${when})` : ""}的日期。確認後，我會將詳細資訊與付款方式一併寄給您。`,
      wait: "球場通常會在 6 到 12 小時內確定，有時可能需要約 24 小時。感謝您的耐心等候。我會盡力讓這一天成為美好的回憶。",
      reply: "若您的計畫有變，或這段期間有任何疑問，直接回覆此郵件即可。",
      sign: "Yukihiro 敬上\nKAMEHAME JAPAN · Prosent Inc.\nhello@kamehame-japan.com",
    },
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
    e.area && `${c.labels.area}: ${e.area}`,
    e.courseMode && `${c.labels.course}: ${e.courseMode === "specific" ? c.labels.courseSpecific : c.labels.courseRecommended}${e.course ? ` — ${e.course}` : ""}`,
    e.dates && `${c.labels.dates}: ${e.dates}`,
    e.party && `${c.labels.party}: ${e.party}`,
    e.level && `${c.labels.level}: ${e.level}`,
    e.rental && `${c.labels.rental}: ${e.rental}`,
    e.clubs && `${c.labels.clubs}: ${e.clubs}`,
    e.pickup && `${c.labels.pickup}: ${e.pickup}`,
    e.whatsapp && `${c.labels.whatsapp}: ${e.whatsapp}`,
    e.interpreter && `${c.labels.interpreter}: ${e.interpreter}`,
    e.addons && `${c.labels.extras}: ${e.addons}`,
    e.estimate && `${c.labels.estimate}: ${e.estimate}`,
    e.message && `${c.labels.message}: ${e.message}`,
  ].filter((l): l is string => typeof l === "string" && l.length > 0);
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
  return { subject: threadSubject(e, experienceTitle), text };
}

/** The subject shared by every email in one enquiry's exchange. */
export function threadSubject(e: Enquiry, experienceTitle?: string): string {
  const c = COPY[isLang(e.lang) ? e.lang : "en"];
  return e.kind === "trade" ? c.subjectTrade : c.subject(experienceTitle, e.dates);
}

/** The personal follow-up from the person handling the request, sent a
 *  little after the acknowledgement so the visitor hears from a human
 *  without waiting for the first manual reply. Guest enquiries only. */
export function followUp(e: Enquiry, experienceTitle?: string): { subject: string; text: string } {
  const c = COPY[isLang(e.lang) ? e.lang : "en"];
  const f = c.followUp;
  const when = e.dates ?? "";
  const body = e.areaId ? f.golf(when) : f.other(experienceTitle ?? e.experience ?? "", when);
  const text = [c.hello(e.name), "", f.intro, "", body, "", f.wait, "", f.reply, "", f.sign].join("\n");
  return { subject: threadSubject(e, experienceTitle), text };
}
