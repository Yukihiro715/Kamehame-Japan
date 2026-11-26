import type { ArticleBlock } from "@/lib/articles";
import { catalogFor } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { addOnTotal, pricingFor, yen } from "@/lib/pricing";

export const TEA_COMPARISON_SLUG = "choosing-tea-ceremony-kyoto";
export type TeaBookingTable = Extract<ArticleBlock, { type: "table" }> & { rowLinks: string[] };

const teaComparison = {
  en: {
    heading: "Private or shared tea ceremony in Higashiyama?",
    caption: "Total cost for two guests, including tax (regular / peak season)",
    columns: ["Session", "Who can join", "Tea ceremony", "With two kimono"],
    private: "Private tea ceremony", shared: "Shared tea ceremony",
    privateGroup: "1–5 guests, ages 4+", sharedGroup: "Up to 8 guests in the room, ages 6+",
    family: "For a four- or five-year-old, choose the private session. Both sessions last about 45 minutes and are led in English.",
    booking: "Kimono rental is optional and arranged separately. The experience page shows how to request your date. If it offers payment now, your booking is provisional until the host confirms. If your preferred slot is unavailable and we cannot agree on an alternative, we refund the full payment.",
  },
  ja: {
    heading: "東山の茶道体験で貸切と相席を比較",
    caption: "2名分の税込総額（通常期／繁忙期）",
    columns: ["プラン", "参加条件", "茶道体験のみ", "着物2名分込み"],
    private: "貸切茶道", shared: "相席茶道",
    privateGroup: "1〜5名・4歳以上", sharedGroup: "最大8名で相席・6歳以上",
    family: "4〜5歳のお子様がご参加の場合は貸切をお選びください。どちらも英語で進行し、所要時間は約45分です。",
    booking: "着物は別途お申し込みいただけます。希望日時のお申し込み方法は各体験ページをご確認ください。先にお支払いいただく場合は仮予約となり、施設確認後に確定します。希望枠が満席で代替案に合意できなければ全額を返金します。",
  },
  es: {
    heading: "¿Ceremonia privada o compartida en Higashiyama?",
    caption: "Precio total para dos personas, impuestos incluidos (temporada normal / alta)",
    columns: ["Sesión", "Participantes", "Solo ceremonia", "Con dos kimonos"],
    private: "Ceremonia privada", shared: "Ceremonia compartida",
    privateGroup: "De 1 a 5 personas, desde 4 años", sharedGroup: "Hasta 8 en la sala, desde 6 años",
    family: "Si viaja con un niño de 4 o 5 años, elija la sesión privada. Ambas sesiones duran unos 45 minutos y se imparten en inglés.",
    booking: "El alquiler de kimono es opcional y se gestiona por separado. Consulte cómo solicitar su fecha en la página de la experiencia. Si paga en el momento, la reserva es provisional hasta la confirmación del anfitrión. Si su horario no está disponible y no acordamos una alternativa, le devolvemos el importe íntegro.",
  },
  fr: {
    heading: "Cérémonie privée ou partagée à Higashiyama ?",
    caption: "Prix total pour deux personnes, taxes comprises (saison normale / haute saison)",
    columns: ["Séance", "Participants", "Cérémonie seule", "Avec deux kimonos"],
    private: "Cérémonie privée", shared: "Cérémonie partagée",
    privateGroup: "1 à 5 personnes, dès 4 ans", sharedGroup: "Jusqu’à 8 dans la salle, dès 6 ans",
    family: "Si vous venez avec un enfant de 4 ou 5 ans, choisissez la séance privée. Les deux séances durent environ 45 minutes et sont animées en anglais.",
    booking: "La location de kimono est facultative et se réserve séparément. Consultez la fiche pour savoir comment demander votre date. En cas de paiement immédiat, la réservation reste provisoire jusqu’à la confirmation de l’hôte. Si le créneau est indisponible et qu’aucune autre option ne vous convient, le paiement est intégralement remboursé.",
  },
  "zh-tw": {
    heading: "東山茶道怎麼選？比較包場與共席",
    caption: "兩人含稅總價（一般期間／旺季）",
    columns: ["場次", "參加條件", "僅茶道體驗", "含兩人和服"],
    private: "包場茶道", shared: "共席茶道",
    privateGroup: "1 至 5 人，4 歲以上", sharedGroup: "同場最多 8 人，6 歲以上",
    family: "若有 4 至 5 歲的兒童參加，請選擇包場。兩種場次都以英語進行，約 45 分鐘。",
    booking: "和服租借可另行加訂。請在體驗頁查看提出日期需求的方式。如選擇立即付款，須待主辦方確認才完成預訂。若原時段已滿，且無法就替代方案達成共識，會全額退款。",
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

export function higashiyamaTeaComparison(lang: Lang): (ArticleBlock | TeaBookingTable)[] {
  const copy = teaComparison[lang];
  const { experiences } = catalogFor(lang);
  const english = lang === "en" ? experiences : catalogFor("en").experiences;
  const options = [
    { slug: "kyoto-higashiyama-private-tea-ceremony", title: copy.private, group: copy.privateGroup },
    { slug: "kyoto-higashiyama-shared-tea-ceremony", title: copy.shared, group: copy.sharedGroup },
  ];
  const rows = options.flatMap(({ slug, title, group }) => {
    const localized = experiences.find((entry) => entry.slug === slug);
    const experience = localized ?? english.find((entry) => entry.slug === slug);
    if (!experience) return [];
    const targetLang = localized ? lang : "en";
    const pricing = pricingFor(experience, targetLang);
    const regular = pricing.rows.find((row) => row.party === 2);
    const peak = pricing.highSeason?.rows.find((row) => row.party === 2);
    if (!regular || !peak) return [];
    const kimono = addOnTotal(pricing, ["kimono"], 2);
    return [{
      cells: [targetLang === lang ? title : `${title} (EN)`, group, `${yen(regular.total)} / ${yen(peak.total)}`, `${yen(regular.total + kimono)} / ${yen(peak.total + kimono)}`],
      href: `/${targetLang}/${experience.city}/${slug}/#request-form`,
    }];
  });
  return [
    `## ${copy.heading}`,
    { type: "table", caption: copy.caption, headings: copy.columns, rows: rows.map(({ cells }) => cells), rowLinks: rows.map(({ href }) => href) },
    copy.family,
    copy.booking,
  ];
}
