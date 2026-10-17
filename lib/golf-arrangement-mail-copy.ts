import type { Lang } from "@/lib/i18n";

/** New copy is separate so the package emails remain available without edits. */
export const arrangementMailCopy: Record<Lang, { dates: string; followUp: string; paymentSplit: string }> = {
  en: {
    dates: "Date and preferred tee time (Japan time)",
    followUp: "Thank you for your tee-time enquiry. We will check suitable courses and send you a proposed course, tee time, the club's charges and cancellation conditions, and our booking service fee. Your reservation is not confirmed yet. Please review the proposal before deciding whether to proceed; no payment is required now.",
    paymentSplit: "Our fee covers course selection, tee-time booking and communication with the club. Green fees, cart, rentals, lunch and any course caddie are paid directly to the club. Transport is not included: if you need a transfer, we can introduce a licensed provider for you to book, contract and pay directly. An English-speaking assistant at the course is optional and quoted separately.",
  },
  ja: {
    dates: "日付・希望のティータイム（日本時間）",
    followUp: "ティータイムのお問い合わせをありがとうございます。候補のゴルフ場を確認し、コース・スタート時刻・現地費用・ゴルフ場のキャンセル条件と当社の予約手配料をご案内します。現時点では予約は確定していません。提案内容をご確認のうえ、お申し込みをご判断ください。今のお支払いは不要です。",
    paymentSplit: "当社の手配料は、コース選定・ティータイム予約・ゴルフ場との連絡に対する料金です。プレー代・カート・レンタル・昼食・コースのキャディ代はゴルフ場に直接お支払いください。送迎は含みません。ご希望の場合は許可を持つ送迎会社をご紹介し、お客様が直接予約・契約・お支払いします。現地での英語アシスタント同行は任意で、別途お見積もりします。",
  },
  es: {
    dates: "Fecha y hora de salida preferida (hora de Japón)",
    followUp: "Gracias por su consulta sobre una hora de salida. Comprobaremos los campos disponibles y le propondremos un campo y una hora, junto con los precios y las condiciones de cancelación del club y nuestra tarifa de gestión. Su reserva aún no está confirmada. Revise la propuesta antes de decidir; por ahora no debe realizar ningún pago.",
    paymentSplit: "Nuestra tarifa cubre la selección del campo, la reserva y la comunicación con el club. El green fee, carrito, alquileres, almuerzo y caddie del campo se pagan directamente al club. El transporte no está incluido: podemos presentarle un proveedor autorizado con quien reservar, contratar y pagar directamente. Un asistente de habla inglesa en el campo es opcional y se cotiza por separado.",
  },
  fr: {
    dates: "Date et heure de départ souhaitée (heure du Japon)",
    followUp: "Merci pour votre demande de départ. Nous vérifierons les parcours disponibles et vous proposerons un parcours et un horaire, avec les tarifs et conditions d'annulation du club ainsi que nos frais de réservation. Votre réservation n'est pas encore confirmée. Veuillez examiner la proposition avant de décider ; aucun paiement n'est requis pour le moment.",
    paymentSplit: "Nos frais couvrent la sélection du parcours, la réservation et les échanges avec le club. Les green fees, voiturette, locations, déjeuner et caddie du parcours sont réglés directement au club. Le transport n'est pas inclus : nous pouvons vous présenter un prestataire agréé auprès duquel vous réservez, contractez et payez directement. Un assistant anglophone sur place est facultatif et fait l'objet d'un devis séparé.",
  },
  "zh-tw": {
    dates: "日期與希望的開球時間（日本時間）",
    followUp: "感謝你的開球時間詢問。我們將確認可預約的球場，並提供球場、開球時間、球場費用與取消條件，以及我們的代辦費。目前預約尚未確認。請先閱讀提案，再決定是否申請；現在無需付款。",
    paymentSplit: "我們的代辦費涵蓋球場挑選、開球時間預約與球場溝通。果嶺費、球車、租借、午餐及球場桿弟費直接支付給球場。費用不含接送；如有需要，我們可介紹持照業者，由你直接預約、簽約及付款。球場現場的英文助理為選購服務，另行報價。",
  },
};
