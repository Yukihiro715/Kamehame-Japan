import type { ArticleCopy } from "@/lib/articles";
import type { Lang } from "@/lib/i18n";
import { JOURNAL_COPY } from "@/lib/journal-copy";
import ja from "@/lib/golf-articles.ja.json";
import es from "@/lib/golf-articles.es.json";
import fr from "@/lib/golf-articles.fr.json";
import zhTw from "@/lib/golf-articles.zh-tw.json";

// JSON files keep full translations independently editable and let the sitemap
// generator read the same published locale inventory without a TS runtime.
const translations = { ja, es, fr, "zh-tw": zhTw } as Record<Exclude<Lang, "en">, Record<string, ArticleCopy>>;

export function golfArticleTranslations(slug: string): Partial<Record<Lang, ArticleCopy>> {
  return Object.fromEntries(Object.entries(translations).flatMap(([lang, articles]) => {
    const copy = articles[slug];
    if (!copy) return [];
    const labels = JOURNAL_COPY[lang as Lang];
    return [[lang, { ...copy, editorial: { author: "KAMEHAME JAPAN", note: labels.note, imageCaption: labels.imageCaption } }]];
  }));
}
