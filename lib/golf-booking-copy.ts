import type { Lang } from "@/lib/i18n";
import type { Experience } from "@/lib/catalog";

// One description of the golf booking process, shared by all customer surfaces.
export const GOLF_BOOKING_COPY = {
  en: {
    received: "Thank you for your golf day request. We will send your package details, final price and payment instructions.",
    proposal: "Review your package, included services, final price and cancellation conditions in our email. There is no payment when you send this request.",
    arrange: "Once you approve the package and complete payment, our team takes care of your course reservation, tee time, private transfers and rental arrangements. We send your confirmed course and tee time within 24 hours of payment.",
    protection: "Your booking is confirmed when we send the confirmed course and tee time. If we cannot arrange a suitable course, we will discuss an alternative with you or provide a full refund. No extra charge or alternative is accepted on your behalf without your agreement.",
    steps: ["Send your request", "Review your package and complete payment", "We arrange and confirm your golf day"],
    photo: "Photos show examples of courses, clubhouses, meals and facilities at different clubs; what is included is confirmed with your proposal. Mt. Fuji views are available only at selected courses in the Mt. Fuji area and depend on the weather.",
    area: "Tokyo area or Mt. Fuji region; hotel transfers from Tokyo, Saitama or Chiba. Other pick-up locations are reviewed individually.",
    pickup: "Hotel / pick-up location", region: "Pick-up prefecture", regions: ["Select…", "Tokyo", "Saitama", "Chiba", "Other / not decided"],
    caddie: "Course caddie", caddies: ["No caddie (standard package)", "Caddie requested (additional charge)", "Please advise"],
    clubs: "Rental clubs (¥5,000 per golfer) are included in every package. Golfers who bring their own clubs pay ¥5,000 less each; choose it in the form and the total updates.",
    caddieNote: "If requested, we will include the caddie arrangement and total price in your payment proposal.",
    paidH: "Payment received", paid: "Thank you. We have received your payment and our team will take care of the arrangements. We will email your booking confirmation once the arrangements are secured.",
  },
  ja: {
    received: "ゴルフ体験のリクエストを受け付けました。プラン内容・最終料金・お支払い方法をご案内します。",
    proposal: "メールでプラン内容・含まれるサービス・最終料金・キャンセル条件をご確認ください。リクエスト送信時のお支払いは不要です。",
    arrange: "プランにご了承のうえお支払いいただいた後、当社がコース予約・スタート時刻・専用車・レンタルの手配を進めます。ご入金から24時間以内に、確定したコースとスタート時刻をご案内します。",
    protection: "確定したコースとスタート時刻のご案内をもって予約確定となります。適切なコースを手配できない場合は、代替案をご相談するか全額返金いたします。ご了承なく追加料金や代替案を確定することはありません。",
    steps: ["ご希望を送る", "プランを確認してお支払い", "当社が手配し、確定内容をご案内"],
    photo: "写真は複数のゴルフ場のコース・クラブハウス・食事・施設の一例です。実際の内容はご提案時に確認します。富士山の眺望は富士山エリアの一部コースに限られ、天候によります。",
    area: "東京近郊または富士山エリア。東京・埼玉・千葉のホテル送迎に対応し、その他の場所は個別にご相談を承ります。",
    pickup: "ホテル名・お迎え場所", region: "お迎え場所の都県", regions: ["選択してください", "東京都", "埼玉県", "千葉県", "その他・未定"],
    caddie: "コースキャディ", caddies: ["なし（標準プラン）", "ありを希望（追加料金）", "相談したい"],
    clubs: "レンタルクラブ(1名¥5,000)は全パッケージに含まれています。クラブをご持参の方は1名につき¥5,000引きです。フォームで選ぶと合計に反映されます。",
    caddieNote: "ご希望の場合は、キャディの手配内容と総額をお支払いのご案内に記載します。",
    paidH: "お支払いを受け付けました", paid: "お支払いありがとうございます。当社が手配を進め、手配完了後に予約確定のご案内をメールでお送りします。",
  },
  es: {
    received: "Gracias por su solicitud de golf. Le enviaremos los detalles del paquete, el precio final y las instrucciones de pago.",
    proposal: "Revise por correo el paquete, los servicios incluidos, el precio final y las condiciones de cancelación. Enviar la solicitud no requiere ningún pago.",
    arrange: "Una vez aceptado el paquete y recibido el pago, nos encargamos de reservar el campo, la hora de salida, el transporte privado y el material de alquiler. Enviaremos el campo y la hora confirmados en un plazo de 24 horas desde el pago.",
    protection: "La reserva queda confirmada cuando enviamos el campo y la hora definitivos. Si no podemos organizar una opción adecuada, consultaremos una alternativa o realizaremos un reembolso completo. No aceptaremos suplementos ni alternativas sin su acuerdo.",
    steps: ["Envíe su solicitud", "Revise el paquete y pague", "Organizamos y confirmamos su día de golf"],
    photo: "Las fotos muestran ejemplos de campos, casas club, comidas e instalaciones de distintos clubes; lo incluido se confirma con tu propuesta. Las vistas del monte Fuji solo existen en algunos campos de la zona del Fuji y dependen del tiempo.",
    area: "Zona de Tokio o Monte Fuji; traslados desde hoteles de Tokio, Saitama o Chiba. Otros puntos se consultan individualmente.",
    pickup: "Hotel / lugar de recogida", region: "Prefectura de recogida", regions: ["Seleccione…", "Tokio", "Saitama", "Chiba", "Otra / por decidir"],
    caddie: "Caddie del campo", caddies: ["Sin caddie (paquete estándar)", "Con caddie (suplemento)", "Quisiera asesoramiento"],
    clubs: "Los palos de alquiler (¥5,000 por golfista) están incluidos en todos los paquetes. Quien traiga sus propios palos paga ¥5,000 menos; elígelo en el formulario y el total se actualiza.",
    caddieNote: "Si lo solicita, incluiremos el caddie y el precio total en la propuesta de pago.",
    paidH: "Pago recibido", paid: "Gracias. Hemos recibido su pago y nos encargaremos de los preparativos. Enviaremos la confirmación por correo una vez aseguradas las reservas.",
  },
  fr: {
    received: "Merci pour votre demande de golf. Nous vous enverrons les détails du forfait, le prix final et les modalités de paiement.",
    proposal: "Consultez par e-mail le forfait, les prestations incluses, le prix final et les conditions d'annulation. Aucun paiement n'est demandé lors de l'envoi du formulaire.",
    arrange: "Après votre accord sur le forfait et réception du paiement, nous nous chargeons du parcours, du départ, des transferts privés et du matériel de location. Nous envoyons le parcours et l'heure confirmés dans les 24 heures suivant le paiement.",
    protection: "La réservation est confirmée lors de l'envoi du parcours et de l'heure définitifs. Si aucune option adaptée ne peut être réservée, nous discutons d'une alternative ou procédons à un remboursement intégral. Aucun supplément ni changement n'est accepté sans votre accord.",
    steps: ["Envoyez votre demande", "Consultez le forfait et réglez", "Nous organisons et confirmons votre journée"],
    photo: "Les photos montrent des exemples de parcours, club-houses, repas et installations de différents clubs ; ce qui est inclus est confirmé avec votre proposition. La vue sur le mont Fuji n'existe que sur certains parcours de la zone du Fuji et dépend de la météo.",
    area: "Région de Tokyo ou du mont Fuji ; transferts depuis les hôtels de Tokyo, Saitama ou Chiba. Autres lieux étudiés individuellement.",
    pickup: "Hôtel / lieu de prise en charge", region: "Préfecture de prise en charge", regions: ["Sélectionnez…", "Tokyo", "Saitama", "Chiba", "Autre / à décider"],
    caddie: "Caddie du parcours", caddies: ["Sans caddie (forfait standard)", "Avec caddie (supplément)", "Je souhaite un conseil"],
    clubs: "Les clubs de location (¥5,000 par golfeur) sont compris dans chaque forfait. Les golfeurs qui apportent leurs clubs paient ¥5,000 de moins chacun ; choisissez-le dans le formulaire et le total se met à jour.",
    caddieNote: "Sur demande, nous préciserons le caddie et le prix total dans la proposition de paiement.",
    paidH: "Paiement reçu", paid: "Merci. Nous avons reçu votre paiement et prenons en charge les préparatifs. Nous enverrons la confirmation par e-mail une fois les réservations assurées.",
  },
  "zh-tw": {
    received: "感謝您的高爾夫體驗申請。我們將寄送方案內容、最終價格及付款方式。",
    proposal: "請於郵件中確認方案、包含項目、最終價格及取消條件。提交申請時不需付款。",
    arrange: "您同意方案並完成付款後，我們將負責球場預約、開球時間、專車及球具租借安排，並於付款後24小時內寄送確定的球場與開球時間。",
    protection: "我們寄出確定球場與開球時間的通知後，預約即成立。若無法安排適合的球場，我們將與您商討替代方案或全額退款。未經您同意，不會確定追加費用或替代方案。",
    steps: ["提交您的需求", "確認方案並付款", "由我們安排並寄送確認通知"],
    photo: "照片為不同球場的球道、會館、餐點與設施範例；實際內容將於提案時確認。富士山景觀僅限富士山區域的部分球場，且視天氣而定。",
    area: "東京近郊或富士山地區；提供東京、埼玉、千葉飯店接送。其他地點另行確認。",
    pickup: "飯店名稱／接送地點", region: "接送都縣", regions: ["請選擇", "東京都", "埼玉縣", "千葉縣", "其他／未定"],
    caddie: "球場球僮", caddies: ["不需要（標準方案）", "需要（追加費用）", "希望諮詢"],
    clubs: "租借球桿（每位 ¥5,000）已含在所有方案中。自備球桿者每位減 ¥5,000；在表單中選擇即可，總價會隨之更新。",
    caddieNote: "如有需求，我們將於付款方案中列明球僮安排及總價。",
    paidH: "已收到付款", paid: "感謝您的付款。我們將進行安排，並在完成手配後以電子郵件寄送預約確認。",
  },
} satisfies Record<Lang, { received: string; proposal: string; arrange: string; protection: string; steps: string[]; photo: string; area: string; pickup: string; region: string; regions: string[]; caddie: string; caddies: string[]; clubs: string; caddieNote: string; paidH: string; paid: string }>;

