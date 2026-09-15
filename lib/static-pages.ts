// Copy for the standing pages (About, FAQ). Kept apart from the catalog because
// it changes on its own rhythm — and because every locale needs the same shape.

import type { Lang } from "@/lib/i18n";

export interface Faq { q: string; a: string }

export interface AboutCopy {
  title: string;
  metaDescription: string;
  lead: string;
  sections: { heading: string; body: string[] }[];
  promises: { heading: string; body: string }[];
  closing: { heading: string; body: string; cta: string };
}

export interface FaqCopy {
  title: string;
  metaDescription: string;
  lead: string;
  groups: { heading: string; items: Faq[] }[];
  closing: { heading: string; body: string; cta: string };
}

const ABOUT: Record<Lang, AboutCopy> = {
  en: {
    title: "Our approach",
    metaDescription:
      "Why KAMEHAME JAPAN books small, private cultural experiences with working masters in Tokyo and Kyoto — and how an interpreter guide changes what you take home.",
    lead:
      "Most cultural experiences sold to visitors in Japan are built for volume. Ours are built around the person teaching them.",
    sections: [
      {
        heading: "Why we started",
        body: [
          "Japan is generous with its surfaces and careful with its interiors. You can stand in front of a sumo stable at six in the morning, or walk past a teahouse in Gion every evening for a week, and never get past the doorway. Not because anyone is unfriendly — because there is no obvious way in.",
          "The way in has always been introduction. A name, passed from someone trusted to someone else. That is how the karyukai has worked for three centuries, and how most craft traditions still work today. What we do is spend the time to build those introductions, then hold them open for people who have three days in Tokyo and no way of knowing where to knock.",
        ],
      },
      {
        heading: "Small on purpose",
        body: [
          "Every experience we sell is private or close to it. That is not a luxury flourish — it is the condition that makes the rest possible. A master teaching two people can answer the question you actually have. A master teaching twenty is running a performance.",
          "It also means we sell fewer sessions than we could. A sushi counter has one chef and a finite number of evenings. We would rather show you a date that is genuinely available than a calendar that is always green.",
        ],
      },
      {
        heading: "The interpreter is the experience",
        body: [
          "An interpreter guide comes with every booking, and we think of that as the product rather than an add-on. Watching someone shape rice in silence is pleasant. Asking why the rice is at body temperature, hearing the answer, and then asking the follow-up — that is the thing you will still be describing to people a year later.",
          "Our guides are briefed on the craft, not just the language. They know when to translate and when to stay out of the way.",
        ],
      },
    ],
    promises: [
      {
        heading: "Real practitioners",
        body: "Everyone you meet works in the craft. No actors, no demonstration-only venues built for tour groups.",
      },
      {
        heading: "Honest availability",
        body: "If a date is not open, we say so. Some of our experiences are confirmed with the house before your booking is final, and we tell you that up front.",
      },
      {
        heading: "Prices that hold",
        body: "The price you see includes the interpreter guide and the session itself. Anything not included is written on the page, not discovered on the day.",
      },
      {
        heading: "Privacy for our partners",
        body: "Some houses ask that their name and address stay private until a booking is confirmed. We honour that — it is often the reason they are willing to receive guests at all.",
      },
    ],
    closing: {
      heading: "Start with one afternoon",
      body:
        "You do not need to plan a whole trip around this. One session, two hours, and the rest of your itinerary stays exactly as it was.",
      cta: "See all experiences",
    },
  },
  es: {
    title: "Nuestra filosofía",
    metaDescription:
      "Por qué KAMEHAME JAPAN reserva experiencias culturales privadas con maestros en activo de Tokio y Kioto, y qué cambia cuando te acompaña un guía intérprete.",
    lead:
      "Casi todas las experiencias culturales que se venden a los visitantes en Japón están pensadas para el volumen. Las nuestras se construyen alrededor de quien las enseña.",
    sections: [
      {
        heading: "Por qué empezamos",
        body: [
          "Japón es generoso con sus superficies y cuidadoso con sus interiores. Puedes plantarte ante un establo de sumo a las seis de la mañana, o pasar por delante de una casa de té de Gion cada tarde durante una semana, y no cruzar nunca el umbral. No por falta de amabilidad, sino porque no hay una puerta evidente.",
          "La puerta siempre ha sido la presentación personal: un nombre que pasa de alguien de confianza a otra persona. Así funciona el karyukai desde hace tres siglos y así siguen funcionando la mayoría de los oficios tradicionales. Nosotros dedicamos el tiempo a construir esas presentaciones y las mantenemos abiertas para quien tiene tres días en Tokio y ninguna forma de saber a qué puerta llamar.",
        ],
      },
      {
        heading: "Pequeño a propósito",
        body: [
          "Todas las experiencias que vendemos son privadas o casi. No es un adorno de lujo: es la condición que hace posible todo lo demás. Un maestro que enseña a dos personas puede responder a la pregunta que de verdad tienes. Un maestro que enseña a veinte está dando una función.",
          "También significa que vendemos menos sesiones de las que podríamos. Una barra de sushi tiene un chef y un número finito de noches. Preferimos enseñarte una fecha realmente disponible antes que un calendario siempre en verde.",
        ],
      },
      {
        heading: "El intérprete es la experiencia",
        body: [
          "Cada reserva incluye un guía intérprete, y lo consideramos el producto, no un extra. Ver a alguien moldear arroz en silencio resulta agradable. Preguntar por qué el arroz está a temperatura corporal, escuchar la respuesta y poder repreguntar: eso es lo que seguirás contando un año después.",
          "Nuestros guías conocen el oficio, no solo el idioma. Saben cuándo traducir y cuándo apartarse.",
        ],
      },
    ],
    promises: [
      {
        heading: "Profesionales de verdad",
        body: "Todas las personas que conocerás trabajan en el oficio. Sin actores ni locales de demostración montados para grupos.",
      },
      {
        heading: "Disponibilidad honesta",
        body: "Si una fecha no está libre, te lo decimos. Algunas experiencias se confirman con la casa antes de cerrar la reserva, y lo indicamos desde el principio.",
      },
      {
        heading: "Precios que se sostienen",
        body: "El precio que ves incluye el guía intérprete y la sesión. Lo que no está incluido aparece escrito en la página, no se descubre el mismo día.",
      },
      {
        heading: "Privacidad para nuestros socios",
        body: "Algunas casas piden que su nombre y dirección se mantengan privados hasta confirmar la reserva. Lo respetamos: a menudo es la razón por la que aceptan recibir visitantes.",
      },
    ],
    closing: {
      heading: "Empieza por una tarde",
      body:
        "No hace falta planificar el viaje entero alrededor de esto. Una sesión, dos horas, y el resto de tu itinerario sigue igual.",
      cta: "Ver todas las experiencias",
    },
  },
  ja: {
    title: "私たちの考え方",
    metaDescription:
      "KAMEHAME JAPAN が東京・京都の現役の作り手と、少人数・貸切の文化体験だけを扱う理由と、通訳ガイドが同行することで何が変わるのかをご説明します。",
    lead:
      "訪日のお客様向けに売られている文化体験の多くは、人数をさばくために設計されています。私たちのものは、教える人を中心に設計しています。",
    sections: [
      {
        heading: "始めた理由",
        body: [
          "日本は、表側には気前がよく、内側には慎重です。朝六時に相撲部屋の前に立つことも、祇園のお茶屋の前を一週間通り続けることもできますが、敷居を越えることはできません。冷たいからではなく、入り口が分からないからです。",
          "入り口は昔から紹介でした。信用のある人から次の人へ、名前が渡っていく。花街が三百年そうしてきたように、多くの工芸の世界も今なおそうです。私たちの仕事は、その紹介を時間をかけて作り、東京に三日しかいない人のために開けておくことです。",
        ],
      },
      {
        heading: "小さいことに意味がある",
        body: [
          "扱うのは貸切かそれに近いものだけです。これは贅沢のための演出ではなく、他のすべてを成り立たせる条件です。二人を教える師は、その人が本当に聞きたいことに答えられます。二十人を教える師は、進行をこなすことになります。",
          "その分、売れる本数は少なくなります。寿司の付け台には職人が一人しかおらず、夜の数は限られています。いつも空いている予約表より、本当に空いている日をお見せしたいと考えています。",
        ],
      },
      {
        heading: "通訳こそが体験の中身",
        body: [
          "通訳ガイドはすべてのご予約に含まれます。追加オプションではなく、これ自体が商品だと考えています。黙って握りを見ているのも悪くありません。ですが、なぜシャリが人肌なのかを尋ね、答えを聞き、さらに一歩踏み込んで聞ける。一年後にも人に話しているのは、そちらのほうです。",
          "ガイドには言葉だけでなく、その技についても事前に共有しています。訳すべき時と、黙っているべき時を心得ています。",
        ],
      },
    ],
    promises: [
      {
        heading: "現役の作り手のみ",
        body: "お会いするのは全員、その仕事で生計を立てている方です。演者も、団体向けの実演専用施設もありません。",
      },
      {
        heading: "空きは正直に",
        body: "空いていない日は空いていないとお伝えします。受け入れ先に確認してから確定する体験については、その旨を最初に明示しています。",
      },
      {
        heading: "後から増えない料金",
        body: "表示の料金には通訳ガイドと体験そのものが含まれます。含まれないものはページに書いてあり、当日になって分かることはありません。",
      },
      {
        heading: "受け入れ先の秘匿",
        body: "店名と住所を予約確定まで伏せたいという受け入れ先があります。私たちはそれを守ります。多くの場合、それが受け入れていただける理由そのものだからです。",
      },
    ],
    closing: {
      heading: "まず一つの午後から",
      body:
        "旅程全体をこれに合わせる必要はありません。一つの体験、二時間。残りの予定はそのままで構いません。",
      cta: "すべての体験を見る",
    },
  },
  fr: {
    title: "Notre approche",
    metaDescription: "Pourquoi KAMEHAME JAPAN ne propose que de petites expériences culturelles privées avec des maîtres en activité à Tokyo et Kyoto — et ce qu'un guide-interprète change à ce que vous ramenez.",
    lead: "La plupart des expériences culturelles vendues aux visiteurs au Japon sont conçues pour le volume. Les nôtres sont construites autour de la personne qui les enseigne.",
    sections: [
      { heading: "Pourquoi nous avons commencé", body: [
        "Le Japon est généreux avec ses surfaces et prudent avec ses intérieurs. Vous pouvez vous tenir devant une écurie de sumo à six heures du matin, ou passer devant une maison de thé de Gion chaque soir pendant une semaine, sans jamais franchir le seuil. Non par manque d'amabilité — parce qu'il n'y a pas d'entrée évidente.",
        "L'entrée a toujours été l'introduction. Un nom, transmis par quelqu'un de confiance à quelqu'un d'autre. C'est ainsi que fonctionne le karyukai depuis trois siècles, et la plupart des métiers d'art encore aujourd'hui. Notre travail consiste à prendre le temps de construire ces introductions, puis à les tenir ouvertes pour ceux qui ont trois jours à Tokyo et aucun moyen de savoir à quelle porte frapper.",
      ]},
      { heading: "Petit, volontairement", body: [
        "Chaque expérience que nous vendons est privée ou presque. Ce n'est pas une fioriture de luxe — c'est la condition qui rend le reste possible. Un maître qui enseigne à deux personnes peut répondre à la question que vous avez vraiment. Un maître qui en enseigne vingt donne un spectacle.",
        "Cela signifie aussi que nous vendons moins de séances que nous le pourrions. Un comptoir de sushi a un chef et un nombre fini de soirées. Nous préférons vous montrer une date réellement disponible qu'un calendrier toujours vert.",
      ]},
      { heading: "L'interprète est l'expérience", body: [
        "Un guide-interprète accompagne chaque réservation, et nous le considérons comme le produit, pas comme une option. Regarder quelqu'un façonner du riz en silence est agréable. Demander pourquoi le riz est à température du corps, entendre la réponse, puis poser la question suivante — voilà ce que vous raconterez encore un an plus tard.",
        "Nos guides sont briefés sur le métier, pas seulement sur la langue. Ils savent quand traduire et quand s'effacer.",
      ]},
    ],
    promises: [
      { heading: "De vrais praticiens", body: "Tous ceux que vous rencontrez vivent de leur métier. Pas d'acteurs, pas de lieux de démonstration bâtis pour les groupes." },
      { heading: "Une disponibilité honnête", body: "Si une date n'est pas libre, nous le disons. Certaines de nos expériences sont confirmées avec la maison avant que votre réservation soit définitive, et nous l'annonçons d'emblée." },
      { heading: "Des prix qui tiennent", body: "Le prix affiché inclut le guide-interprète et la séance elle-même. Ce qui n'est pas inclus est écrit sur la page, pas découvert le jour même." },
      { heading: "La discrétion pour nos partenaires", body: "Certaines maisons demandent que leur nom et leur adresse restent privés jusqu'à confirmation. Nous le respectons — c'est souvent la raison pour laquelle elles acceptent de recevoir." },
    ],
    closing: { heading: "Commencez par un après-midi", body: "Inutile de bâtir tout un voyage autour. Une séance, deux heures, et le reste de votre itinéraire ne bouge pas.", cta: "Voir toutes les expériences" },
  },
  "zh-tw": {
    title: "我們的理念",
    metaDescription: "為什麼 KAMEHAME JAPAN 只安排東京與京都現役職人的小型私人文化體驗——以及口譯導遊如何改變您帶回家的東西。",
    lead: "賣給日本旅客的文化體驗，多數是為了消化人數而設計。我們的體驗則是圍繞著教的人來設計。",
    sections: [
      { heading: "我們為何開始", body: [
        "日本對表面慷慨，對內裡謹慎。您可以清晨六點站在相撲部屋門口，或連著一週每晚經過祇園的茶屋，卻始終跨不過門檻。不是因為誰不友善——而是沒有明顯的入口。",
        "入口從來都是引薦：一個名字，從受信任的人傳給另一個人。花柳界三百年來如此運作，大多數工藝傳統至今亦然。我們做的，是花時間建立這些引薦，然後為那些在東京只有三天、不知道該敲哪扇門的人，把門留著。",
      ]},
      { heading: "刻意做小", body: [
        "我們賣的每一項體驗都是私人或接近私人的。這不是奢華的點綴——而是讓其餘一切成立的條件。教兩個人的師傅能回答您真正想問的問題；教二十個人的師傅是在演出。",
        "這也表示我們賣的場次比能賣的少。一個壽司吧檯只有一位職人和有限的夜晚。我們寧願給您一個真正有空的日期，也不要一本永遠都是綠色的行事曆。",
      ]},
      { heading: "口譯就是體驗本身", body: [
        "每筆預約都有口譯導遊，我們把它當成產品，而非加購。靜靜看人捏飯很愉快；問為什麼飯要維持體溫、聽到答案、再追問下去——那才是一年後您還會跟人說的事。",
        "我們的導遊事先了解那門技藝，不只是語言。他們知道何時該翻譯，何時該退開。",
      ]},
    ],
    promises: [
      { heading: "真正的執業者", body: "您見到的每個人都以這門技藝為生。沒有演員，沒有為團客搭建的示範場地。" },
      { heading: "誠實的空檔", body: "日期沒空，我們就說沒空。部分體驗會先與場地確認再成立預約，我們一開始就會說明。" },
      { heading: "不會膨脹的價格", body: "您看到的價格包含口譯導遊與體驗本身。不含的項目寫在頁面上，不會在當天才發現。" },
      { heading: "為合作夥伴保密", body: "有些場地希望在預約確認前不公開名稱與地址。我們尊重——這往往正是他們願意接待的原因。" },
    ],
    closing: { heading: "從一個下午開始", body: "不必為此重排整趟旅程。一場體驗、兩小時，其餘行程維持原樣。", cta: "查看所有體驗" },
  },
};

