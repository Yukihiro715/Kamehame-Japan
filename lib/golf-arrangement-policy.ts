import type { Lang } from "@/lib/i18n";

/** Separate from the price version: existing customers keep their agreed terms. */
/** 2026-10-24: the fee became ¥15,000 for the first golfer + ¥5,000 per additional golfer, and the research
 *  portion retained after a proposal became ¥5,000 per group (it was ¥5,000 per golfer under staged-2026-10-19). */
export const GOLF_ARRANGEMENT_POLICY_VERSION = "staged-2026-10-24";

export const arrangementPolicy: Record<Lang, {
  terms: string; request: string; beforePayment: string; research: string;
  confirmation: string; paid: string; stageTitle: string; stages: string[]; weather: string;
}> = {
  en: {
    terms: "The booking service fee is ¥15,000 for the first golfer plus ¥5,000 for each additional golfer, including tax (¥20,000 for two golfers, ¥25,000 for three, ¥30,000 for four). Of this, ¥5,000 covers research and a suitable proposal and the remainder covers booking and coordination. For customer-requested cancellation, we refund the whole fee before a specific proposal meeting the agreed essential requirements has been delivered (including before work starts); after that proposal, we retain ¥5,000 and refund the remainder. Once you have approved the course, time, charges and cancellation conditions, the club has confirmed the booking and we have sent you written confirmation, the booking service fee is non-refundable for customer-requested cancellation, including deciding not to play or a no-show. Merely checking availability is not a completed booking. If we cannot arrange a booking meeting the agreed essential requirements, or our error prevents the service, the booking service fee is refunded in full; any alternative requires your agreement. If the club closes the course due to weather, we offer an agreed alternative or a full refund of our fee. Club cancellation charges are separate and are disclosed for your approval before booking, even when playing fees are paid on the day. Existing individually agreed terms remain valid. Statutory rights are unaffected; any retention is limited as required by applicable law.",
    request: "Thank you for your enquiry. We will first confirm your date, area, golfers, rental needs and total budget, distinguishing essential requirements from preferences. Enquiring is free; no booking has been made.",
    beforePayment: "Before payment, we agree your essential requirements, budget ceiling and these refund terms by email. The booking service fee is paid before detailed course research; named course options, available tee times and itemised club charges follow after payment.",
    research: "After your agreement and payment, we research suitable courses and send a proposal. We book only after you approve the course, tee time, charges and club cancellation conditions; then we send written confirmation and arrival details.",
    confirmation: "Payment alone does not confirm a tee time. If we cannot arrange a booking meeting your agreed essential requirements, we discuss an alternative or refund our fee in full. Customer-requested cancellation follows the stages in our refund policy.",
    paid: "Thank you for your payment. We will check it against your agreed requirements and begin the research and proposal stage. Your tee time is not yet confirmed; we seek your approval before booking.",
    stageTitle: "Agree requirements and pay for research",
    stages: ["Send your enquiry", "Agree requirements and pay the service fee", "Review the proposal; approve the booking"],
    weather: "If the club closes the course due to weather, we offer an agreed alternative or refund our booking service fee in full. Rain alone does not mean closure. The club's separate conditions are disclosed before booking.",
  },
  ja: {
    terms: "予約手配料は1名目15,000円、2名目以降は1名につき5,000円を追加した1組の金額（税込。2名20,000円、3名25,000円、4名30,000円）で、このうち5,000円が調査・条件に合う提案、残りが予約・調整の内訳です。お客様都合の取消では、合意した必須条件に合う具体的な提案をお送りする前（着手前を含む）は予約手配料を全額返金し、提案後は5,000円を頂戴して残額を返金します。お客様がコース・時刻・料金・取消条件を承認し、ゴルフ場が予約を確定して当社が書面の確定通知をお送りした後は、プレーを取りやめる場合や無連絡不参加を含め、お客様都合による手配料の返金はありません。空き状況の確認だけでは予約手配完了になりません。合意した必須条件で手配できない場合、または当社の不備でサービスを提供できない場合は予約手配料を全額返金し、代替案はお客様の同意を得ます。天候によるゴルフ場のクローズ時も、同意いただいた代替案または当社手配料の全額返金で対応します。ゴルフ場の取消料は別で、プレー代が当日払いでも発生する場合があるため、予約前に条件を提示し承認をいただきます。既に個別合意した条件は維持します。法令上の権利を制限せず、頂戴する額は適用法令の範囲内とします。",
    request: "お問い合わせを受け付けました。まず日程・エリア・人数・レンタル・総予算について、必須条件と希望条件を確認します。お問い合わせは無料で、予約はまだ確定していません。",
    beforePayment: "お支払い前に、必須条件・予算上限・返金条件をメールで合意します。具体的なゴルフ場の調査は手配料のお支払い後に開始し、コース名・空きのある時刻・現地費用の内訳をご提案します。",
    research: "条件への合意と手配料のお支払い後に調査・提案を行います。コース・時刻・料金・ゴルフ場の取消条件をご承認いただいてから予約し、確定通知と当日の案内をお送りします。",
    confirmation: "決済だけではティータイムは確定しません。合意した必須条件で手配できない場合は、代替案をご相談するか手配料を全額返金します。お客様都合の取消は、返金規定の進行段階に応じて扱います。",
    paid: "お支払いありがとうございます。合意した条件と入金を照合し、調査・提案を進めます。ティータイムは未確定で、ご提案をご承認いただいてから予約します。",
    stageTitle: "条件を合意し、調査のための手配料をお支払い",
    stages: ["お問い合わせ", "条件合意・手配料のお支払い", "提案確認・予約の承認"],
    weather: "天候によりゴルフ場がクローズした場合は、同意いただいた代替案または当社手配料の全額返金で対応します。雨天だけではクローズとはなりません。ゴルフ場側の条件は予約前にご案内します。",
  },
  es: {
    terms: "La tarifa es de ¥15,000 por el primer golfista más ¥5,000 por cada golfista adicional, impuestos incluidos (¥20,000 para dos golfistas, ¥25,000 para tres, ¥30,000 para cuatro). De ella, ¥5,000 corresponden a la investigación y una propuesta adecuada, y el resto a la reserva y coordinación. Si el cliente cancela antes de recibir una propuesta concreta que cumpla los requisitos esenciales acordados (incluso antes de iniciar el trabajo), se reembolsa la tarifa íntegra. Después de esa propuesta, retenemos ¥5,000 y reembolsamos el resto. Una vez que el cliente aprueba campo, hora, costes y condiciones, el club confirma la reserva y enviamos confirmación escrita, la tarifa no es reembolsable por cancelación del cliente, incluida la decisión de no jugar o no presentarse. Consultar disponibilidad no equivale a completar una reserva. Si no podemos reservar conforme a los requisitos esenciales acordados o un error nuestro impide el servicio, reembolsamos la tarifa íntegra; cualquier alternativa requiere su acuerdo. Si el club cierra por el tiempo, ofrecemos una alternativa aceptada o el reembolso íntegro de nuestra tarifa. Los cargos de cancelación del club son independientes y se presentan para su aprobación antes de reservar, aunque el juego se pague ese día. Se mantienen los acuerdos individuales anteriores y los derechos legales; cualquier retención se limita a lo permitido por la ley aplicable.",
    request: "Gracias por su consulta. Primero confirmaremos fecha, zona, jugadores, alquileres y presupuesto total, diferenciando requisitos esenciales y preferencias. La consulta es gratuita y aún no hay reserva.",
    beforePayment: "Antes del pago acordamos por correo los requisitos esenciales, el presupuesto máximo y estas condiciones de reembolso. La tarifa se paga antes de la investigación detallada; después presentamos nombres de campos, salidas disponibles y costes desglosados.",
    research: "Tras el acuerdo y el pago investigamos y enviamos una propuesta. Reservamos solo cuando aprueba el campo, la hora, los costes y las condiciones de cancelación del club; después enviamos confirmación escrita e instrucciones de llegada.",
    confirmation: "El pago no confirma una salida. Si no podemos reservar según los requisitos esenciales acordados, consultamos una alternativa o reembolsamos nuestra tarifa íntegra. La cancelación del cliente sigue las etapas de nuestra política.",
    paid: "Gracias por el pago. Lo cotejaremos con los requisitos acordados e iniciaremos la investigación y propuesta. La salida no está confirmada; solicitaremos su aprobación antes de reservar.",
    stageTitle: "Acordar requisitos y pagar la investigación",
    stages: ["Enviar la consulta", "Acordar requisitos y pagar la tarifa", "Revisar la propuesta y aprobar la reserva"],
    weather: "Si el club cierra por el tiempo, ofrecemos una alternativa aceptada o reembolsamos nuestra tarifa íntegra. La lluvia por sí sola no implica cierre. Las condiciones del club se presentan antes de reservar.",
  },
  fr: {
    terms: "Les frais sont de ¥15,000 pour le premier golfeur plus ¥5,000 par golfeur supplémentaire, taxes comprises (¥20,000 pour deux golfeurs, ¥25,000 pour trois, ¥30,000 pour quatre). Sur ce montant, ¥5,000 couvrent la recherche et une proposition adaptée, le reste la réservation et la coordination. En cas d'annulation par le client avant l'envoi d'une proposition précise répondant aux exigences essentielles convenues (y compris avant le début du travail), nous remboursons l'intégralité des frais. Après cette proposition, nous retenons ¥5,000 et remboursons le reste. Lorsque vous avez approuvé le parcours, l'horaire, les coûts et les conditions, que le club a confirmé la réservation et que nous vous avons envoyé la confirmation écrite, nos frais ne sont plus remboursables en cas d'annulation par le client, y compris s'il décide de ne plus jouer ou ne se présente pas. Vérifier la disponibilité ne constitue pas une réservation achevée. Si nous ne pouvons pas réserver conformément aux exigences essentielles convenues, ou si une erreur de notre part empêche le service, nos frais sont intégralement remboursés ; toute alternative nécessite votre accord. Si le club ferme pour cause de météo, nous proposons une alternative acceptée ou un remboursement intégral de nos frais. Les frais d'annulation du club sont distincts et soumis à votre accord avant réservation, même si la partie se paie sur place. Les accords individuels antérieurs et les droits légaux sont préservés ; toute retenue est limitée par la loi applicable.",
    request: "Merci pour votre demande. Nous confirmerons d'abord la date, la région, les joueurs, les locations et le budget total, en distinguant exigences essentielles et préférences. La demande est gratuite ; aucune réservation n'est faite.",
    beforePayment: "Avant paiement, nous convenons par e-mail des exigences essentielles, du budget maximum et de ces conditions de remboursement. Les frais sont réglés avant la recherche détaillée ; les noms des parcours, les départs disponibles et les coûts détaillés sont proposés ensuite.",
    research: "Après accord et paiement, nous recherchons les parcours et envoyons une proposition. Nous réservons seulement après votre approbation du parcours, de l'horaire, des coûts et des conditions d'annulation du club, puis envoyons confirmation écrite et informations d'arrivée.",
    confirmation: "Le paiement seul ne confirme pas un départ. Si nous ne pouvons pas réserver selon les exigences essentielles convenues, nous consultons une alternative ou remboursons nos frais intégralement. L'annulation par le client suit les étapes de notre politique.",
    paid: "Merci pour votre paiement. Nous le rapprocherons des exigences convenues et commencerons la recherche et la proposition. Le départ n'est pas confirmé ; votre approbation sera demandée avant réservation.",
    stageTitle: "Convenir des exigences et payer la recherche",
    stages: ["Envoyer la demande", "Convenir des exigences et régler les frais", "Examiner la proposition et approuver la réservation"],
    weather: "Si le club ferme pour cause de météo, nous proposons une alternative acceptée ou remboursons nos frais intégralement. La pluie seule ne signifie pas une fermeture. Les conditions du club sont communiquées avant réservation.",
  },
  "zh-tw": {
    terms: "代辦費為第 1 位 ¥15,000，每增加 1 位加 ¥5,000（含稅；2 位 ¥20,000、3 位 ¥25,000、4 位 ¥30,000），其中 ¥5,000 為調查及符合條件的提案，其餘為預約與協調。客人取消時，在我們寄出符合已合意必要條件的具體提案之前（包括尚未開始工作），代辦費全額退還；提案寄出後保留 ¥5,000、退還其餘款項。客人同意球場、時間、費用與取消條件，球場確認預約，且我們寄出書面確認後，因客人決定不打球、未到場等個人因素取消，代辦費不退。僅查詢空位並不代表預約完成。若無法按照已合意的必要條件安排，或因我們的疏失無法提供服務，代辦費全額退還；替代方案須經客人同意。若球場因天候關閉，提供經同意的替代方案或全額退還我們的代辦費。球場取消費另計，即使球費當天支付仍可能產生，會於預約前告知並取得同意。先前個別約定維持有效。法定權利不受影響，保留款項以適用法令允許的範圍為限。",
    request: "感謝你的詢問。我們會先確認日期、區域、人數、租借與總預算，區分必要條件與偏好。詢問免費，目前尚未預約。",
    beforePayment: "付款前先以郵件合意必要條件、預算上限與退款規定。詳細球場調查在代辦費支付後開始，之後提供球場名稱、可預約時間與現地費用明細。",
    research: "條件合意及付款後進行調查並寄送提案。你同意球場、時間、費用及球場取消規定後才預約，再寄送書面確認與當日資訊。",
    confirmation: "付款不代表開球時間已確認。若無法符合已合意的必要條件，將討論替代方案或全額退還代辦費。客人自行取消依退款規定的進行階段處理。",
    paid: "感謝付款。我們會核對已合意條件並開始調查與提案。開球時間尚未確認，預約前會先取得你的同意。",
    stageTitle: "合意條件並支付調查代辦費",
    stages: ["提出詢問", "合意條件並支付代辦費", "確認提案並同意預約"],
    weather: "若球場因天候關閉，提供經同意的替代方案或全額退還代辦費。下雨不一定代表關閉，球場條件將於預約前告知。",
  },
};
