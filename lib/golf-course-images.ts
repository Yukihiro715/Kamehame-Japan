/** Course photos for the shared-bus tour cards: one per course, taken from
 *  the course's own website (the partner's listing photos carry a text
 *  banner), stored under public/images/golf-courses/. `source` is kept for
 *  the rights check before production. A course without an entry shows the
 *  KAMEHAME fallback photo. */
export interface CourseImage { file: string; site: string; source: string }

export const COURSE_IMAGES: Record<string, CourseImage> = {
  "サンヒルズカントリークラブ": { file: "course-7a2fbfb3.webp", site: "https://booking.pacificgolf.co.jp/guide/36.html", source: "https://pgm-images.s3-ap-northeast-1.amazonaws.com/img/main_visual/36/r65cae469.jpg" },
  "ノースショアカントリークラブ": { file: "course-200e414a.webp", site: "https://nscc.golftk.com/", source: "https://nscc.golftk.com/img/slide1.jpg" },
  "太平洋クラブ益子PGAコース": { file: "course-db298dc9.webp", site: "https://www.taiheiyoclub.co.jp/course/mashiko/index.html", source: "https://www.taiheiyoclub.co.jp/course/mashiko/lrhh7f000000024m-img/lrhh7f000000025r.jpg" },
  "太平洋クラブ大洗シャーウッドコース": { file: "course-3ef0d9d8.webp", site: "https://www.taiheiyoclub.co.jp/course/sherwood/index.html", source: "https://www.taiheiyoclub.co.jp/course/sherwood/lrhh7f00000000sg-img/lrhh7f00000000tj.jpg" },
  "益子カントリー倶楽部": { file: "course-c58fa865.webp", site: "https://www.resol-golf.jp/mashiko/", source: "https://www.resol-golf.jp/assets/local/images/mashiko/top/mainvisual_pht_01_pc.jpg" },
  "ピートダイGC ロイヤルコース": { file: "course-9c892fd7.webp", site: "https://booking.pacificgolf.co.jp/guide/32.html", source: "https://pgm-images.s3-ap-northeast-1.amazonaws.com/img/main_visual/32/r64f51d96.jpg" },
  "日立高鈴ゴルフ倶楽部": { file: "course-b587b627.webp", site: "https://www.yc21.co.jp/takasuzu/", source: "https://www.yc21.co.jp/takasuzu/images/top/photo02.jpg" },
  "ピートダイGC VIPコース": { file: "course-a1e1e646.webp", site: "https://booking.pacificgolf.co.jp/guide/31.html", source: "https://pgm-images.s3-ap-northeast-1.amazonaws.com/img/main_visual/31/r64e5c846.jpg" },
  "鴨川カントリークラブ": { file: "course-3b7f8df2.webp", site: "https://reserve.accordiagolf.com/golfCourse/chiba/kamogawa", source: "https://reserve.accordiagolf.com/images/course/059/main.png" },
  "ゴルフ5カントリーサニーフィールド": { file: "course-5972ae43.webp", site: "https://www.alpen-group.net/sunnyfield/", source: "https://www.alpen-group.net/sunnyfield/files/images/home/img_kv11-pc.jpg" },
  "岩瀬桜川カントリークラブ": { file: "course-3802c772.webp", site: "https://www.iwasesakuragawa-cc.co.jp/", source: "https://www.iwasesakuragawa-cc.co.jp/top/hero1.jpg" },
  "万木城カントリークラブ": { file: "course-5d74a03b.webp", site: "https://www.yc21.co.jp/mangijo/", source: "https://www.yc21.co.jp/mangijo/images/top/photo01.jpg" },
  "セントラルゴルフクラブ": { file: "course-32b005ee.webp", site: "https://reserve.accordiagolf.com/golfCourse/ibaraki/central", source: "https://reserve.accordiagolf.com/images/course/081/main.png" },
  "セントラルゴルフNEWコース": { file: "course-56adcb67.webp", site: "https://reserve.accordiagolf.com/golfCourse/ibaraki/central_new", source: "https://reserve.accordiagolf.com/images/course/080/main.png" },
  "かすみがうらゴルフクラブ": { file: "course-5698d18c.webp", site: "https://reserve.accordiagolf.com/golfCourse/ibaraki/kasumigaura", source: "https://reserve.accordiagolf.com/images/course/319/main.png" },
  "勝浦東急ゴルフコース": { file: "course-b190afd4.webp", site: "https://www.tokyu-golf-resort.com/katsuura/", source: "https://www.tokyu-golf-resort.com/cms/files/tokyu-golf-s/katsuura/0400/vawg2GXg.jpg" },
  "足利カントリークラブ飛駒コース": { file: "course-9a304fd1.webp", site: "https://www.ashikaga-cc.com/course/hikoma/", source: "https://www.ashikaga-cc.com/common/img/header_img01.jpg" },
  "足利カントリークラブ多幸コース": { file: "course-256b24a4.webp", site: "https://www.ashikaga-cc.com/course/takou/", source: "https://www.ashikaga-cc.com/common/img/header_img02.jpg" },
  "マナゴルフクラブ": { file: "course-15811335.webp", site: "https://www.managolf.jp/", source: "https://www.managolf.jp/wp-content/uploads/2018/10/top_slide001.jpg" },
  "ザ・オーシャンゴルフクラブ": { file: "course-3ff76c08.webp", site: "https://www.oceangolfclub.com/", source: "https://www.oceangolfclub.com/images/top_01.jpg" },
  "潮来カントリー倶楽部": { file: "course-70a5872c.webp", site: "https://www.itakocc.jp/", source: "https://www.itakocc.jp/wp-content/themes/shinnihonkanko/images/course_mv.jpg" },
  "ワイルドダックカントリークラブ": { file: "course-62654715.webp", site: "https://www.accordiagolf.com/golfCourse/ibaraki/wildduck/", source: "https://reserve.accordiagolf.com/images/golfs/128/%E3%83%AA%E3%82%B5%E3%82%A4%E3%82%BA_0000s_0000_wildduck_no13_47_1.jpg" },
  "霞台カントリークラブ": { file: "course-5779953e.webp", site: "https://www.accordiagolf.com/golfCourse/ibaraki/kasumidai/", source: "https://reserve.accordiagolf.com/images/golfs/094/K-04.jpg" },
  "鶴舞カントリークラブ": { file: "course-47bacfa3.webp", site: "https://www.tokyu-golf-resort.com/tsurumai/", source: "https://www.tokyu-golf-resort.com/tsurumai/img/top/main_bg.jpg" },
};

const normalise = (name: string) => name.replace(/\s+/g, "").replace(/倶楽部/g, "クラブ").replace(/ＧＣ|GC/g, "ゴルフクラブ").replace(/ＰＧＡ/g, "PGA");

/** The local photo for a course name as the partner publishes it, if we have one. */
export function courseImage(course: string): string | undefined {
  const hit = COURSE_IMAGES[course] ?? Object.entries(COURSE_IMAGES).find(([k]) => normalise(k) === normalise(course))?.[1];
  return hit ? `/images/golf-courses/${hit.file}` : undefined;
}
