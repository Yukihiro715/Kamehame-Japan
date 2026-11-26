// Newly approved direct reviews are separate from the unchanged partner archive.
import { REVIEWS_PUBLISHED, reviewsFor as archivedReviewsFor, type Review, type Aggregate } from "@/lib/reviews";
export { REVIEWS_PUBLISHED, reviewDate, sampleReviewsFor, featuredReviews } from "@/lib/reviews";
export type { Review, Aggregate } from "@/lib/reviews";

const DIRECT_REVIEWS: Review[] = [
  // Direct submission matched to the confirmed 6 Nov golf booking.
  // Text publication consent covers the original review and first name.
  {
    id: "suan-golf-2026-11", experience: "mt-fuji-golf-day", rating: 5,
    author: "Suan", country: "", source: "direct", verified: true, date: "2026-11-06",
    body: "Booked through KAMEHAME JAPAN for a private twosome at Kumagaya Golf Club on 6 November. Yukihiro arranged the rental clubs and shoes, and sent clear train and shuttle directions.\n\nYukihiro was very helpful and professional throughout. He took the time to understand our requirements and made sure everything was arranged to suit us, and his communication was prompt and clear from start to finish.\n\nThe golf club he recommended was well maintained, with good facilities, and the day itself ran smoothly. Overall, our first golf experience in Japan was a very pleasant one.",
    i18n: {
      ja: { body: "11月6日、KAMEHAME JAPANを通じて熊谷ゴルフクラブで2人だけのラウンドを予約しました。Yukihiroさんはレンタルクラブとシューズを手配し、電車と送迎バスの乗り方を分かりやすく案内してくれました。\n\nYukihiroさんは最初から最後まで親切で、プロフェッショナルな対応でした。私たちの希望を丁寧に聞いて、それに合うようにすべて手配してくれました。連絡も終始迅速で明快でした。\n\n勧めてくれたゴルフクラブは手入れが行き届き、設備も充実していて、当日もスムーズに進みました。日本で初めてのゴルフは、とても楽しい体験になりました。" },
      es: { body: "Reservamos a través de KAMEHAME JAPAN una ronda privada para dos en el Kumagaya Golf Club el 6 de noviembre. Yukihiro gestionó el alquiler de palos y zapatos y nos envió indicaciones claras para llegar en tren y en el autobús del club.\n\nYukihiro fue muy atento y profesional en todo momento. Se tomó el tiempo de entender lo que necesitábamos y se aseguró de que todo se organizara según nuestras preferencias. Su comunicación fue rápida y clara de principio a fin.\n\nEl club de golf que nos recomendó estaba bien cuidado y tenía buenas instalaciones, y la jornada transcurrió sin contratiempos. En conjunto, nuestra primera experiencia de golf en Japón fue muy agradable." },
      fr: { body: "Nous avons réservé auprès de KAMEHAME JAPAN une partie privée à deux au Kumagaya Golf Club le 6 novembre. Yukihiro a organisé la location des clubs et des chaussures et nous a envoyé des indications claires pour le train et la navette.\n\nYukihiro s’est montré très serviable et professionnel tout au long de la réservation. Il a pris le temps de comprendre nos besoins et s’est assuré que tout était organisé selon nos préférences. Ses échanges ont été rapides et clairs du début à la fin.\n\nLe club qu’il nous a recommandé était bien entretenu, avec de bonnes installations, et la journée s’est déroulée sans accroc. Dans l’ensemble, notre première expérience de golf au Japon a été très agréable." },
      "zh-tw": { body: "我們透過 KAMEHAME JAPAN 預訂了 11 月 6 日在熊谷高爾夫俱樂部的雙人專場。Yukihiro 幫我們安排了球桿和球鞋租借，也提供了清楚的火車與接駁車搭乘指引。\n\nYukihiro 從頭到尾都很熱心且專業。他花時間了解我們的需求，確保每項安排都符合我們的需要，溝通也始終及時而清楚。\n\n他推薦的高爾夫俱樂部維護得很好，設施也很完善，當天一切順利。整體來說，我們第一次在日本打高爾夫球的體驗非常愉快。" },
    },
  },
  // Direct submission on 14 Nov, matched to the completed 10 Nov shared-bus
  // tour from Shinjuku to Taiheiyo Club Mashiko PGA, Tochigi (not Mt. Fuji).
  // Original English text preserved; first name only.
  {
    id: "neil-golf-2026-11", experience: "golf-bus", rating: 5,
    author: "Neil", country: "", source: "direct", verified: true, date: "2026-11-10",
    body: "Wasn't sure what to expect from the day after booking a few days before the round. Toshi our driver and guide was extremely helpful and helped me navigate golf etiquette in Japan and the different style of play I'm accustomed to in America. It was a long day but Toshi kept us on schedule and allowed time for breaks during the bus ride. The course was in excellent condition even though it rained the night before. I would highly recommend this trip for anyone wanting to experience golf in Japan.",
    i18n: {
      ja: { body: "ラウンドの数日前に予約したので、どんな一日になるのか想像がつきませんでした。運転手兼ガイドのToshiさんがとても親切で、日本のゴルフのマナーや、アメリカで慣れ親しんだプレースタイルとの違いを教えてくれました。長い一日でしたが、Toshiさんは予定どおりに進めながら、バスでの移動中に休憩時間も取ってくれました。前夜に雨が降ったにもかかわらず、コースのコンディションは素晴らしかったです。日本でゴルフを体験したい方に、このツアーをぜひおすすめします。" },
      es: { body: "Reservé unos días antes de la ronda y no sabía muy bien qué esperar. Toshi, nuestro conductor y guía, fue de gran ayuda. Me orientó sobre la etiqueta del golf en Japón y sobre las diferencias con la forma de jugar a la que estoy acostumbrado en Estados Unidos. Fue un día largo, pero Toshi mantuvo el horario y dejó tiempo para hacer pausas durante el trayecto en autobús. El campo estaba en excelentes condiciones a pesar de que había llovido la noche anterior. Recomiendo mucho esta excursión a cualquiera que quiera jugar al golf en Japón." },
      fr: { body: "J’avais réservé quelques jours avant la partie et je ne savais pas trop à quoi m’attendre. Toshi, notre chauffeur et guide, a été d’une grande aide. Il m’a expliqué l’étiquette du golf au Japon et les différences avec la façon de jouer à laquelle je suis habitué aux États-Unis. La journée a été longue, mais Toshi a respecté le programme tout en prévoyant des pauses pendant le trajet en bus. Le parcours était en excellent état malgré la pluie de la veille au soir. Je recommande vivement cette excursion à quiconque souhaite découvrir le golf au Japon." },
      "zh-tw": { body: "我在開打前幾天才預訂，不太確定這一天會是什麼樣子。司機兼導遊 Toshi 非常熱心，幫我了解日本的高爾夫禮儀，以及這裡的打球方式和我在美國習慣的方式有什麼不同。雖然行程很長，Toshi 還是讓我們按時走完全程，也在搭巴士途中安排了休息時間。儘管前一晚下了雨，球場的狀況仍然非常好。我很推薦想在日本體驗高爾夫的人參加這個行程。" },
    },
  },
  // Direct submission on 13 Nov, matched to the confirmed 12 Nov kendo booking.
  // Original English text preserved; first name only, no uploaded media.
  {
    id: "hui-nihonbashi-kendo-2026-11", experience: "nihonbashi-kendo-experience", rating: 5,
    author: "Hui", country: "", source: "direct", verified: true, date: "2026-11-12",
    body: "The teachers were really nice and patient. Course material (hard copy guide and all the armors) was sufficiently provided.",
    i18n: {
      ja: { body: "先生方はとても親切で、根気よく教えてくれました。教材（紙のガイドと防具一式）も十分に用意されていました。" },
      es: { body: "Los profesores fueron muy amables y pacientes. El material del curso (la guía impresa y todo el equipo de protección) se proporcionó en cantidad suficiente." },
      fr: { body: "Les enseignants étaient vraiment gentils et patients. Le matériel du cours (le guide imprimé et toutes les pièces d’armure) était fourni en quantité suffisante." },
      "zh-tw": { body: "老師們非常親切，也很有耐心。課程教材（紙本指南及全套護具）都準備得很充足。" },
    },
  },
  // Direct submission matched to the review invitation and confirmed booking
  // for Takane Country Club, 4 Nov 2026. Site/SNS photo consent received 7 Nov.
  // Keep the guest's original English wording and first name only.
  {
    id: "tyler-takane-2026-11", experience: "mt-fuji-golf-day", rating: 5,
    author: "Tyler", country: "", source: "direct", verified: true, date: "2026-11-04",
    body: "I tried booking golf for an upcoming Japan trip myself… to no avail. Time and time again, no tee times were available, or language barriers were getting in the way.\n\nI then figured, why not reach out to a pro? And tried Kamehame. Not only DID they book me my golf, but the booking process was quick, easy, informative, and they got me on an awesome course!\n\nEven up until the day of, they responded to emails rapidly, and helped me every step of the way. They are so, so awesome. Let them help you, you won’t regret it!!!",
    photos: ["/images/reviews/tyler-2026-11/group.webp", "/images/reviews/tyler-2026-11/tee-shot.webp", "/images/reviews/tyler-2026-11/course.webp"],
  },
];

