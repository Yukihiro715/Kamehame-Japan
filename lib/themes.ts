// Themes: the five "Find your Japan" tiles on the home page, each a group of
// catalog categories (by the English category tag in lib/catalog.ts). A theme
// has its own listing page, /{lang}/{theme}/, built by lib/collections.ts
// from every published experience in its categories — so the "Food & Drink"
// tile lists the ramen classes, the cooking seminar and the sushi class
// together, instead of sending visitors to a single category.

import { catalogFor, type Category } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

export interface Theme {
  slug: string;
  /** English category tags that belong to this theme (lib/catalog.ts). */
  tags: string[];
  img: string;
  mark: string;
  copy: Record<Lang, { title: string; sub: string; h1: string; lead: string; heroAlt: string }>;
}

export const THEMES: Theme[] = [
  {
    slug: "food", tags: ["Food"], img: "/images/ramen-noodle-machine.jpg", mark: "食",
    copy: {
      en: { title: "Food & Drink", sub: "Ramen / Sushi / Home cooking", h1: "Food & drink experiences in Japan", lead: "Cook, taste and understand the food Japan actually eats: ramen from scratch in a working kitchen, sushi and home cooking with the people who make them every day. Small groups, real kitchens, and the hosts eat with you.", heroAlt: "Fresh ramen noodles coming out of a noodle machine" },
      es: { title: "Comida y bebida", sub: "Ramen / Sushi / Cocina casera", h1: "Experiencias gastronómicas en Japón", lead: "Cocina, prueba y entiende la comida que Japón come de verdad: ramen desde cero en una cocina en activo, sushi y cocina casera con quienes la preparan cada día. Grupos reducidos, cocinas reales, y los anfitriones comen contigo.", heroAlt: "Fideos de ramen frescos saliendo de la máquina" },
      ja: { title: "食と酒", sub: "ラーメン / 寿司 / 家庭料理", h1: "日本の食の体験", lead: "日本人が本当に食べているものを、作って、味わって、知る。営業中の厨房で麺から作るラーメン、毎日それを作っている人と学ぶ寿司や家庭料理。少人数、本物の厨房、そして作り手と一緒に食卓を囲みます。", heroAlt: "製麺機から出てくる打ちたてのラーメンの麺" },
      fr: { title: "Cuisine et boissons", sub: "Ramen / Sushi / Cuisine familiale", h1: "Expériences culinaires au Japon", lead: "Cuisinez, goûtez et comprenez ce que le Japon mange vraiment : des ramen de A à Z dans une cuisine en activité, des sushi et de la cuisine familiale avec ceux qui les préparent chaque jour. Petits groupes, vraies cuisines, et les hôtes mangent avec vous.", heroAlt: "Nouilles de ramen fraîches sortant de la machine" },
      "zh-tw": { title: "美食與酒", sub: "拉麵 / 壽司 / 家常料理", h1: "日本的美食體驗", lead: "親手做、親口嚐，認識日本人真正在吃的食物：在營業中的廚房從麵條開始做拉麵，跟每天在做的人學壽司與家常料理。小團、真實的廚房，主人與你同桌。", heroAlt: "剛從製麵機出來的新鮮拉麵" },
    },
  },
  {
    slug: "arts-crafts", tags: ["Arts & crafts"], img: "/images/kanji-works-table.jpg", mark: "書",
    copy: {
      en: { title: "Arts & Crafts", sub: "Calligraphy / Knife making", h1: "Arts & crafts experiences in Japan", lead: "Make something with your hands under a working craftsperson: your name in brush calligraphy, a kitchen knife you forge and sharpen yourself. You take the piece home.", heroAlt: "Finished calligraphy works laid out on a table" },
      es: { title: "Arte y oficios", sub: "Caligrafía / Cuchillos", h1: "Experiencias de arte y oficios en Japón", lead: "Crea algo con tus manos junto a un artesano en activo: tu nombre en caligrafía con pincel, un cuchillo de cocina que forjas y afilas tú mismo. Te llevas la pieza a casa.", heroAlt: "Obras de caligrafía terminadas sobre una mesa" },
      ja: { title: "アート・工芸", sub: "書道 / 包丁づくり", h1: "日本のアート・工芸の体験", lead: "現役の職人のもとで、自分の手で何かを作る。筆で書く自分の名前、自分で鍛えて研ぐ包丁。作品は持ち帰れます。", heroAlt: "机に並んだ完成した書の作品" },
      fr: { title: "Arts et artisanat", sub: "Calligraphie / Couteaux", h1: "Expériences d'arts et d'artisanat au Japon", lead: "Fabriquez quelque chose de vos mains auprès d'un artisan en activité : votre nom en calligraphie au pinceau, un couteau de cuisine que vous forgez et aiguisez vous-même. Vous repartez avec la pièce.", heroAlt: "Œuvres de calligraphie terminées posées sur une table" },
      "zh-tw": { title: "藝術與工藝", sub: "書道 / 製刀", h1: "日本的藝術與工藝體驗", lead: "在現役職人身旁親手做一件作品：用毛筆寫下自己的名字，親手鍛造並研磨一把菜刀。作品帶回家。", heroAlt: "桌上排列的完成書法作品" },
    },
  },
  {
    slug: "tradition", tags: ["Traditional"], img: "/images/geiko-dance.jpg", mark: "芸",
    copy: {
      en: { title: "Tradition & Culture", sub: "Geiko / Tea Ceremony / Kendo / Samurai", h1: "Tradition & culture experiences in Japan", lead: "The living traditions, from the inside: an evening with a geiko, a tea ceremony, kendo in a working dojo, samurai sword choreography, rakugo and the performing arts. Hosted by the people who practise them, in small groups.", heroAlt: "A geiko performing a dance" },
      es: { title: "Tradición y cultura", sub: "Geiko / Ceremonia del té / Kendo / Samurái", h1: "Experiencias de tradición y cultura en Japón", lead: "Las tradiciones vivas, desde dentro: una velada con una geiko, una ceremonia del té, kendo en un dojo en activo, coreografía de espada samurái, rakugo y artes escénicas. Con quienes las practican, en grupos reducidos.", heroAlt: "Una geiko bailando" },
      ja: { title: "伝統と文化", sub: "芸妓・舞妓 / 茶道 / 剣道 / 侍", h1: "日本の伝統と文化の体験", lead: "生きている伝統を、内側から。芸妓とのひととき、茶道、現役の道場での剣道、殺陣、落語、伝統芸能。それを実践している人が少人数でもてなします。", heroAlt: "舞を披露する芸妓" },
      fr: { title: "Tradition et culture", sub: "Geiko / Cérémonie du thé / Kendo / Samouraï", h1: "Expériences de tradition et de culture au Japon", lead: "Les traditions vivantes, de l'intérieur : une soirée avec une geiko, une cérémonie du thé, le kendo dans un dojo en activité, la chorégraphie au sabre des samouraïs, le rakugo et les arts de la scène. Avec ceux qui les pratiquent, en petits groupes.", heroAlt: "Une geiko exécutant une danse" },
      "zh-tw": { title: "傳統與文化", sub: "藝妓 / 茶道 / 劍道 / 武士", h1: "日本的傳統與文化體驗", lead: "從內部體驗活著的傳統：與藝妓共度一晚、茶道、在現役道場練劍道、武士刀的殺陣、落語與傳統藝能。由實際從事的人以小團接待。", heroAlt: "正在表演舞蹈的藝妓" },
    },
  },
  {
    slug: "pop-culture", tags: ["Pop culture"], img: "/images/cat-nail.jpg", mark: "爪",
    copy: {
      en: { title: "Pop Culture & Beauty", sub: "Character Nails / Anime", h1: "Pop culture & beauty experiences in Japan", lead: "The culture shaping Japan today, hands-on: character nail art and more to come.", heroAlt: "Anime-inspired nail art" },
      es: { title: "Cultura pop y belleza", sub: "Uñas de personajes / Anime", h1: "Experiencias de cultura pop y belleza en Japón", lead: "La cultura que da forma al Japón de hoy, en primera persona: nail art de personajes y más por venir.", heroAlt: "Nail art inspirado en el anime" },
      ja: { title: "ポップカルチャー・美容", sub: "キャラクターネイル / アニメ", h1: "日本のポップカルチャー・美容の体験", lead: "いまの日本をかたちづくる文化を、手を動かして。キャラクターネイルほか、順次追加予定。", heroAlt: "アニメ風のネイルアート" },
      fr: { title: "Pop culture et beauté", sub: "Nail art / Anime", h1: "Expériences de pop culture et de beauté au Japon", lead: "La culture qui façonne le Japon d'aujourd'hui, en pratique : nail art de personnages, et d'autres à venir.", heroAlt: "Nail art inspiré de l'anime" },
      "zh-tw": { title: "流行文化與美容", sub: "角色美甲 / 動漫", h1: "日本的流行文化與美容體驗", lead: "親身體驗形塑今日日本的文化：角色美甲，更多陸續推出。", heroAlt: "動漫風格的美甲" },
    },
  },
  {
    slug: "sports", tags: ["Sport"], img: "/images/cat-sumo.jpg", mark: "武",
    copy: {
      en: { title: "Sports & Outdoors", sub: "Golf / Sumo", h1: "Sports & outdoors experiences in Japan", lead: "Japan outdoors and in motion: a tee time booked at a course that welcomes visitors, and more to come.", heroAlt: "Sumo wrestlers at morning practice" },
      es: { title: "Deporte y aire libre", sub: "Golf / Sumo", h1: "Experiencias de deporte y aire libre en Japón", lead: "Japón al aire libre y en movimiento: una hora de salida reservada en un campo que recibe visitantes, y más por venir.", heroAlt: "Luchadores de sumo en el entrenamiento matinal" },
      ja: { title: "スポーツ・アウトドア", sub: "ゴルフ / 相撲", h1: "日本のスポーツ・アウトドアの体験", lead: "屋外で、体を動かして味わう日本。ビジターを受け入れるコースでのティータイム手配ほか、順次追加予定。", heroAlt: "朝稽古の力士たち" },
      fr: { title: "Sport et plein air", sub: "Golf / Sumo", h1: "Expériences de sport et de plein air au Japon", lead: "Le Japon en plein air et en mouvement : un départ réservé sur un parcours qui accueille les visiteurs, et d'autres à venir.", heroAlt: "Lutteurs de sumo à l'entraînement du matin" },
      "zh-tw": { title: "運動與戶外", sub: "高爾夫 / 相撲", h1: "日本的運動與戶外體驗", lead: "在戶外、在運動中體驗日本：在歡迎訪客的球場預約開球時間，更多陸續推出。", heroAlt: "晨練中的相撲力士" },
    },
  },
];

const EN_TAG_BY_CATEGORY: Record<string, string> = Object.fromEntries(catalogFor("en").categories.map((c) => [c.slug, c.tag]));

export const themeBySlug = (slug: string) => THEMES.find((th) => th.slug === slug);

/** The published categories (in the page language) that belong to a theme. */
export const themeCategories = (theme: Theme, categories: Category[]) =>
  categories.filter((c) => theme.tags.includes(EN_TAG_BY_CATEGORY[c.slug] ?? c.tag));

/** A theme has a page only while at least one published category sits in it. */
export const themeIsLive = (slug: string, categories: Category[]) => {
  const theme = themeBySlug(slug);
  return !!theme && themeCategories(theme, categories).length > 0;
};
