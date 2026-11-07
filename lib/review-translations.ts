import type { Lang } from "@/lib/i18n";

type Translation = { body: string; excerpt: string };

// Translations of the guest's submitted text. The original stays in published-reviews.ts.
const translations: Record<string, Record<Exclude<Lang, "en">, Translation>> = {
  "tyler-takane-2026-11": {
    ja: {
      body: "今度の日本旅行でゴルフをしようと、自分で予約を試みましたが……うまくいきませんでした。何度試しても希望のティータイムが空いていなかったり、言葉の壁に阻まれたりしていました。\n\nそこで、プロにお願いしてみようと思い、Kamehameに相談しました。ゴルフを予約してくれただけでなく、手続きは迅速で簡単、案内も分かりやすく、素晴らしいコースを手配してくれました！\n\n当日までメールにもすぐに返信してくれて、一つひとつ丁寧にサポートしてくれました。本当に、本当に素晴らしい皆さんです。ぜひお願いしてみてください。きっと後悔しません！！！",
      excerpt: "手続きは迅速で簡単、案内も分かりやすく、素晴らしいコースを手配してくれました！",
    },
    es: {
      body: "Intenté reservar por mi cuenta una ronda de golf para un próximo viaje a Japón… sin éxito. Una y otra vez, no había horarios de salida disponibles o la barrera del idioma me lo impedía.\n\nEntonces pensé: ¿por qué no recurrir a un profesional? Y probé con Kamehame. ¡No solo consiguieron reservarme la ronda, sino que el proceso fue rápido, sencillo y con toda la información necesaria, y me consiguieron un campo fantástico!\n\nIncluso hasta el mismo día, respondieron rápidamente a mis correos y me ayudaron en cada paso. Son realmente increíbles. ¡Dejad que os ayuden, no os arrepentiréis!",
      excerpt: "el proceso fue rápido, sencillo y con toda la información necesaria, y me consiguieron un campo fantástico",
    },
    fr: {
      body: "J’ai essayé de réserver moi-même une partie de golf pour un prochain voyage au Japon… sans succès. À chaque tentative, soit aucun créneau de départ n’était disponible, soit la barrière de la langue me bloquait.\n\nJe me suis alors dit : pourquoi ne pas faire appel à un professionnel ? J’ai donc essayé Kamehame. Non seulement ils ont réussi à me réserver une partie, mais la réservation a été rapide, simple et bien expliquée, et ils m’ont trouvé un parcours formidable !\n\nJusqu’au jour même, ils ont répondu rapidement à mes e-mails et m’ont accompagné à chaque étape. Ils sont vraiment, vraiment formidables. Faites appel à eux, vous ne le regretterez pas !!!",
      excerpt: "la réservation a été rapide, simple et bien expliquée, et ils m’ont trouvé un parcours formidable !",
    },
    "zh-tw": {
      body: "為了即將到來的日本旅行，我試著自己預訂高爾夫球場……卻一直沒有成功。一次又一次，不是沒有可預約的開球時段，就是遇到語言障礙。\n\n後來我想，何不找專業的人幫忙？於是就試著聯絡了Kamehame。他們不僅幫我訂到了球場，預訂流程也快速、簡單，說明清楚，而且還安排了一個很棒的球場！\n\n直到打球當天，他們仍然迅速回覆電子郵件，每個步驟都給予協助。他們真的、真的非常棒。放心交給他們幫忙，你不會後悔的！！！",
      excerpt: "預訂流程也快速、簡單，說明清楚，而且還安排了一個很棒的球場！",
    },
  },
};

export const reviewTranslationFor = (id: string, lang: Lang): Translation | null =>
  lang === "en" ? null : translations[id]?.[lang] ?? null;
