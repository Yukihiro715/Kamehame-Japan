/** The courses on the shared-bus schedule: the English name shown on the
 *  English pages, the prefecture, and the card photo stored under
 *  public/images/golf-courses/ (one per course; a course without a photo
 *  shows the KAMEHAME fallback). Keyed by the name as the partner publishes it. */
export interface CourseInfo { en: string; area: string; file?: string }

export const COURSES: Record<string, CourseInfo> = {
  "サンヒルズカントリークラブ": { en: "Sunhills Country Club", area: "Tochigi", file: "course-7a2fbfb3.webp" },
  "ノースショアカントリークラブ": { en: "North Shore Country Club", area: "Ibaraki", file: "course-200e414a.webp" },
  "太平洋クラブ益子PGAコース": { en: "Taiheiyo Club Mashiko PGA Course", area: "Tochigi", file: "course-db298dc9.webp" },
  "ABCいすみゴルフコース": { en: "ABC Isumi Golf Course", area: "Chiba" },
  "太平洋クラブ大洗シャーウッドコース": { en: "Taiheiyo Club Oarai Sherwood Course", area: "Ibaraki", file: "course-3ef0d9d8.webp" },
  "益子カントリー倶楽部": { en: "Mashiko Country Club", area: "Tochigi", file: "course-c58fa865.webp" },
  "ピートダイGC ロイヤルコース": { en: "Pete Dye Golf Club, Royal Course", area: "Tochigi", file: "course-9c892fd7.webp" },
  "日立高鈴ゴルフ倶楽部": { en: "Hitachi Takasuzu Golf Club", area: "Ibaraki", file: "course-b587b627.webp" },
  "ピートダイGC VIPコース": { en: "Pete Dye Golf Club, VIP Course", area: "Tochigi", file: "course-a1e1e646.webp" },
  "鴨川カントリークラブ": { en: "Kamogawa Country Club", area: "Chiba", file: "course-3b7f8df2.webp" },
  "ゴルフ5カントリーサニーフィールド": { en: "Golf5 Country Sunny Field", area: "Ibaraki", file: "course-5972ae43.webp" },
  "岩瀬桜川カントリークラブ": { en: "Iwase Sakuragawa Country Club", area: "Ibaraki", file: "course-3802c772.webp" },
  "万木城カントリークラブ": { en: "Mangijo Country Club", area: "Chiba", file: "course-5d74a03b.webp" },
  "セントラルゴルフクラブ": { en: "Central Golf Club", area: "Ibaraki", file: "course-32b005ee.webp" },
  "かすみがうらゴルフクラブ": { en: "Kasumigaura Golf Club", area: "Ibaraki", file: "course-5698d18c.webp" },
  "勝浦東急ゴルフコース": { en: "Katsuura Tokyu Golf Course", area: "Chiba", file: "course-b190afd4.webp" },
  "足利カントリークラブ飛駒コース": { en: "Ashikaga Country Club, Hikoma Course", area: "Tochigi", file: "course-9a304fd1.webp" },
  "マナゴルフクラブ": { en: "Mana Golf Club", area: "Ibaraki", file: "course-15811335.webp" },
  "ザ・オーシャンゴルフクラブ": { en: "The Ocean Golf Club", area: "Ibaraki", file: "course-3ff76c08.webp" },
  "潮来カントリー倶楽部": { en: "Itako Country Club", area: "Ibaraki", file: "course-70a5872c.webp" },
  "足利カントリークラブ多幸コース": { en: "Ashikaga Country Club, Tako Course", area: "Tochigi", file: "course-256b24a4.webp" },
  "セントラルゴルフNEWコース": { en: "Central Golf Club, NEW Course", area: "Ibaraki", file: "course-56adcb67.webp" },
  "ワイルドダックカントリークラブ": { en: "Wild Duck Country Club", area: "Ibaraki", file: "course-62654715.webp" },
  "霞台カントリークラブ": { en: "Kasumidai Country Club", area: "Ibaraki", file: "course-5779953e.webp" },
  "鶴舞カントリークラブ": { en: "Tsurumai Country Club", area: "Chiba", file: "course-47bacfa3.webp" },
};

const normalise = (name: string) => name.replace(/\s+/g, "").replace(/倶楽部/g, "クラブ").replace(/ＧＣ|GC/g, "ゴルフクラブ").replace(/ＰＧＡ/g, "PGA");
const lookup = (course: string): CourseInfo | undefined => COURSES[course] ?? Object.entries(COURSES).find(([k]) => normalise(k) === normalise(course))?.[1];

/** The local photo for a course name as the partner publishes it, if we have one. */
export function courseImage(course: string): string | undefined {
  const hit = lookup(course);
  return hit?.file ? `/images/golf-courses/${hit.file}` : undefined;
}
/** The English name for the English pages; the Japanese name when we have none. */
export function courseNameEn(course: string): string { return lookup(course)?.en ?? course; }
export function courseArea(course: string): string | undefined { return lookup(course)?.area; }
