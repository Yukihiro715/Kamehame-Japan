/** Words on the experience listings: the filter bar, the sort menu, the view
 *  toggle and the card (components/site/listing-grid.tsx). */
import type { Lang } from "@/lib/i18n";

export interface ListingCopy {
  found: (n: number) => string; filters: string; clear: string; done: string; sort: string;
  sortRecommended: string; sortPriceAsc: string; sortPriceDesc: string; sortDuration: string; sortRating: string;
  viewGrid: string; viewList: string;
  city: string; interest: string; duration: string; price: string; group: string; booking: string;
  dur: [string, string, string, string]; priceBand: [string, string, string, string];
  privateOnly: string; smallGroup: string; instant: string; onRequest: string;
  noMatch: string; reviews: (n: number) => string; previous: string; next: string; photoOf: (i: number, n: number) => string;
}

const COPY: Record<Lang, ListingCopy> = {
  en: {
    found: (n) => `${n} experience${n === 1 ? "" : "s"} found`, filters: "Filters", clear: "Clear all", done: "Show results", sort: "Sort",
    sortRecommended: "Recommended", sortPriceAsc: "Price: low to high", sortPriceDesc: "Price: high to low", sortDuration: "Shortest first", sortRating: "Top rated",
    viewGrid: "Grid view", viewList: "List view",
    city: "City", interest: "Interest", duration: "Duration", price: "Price (from)", group: "Group", booking: "Booking",
    dur: ["Up to 1 hour", "1–2 hours", "2–4 hours", "Half day or more"], priceBand: ["Under ¥10,000", "¥10,000–20,000", "¥20,000–40,000", "¥40,000 and up"],
    privateOnly: "Private", smallGroup: "Small group", instant: "Instant booking", onRequest: "On request",
    noMatch: "Nothing matches these filters yet. Clear one or two to see more.", reviews: (n) => `(${n})`, previous: "Previous photo", next: "Next photo", photoOf: (i, n) => `Photo ${i} of ${n}`,
  },
  ja: {
    found: (n) => `${n} 件の体験`, filters: "絞り込み", clear: "すべて解除", done: "結果を見る", sort: "並び順",
    sortRecommended: "おすすめ順", sortPriceAsc: "価格が安い順", sortPriceDesc: "価格が高い順", sortDuration: "所要時間が短い順", sortRating: "評価が高い順",
    viewGrid: "グリッド表示", viewList: "リスト表示",
    city: "都市", interest: "ジャンル", duration: "所要時間", price: "料金（〜から）", group: "グループ", booking: "予約方法",
    dur: ["1時間以内", "1〜2時間", "2〜4時間", "半日以上"], priceBand: ["¥10,000未満", "¥10,000〜20,000", "¥20,000〜40,000", "¥40,000以上"],
    privateOnly: "貸切", smallGroup: "少人数", instant: "即時予約", onRequest: "リクエスト予約",
    noMatch: "この条件に合う体験はまだありません。条件を減らしてみてください。", reviews: (n) => `(${n})`, previous: "前の写真", next: "次の写真", photoOf: (i, n) => `写真 ${i} / ${n}`,
  },
  es: {
    found: (n) => `${n} experiencia${n === 1 ? "" : "s"}`, filters: "Filtros", clear: "Borrar todo", done: "Ver resultados", sort: "Ordenar",
    sortRecommended: "Recomendado", sortPriceAsc: "Precio: de menor a mayor", sortPriceDesc: "Precio: de mayor a menor", sortDuration: "Más cortas primero", sortRating: "Mejor valoradas",
    viewGrid: "Vista en cuadrícula", viewList: "Vista en lista",
    city: "Ciudad", interest: "Interés", duration: "Duración", price: "Precio (desde)", group: "Grupo", booking: "Reserva",
    dur: ["Hasta 1 hora", "1–2 horas", "2–4 horas", "Medio día o más"], priceBand: ["Menos de ¥10.000", "¥10.000–20.000", "¥20.000–40.000", "¥40.000 o más"],
    privateOnly: "Privado", smallGroup: "Grupo reducido", instant: "Reserva inmediata", onRequest: "Bajo petición",
    noMatch: "Ninguna experiencia coincide con estos filtros. Quita alguno para ver más.", reviews: (n) => `(${n})`, previous: "Foto anterior", next: "Foto siguiente", photoOf: (i, n) => `Foto ${i} de ${n}`,
  },
  fr: {
    found: (n) => `${n} expérience${n === 1 ? "" : "s"}`, filters: "Filtres", clear: "Tout effacer", done: "Voir les résultats", sort: "Trier",
    sortRecommended: "Recommandé", sortPriceAsc: "Prix croissant", sortPriceDesc: "Prix décroissant", sortDuration: "Les plus courtes d'abord", sortRating: "Mieux notées",
    viewGrid: "Vue grille", viewList: "Vue liste",
    city: "Ville", interest: "Thème", duration: "Durée", price: "Prix (dès)", group: "Groupe", booking: "Réservation",
    dur: ["Jusqu'à 1 h", "1–2 h", "2–4 h", "Demi-journée ou plus"], priceBand: ["Moins de ¥10 000", "¥10 000–20 000", "¥20 000–40 000", "¥40 000 et plus"],
    privateOnly: "Privé", smallGroup: "Petit groupe", instant: "Réservation immédiate", onRequest: "Sur demande",
    noMatch: "Aucune expérience ne correspond à ces filtres. Retirez-en un ou deux pour en voir plus.", reviews: (n) => `(${n})`, previous: "Photo précédente", next: "Photo suivante", photoOf: (i, n) => `Photo ${i} sur ${n}`,
  },
  "zh-tw": {
    found: (n) => `共 ${n} 個體驗`, filters: "篩選", clear: "全部清除", done: "查看結果", sort: "排序",
    sortRecommended: "推薦排序", sortPriceAsc: "價格由低到高", sortPriceDesc: "價格由高到低", sortDuration: "時間由短到長", sortRating: "評價最高",
    viewGrid: "格狀檢視", viewList: "列表檢視",
    city: "城市", interest: "主題", duration: "所需時間", price: "價格（起）", group: "人數", booking: "預約方式",
    dur: ["1 小時以內", "1–2 小時", "2–4 小時", "半天以上"], priceBand: ["¥10,000 以下", "¥10,000–20,000", "¥20,000–40,000", "¥40,000 以上"],
    privateOnly: "包場", smallGroup: "小團體", instant: "即時預約", onRequest: "需確認",
    noMatch: "目前沒有符合條件的體驗，請減少篩選條件。", reviews: (n) => `(${n})`, previous: "上一張", next: "下一張", photoOf: (i, n) => `第 ${i} 張，共 ${n} 張`,
  },
};
export const listingCopy = (lang: Lang) => COPY[lang] ?? COPY.en;
