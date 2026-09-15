// Editorial articles (the Journal).
//
// Articles live here as data rather than in a CMS: there is no editor to log
// into, and adding one is a pull request. See docs/CONTENT.md for how a new
// article gets written and published.
//
// Every article is optional. With the list empty, the home page and experience
// pages simply omit their article sections — nothing renders half-built.

import type { Lang } from "@/lib/i18n";

export interface Article {
  slug: string;
  /** Publication date, ISO. Sorting and display both use it. */
  date: string;
  /** Reading time in minutes, written by hand — we do not estimate it. */
  minutes: number;
  /** Catalog slugs this article belongs with, for the related-reading block. */
  experiences: string[];
  /** Hero image, site-root-relative. */
  img: string;
  alt: string;
  /** Per-locale copy. An article renders only in the locales present here. */
  copy: Partial<Record<Lang, ArticleCopy>>;
}

export interface ArticleCopy {
  title: string;
  /** One sentence: used on cards, in metadata and as the share description. */
  standfirst: string;
  /** Body paragraphs. A string starting with "## " becomes a subheading. */
  body: string[];
}

const ARTICLES: Article[] = [
  {
    slug: "booking-a-maiko-evening",
    date: "2026-08-20",
    minutes: 6,
    experiences: ["evening-with-geiko"],
    img: "/images/exp-geisha.jpg",
    alt: "Maiko performing a traditional dance with a fan",
    copy: {
      en: {
        title: "How a maiko evening in Kyoto is actually arranged",
        standfirst:
          "Kyoto's teahouses do not take walk-ins, and the reason is older and more practical than mystique.",
        body: [
          "The phrase you will read online is ichigen-san okotowari — no first-time guests. It gets translated as exclusivity, which makes it sound like a velvet rope. It is closer to a credit system.",
          "## Why introduction came first",
          "A teahouse in Kyoto's hanamachi does not present a bill at the end of the evening. It bills later, having also paid the geiko, the maiko, the kitchen and the musicians on your behalf. That only works if the house knows who is good for it. For three centuries the answer was introduction: someone the house already trusted vouched for you, and their trust extended to cover you.",
          "It was never about keeping people out for its own sake. It was about who carries the risk.",
          "## What that means for a visitor today",
          "It means you cannot simply turn up, and it means the date is not yours until the house says it is. When you send a request, someone has to check whether a geiko and a maiko are free that evening — and they are working artists with their own schedules, not staff on a rota. That is the whole reason a maiko evening is booked on request rather than instantly confirmed.",
          "It also means the answer is sometimes no. A date we cannot hold is a date we tell you about, rather than quietly substituting something else.",
          "## What the evening is actually like",
          "Two hours, a private room, seasonal Kyoto cooking, and conversation. The dance happens about halfway through and is performed close enough that you can hear the fabric move. Then come the ozashiki games, which are simple, competitive and usually where the room relaxes.",
          "The part most guests do not expect is how ordinary the conversation is. Geiko and maiko are trained to host, which mostly means being interested in you. With an interpreter carrying both directions, that works exactly as it should.",
          "## Practical notes",
          "Book at least three days ahead — the cutoff is 5pm Japan time, three days before. Spring and autumn fill first. Pricing is per group rather than per person, so a party of four costs less each than a party of two. Tell us about allergies when you request the date, not on the evening.",
        ],
      },
      ja: {
        title: "京都のお座敷は、どう手配されているのか",
        standfirst: "一見さんお断りは格式の話ではなく、もっと古くて実務的な理由があります。",
        body: [
          "「一見さんお断り」は、海外では exclusivity と訳されがちです。ロープで仕切られた場所のように聞こえますが、実態は与信の仕組みに近いものです。",
          "## なぜ紹介が前提だったのか",
          "花街のお茶屋は、その場でお勘定を出しません。芸妓・舞妓、料理、地方への支払いをいったん立て替えたうえで、後から請求します。これは、相手が誰かを店が知っていて初めて成り立ちます。三百年のあいだ、その答えが紹介でした。すでに信用のある人が身元を引き受け、その信用が客にも及ぶという形です。",
          "人を締め出すこと自体が目的だったわけではありません。誰がリスクを負うか、という話です。",
          "## いまの訪問者にとっての意味",
          "飛び込みでは入れない、ということです。そして日程は、店が「取れます」と言うまで確定しません。ご希望の日にちをいただいたら、その晩に芸妓と舞妓を手配できるかを確認します。相手はシフトで動く従業員ではなく、自分の予定を持った芸の人です。お座敷をリクエスト予約にしている理由は、ここにあります。",
          "したがって、お断りすることもあります。押さえられない日は、黙って別のものに差し替えず、そのままお伝えします。",
          "## 当日の実際",
          "二時間、貸切のお座敷、季節の京料理、そして会話です。舞は中ほどで、衣擦れが聞こえる距離で披露されます。そのあとのお座敷遊びは単純で、勝ち負けがあり、たいていここで座が和みます。",
          "多くのお客様が意外に思われるのは、会話がごく普通だということです。芸妓・舞妓はもてなしの訓練を受けており、それは要するに相手に関心を持つということです。通訳が双方向で入れば、そのまま機能します。",
          "## 実務的なこと",
          "3日前の17時(日本時間)が締切です。春と秋から先に埋まります。料金は1名あたりではなくグループ単位なので、4名なら1人あたりの負担は2名のときより下がります。アレルギーは当日ではなく、ご依頼の時点でお知らせください。",
        ],
      },
    },
  },
  {
    slug: "sumo-morning-practice-etiquette",
    date: "2026-08-06",
    minutes: 5,
    experiences: ["sumo-morning-practice"],
    img: "/images/exp-sumo.jpg",
    alt: "Sumo wrestlers training in the ring of a Tokyo stable",
    copy: {
      en: {
        title: "What actually happens at sumo morning practice",
        standfirst:
          "Keiko is not a performance, and knowing the shape of it changes what you see.",
        body: [
          "A sumo stable is a house where wrestlers live, eat and train under one roof and a strict hierarchy. Morning practice — keiko — is the part of that life a visitor can sit in on, and it starts early because the rest of the day is built around it.",
          "## The order of the morning",
          "The lowest-ranked wrestlers are in the ring first, often before six. They sweep the dohyo, warm up and train hardest while the senior wrestlers are still sleeping or eating. As the morning goes on, rank rises. By the time the highest-ranked man steps in, the juniors have been at it for two hours and the room has quietly reorganised itself around him.",
          "If you watch only the last half hour you see the best bouts. If you watch the whole thing you see the society.",
          "## The drills, and why they look repetitive",
          "Shiko — the lifting and stamping of each leg — looks ceremonial and is in fact the foundation of everything: balance, hip strength, the ability to stay low. Suriashi is a sliding walk that never lifts the feet. Butsukari-geiko is the one that looks brutal: one wrestler drives into another's chest, over and over, while being pushed back.",
          "None of this is arranged for visitors. It would happen identically with the room empty.",
          "## How to behave",
          "Silence during training is not a suggestion. Your guide will translate in a whisper and will tell you when it is fine to speak. Sit as instructed; cushions are provided but you will be on tatami for up to ninety minutes, and legs do complain. No flash. Dress modestly.",
          "If the schedule allows, there is usually a short greeting afterwards. It is genuinely short — they have a day to get on with.",
          "## When it is not possible",
          "Practice follows the tournament calendar. During a basho and while stables travel, visits stop. That is not availability we can negotiate, which is why some weeks simply have no dates.",
        ],
      },
    },
  },
  {
    slug: "why-edomae-sushi-tastes-different",
    date: "2026-07-23",
    minutes: 5,
    experiences: ["sushi-masterclass", "kyoto-sushi-class"],
    img: "/images/exp-sushi.jpg",
    alt: "Quiet hinoki-wood omakase sushi counter",
    copy: {
      en: {
        title: "Why Edo-mae sushi tastes different from the sushi you know",
        standfirst:
          "The techniques that define it were invented to solve a refrigeration problem, and survived because they taste better.",
        body: [
          "Edo-mae means \"in front of Edo\" — fish from the bay the city sat on. In the early nineteenth century that fish had to last a day without ice, in a hot, crowded city, sold from a stall to someone eating standing up.",
          "## Four answers to one problem",
          "Curing in salt draws water out and firms the flesh. A vinegar bath after it does the same and adds acidity. Marinating in soy — zuke — both preserves and seasons, which is why lean tuna is often darker and deeper-flavoured than you expect. Searing the skin over a flame kills surface bacteria and renders fat.",
          "Refrigeration arrived and none of these disappeared, because a chef who tried serving the same fish raw found it flatter.",
          "## The rice is doing more work than you think",
          "Shari is seasoned with vinegar, salt and sometimes sugar, and it is served at roughly body temperature. That is deliberate: warm rice against cool fish changes how the fat reads on the tongue. Cold rice mutes it.",
          "The shaping matters for the same reason. A nigiri should hold together between the counter and your mouth and then fall apart immediately. Press too hard and you get a brick. This is the part that takes people years and the part you will spend most of a masterclass on.",
          "## What to do at the counter",
          "Eat each piece when it is put down, not when you have finished talking. If it is already seasoned — and at a good counter most of it is — do not add soy. Fingers are fine.",
          "Ask questions. A chef who has closed his shop to teach six people is not being interrupted; he is being met halfway.",
        ],
      },
    },
  },
];

export const articlesFor = (lang: Lang): Article[] =>
  ARTICLES.filter((a) => a.copy[lang]).sort((a, b) => b.date.localeCompare(a.date));

export const articleBySlug = (slug: string, lang: Lang): Article | undefined =>
  articlesFor(lang).find((a) => a.slug === slug);

/** Articles tagged with an experience, newest first. */
export const articlesForExperience = (experience: string, lang: Lang, limit = 2): Article[] =>
  articlesFor(lang).filter((a) => a.experiences.includes(experience)).slice(0, limit);

export const latestArticles = (lang: Lang, limit = 3): Article[] => articlesFor(lang).slice(0, limit);

export const articleDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "es" ? "es-ES" : "en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });
