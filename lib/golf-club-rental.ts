// Chosen-model club rental for the golf booking service (owner, 2026-10-25).
//
// Golf courses rent clubs, but the guest cannot pick the maker or the model.
// As an option, we order a named set from a rental supplier and have it
// delivered to the course the day before; the guest hands it back at the
// front desk after the round with the enclosed return slip. One fee per set,
// paid to us with the booking service fee. The supplier is never named on the
// page (the photos are used with its permission). While the option is being
// reviewed it is shown only on the unlisted preview page
// (app/previews/golf-club-rental-7c3e9a51b2/).

import type { Lang } from "@/lib/i18n";

/** Per set, including tax, paid to us. */
export const GOLF_CLUB_RENTAL_JPY = 15000;
/** The supplier needs the order four business days before use and we order only once the
 *  course is confirmed, so the option closes this many days before the round. */
export const GOLF_CLUB_RENTAL_CUTOFF_DAYS = 7;
/** Stamped on requests that carry the option, beside the fee's price version. */
export const GOLF_CLUB_RENTAL_VERSION = "club-rental-2026-10-25";

export type ClubHand = "right" | "left";
export type ClubGender = "men" | "ladies";
export type ClubTier = "entry" | "standard" | "premium";

export interface ClubSet {
  id: string;
  brand: string;
  model: string;
  /** Driver flex as the supplier lists it: "S", "R", "SR", "R/SR", "L" (ladies), "A". */
  flex: string;
  hand: ClubHand;
  gender: ClubGender;
  tier: ClubTier;
  img: string;
  thumb: string;
}

const set = (id: string, brand: string, model: string, flex: string, hand: ClubHand, gender: ClubGender, tier: ClubTier): ClubSet =>
  ({ id, brand, model, flex, hand, gender, tier, img: `/images/golf-clubs/${id}.webp`, thumb: `/images/golf-clubs/thumbs/${id}.webp` });

/** Representative sets from the supplier's current line-up (2026-10-25). Availability is
 *  confirmed with the proposal; an equivalent set may be offered when one is out. */
export const CLUB_SETS: ClubSet[] = [
  set("taylormade-qi10-s", "TaylorMade", "Qi10", "S", "right", "men", "premium"),
  set("taylormade-stealth2-r", "TaylorMade", "Stealth 2", "R", "right", "men", "premium"),
  set("callaway-paradym-ai-smoke-s", "Callaway", "Paradym Ai Smoke", "S", "right", "men", "premium"),
  set("callaway-paradym-r", "Callaway", "Paradym", "R", "right", "men", "premium"),
  set("ping-g425-s", "PING", "G425", "S", "right", "men", "premium"),
  set("xxio-mp1200-r", "Dunlop XXIO", "MP1200", "R", "right", "men", "premium"),
  set("bridgestone-tour-b-s", "Bridgestone", "TOUR B", "S", "right", "men", "standard"),
  set("xxio-mp800-r-sr", "Dunlop XXIO", "MP800", "R/SR", "right", "men", "standard"),
  set("mixed-set-r", "Mixed set", "Entry set", "R", "right", "men", "entry"),
  set("xxio-mp1100-left-r", "Dunlop XXIO", "MP1100", "R", "left", "men", "premium"),
  set("ladies-xxio-mp800-l", "Dunlop XXIO", "MP800 Ladies", "L", "right", "ladies", "standard"),
  set("ladies-callaway-mixed-l", "Callaway", "Ladies mixed set", "L", "right", "ladies", "standard"),
  set("ladies-world-eagle-g510-left-l", "World Eagle", "G-510 Ladies", "L", "left", "ladies", "entry"),
];

export const clubSetById = (id: string | undefined): ClubSet | undefined => CLUB_SETS.find((s) => s.id === id);
export const isClubSetId = (id: unknown): id is string => typeof id === "string" && CLUB_SETS.some((s) => s.id === id);
/** "TaylorMade Qi10 (S)": the set's name as it appears everywhere. */
export const clubSetName = (s: ClubSet) => `${s.brand} ${s.model} (${s.flex})`;
export const clubRentalTotal = (sets: number) => GOLF_CLUB_RENTAL_JPY * Math.max(0, sets);

