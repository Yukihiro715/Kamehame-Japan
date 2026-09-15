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
      ja: {
        title: "相撲の朝稽古で、実際に起きていること",
        standfirst: "稽古は見世物ではありません。その形を知っておくと、見えるものが変わります。",
        body: [
          "相撲部屋は、力士がひとつ屋根の下で寝起きし、食べ、厳しい序列の中で稽古する家です。朝稽古は、その暮らしの中で外の人間が同席できる唯一の部分で、一日全体がそこを軸に組まれているため早朝に始まります。",
          "## 朝の順序",
          "最初に土俵に上がるのは番付の低い力士で、六時前のこともあります。土俵を掃き、体を温め、上位の力士がまだ寝ているか食べている間にいちばん激しく稽古します。朝が進むにつれて番付が上がっていき、いちばん上の力士が土俵に入る頃には、若い衆は二時間動き続けており、部屋はその人を中心に静かに組み替わっています。",
          "最後の三十分だけ見れば、いちばん良い取組が見られます。全部見れば、この社会が見えます。",
          "## 稽古が同じことの繰り返しに見える理由",
          "四股——片脚ずつ上げて踏み下ろす——は儀式のように見えますが、実際にはすべての土台です。均衡、腰の強さ、低く構え続ける力。摺り足は足を上げずに滑るように進む歩き方です。ぶつかり稽古は荒っぽく見えるやつで、ひとりが相手の胸に何度も何度も当たっていき、押し返されます。",
          "どれも見学者のために整えられたものではありません。部屋が空でもまったく同じことが起きています。",
          "## 振る舞い方",
          "稽古中の静粛は「お願い」ではありません。ガイドは小声で通訳し、話してよい時を伝えます。指示された場所に座ってください。座布団はありますが、最大九十分ほど畳の上ですので、脚は文句を言います。フラッシュは不可、露出の少ない服装で。",
          "日程が許せば、稽古後に短いご挨拶があることが多いです。本当に短いものです。力士にはこれから一日があります。",
          "## 見学できない時",
          "稽古は本場所の日程に従います。場所中と巡業で部屋が留守の間、見学は止まります。これは交渉で動く空き状況ではないため、日程がまったく無い週があります。",
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
      ja: {
        title: "江戸前寿司の味が、知っている寿司と違う理由",
        standfirst: "江戸前を定義する技は冷蔵の問題を解くために生まれ、そのほうが旨いから残りました。",
        body: [
          "江戸前とは「江戸の前」、つまり街の面した湾で獲れた魚のことです。十九世紀初め、その魚は氷なしで一日もたせる必要がありました。暑く、人の多い街で、屋台から、立ったまま食べる人に売られていたのです。",
          "## ひとつの問題に、四つの答え",
          "塩で締めると水分が抜けて身が締まります。その後の酢洗いも同じ働きをし、酸味を加えます。醤油に漬ける——漬け——は保存と味付けを兼ねており、赤身が思ったより色が濃く味が深い理由はここにあります。皮目を炙ると表面の菌が死に、脂が溶けます。",
          "冷蔵庫が来ても、このどれも消えませんでした。同じ魚を生で出してみた職人は、味が平板になることに気づいたからです。",
          "## シャリは思っているより仕事をしている",
          "シャリは酢と塩、時に砂糖で味を付け、ほぼ人肌で出されます。これは意図的なもので、温かい飯と冷たい魚が合わさると、脂の舌への乗り方が変わります。冷たい飯はそれを鈍らせます。",
          "握りの形が大事なのも同じ理由です。握りは付け台から口までは崩れず、口に入った瞬間にほどけなければなりません。強く握れば塊になります。ここが人が何年もかける部分で、マスタークラスの大半をここに使うことになります。",
          "## 付け台での作法",
          "出された一貫は、話が終わってからではなく、出された時に食べてください。すでに味が付いている場合——良い店ではほとんどがそうです——醤油は足さないでください。手で食べて構いません。",
          "質問してください。六人に教えるために店を閉めた職人は、邪魔をされているのではありません。歩み寄られているのです。",
        ],
      },
    },
  },
  {
    slug: "when-to-visit-seasons",
    date: "2026-09-10",
    minutes: 6,
    experiences: ["kimono-higashiyama-walk", "kimono-photo-walk", "tea-ceremony-with-master", "evening-with-geiko"],
    img: "/images/city-kyoto.jpg",
    alt: "Lantern-lined Yasaka-dori street at dawn with the Yasaka pagoda",
    copy: {
      en: {
        title: "When to come: the honest version of Japan's seasons",
        standfirst: "Cherry blossom and autumn leaves are real, brief, and crowded. Here is what each part of the year actually offers.",
        body: [
          "Most first-time visitors book around two weeks a year. That is understandable, and it is also why those two weeks cost more, book out earlier and involve more elbows. The rest of the calendar is not a compromise.",
          "## Late March to mid-April",
          "Blossom. It is as good as the photographs and it lasts about ten days in any one place, with the date sliding a week or two either way. Kyoto's maiko evenings and kimono walks fill first. If these weeks are your only option, book the moment your flights are confirmed and treat the exact blossom timing as luck.",
          "## May to June",
          "Fresh green, warm days, and the crowds thin out after Golden Week ends in early May. Tea ceremony is at its most beautiful: the garden path is wet, the moss is at its brightest, the utensils change for the season. June brings the rainy season, which is gentler than it sounds and photographs well under a paper umbrella.",
          "## July to August",
          "Hot and humid, honestly. Morning experiences — sumo practice, an early sushi session — are the ones to book. Evening events come into their own; a maiko banquet starts at seven and the room is cool. Festival season means some venues change their hours.",
          "## Mid-October to late November",
          "The other famous window. Autumn colour arrives later than people expect — Kyoto peaks in the last two weeks of November — and lasts longer than blossom. High-season rates apply for the geiko evening from October. Kimono walks at lantern hour are at their best; the light goes early and the lanterns come on while the maples are still lit.",
          "## December to February",
          "Underrated. Cold, clear, quiet. Craft experiences that happen indoors — the forge, the sushi counter, the tea room, the nail studio — are unaffected, and you will have masters' attention that spring visitors do not get. Kimono are lined and warm. The New Year holidays close many venues from about 28 December to 4 January, so plan around them.",
          "## What we would do",
          "If you can choose, we would come in late May, early June, or late November. If you cannot, come when you can: every experience we sell works in every month, and we will tell you plainly if a specific date does not.",
        ],
      },
      ja: {
        title: "いつ来るべきか:日本の季節の正直な話",
        standfirst: "桜と紅葉は本物で、短く、混みます。一年のそれぞれの時期に、実際に何があるかをお伝えします。",
        body: [
          "初めて来る方の多くが、一年のうち二週間ほどに予約を集中させます。もっともなことですが、そのせいでその二週間は高く、早く埋まり、人混みが増えます。残りの月は妥協ではありません。",
          "## 三月下旬から四月中旬",
          "桜です。写真の通りで、一か所ではおよそ十日間、時期は前後に一、二週間ずれます。京都のお座敷と着物散策はここから埋まります。この時期しか選べないなら、航空券が確定した瞬間に予約し、桜の時期はご縁だと思ってください。",
          "## 五月から六月",
          "新緑、温かい日、そして五月初めのゴールデンウィークが終わると人が減ります。茶道がいちばん美しい季節です。露地は濡れ、苔は最も鮮やかで、道具は季節のものに変わります。六月は梅雨ですが、聞くほど厳しくなく、和傘の下ではよく写ります。",
          "## 七月から八月",
          "正直に言えば、暑くて蒸します。朝の体験——相撲の朝稽古、早い時間の寿司——を選んでください。夜の催しが本領を発揮します。お座敷は七時に始まり、部屋は涼しい。祭りの季節は、時間を変える受け入れ先があります。",
          "## 十月中旬から十一月下旬",
          "もう一つの有名な時期です。紅葉は思うより遅く来ます。京都のピークは十一月最後の二週間で、桜より長く持ちます。お座敷は十月から繁忙期料金です。灯りの頃の着物散策はここが最高で、日が早く落ち、楓がまだ照らされているうちに灯りがともります。",
          "## 十二月から二月",
          "過小評価されています。寒く、澄んで、静か。屋内で行う体験——鍛冶場、寿司の付け台、茶室、ネイルサロン——は影響を受けず、春の客には得られない師の注意を独り占めできます。着物は袷で暖かい。年末年始はおおむね十二月二十八日から一月四日まで多くの受け入れ先が閉まるので、避けて計画してください。",
          "## 私たちなら",
          "選べるなら、五月下旬、六月上旬、十一月下旬に来ます。選べないなら、来られる時に来てください。私たちが扱う体験はどの月でも成り立ちます。特定の日が難しい場合は、はっきりお伝えします。",
        ],
      },
    },
  },
  {
    slug: "tatami-rooms-what-to-know",
    date: "2026-09-02",
    minutes: 4,
    experiences: ["tea-ceremony-with-master", "evening-with-geiko", "kimono-higashiyama-walk", "sumo-morning-practice"],
    img: "/images/craft-hands.jpg",
    alt: "Tea ceremony host placing a tea bowl on tatami before seated guests",
    copy: {
      en: {
        title: "Tatami rooms: shoes, socks, sitting and the things nobody tells you",
        standfirst: "Half our experiences happen on a tatami floor. None of the etiquette is difficult, but knowing it beforehand lets you stop thinking about it.",
        body: [
          "A tatami room is a room floored with woven rush mats. The mats are soft, they mark easily, and they are cleaned by hand, which explains most of the rules that follow.",
          "## Shoes",
          "They come off at the step up into the room, never on the mat itself. You will see a step or a change in floor level: that is the line. Turn your shoes to face outward when you leave them; your guide will do it for you if you forget, and nobody will mind.",
          "## Socks",
          "Bare feet on tatami are considered a little unclean, so socks are the norm. White ones are appreciated at the tea room and are the one thing worth packing on purpose. Tights are fine. A hole in the toe is the only genuinely embarrassing outcome, and a spare pair in your bag prevents it.",
          "## Sitting",
          "Seiza — kneeling with your weight on your heels — is the formal position and it hurts everyone within about ten minutes, Japanese guests included. You will be invited to sit however is comfortable. Cross-legged is fine for men; women usually sit with legs to one side. Low stools and cushions are available at every venue we work with; ask, or your guide will.",
          "## Doorways and edges",
          "Do not step on the cloth border of a mat or the wooden sill of a sliding door. Both are structural and both are a little bit sacred. Step over them.",
          "## Bags and coats",
          "Off the mat if possible — on the step, or on a tray if one is offered. Large bags are best left at the entrance.",
          "## The one thing to actually remember",
          "Your guide has done this hundreds of times and will quietly cue everything above as it comes. The purpose of knowing it is not to perform correctly; it is so that you can watch the room instead of your feet.",
        ],
      },
      ja: {
        title: "畳の部屋:靴、靴下、座り方、そして誰も教えてくれないこと",
        standfirst: "私たちの体験の半分は畳の上で行われます。作法はどれも難しくありませんが、事前に知っておけば、その場で考えずに済みます。",
        body: [
          "畳の部屋とは、藺草を織った敷物を床に敷いた部屋です。畳は柔らかく、跡が付きやすく、手で掃除します。これで、この先の決まりの大半に説明がつきます。",
          "## 靴",
          "部屋へ上がる段で脱ぎます。畳の上では決して脱ぎません。段差か床の高さの変わり目があり、そこが境目です。脱いだ靴は外向きに揃えます。忘れてもガイドが直しますし、誰も気にしません。",
          "## 靴下",
          "畳に素足は少し不作法とされるため、靴下が通常です。茶室では白い靴下が喜ばれ、これは意識して荷物に入れる価値のある唯一のものです。タイツで構いません。本当に恥ずかしい結果はつま先の穴だけで、鞄に予備を一足入れておけば防げます。",
          "## 座り方",
          "正座——踵の上に体重を乗せて膝をつく——が正式な座り方で、十分ほどで誰でも痛くなります。日本人のお客様も同じです。楽な座り方でどうぞ、と勧められます。男性はあぐらで構いません。女性はたいてい脚を横に流します。私たちが組む受け入れ先には必ず低い椅子や座布団があります。お尋ねいただくか、ガイドが頼みます。",
          "## 敷居と縁",
          "畳の縁や、襖・障子の敷居は踏まないでください。どちらも構造上大切で、少し神聖なものです。またいでください。",
          "## 鞄と上着",
          "できれば畳の外へ。上がり口か、盆が差し出されればその上に。大きな鞄は入口に置くのがいちばんです。",
          "## 本当に憶えておくべき一つのこと",
          "ガイドは何百回もこれをしており、上のすべてをその場で静かに合図します。知っておく目的は正しく振る舞うためではなく、足元ではなく部屋を見ていられるようにするためです。",
        ],
      },
    },
  },
  {
    slug: "what-a-private-experience-costs",
    date: "2026-08-28",
    minutes: 5,
    experiences: ["sushi-masterclass", "katana-forge-visit", "evening-with-geiko", "anime-nail-art-session"],
    img: "/images/exp-kimono.jpg",
    alt: "Woman in a red kimono beside a koi pond in a Japanese garden",
    copy: {
      en: {
        title: "Why a private experience costs what it does",
        standfirst: "A two-hour session for two people at ¥45,000 looks expensive next to a ¥8,000 group class. Here is where the money goes.",
        body: [
          "We publish one price and include everything, so it is fair to ask what is in it. This is the honest breakdown for a typical private masterclass.",
          "## The master's time, at the master's rate",
          "A sushi chef who closes his counter for a morning is not teaching in his spare time; he is giving up a service. The same is true of a swordsmith who stops forging, or a tea master who prepares a room, a scroll and sweets for four guests. The largest share of every price is that person's time, paid at what their work is actually worth rather than at a tourism rate.",
          "## The interpreter guide",
          "Every booking includes a guide who is briefed on the specific craft, travels to the venue, and stays with you throughout. Guides are paid per session, and a good one is the difference between watching and understanding. This is the second largest cost and the one we would never remove to make a price look better.",
          "## Small numbers",
          "A group class spreads the master's fee across twelve or twenty people. Ours spread it across two to six. That is the whole design — the master can correct your hands because there are only six pairs of them — and it is also, arithmetically, most of the difference in price.",
          "## Materials and the room",
          "Fish for a sushi session is bought that morning. Silk kimono are cleaned after each wearing. Tea sweets are made for the day. These are real costs and they are included, because a price that grows on the day is a price we would not want to be quoted ourselves.",
          "## What is not in the price",
          "Transport. Every experience is meet-on-site, and we say so on every page. Optional extras — a second performer at the geiko evening, shipping a piece home — are listed with their cost before you book.",
          "## Where the difference actually shows",
          "It shows in the question you get to ask. In a class of twenty, you watch. In a room of four, you ask why the rice is warm, and the person who has spent forty years on that answer gives it to you.",
        ],
      },
      ja: {
        title: "貸切の体験は、なぜこの価格なのか",
        standfirst: "二人で二時間 ¥45,000 は、¥8,000 の団体クラスの横に置くと高く見えます。お金がどこへ行くのかをお話しします。",
        body: [
          "私たちは価格を一つだけ表示し、すべてを含めています。ですから、その中身を尋ねられるのは当然です。典型的な貸切マスタークラスの、正直な内訳です。",
          "## 師の時間を、師の相場で",
          "午前中に付け台を閉める寿司職人は、余った時間で教えているのではありません。営業を一回手放しています。鍛錬を止める刀匠も、四人の客のために部屋と掛物と菓子を整える茶道家も同じです。どの価格でも最も大きな部分はその人の時間で、観光向けの相場ではなく、その仕事が実際に値するだけの額を払っています。",
          "## 通訳ガイド",
          "すべてのご予約に、その技について事前に共有を受け、会場まで出向き、最後までご一緒するガイドが含まれます。ガイドには一回ごとに報酬があり、良いガイドは「見る」と「分かる」の差そのものです。二番目に大きな費用で、価格を安く見せるために外すことは決してしません。",
          "## 少人数であること",
          "団体クラスは師の報酬を十二人や二十人で割ります。私たちは二人から六人で割ります。これが設計のすべてで——手が六組しかないから師が手を取って直せる——、算数の上でも価格差のほとんどがここです。",
          "## 材料と部屋",
          "寿司の魚はその朝に仕入れます。絹の着物は着るたびに手入れします。茶菓子はその日のために作られます。実際にかかる費用で、含めています。当日になって膨らむ価格は、私たち自身が提示されたくない価格だからです。",
          "## 価格に含まれないもの",
          "移動です。すべての体験は現地集合で、どのページにもそう書いています。任意の追加——お座敷での芸妓・舞妓の追加、作品の海外発送——は、お申し込み前に費用とともに記載しています。",
          "## 差が実際に現れる場所",
          "尋ねられる質問に現れます。二十人のクラスでは見ます。四人の部屋では、なぜ飯が温かいのかを尋ね、その答えに四十年をかけた人がそれをくれます。",
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

/** Articles for a listing page. A city or category page shows the articles
 *  attached to any experience in that city or category, newest first. The
 *  "experiences" page shows everything. */
export function articlesForCollection(
  collection: string,
  lang: Lang,
  lookup: (slug: string) => { city: string; category: string } | undefined,
  limit = 3,
): Article[] {
  const all = articlesFor(lang);
  if (collection === "experiences") return all.slice(0, limit);
  return all
    .filter((a) => a.experiences.some((slug) => {
      const e = lookup(slug);
      return e !== undefined && (e.city === collection || e.category === collection);
    }))
    .slice(0, limit);
}

export const articleDate = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "es" ? "es-ES" : "en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });
