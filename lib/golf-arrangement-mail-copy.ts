import { arrangementPolicy } from "@/lib/golf-arrangement-policy";
import type { Lang } from "@/lib/i18n";

/** New copy is separate so the package emails remain available without edits. */
export const arrangementMailCopy: Record<Lang, { dates: string; followUp: string; paymentSplit: string }> = {
  en: {
    dates: "Date and preferred tee time (Japan time)",
    followUp: arrangementPolicy["en"].request + "\n\n" + arrangementPolicy["en"].beforePayment,
    paymentSplit: "Our fee covers course selection, tee-time booking and communication with the club. Green fees, cart, rentals, lunch and any course caddie are paid directly to the club. Transport is not included: if you need a transfer, we can introduce a licensed provider for you to book, contract and pay directly. An English-speaking assistant at the course is optional and quoted separately.",
  },
  ja: {
    dates: "日付・希望のティータイム（日本時間）",
    followUp: arrangementPolicy["ja"].request + "\n\n" + arrangementPolicy["ja"].beforePayment,
    paymentSplit: "当社の手配料は、コース選定・ティータイム予約・ゴルフ場との連絡に対する料金です。プレー代・カート・レンタル・昼食・コースのキャディ代はゴルフ場に直接お支払いください。送迎は含みません。ご希望の場合は許可を持つ送迎会社をご紹介し、お客様が直接予約・契約・お支払いします。現地での英語アシスタント同行は任意で、別途お見積もりします。",
  },
  es: {
    dates: "Fecha y hora de salida preferida (hora de Japón)",
    followUp: arrangementPolicy["es"].request + "\n\n" + arrangementPolicy["es"].beforePayment,
    paymentSplit: "Nuestra tarifa cubre la selección del campo, la reserva y la comunicación con el club. El green fee, carrito, alquileres, almuerzo y caddie del campo se pagan directamente al club. El transporte no está incluido: podemos presentarle un proveedor autorizado con quien reservar, contratar y pagar directamente. Un asistente de habla inglesa en el campo es opcional y se cotiza por separado.",
  },
  fr: {
    dates: "Date et heure de départ souhaitée (heure du Japon)",
    followUp: arrangementPolicy["fr"].request + "\n\n" + arrangementPolicy["fr"].beforePayment,
    paymentSplit: "Nos frais couvrent la sélection du parcours, la réservation et les échanges avec le club. Les green fees, voiturette, locations, déjeuner et caddie du parcours sont réglés directement au club. Le transport n'est pas inclus : nous pouvons vous présenter un prestataire agréé auprès duquel vous réservez, contractez et payez directement. Un assistant anglophone sur place est facultatif et fait l'objet d'un devis séparé.",
  },
  "zh-tw": {
    dates: "日期與希望的開球時間（日本時間）",
    followUp: arrangementPolicy["zh-tw"].request + "\n\n" + arrangementPolicy["zh-tw"].beforePayment,
    paymentSplit: "我們的代辦費涵蓋球場挑選、開球時間預約與球場溝通。果嶺費、球車、租借、午餐及球場桿弟費直接支付給球場。費用不含接送；如有需要，我們可介紹持照業者，由你直接預約、簽約及付款。球場現場的英文助理為選購服務，另行報價。",
  },
};