export interface ClubRentalCopy {
  /** Section on the page */
  heading: string; lede: string;
  course: { title: string; price: string; body: string };
  chosen: { title: string; price: string; body: string };
  gridH: string; gridNote: string;
  deadline: string; cancel: string; returns: string;
  details: string; close: string;
  /** Tags in the grid and the modal */
  hand: Record<ClubHand, string>; gender: Record<ClubGender, string>; tier: Record<ClubTier, string>; flex: string;
  /** Modal */
  setIncludes: string; condition: string; pickThis: string; picked: string;
  /** Form */
  option: string; optionShort: string; choose: string; change: string; notChosen: string; forGolfer: string;
  /** "Club rental × {n}" and the breakdown words */
  line: string; total: string; feeWord: string;
  /** FAQ */
  faqQ: string; faqA: string;
  /** Terms paragraph appended to the cancellation section */
  terms: string;
  /** First view: the benefit pill; the inclusion card's note; the form's note after choosing; the "remove" action */
  fvBenefit: string; inclusionNote: string; perSet: string; remove: string;
}

const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;
const FEE = yen(GOLF_CLUB_RENTAL_JPY);
const D = GOLF_CLUB_RENTAL_CUTOFF_DAYS;

export const CLUB_RENTAL_COPY: Record<Lang, ClubRentalCopy> = {
  en: {
    heading: "Rental clubs: two ways",
    lede: "Every course rents clubs, but you cannot choose the maker or the model. If you would like a particular set, we order it and have it waiting for you at the course.",
    course: { title: "Course rental", price: "About ¥5,000, paid at the club", body: "A standard set from the club's rental stock. Maker and model are the club's choice; right- or left-handed on request." },
    chosen: { title: "Choose your set", price: `${FEE} per set, paid with our fee`, body: "Pick a maker, model and flex below. The set is delivered to the course the day before; after the round you hand it back at the front desk with the enclosed return slip." },
    gridH: "Sets you can choose",
    gridNote: "Examples from our supplier's current line-up. Availability is confirmed with your proposal; if a set is out we offer an equivalent one.",
    deadline: `Order by ${D} days before your round.`,
    cancel: "Free to change or cancel until the set is shipped (about three days before); no refund of the set fee after that.",
    returns: "A driver, fairway wood, hybrid, irons, wedges, putter and a caddie bag. All sets are used and in good playing condition.",
    details: "Details", close: "Close",
    hand: { right: "Right-handed", left: "Left-handed" }, gender: { men: "Men's", ladies: "Ladies'" }, tier: { entry: "Entry", standard: "Standard", premium: "Premium" }, flex: "Flex",
    setIncludes: "Driver, fairway wood, hybrid, irons, wedges, putter and a caddie bag.",
    condition: "Used set in good playing condition. Availability is confirmed with your proposal.",
    pickThis: "Choose this set", picked: "Chosen",
    option: "Chosen model", optionShort: "Chosen set", choose: "Choose a set", change: "Change", notChosen: "No set chosen yet", forGolfer: "Set for {golfer}",
    line: `Club rental × {n}`, total: "{fee} fee + {rental} club rental × {n}", feeWord: "fee",
    faqQ: "Can I choose the make and model of the rental clubs?",
    faqA: `Yes. Course rental sets are the club's choice. For ${FEE} per set we order the set you pick and have it delivered to the course the day before; you hand it back at the front desk after the round. Order by ${D} days before your round.`,
    terms: `Chosen-set club rental (${FEE} per set): ordered once your booking is confirmed and no later than ${D} days before the round. Changes and cancellation are free until the set is shipped, about three days before the round; after shipment the set fee is not refunded, including when the course closes for weather. Lost or damaged clubs are charged at the supplier's rate.`,
    fvBenefit: "Rental clubs of your choice: TaylorMade, Callaway, PING, XXIO",
    inclusionNote: `Course rental, or choose the set (TaylorMade, Callaway, PING…) for ${FEE}`,
    perSet: `+${FEE} per set, paid with our fee`, remove: "Remove",
  },
  ja: {
    heading: "レンタルクラブは2通り",
    lede: "ゴルフ場でもクラブは借りられますが、メーカーやモデルは選べません。使いたいセットがある方には、当社が手配してゴルフ場に届けておきます。",
    course: { title: "ゴルフ場のレンタル", price: "5,000円前後・ゴルフ場払い", body: "ゴルフ場の在庫からの標準セット。メーカー・モデルはゴルフ場任せ。右・左利きはリクエスト可。" },
    chosen: { title: "モデルを選んで借りる", price: `1セット${FEE}・手配料と一緒にお支払い`, body: "下からメーカー・モデル・フレックスを選択。前日にゴルフ場へ届き、プレー後はフロントで同梱の伝票を使って返送するだけです。" },
    gridH: "選べるセット",
    gridNote: "提携先の現在のラインナップの一例です。在庫はご提案時に確認し、欠品の場合は同等のセットをご案内します。",
    deadline: `お申し込みはプレー${D}日前まで。`,
    cancel: "発送（プレー約3日前）までは変更・取消無料。発送後はセット料金の返金はありません。",
    returns: "ドライバー、フェアウェイウッド、ユーティリティ、アイアン、ウェッジ、パター、キャディバッグ。いずれも中古で、プレーに支障のない状態です。",
    details: "詳細", close: "閉じる",
    hand: { right: "右利き", left: "左利き" }, gender: { men: "メンズ", ladies: "レディース" }, tier: { entry: "エントリー", standard: "スタンダード", premium: "プレミアム" }, flex: "フレックス",
    setIncludes: "ドライバー、フェアウェイウッド、ユーティリティ、アイアン、ウェッジ、パター、キャディバッグ。",
    condition: "中古セット（プレーに支障のない状態）。在庫はご提案時に確認します。",
    pickThis: "このセットにする", picked: "選択中",
    option: "指定モデル", optionShort: "指定セット", choose: "セットを選ぶ", change: "変更", notChosen: "セット未選択", forGolfer: "{golfer}のセット",
    line: "指定レンタル × {n}", total: "手配料 {fee} + 指定レンタル {rental} × {n}", feeWord: "手配料",
    faqQ: "レンタルクラブのメーカーやモデルは選べますか?",
    faqA: `はい。ゴルフ場のレンタルはゴルフ場任せですが、1セット${FEE}で選んだセットを手配し、前日にゴルフ場へ届けます。プレー後はフロントで返送。お申し込みはプレー${D}日前までです。`,
    terms: `指定セットのレンタル（1セット${FEE}）は、予約確定後かつプレー${D}日前までに手配します。発送（プレー約3日前）までは変更・取消無料、発送後はセット料金の返金はありません（天候によるクローズ時も同様）。紛失・破損は提携先の規定額をご負担いただきます。`,
    fvBenefit: "レンタルクラブはモデルを指定可: テーラーメイド、キャロウェイ、PING、XXIO",
    inclusionNote: `ゴルフ場のレンタル、または指定モデル（テーラーメイド、キャロウェイ、PING…）を1セット${FEE}で`,
    perSet: `+${FEE}／セット、手配料と一緒にお支払い`, remove: "取り消す",
  },
  es: {
    heading: "Palos de alquiler: dos opciones",
    lede: "Todos los campos alquilan palos, pero no puedes elegir marca ni modelo. Si quieres un set concreto, lo pedimos y te espera en el campo.",
    course: { title: "Alquiler del campo", price: "Unos ¥5,000, se pagan en el club", body: "Un set estándar del almacén del club. Marca y modelo los decide el club; diestro o zurdo bajo petición." },
    chosen: { title: "Elige tu set", price: `${FEE} por set, se paga con nuestra tarifa`, body: "Elige marca, modelo y flex abajo. El set llega al campo el día anterior; tras la vuelta lo entregas en recepción con la etiqueta de devolución incluida." },
    gridH: "Sets que puedes elegir",
    gridNote: "Ejemplos de la gama actual de nuestro proveedor. La disponibilidad se confirma con la propuesta; si falta un set ofrecemos uno equivalente.",
    deadline: `Pídelo hasta ${D} días antes de la vuelta.`,
    cancel: "Cambio o cancelación gratis hasta el envío (unos tres días antes); después no se devuelve el importe del set.",
    returns: "Driver, madera de calle, híbrido, hierros, wedges, putter y bolsa. Todos los sets son usados y en buen estado de juego.",
    details: "Detalles", close: "Cerrar",
    hand: { right: "Diestro", left: "Zurdo" }, gender: { men: "Hombre", ladies: "Mujer" }, tier: { entry: "Básico", standard: "Estándar", premium: "Premium" }, flex: "Flex",
    setIncludes: "Driver, madera de calle, híbrido, hierros, wedges, putter y bolsa.",
    condition: "Set usado en buen estado de juego. La disponibilidad se confirma con la propuesta.",
    pickThis: "Elegir este set", picked: "Elegido",
    option: "Modelo elegido", optionShort: "Set elegido", choose: "Elegir un set", change: "Cambiar", notChosen: "Sin set elegido", forGolfer: "Set para {golfer}",
    line: "Alquiler de palos × {n}", total: "{fee} de tarifa + {rental} alquiler de palos × {n}", feeWord: "tarifa",
    faqQ: "¿Puedo elegir la marca y el modelo de los palos de alquiler?",
    faqA: `Sí. Los sets del campo los elige el club. Por ${FEE} por set pedimos el que elijas y llega al campo el día anterior; lo entregas en recepción tras la vuelta. Pídelo hasta ${D} días antes.`,
    terms: `Alquiler de set elegido (${FEE} por set): se pide una vez confirmada la reserva y como máximo ${D} días antes de la vuelta. Cambios y cancelación gratis hasta el envío, unos tres días antes; tras el envío no se devuelve el importe del set, tampoco si el campo cierra por el tiempo. Pérdida o daños se cobran según la tarifa del proveedor.`,
    fvBenefit: "Palos de alquiler a tu elección: TaylorMade, Callaway, PING, XXIO",
    inclusionNote: `Alquiler del campo, o el set que elijas (TaylorMade, Callaway, PING…) por ${FEE}`,
    perSet: `+${FEE} por set, se paga con nuestra tarifa`, remove: "Quitar",
  },
  fr: {
    heading: "Clubs de location : deux façons",
    lede: "Chaque parcours loue des clubs, mais vous ne choisissez ni la marque ni le modèle. Si vous souhaitez un set précis, nous le commandons et il vous attend au parcours.",
    course: { title: "Location du parcours", price: "Environ ¥5,000, réglés au club", body: "Un set standard du stock du club. Marque et modèle au choix du club ; droitier ou gaucher sur demande." },
    chosen: { title: "Choisissez votre set", price: `${FEE} par set, réglés avec nos frais`, body: "Choisissez marque, modèle et flex ci-dessous. Le set est livré au parcours la veille ; après la partie, vous le rendez à l'accueil avec l'étiquette de retour fournie." },
    gridH: "Sets au choix",
    gridNote: "Exemples de la gamme actuelle de notre fournisseur. La disponibilité est confirmée avec la proposition ; si un set manque, nous proposons un équivalent.",
    deadline: `À commander jusqu'à ${D} jours avant la partie.`,
    cancel: "Modification ou annulation gratuite jusqu'à l'expédition (environ trois jours avant) ; ensuite, le prix du set n'est pas remboursé.",
    returns: "Driver, bois de parcours, hybride, fers, wedges, putter et sac. Tous les sets sont d'occasion et en bon état de jeu.",
    details: "Détails", close: "Fermer",
    hand: { right: "Droitier", left: "Gaucher" }, gender: { men: "Homme", ladies: "Femme" }, tier: { entry: "Entrée", standard: "Standard", premium: "Premium" }, flex: "Flex",
    setIncludes: "Driver, bois de parcours, hybride, fers, wedges, putter et sac.",
    condition: "Set d'occasion en bon état de jeu. Disponibilité confirmée avec la proposition.",
    pickThis: "Choisir ce set", picked: "Choisi",
    option: "Modèle choisi", optionShort: "Set choisi", choose: "Choisir un set", change: "Modifier", notChosen: "Aucun set choisi", forGolfer: "Set pour {golfer}",
    line: "Location de clubs × {n}", total: "{fee} de frais + {rental} location de clubs × {n}", feeWord: "frais",
    faqQ: "Puis-je choisir la marque et le modèle des clubs de location ?",
    faqA: `Oui. Les sets du parcours sont au choix du club. Pour ${FEE} par set, nous commandons celui que vous choisissez et il est livré au parcours la veille ; vous le rendez à l'accueil après la partie. À commander jusqu'à ${D} jours avant.`,
    terms: `Location d'un set choisi (${FEE} par set) : commandée une fois la réservation confirmée et au plus tard ${D} jours avant la partie. Modification et annulation gratuites jusqu'à l'expédition, environ trois jours avant ; après expédition, le prix du set n'est pas remboursé, y compris si le parcours ferme pour cause de météo. Perte ou dommages facturés au tarif du fournisseur.`,
    fvBenefit: "Clubs de location au choix : TaylorMade, Callaway, PING, XXIO",
    inclusionNote: `Location du parcours, ou le set de votre choix (TaylorMade, Callaway, PING…) pour ${FEE}`,
    perSet: `+${FEE} par set, réglés avec nos frais`, remove: "Retirer",
  },
  "zh-tw": {
    heading: "租借球桿：兩種方式",
    lede: "每個球場都有租借球桿，但無法指定品牌與型號。想用特定球桿組的話，由我們代訂並送到球場等你。",
    course: { title: "球場租借", price: "約 ¥5,000，在球場支付", body: "球場庫存的標準球桿組。品牌與型號由球場決定；可要求右手或左手。" },
    chosen: { title: "自選球桿組", price: `每組 ${FEE}，與代辦費一起支付`, body: "在下方選擇品牌、型號與硬度。球桿組於前一天送達球場；打完後連同內附的回寄單交給櫃檯即可。" },
    gridH: "可選的球桿組",
    gridNote: "合作供應商現有產品的範例。可用性於提案時確認；若缺貨將提供同等球桿組。",
    deadline: `請於開球 ${D} 天前申請。`,
    cancel: "出貨前（約開球前 3 天）可免費更改或取消；出貨後球桿組費用不退。",
    returns: "一號木、球道木、混合桿、鐵桿、挖起桿、推桿與球袋。皆為二手，狀態良好可正常使用。",
    details: "詳細", close: "關閉",
    hand: { right: "右手", left: "左手" }, gender: { men: "男士", ladies: "女士" }, tier: { entry: "入門", standard: "標準", premium: "高階" }, flex: "硬度",
    setIncludes: "一號木、球道木、混合桿、鐵桿、挖起桿、推桿與球袋。",
    condition: "二手球桿組，狀態良好。可用性於提案時確認。",
    pickThis: "選擇此組", picked: "已選",
    option: "指定型號", optionShort: "指定球桿組", choose: "選擇球桿組", change: "更改", notChosen: "尚未選擇", forGolfer: "{golfer}的球桿組",
    line: "指定租借 × {n}", total: "代辦費 {fee} + 指定租借 {rental} × {n}", feeWord: "代辦費",
    faqQ: "可以指定租借球桿的品牌與型號嗎？",
    faqA: `可以。球場的租借球桿由球場決定；每組 ${FEE}，我們代訂你選的球桿組並於前一天送到球場，打完後交給櫃檯即可。請於開球 ${D} 天前申請。`,
    terms: `指定球桿組租借（每組 ${FEE}）：於預約確認後、最遲開球 ${D} 天前代訂。出貨前（約開球前 3 天）可免費更改或取消；出貨後球桿組費用不退，球場因天候關閉亦同。遺失或損壞依供應商規定收費。`,
    fvBenefit: "租借球桿可指定型號：TaylorMade、Callaway、PING、XXIO",
    inclusionNote: `球場租借，或指定球桿組（TaylorMade、Callaway、PING…）每組 ${FEE}`,
    perSet: `+${FEE}／組，與代辦費一起支付`, remove: "取消選擇",
  },
};