const FAQ: Record<Lang, FaqCopy> = {
  en: {
    title: "Frequently asked questions",
    metaDescription:
      "Booking, language, timing, dress, dietary needs and cancellation — the questions visitors ask before booking a cultural experience in Tokyo or Kyoto.",
    lead: "If your question is not here, write to us. A person answers, usually the same day.",
    groups: [
      {
        heading: "Booking",
        items: [
          {
            q: "How far in advance should I book?",
            a: "Two to four weeks is comfortable for most experiences. The Kyoto maiko and geiko banquet needs at least three days and fills quickly in spring and autumn. If your dates are close, ask anyway — cancellations happen.",
          },
          {
            q: "What does “on request” mean on some experiences?",
            a: "It means the house confirms your date before the booking is final. You send your preferred date and party size, we check with them, and you hear back within 24 hours. Nothing is settled until we confirm, and we will tell you straight away if the date cannot be held.",
          },
          {
            q: "Can I book for one person?",
            a: "Some experiences have a two-person minimum because the session is priced per group. The minimum is written on each experience page under the group size.",
          },
          {
            q: "Do you arrange transport or hotel pickup?",
            a: "No. Every experience is meet-on-site: you make your own way there and leave when it ends. We send clear directions, the nearest station and walking time once your booking is confirmed.",
          },
        ],
      },
      {
        heading: "On the day",
        items: [
          {
            q: "Will someone speak my language?",
            a: "Yes. An interpreter guide is included in every booking and stays with you throughout. The master usually teaches in Japanese; your guide carries the conversation both ways, including your questions.",
          },
          {
            q: "Where exactly do we meet?",
            a: "The meeting point is confirmed by email once your booking is final. Some of our partner venues ask that their name and address stay private until then, so the experience page gives the district and nearest station rather than the street address.",
          },
          {
            q: "What should I wear?",
            a: "Comfortable clothes you can move in. Several venues are tatami rooms where you will take your shoes off, so socks without holes are a genuine kindness to yourself. Anything more specific is listed on the experience page.",
          },
          {
            q: "Can I take photographs?",
            a: "Almost always yes, and in most sessions there is a moment set aside for it. A few venues restrict photography during parts of the session; your guide will tell you when.",
          },
        ],
      },
      {
        heading: "Who can join",
        items: [
          {
            q: "Are children welcome?",
            a: "It depends on the experience — the age range is written on each page. Where children can join, the price is often lower for them.",
          },
          {
            q: "I have tattoos. Is that a problem?",
            a: "For our experiences, generally no. If a particular venue asks for tattoos to be covered, it is stated on that experience page. Japan's rules about tattoos mostly concern bathhouses and pools, which we do not book.",
          },
          {
            q: "Can you accommodate dietary requirements?",
            a: "Where food is served, yes, with notice. Tell us when you book — allergies, vegetarian, vegan, halal — and we will confirm what the kitchen can do before you pay.",
          },
          {
            q: "What about accessibility?",
            a: "Several venues are older buildings with steps and no lift. Tell us what you need and we will check the specific venue rather than guess; if it will not work we will say so.",
          },
        ],
      },
      {
        heading: "Payment and changes",
        items: [
          {
            q: "What currency do I pay in?",
            a: "Prices are set and charged in Japanese yen. Your card issuer converts at its own rate, so the amount in your currency may differ slightly from any estimate shown.",
          },
          {
            q: "What is included in the price?",
            a: "The session itself and your interpreter guide. Anything not included — a souvenir you keep, an extra performer, shipping a piece home — is listed on the experience page before you book.",
          },
          {
            q: "Can I cancel or change my date?",
            a: "Cancellation terms are printed on every experience page, because they differ by venue. Some are free up to seven days before; others charge from four days out. Read the terms on the page you are booking.",
          },
          {
            q: "What if the venue cancels?",
            a: "You receive a full refund. Where we can offer an alternative date first, we will.",
          },
        ],
      },
    ],
    closing: {
      heading: "Still deciding?",
      body: "Tell us the dates you are in Japan and what interests you, and we will say honestly what is worth your afternoon.",
      cta: "Browse experiences",
    },
  },
  es: {
    title: "Preguntas frecuentes",
    metaDescription:
      "Reservas, idioma, horarios, vestimenta, dietas y cancelaciones: lo que preguntan los viajeros antes de reservar una experiencia cultural en Tokio o Kioto.",
    lead: "Si tu pregunta no está aquí, escríbenos. Responde una persona, normalmente el mismo día.",
    groups: [
      {
        heading: "Reservas",
        items: [
          {
            q: "¿Con cuánta antelación conviene reservar?",
            a: "Entre dos y cuatro semanas va bien para casi todo. El banquete con maiko y geiko en Kioto necesita al menos tres días y se llena rápido en primavera y otoño. Si tus fechas están cerca, pregúntanos igualmente: siempre hay cancelaciones.",
          },
          {
            q: "¿Qué significa «bajo petición» en algunas experiencias?",
            a: "Significa que la casa confirma tu fecha antes de cerrar la reserva. Nos envías la fecha y el número de personas, lo consultamos con ellos y te respondemos en 24 horas. Nada queda cerrado hasta que lo confirmamos, y si la fecha no puede mantenerse te lo decimos enseguida.",
          },
          {
            q: "¿Puedo reservar para una sola persona?",
            a: "Algunas experiencias tienen un mínimo de dos personas porque el precio es por grupo. El mínimo aparece en cada página, junto al tamaño del grupo.",
          },
          {
            q: "¿Organizáis transporte o recogida en el hotel?",
            a: "No. Todas las experiencias son con punto de encuentro en el lugar: llegas por tu cuenta y te marchas al terminar. Te enviamos indicaciones claras, la estación más cercana y el tiempo a pie en cuanto se confirma la reserva.",
          },
        ],
      },
      {
        heading: "El día de la experiencia",
        items: [
          {
            q: "¿Habrá alguien que hable mi idioma?",
            a: "Sí. Todas las reservas incluyen un guía intérprete que te acompaña en todo momento. El maestro suele enseñar en japonés; tu guía lleva la conversación en ambas direcciones, también tus preguntas.",
          },
          {
            q: "¿Dónde nos encontramos exactamente?",
            a: "El punto de encuentro se confirma por correo cuando la reserva queda cerrada. Algunos de nuestros locales piden que su nombre y dirección se mantengan privados hasta entonces, así que la página indica el barrio y la estación más cercana en lugar de la calle.",
          },
          {
            q: "¿Cómo debo vestir?",
            a: "Ropa cómoda con la que puedas moverte. Varios locales son salas de tatami donde te descalzarás, así que unos calcetines sin agujeros son un favor que te haces a ti. Cualquier requisito concreto aparece en la página de la experiencia.",
          },
          {
            q: "¿Puedo hacer fotos?",
            a: "Casi siempre sí, y en la mayoría de las sesiones hay un momento reservado para ello. Algunos locales restringen las fotos en ciertas partes; tu guía te avisará.",
          },
        ],
      },
      {
        heading: "Quién puede participar",
        items: [
          {
            q: "¿Pueden venir niños?",
            a: "Depende de la experiencia: el rango de edad está indicado en cada página. Donde pueden participar, su precio suele ser menor.",
          },
          {
            q: "Tengo tatuajes. ¿Es un problema?",
            a: "En nuestras experiencias, por lo general no. Si algún local pide cubrirlos, se indica en esa página. Las normas japonesas sobre tatuajes afectan sobre todo a baños y piscinas, que no reservamos.",
          },
          {
            q: "¿Podéis atender necesidades dietéticas?",
            a: "Donde se sirve comida, sí, avisando con antelación. Dínoslo al reservar —alergias, vegetariano, vegano, halal— y confirmaremos qué puede hacer la cocina antes de que pagues.",
          },
          {
            q: "¿Y la accesibilidad?",
            a: "Varios locales son edificios antiguos con escalones y sin ascensor. Cuéntanos qué necesitas y lo comprobamos con ese local concreto en lugar de suponerlo; si no es viable, te lo diremos.",
          },
        ],
      },
      {
        heading: "Pago y cambios",
        items: [
          {
            q: "¿En qué moneda pago?",
            a: "Los precios se fijan y se cobran en yenes japoneses. Tu banco aplica su propio cambio, así que el importe en tu moneda puede variar ligeramente respecto a cualquier estimación mostrada.",
          },
          {
            q: "¿Qué incluye el precio?",
            a: "La sesión y tu guía intérprete. Lo que no se incluye —un recuerdo que te llevas, un artista adicional, el envío de una pieza a casa— aparece en la página antes de reservar.",
          },
          {
            q: "¿Puedo cancelar o cambiar la fecha?",
            a: "Las condiciones de cancelación están impresas en cada página, porque varían según el local. Algunas son gratuitas hasta siete días antes; otras cobran desde cuatro días antes. Lee las condiciones de la página que estés reservando.",
          },
          {
            q: "¿Y si cancela el local?",
            a: "Recibes el reembolso íntegro. Si podemos ofrecerte antes una fecha alternativa, lo haremos.",
          },
        ],
      },
    ],
    closing: {
      heading: "¿Aún lo estás pensando?",
      body: "Dinos qué días estarás en Japón y qué te interesa, y te diremos con franqueza qué merece tu tarde.",
      cta: "Ver experiencias",
    },
  },
  ja: {
    title: "よくあるご質問",
    metaDescription:
      "予約、言語、時間、服装、食事制限、キャンセルについて。東京・京都の文化体験をお申し込みになる前によくいただくご質問をまとめました。",
    lead: "こちらにない場合はお問い合わせください。担当者が、通常は当日中にお返事します。",
    groups: [
      {
        heading: "ご予約について",
        items: [
          {
            q: "どのくらい前に予約すればよいですか。",
            a: "多くの体験は2〜4週間前が目安です。京都の舞妓・芸妓のお座敷は最低3日前までで、春と秋は早く埋まります。日程が近い場合も、キャンセルが出ることがありますので一度ご相談ください。",
          },
          {
            q: "「リクエスト予約」とはどういう意味ですか。",
            a: "受け入れ先と日程を確認してから予約が確定する方式です。ご希望の日程と人数をお送りいただき、当方で確認のうえ24時間以内にご返信します。確定のご連絡までは予約は成立せず、日程を押さえられない場合はすぐにお知らせします。",
          },
          {
            q: "1名でも予約できますか。",
            a: "グループ単位の料金設定のため、2名からとなる体験があります。最少人数は各体験ページの人数欄に記載しています。",
          },
          {
            q: "送迎やホテルへのお迎えはありますか。",
            a: "ございません。すべて現地集合・現地解散です。ご予約確定後に、最寄駅と徒歩時間を含めた分かりやすい道順をお送りします。",
          },
        ],
      },
      {
        heading: "当日について",
        items: [
          {
            q: "言葉が通じるか心配です。",
            a: "すべてのご予約に通訳ガイドが含まれ、最後までご一緒します。師は日本語で教えることがほとんどですが、ガイドが双方向で会話を運びます。お客様からの質問も同様です。",
          },
          {
            q: "集合場所はどこになりますか。",
            a: "ご予約確定後にメールでお伝えします。受け入れ先の中には、店名と住所を確定までは伏せたいというところがあるため、体験ページでは地区と最寄駅までの表示としています。",
          },
          {
            q: "服装はどうすればよいですか。",
            a: "動きやすい服装でお越しください。畳の部屋で靴を脱ぐ体験がいくつかありますので、靴下をお持ちいただくと安心です。これ以外の条件がある場合は各体験ページに記載しています。",
          },
          {
            q: "写真を撮ってもよいですか。",
            a: "ほとんどの場合は可能で、多くの体験には撮影の時間を設けています。一部、進行中の撮影を控えていただく場面がありますので、ガイドがその都度ご案内します。",
          },
        ],
      },
      {
        heading: "参加の条件",
        items: [
          {
            q: "子どもも参加できますか。",
            a: "体験によって異なります。対象年齢は各ページに記載しています。参加いただける体験では、お子様料金を設けている場合があります。",
          },
          {
            q: "タトゥーがありますが問題ありますか。",
            a: "当社の体験では、基本的に問題ありません。特定の受け入れ先で覆っていただく必要がある場合は、その体験ページに記載しています。日本でタトゥーが制限されるのは主に入浴施設やプールで、当社では取り扱っていません。",
          },
          {
            q: "食事制限に対応してもらえますか。",
            a: "食事が出る体験については、事前にお知らせいただければ対応します。ご予約時にアレルギー、ベジタリアン、ヴィーガン、ハラルなどをお伝えください。お支払い前に厨房で対応可能かをご連絡します。",
          },
          {
            q: "バリアフリーの状況を知りたいです。",
            a: "古い建物で段差があり、エレベーターのない会場がいくつかあります。必要な条件をお知らせいただければ、推測ではなくその会場に確認します。難しい場合は、難しいとお伝えします。",
          },
        ],
      },
      {
        heading: "お支払いと変更",
        items: [
          {
            q: "どの通貨で支払いますか。",
            a: "料金の設定・決済はすべて日本円です。カード会社の換算レートによるため、お客様の通貨での金額は目安表示と多少異なる場合があります。",
          },
          {
            q: "料金には何が含まれますか。",
            a: "体験そのものと通訳ガイドです。含まれないもの——お持ち帰りいただく作品、追加の出演者、作品の海外発送など——は、お申し込み前に各体験ページに記載しています。",
          },
          {
            q: "キャンセルや日程変更はできますか。",
            a: "キャンセル規定は受け入れ先ごとに異なるため、各体験ページに記載しています。7日前まで無料のものもあれば、4日前から料金が発生するものもあります。お申し込みになるページの規定をご確認ください。",
          },
          {
            q: "受け入れ先の都合で中止になった場合は。",
            a: "全額を返金いたします。代替日をご提案できる場合は、まずそちらをご案内します。",
          },
        ],
      },
    ],
    closing: {
      heading: "迷われている方へ",
      body: "日本にいらっしゃる日程とご関心をお知らせいただければ、その午後を使う価値があるかどうかを正直にお答えします。",
      cta: "体験を見る",
    },
  },
  fr: {
    title: "Questions fréquentes",
    metaDescription: "Réservation, langue, horaires, tenue, régimes et annulation — les questions que se posent les voyageurs avant de réserver une expérience culturelle à Tokyo ou Kyoto.",
    lead: "Si votre question n'est pas ici, écrivez-nous. Une personne répond, généralement le jour même.",
    groups: [
      { heading: "Réservation", items: [
        { q: "Combien de temps à l'avance réserver ?", a: "Deux à quatre semaines conviennent pour la plupart des expériences. Le banquet avec maiko et geiko à Kyoto exige au moins trois jours et se remplit vite au printemps et en automne. Si vos dates sont proches, demandez quand même — des annulations arrivent." },
        { q: "Que signifie « sur demande » sur certaines expériences ?", a: "Que la maison confirme votre date avant que la réservation soit définitive. Vous envoyez votre date et le nombre de personnes, nous vérifions auprès d'elle, et vous avez une réponse sous 24 heures. Rien n'est engagé tant que nous n'avons pas confirmé, et nous vous dirons tout de suite si la date ne peut pas être tenue." },
        { q: "Puis-je réserver pour une personne ?", a: "Certaines expériences ont un minimum de deux personnes parce que la séance est tarifée par groupe. Le minimum est indiqué sur chaque page, à la taille du groupe." },
        { q: "Organisez-vous le transport ou une prise en charge à l'hôtel ?", a: "Non. Chaque expérience se fait avec rendez-vous sur place : vous vous y rendez par vos propres moyens et repartez à la fin. Nous envoyons des indications claires, la gare la plus proche et le temps de marche une fois votre réservation confirmée." },
      ]},
      { heading: "Le jour même", items: [
        { q: "Quelqu'un parlera-t-il ma langue ?", a: "Oui. Un guide-interprète est inclus dans chaque réservation et reste avec vous du début à la fin. Le maître enseigne généralement en japonais ; votre guide porte la conversation dans les deux sens, y compris vos questions." },
        { q: "Où exactement nous retrouvons-nous ?", a: "Le point de rendez-vous est confirmé par e-mail une fois la réservation définitive. Certains lieux partenaires demandent que leur nom et leur adresse restent privés jusque-là ; la page de l'expérience indique donc le quartier et la gare la plus proche plutôt que l'adresse." },
        { q: "Comment m'habiller ?", a: "Des vêtements confortables dans lesquels vous pouvez bouger. Plusieurs lieux sont des pièces en tatami où vous retirerez vos chaussures : des chaussettes sans trou sont une vraie gentillesse envers vous-même. Toute consigne plus précise figure sur la page de l'expérience." },
        { q: "Puis-je prendre des photos ?", a: "Presque toujours, et la plupart des séances prévoient un moment pour cela. Quelques lieux limitent les photos pendant certaines parties ; votre guide vous le dira." },
      ]},
      { heading: "Qui peut participer", items: [
        { q: "Les enfants sont-ils les bienvenus ?", a: "Cela dépend de l'expérience — la tranche d'âge est indiquée sur chaque page. Lorsqu'ils peuvent participer, leur tarif est souvent réduit." },
        { q: "J'ai des tatouages. Est-ce un problème ?", a: "Pour nos expériences, en général non. Si un lieu demande de les couvrir, c'est indiqué sur sa page. Les règles japonaises sur les tatouages concernent surtout les bains et les piscines, que nous ne réservons pas." },
        { q: "Pouvez-vous tenir compte de régimes alimentaires ?", a: "Là où un repas est servi, oui, avec préavis. Dites-le-nous à la réservation — allergies, végétarien, végétalien, halal — et nous confirmerons ce que la cuisine peut faire avant que vous payiez." },
        { q: "Et l'accessibilité ?", a: "Plusieurs lieux sont des bâtiments anciens avec des marches et sans ascenseur. Dites-nous ce dont vous avez besoin et nous vérifierons auprès du lieu précis plutôt que de deviner ; si ce n'est pas possible, nous le dirons." },
      ]},
      { heading: "Paiement et modifications", items: [
        { q: "Dans quelle devise est-ce que je paie ?", a: "Les prix sont fixés et débités en yens japonais. Votre banque convertit à son propre taux, le montant dans votre devise peut donc différer légèrement d'une estimation affichée." },
        { q: "Qu'est-ce qui est inclus dans le prix ?", a: "La séance elle-même et votre guide-interprète. Tout ce qui n'est pas inclus — un souvenir que vous gardez, un artiste supplémentaire, l'expédition d'une pièce — est listé sur la page avant de réserver." },
        { q: "Puis-je annuler ou changer de date ?", a: "Les conditions d'annulation figurent sur chaque page, car elles varient selon le lieu. Certaines sont gratuites jusqu'à sept jours avant ; d'autres facturent à partir de quatre jours. Lisez les conditions de la page que vous réservez." },
        { q: "Et si le lieu annule ?", a: "Vous êtes intégralement remboursé. Lorsque nous pouvons d'abord proposer une autre date, nous le faisons." },
      ]},
    ],
    closing: { heading: "Encore hésitant ?", body: "Dites-nous vos dates au Japon et ce qui vous intéresse, et nous vous dirons honnêtement ce qui vaut votre après-midi.", cta: "Parcourir les expériences" },
  },
  "zh-tw": {
    title: "常見問題",
    metaDescription: "預約、語言、時間、穿著、飲食與取消——旅客在預約東京或京都的文化體驗前常問的問題。",
    lead: "如果這裡沒有您的問題，請來信。由專人回覆，通常當天就會回。",
    groups: [
      { heading: "預約", items: [
        { q: "應該提前多久預約？", a: "大多數體驗提前兩到四週即可。京都的舞妓與藝妓座敷宴至少需提前三天，春秋兩季很快額滿。若日期很近，也請詢問——總會有人取消。" },
        { q: "部分體驗標示「需確認」是什麼意思？", a: "表示場地會先確認您的日期，預約才成立。您送出希望的日期與人數，我們向場地確認，並在 24 小時內回覆。在我們確認之前一切都未定，若日期無法保留，我們會立刻告知。" },
        { q: "可以一個人預約嗎？", a: "部分體驗因為以組計價，最少需兩人。最少人數標示在各體驗頁面的團體人數欄。" },
        { q: "有安排交通或飯店接送嗎？", a: "沒有。所有體驗都是現場集合：您自行前往，結束後自行離開。預約確認後我們會寄出清楚的路線、最近車站與步行時間。" },
      ]},
      { heading: "當天", items: [
        { q: "會有人說我的語言嗎？", a: "會。每筆預約都含口譯導遊，全程陪同。師傅通常以日語教學；導遊負責雙向溝通，包括您的提問。" },
        { q: "確切集合地點在哪裡？", a: "預約成立後以電子郵件確認。部分合作場地希望在此之前不公開名稱與地址，因此體驗頁面標示的是區域與最近車站，而非街道地址。" },
        { q: "該怎麼穿？", a: "方便活動的舒適衣物。有幾個場地是榻榻米房間，需要脫鞋，所以襪子沒有破洞真的是善待自己。若有更具體的要求，會標示在體驗頁面。" },
        { q: "可以拍照嗎？", a: "幾乎都可以，多數體驗還會安排拍照時間。少數場地在部分環節限制拍照；導遊會告訴您何時。" },
      ]},
      { heading: "誰能參加", items: [
        { q: "歡迎兒童嗎？", a: "視體驗而定——年齡範圍標示在各頁面。可參加的體驗，兒童價格通常較低。" },
        { q: "我有刺青，會有問題嗎？", a: "就我們的體驗而言，通常不會。若特定場地要求遮蓋，會標示在該體驗頁面。日本關於刺青的規定主要涉及澡堂與泳池，而我們不安排這些。" },
        { q: "能配合飲食需求嗎？", a: "有供餐的體驗可以，需事先告知。預約時請說明——過敏、素食、純素、清真——我們會在您付款前確認廚房能做到什麼。" },
        { q: "無障礙方面呢？", a: "有幾個場地是有階梯、無電梯的老建築。告訴我們您的需求，我們會向該場地確認而非猜測；若不可行，我們會如實告知。" },
      ]},
      { heading: "付款與更改", items: [
        { q: "以什麼貨幣付款？", a: "價格以日圓訂定並收取。您的發卡機構會以自己的匯率換算，因此您的貨幣金額可能與頁面上的估算略有出入。" },
        { q: "價格包含什麼？", a: "體驗本身與您的口譯導遊。不包含的項目——可帶走的作品、額外表演者、將作品寄回家——都在預約前列於體驗頁面。" },
        { q: "可以取消或更改日期嗎？", a: "取消條款因場地而異，因此印在每個體驗頁面上。有些七天前免費，有些從四天前開始收費。請閱讀您預約頁面上的條款。" },
        { q: "如果場地方取消呢？", a: "您將獲得全額退款。若能先提供替代日期，我們會先提供。" },
      ]},
    ],
    closing: { heading: "還在考慮？", body: "告訴我們您在日本的日期與感興趣的事，我們會誠實地說什麼值得您的下午。", cta: "瀏覽體驗" },
  },
};

export const aboutFor = (lang: Lang) => ABOUT[lang];
export const faqFor = (lang: Lang) => FAQ[lang];