export function applyGolfBookingCopy(e: Experience, lang: Lang): Experience {
  if (e.slug !== "mt-fuji-golf-day" || !e.variantCopy) return e;
  const c = GOLF_BOOKING_COPY[lang];
  const v = e.variantCopy;
  const dress = {en: "Most Japanese clubs ask for smart clothing on arrival and a collared shirt on the course. We send the confirmed course’s rules with your booking details.", ja: "来場時は清潔感のある服装、プレー中は襟付きシャツが基本です。確定したコースの服装規定は予約詳細と一緒にご案内します。", es: "Se recomienda ropa elegante al llegar y una camisa con cuello para jugar. Enviaremos las normas del campo con los detalles confirmados.", fr: "Une tenue soignée à l’arrivée et un polo à col pour jouer sont recommandés. Les règles du parcours accompagneront la confirmation.", "zh-tw": "抵達時請穿著整齊，打球時穿有領上衣。確定球場的服裝規定將隨預約詳情一併寄送。"}[lang];
  const weekend = {en: "Standard prices include regular weekday and weekend green fees at a recommended course. If no suitable course can be arranged at the agreed price, we will discuss an alternative or provide a full refund.", ja: "標準料金には、おすすめコースの通常の平日・週末のプレー料金を含みます。合意した料金で適切なコースを手配できない場合は、代替案をご相談するか全額返金します。", es: "El precio estándar incluye green fees habituales entre semana y fines de semana. Si no podemos reservar una opción adecuada al precio acordado, consultaremos una alternativa o reembolsaremos el importe completo.", fr: "Le tarif standard comprend les green fees habituels en semaine et le week-end. Si aucun parcours adapté n’est disponible au prix convenu, nous proposons une alternative ou un remboursement intégral.", "zh-tw": "標準價格包含推薦球場平日及一般週末的果嶺費。若無法以約定價格安排適合球場，我們將商討替代方案或全額退款。"}[lang];
  return {
    ...e, area: c.area,
    cta: e.cta ? { ...e.cta, lead: c.proposal } : e.cta,
    // The manual payment emails: 50% through D-3; 100% from D-2.
    cancellationTiers: [{ until: 7, rate: 0 }, { until: 3, rate: 50 }, { until: 0, rate: 100 }],
    flow: c.steps.map((title, i) => ({ title, body: [c.received, c.proposal, `${c.arrange} ${c.protection}`][i] })),
    venue: e.venue ? { ...e.venue, known: [c.proposal, c.area], afterBooking: [c.arrange, c.protection, ...e.venue.afterBooking] } : e.venue,
    faq: e.faq?.map((f, i) => ({ ...f, a: ({ 0: `${c.arrange} ${c.protection}`, 4: weekend, 5: `${c.proposal} ${c.arrange}`, 8: c.area, 11: dress } as Record<number, string>)[i] ?? f.a })),
    variantCopy: { ...v, photoNote: c.photo,
      options: { ...v.options, note: `${c.proposal} ${c.arrange}` },
      prices: { ...v.prices, notes: [c.clubs, c.proposal, c.arrange, c.protection] },
      form: { ...v.form, pickup: c.pickup, note: c.proposal, sentNote: `${c.received} ${c.arrange} ${c.protection}` },
    },
  };
}
