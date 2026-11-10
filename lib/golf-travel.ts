import type { Lang } from "./i18n";

/** Indicative customer-facing budgets, not bookable quotes or checkout prices. */
export const FUJI_TRANSFER_JPY = { min: 100_000, max: 120_000 };
export const SHARED_BUS_BUDGET_JPY = { min: 30_000, max: 40_000 };
export type GolfTransferChoice = "introduce" | "none" | "unsure";
export const GOLF_TRAVEL_UI: Record<Lang, { details: string; bus: string; busArea: string; planning: string; requests: string }> = {
  en: { details: "Price details & conditions", bus: "Shared bus · for 1–2 golfers", busArea: "Chiba / Ibaraki / Tochigi · Not the Fuji area", planning: "Hotel, budget & preferred course (optional)", requests: "WhatsApp & special requests (optional)" },
  ja: { details: "料金の詳細・条件を見る", bus: "1〜2名向け・乗合バス", busArea: "千葉・茨城・栃木方面（富士エリア以外）", planning: "ホテル・予算・希望コース（任意）", requests: "WhatsApp・その他のご希望（任意）" },
  es: { details: "Detalles y condiciones", bus: "Autobús compartido · 1–2 jugadores", busArea: "Chiba / Ibaraki / Tochigi · Fuera del Fuji", planning: "Hotel, presupuesto y campo preferido (opcional)", requests: "WhatsApp y otras peticiones (opcional)" },
  fr: { details: "Détail des prix et conditions", bus: "Bus partagé · 1–2 joueurs", busArea: "Chiba / Ibaraki / Tochigi · Hors région du Fuji", planning: "Hôtel, budget et parcours souhaité (facultatif)", requests: "WhatsApp et demandes particulières (facultatif)" },
  "zh-tw": { details: "查看費用詳情與條件", bus: "1〜2人適合・共乘巴士", busArea: "千葉・茨城・栃木（非富士地區）", planning: "住宿・預算・指定球場（選填）", requests: "WhatsApp・其他需求（選填）" },
};
export function travelRange(min: number, max: number) {
  return `¥${Math.ceil(min).toLocaleString("en-US")}–¥${Math.ceil(max).toLocaleString("en-US")}`;
}
export function validTravelDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function readGolfTravelQuery(query: URLSearchParams, maxPeople = 8) {
  const n = Number(query.get("golfers"));
  const date = query.get("date");
  const choice = query.get("transfer");
  return {
    golfers: Number.isInteger(n) && n >= 1 && n <= maxPeople ? n : undefined,
    date: validTravelDate(date) ? date : "",
    transfer: (["introduce", "none", "unsure"] as const).find((v) => v === choice),
    fromFuji: query.get("from") === "fuji",
  };
}
export function golfBusHref(lang: Lang, golfers: number, date: string, transfer: GolfTransferChoice) {
  const q = new URLSearchParams({ from: "fuji", golfers: String(golfers), transfer });
  if (validTravelDate(date)) q.set("date", date);
  return `/${lang}/golf-bus/?${q}#tours`;
}
export function golfReturnHref(lang: Lang, golfers: number, date: string, transfer: GolfTransferChoice) {
  const q = new URLSearchParams({ area: "fuji", golfers: String(golfers), transfer });
  if (validTravelDate(date)) q.set("date", date);
  return `/${lang}/tokyo/mt-fuji-golf-day/?${q}#request-form`;
}