export const reviewsFor = (experience: string): Review[] => REVIEWS_PUBLISHED
  ? [...DIRECT_REVIEWS.filter((r) => r.experience === experience), ...archivedReviewsFor(experience)]
  : [];

/** How many reviews gave each star, 5 down to 1, for the breakdown bars. */
export function distributionFor(experience: string, scope?: "partner"): { stars: number; count: number; share: number }[] {
  const rs = ratingReviewsFor(experience, scope);
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = rs.filter((r) => Math.round(r.rating) === stars).length;
    return { stars, count, share: rs.length ? count / rs.length : 0 };
  });
}

/** Only reviews written through our own booking flow count toward the rating
 *  we declare to search engines. */
export const ownReviewsFor = (experience: string): Review[] => reviewsFor(experience).filter((r) => r.verified === true && r.source !== "venue" && r.source !== "partner" && r.source !== "sample");

/** Once direct verified feedback exists, never blend it with partner ratings. */
export function ratingReviewsFor(experience: string, scope?: "partner"): Review[] {
  const list = reviewsFor(experience);
  if (scope === "partner") return list.filter((r) => r.source === "partner");
  const own = ownReviewsFor(experience);
  return own.length ? own : list;
}

/** Rating from our own verified reviews only — what structured data may declare. */
export function ownAggregateFor(experience: string): Aggregate | null {
  const rs = ownReviewsFor(experience);
  if (!rs.length) return null;
  return { average: Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10, count: rs.length };
}

export function aggregateFor(experience: string, scope?: "partner"): Aggregate | null {
  const list = ratingReviewsFor(experience, scope);
  if (list.length === 0) return null;
  const total = list.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / list.length) * 10) / 10, count: list.length };
}