interface TravelCopy {
  heading: string; choices: Record<GolfTransferChoice, string>;
  privateTitle: string; route: string; vehicle: string; includes: string;
  excludes: string; quote: string; perGolfer: string; transferOnly: string;
  busTag: string; busTitle: string; busPrice: string; busIncludes: string;
  busTotal: string; busExtras: string; busArea: string; busCta: string;
  self: string; returnCta: string; nearDates: string; noSeats: string;
  compareTitle: string; approx: string;
}
export const GOLF_TRAVEL_COPY: Record<Lang, TravelCopy> = {
  en: {
    heading: "How would you like to get there?",
    choices: { introduce: "Private car through our partner", none: "I'll make my own way", unsure: "I'd like advice" },
    privateTitle: "Hotel pickup, all the way to the course", route: "Tokyo ↔ Mt. Fuji area · Round trip",
    vehicle: "Estimated transfer price per vehicle", includes: "Fuel and highway tolls included.",
    excludes: "Transfer only. Golf, booking fee and rentals are additional.",
    quote: "Final quote depends on pickup location, course and date. Departures outside Tokyo are quoted separately. Book and pay the transfer company directly.",
    perGolfer: "For {n} golfers: {price} each", transferOnly: "Transfer only · Shared within your group",
    busTag: "A lower-cost option for 1–2 golfers", busTitle: "Open to a course outside the Fuji area?",
    busPrice: "Approx. {price} / person", busIncludes: "Booking fee + round-trip bus + golf + cart + tax included",
    busTotal: "For {n} golfers: approx. {price} total", busExtras: "Indicative range; prices vary by date and course. Rental clubs: +¥5,500 per person. Shoes are extra; lunch inclusions vary by tour.",
    busArea: "Published dates in Chiba, Ibaraki or Tochigi. Shared golf groups. These tours do not visit the Mt. Fuji area.",
    busCta: "See dates & total prices", self: "Keep Mt. Fuji and arrange your own journey. Tell us where you are staying so we can consider suitable courses and routes. Travel costs are separate.",
    returnCta: "Back to my Mt. Fuji plan", nearDates: "Nearby available dates", noSeats: "No tour currently has enough seats for your group on this date. Try a nearby date or return to your Mt. Fuji plan.",
    compareTitle: "Planning Mt. Fuji golf from Tokyo?", approx: "Approx.",
  },
  ja: {
    heading: "ゴルフ場までの移動方法", choices: { introduce: "専用車の送迎を希望", none: "自分で移動する", unsure: "相談して決めたい" },
    privateTitle: "ホテルからゴルフ場まで、専用車で快適に", route: "東京 ↔ 富士エリア・往復",
    vehicle: "専用車1台の送迎費目安", includes: "ガソリン代・高速代込み。", excludes: "送迎のみの料金です。プレー代・手配料・レンタル代は別途。",
    quote: "出発地・コース・日程により正式見積もりをご案内します。東京以外からの出発は別途見積もり。送迎会社と直接契約・お支払いとなります。",
    perGolfer: "{n}名なら、お一人 {price}", transferOnly: "送迎費のみ・グループ内で分担",
    busTag: "1〜2名には、費用を抑えられる乗合バスも", busTitle: "富士エリア以外のコースも検討できますか？",
    busPrice: "お一人 約{price}", busIncludes: "手配料・往復バス・プレー代・カート代・税込み",
    busTotal: "{n}名なら合計 約{price}", busExtras: "料金は日程・コースにより変動します。クラブレンタルは1名＋¥5,500。シューズは別途、昼食はプランによります。",
    busArea: "千葉・茨城・栃木方面の公開日程から選択。他の参加者との組合せあり。富士エリアへ行くツアーではありません。",
    busCta: "日程と総額を見る", self: "富士エリアのまま、自力移動も選べます。滞在先を伺い、電車・タクシー等で行けるコースと経路を検討します。交通費は別途です。",
    returnCta: "富士エリアのプランに戻る", nearDates: "近い日程の空き候補", noSeats: "この日は、ご希望の人数分の空席があるツアーがありません。近い日程を選ぶか、富士エリアのプランに戻れます。",
    compareTitle: "東京から富士エリアでゴルフをするなら", approx: "約",
  },
  es: {
    heading: "¿Cómo quieres llegar al campo?", choices: { introduce: "Coche privado con nuestro colaborador", none: "Iré por mi cuenta", unsure: "Quiero asesoramiento" },
    privateTitle: "De tu hotel al campo en coche privado", route: "Tokio ↔ zona del monte Fuji · Ida y vuelta",
    vehicle: "Precio estimado del traslado por vehículo", includes: "Combustible y peajes incluidos.", excludes: "Solo traslado. Golf, gestión de reserva y alquileres aparte.",
    quote: "El presupuesto depende de la recogida, el campo y la fecha. Salidas fuera de Tokio: presupuesto aparte. Reserva y pago directamente a la empresa de transporte.",
    perGolfer: "Para {n} jugadores: {price} por persona", transferOnly: "Solo traslado · Coste repartido entre el grupo",
    busTag: "Una opción más económica para 1–2 jugadores", busTitle: "¿Considerarías un campo fuera de la zona del Fuji?",
    busPrice: "Aprox. {price} / persona", busIncludes: "Gestión de reserva + autobús de ida y vuelta + golf + carrito + impuestos incluidos",
    busTotal: "Para {n} jugadores: aprox. {price} en total", busExtras: "Importe orientativo; varía según fecha y campo. Palos de alquiler: +¥5,500 por persona. Zapatos aparte; almuerzo según el tour.",
    busArea: "Fechas publicadas en Chiba, Ibaraki o Tochigi. Partidas compartidas. Estos tours no visitan la zona del monte Fuji.",
    busCta: "Ver fechas y precios totales", self: "Puedes mantener la zona del Fuji y viajar por tu cuenta. Indica dónde te alojas para estudiar campos y rutas adecuados. Transporte aparte.",
    returnCta: "Volver a mi plan del monte Fuji", nearDates: "Fechas próximas con plazas", noSeats: "No hay suficientes plazas para tu grupo en esta fecha. Prueba una fecha próxima o vuelve a tu plan del Fuji.",
    compareTitle: "¿Golf cerca del monte Fuji desde Tokio?", approx: "Aprox.",
  },
  fr: {
    heading: "Comment souhaitez-vous rejoindre le parcours ?", choices: { introduce: "Voiture privée avec notre partenaire", none: "Je m'y rendrai par mes propres moyens", unsure: "Je souhaite être conseillé" },
    privateTitle: "De votre hôtel au parcours en voiture privée", route: "Tokyo ↔ région du mont Fuji · Aller-retour",
    vehicle: "Estimation du transfert par véhicule", includes: "Carburant et péages inclus.", excludes: "Transfert uniquement. Golf, frais de réservation et locations en supplément.",
    quote: "Devis selon le lieu de prise en charge, le parcours et la date. Départs hors de Tokyo sur devis séparé. Réservation et paiement directement auprès du transporteur.",
    perGolfer: "Pour {n} joueurs : {price} par personne", transferOnly: "Transfert uniquement · Coût partagé entre votre groupe",
    busTag: "Une option plus économique pour 1–2 joueurs", busTitle: "Un parcours hors de la région du Fuji vous conviendrait-il ?",
    busPrice: "Env. {price} / personne", busIncludes: "Frais de réservation + bus aller-retour + golf + voiturette + taxes inclus",
    busTotal: "Pour {n} joueurs : env. {price} au total", busExtras: "Estimation variable selon la date et le parcours. Location de clubs : +¥5,500 par personne. Chaussures en supplément ; déjeuner selon le circuit.",
    busArea: "Dates publiées à Chiba, Ibaraki ou Tochigi. Parties partagées. Ces circuits ne vont pas dans la région du mont Fuji.",
    busCta: "Voir les dates et les prix totaux", self: "Vous pouvez conserver le Fuji et vous déplacer par vos propres moyens. Indiquez votre hébergement pour étudier les parcours et trajets adaptés. Transport en supplément.",
    returnCta: "Revenir à mon projet au mont Fuji", nearDates: "Dates proches avec des places", noSeats: "Aucun circuit ne dispose de suffisamment de places à cette date. Essayez une date proche ou revenez à votre projet au Fuji.",
    compareTitle: "Un golf au mont Fuji au départ de Tokyo ?", approx: "Env.",
  },
  "zh-tw": {
    heading: "前往球場的交通方式", choices: { introduce: "希望安排合作車公司的專車接送", none: "自行前往", unsure: "希望先諮詢" },
    privateTitle: "專車從飯店直達球場", route: "東京 ↔ 富士地區・來回",
    vehicle: "每輛專車的接送費用估算", includes: "包含油費及高速公路通行費。", excludes: "僅為接送費用。打球費、預約手續費及租借費另計。",
    quote: "正式報價依接送地點、球場及日期而定。東京以外出發另行報價。請直接與接送公司簽約及付款。",
    perGolfer: "{n}人同行：每人 {price}", transferOnly: "僅接送費・由同行者分攤",
    busTag: "1～2人也可考慮較省預算的共乘巴士", busTitle: "也願意考慮富士地區以外的球場嗎？",
    busPrice: "每人約 {price}", busIncludes: "包含預約手續費、來回巴士、打球費、球車及稅金",
    busTotal: "{n}人合計約 {price}", busExtras: "價格依日期及球場而異。球桿租借每人另加¥5,500。球鞋另計；午餐依方案而定。",
    busArea: "可選擇千葉、茨城或栃木的公布行程，可能與其他旅客同組。行程不前往富士地區。",
    busCta: "查看日期及總價", self: "仍可選擇富士地區並自行前往。請告知住宿地點，我們將評估適合的球場與電車、計程車等路線。交通費另計。",
    returnCta: "返回我的富士地區方案", nearDates: "鄰近日期的可預約行程", noSeats: "當日沒有足夠空位容納您的同行人數。可選擇鄰近日期，或返回富士地區方案。",
    compareTitle: "想從東京出發到富士地區打高爾夫？", approx: "約",
  },
};
