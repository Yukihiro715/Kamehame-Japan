// Privacy & cookies. Written to describe what the site actually does today:
// an enquiry form that reaches us by email and is passed to the host venue,
// and measurement through Google Tag Manager under Consent Mode v2. When
// online booking or payment arrives, this page has to change with it.

import type { Lang } from "@/lib/i18n";

export interface PrivacyCopy {
  title: string;
  metaDescription: string;
  lead: string;
  updated: string;
  sections: { heading: string; body: string[]; list?: string[] }[];
  cookies: {
    heading: string;
    intro: string;
    cols: [string, string, string];
    rows: [string, string, string][];
  };
}

const UPDATED = "2026-09-15";

const PRIVACY: Record<Lang, PrivacyCopy> = {
  en: {
    title: "Privacy & cookies",
    metaDescription: "What KAMEHAME JAPAN does with the details you send, which cookies the site sets, and how to change your choice.",
    lead: "This page explains what happens to the details you send us, what the site measures, and how to change your mind.",
    updated: "Last updated",
    sections: [
      {
        heading: "Who is responsible",
        body: [
          "KAMEHAME JAPAN is operated by Prosent Inc., Kachidoki 1-3-1, 43F, Chuo-ku, Tokyo 104-0054, Japan, which decides how the information described here is used. Write to hello@kamehame-japan.com with any question about this page or about your own data.",
        ],
      },
      {
        heading: "When you send an enquiry",
        body: [
          "The enquiry form asks for your name, email address, the dates and start times you would like, how many of you there are, and anything you want us to check with the venue. It reaches us as an email; nothing is published and nothing is sold.",
          "To answer you we pass what is needed — usually the date, the number of guests and any dietary or access requirement — to the host of the experience you asked about, and to our travel-arrangement partner, ELNX TRAVEL Co., Ltd., where they handle the booking. We do not send them your email address unless you ask us to put you in direct contact.",
          "We keep enquiries for as long as it takes to answer you and to honour a booking made from them, and for up to three years afterwards so we can deal with questions about a past booking. Ask us to delete yours sooner and we will.",
        ],
      },
      {
        heading: "Why we are allowed to use it",
        body: [
          "For enquiries and bookings: because you asked us to take steps before entering into a contract, and to perform that contract once it exists. For measurement and advertising: your consent, which you can withdraw at any time. For keeping records of past bookings: our legitimate interest in being able to answer questions about them.",
        ],
      },
      {
        heading: "Measurement and advertising",
        body: [
          "The site loads Google Tag Manager, which in turn runs Google Analytics 4 and — where you have agreed — Google Ads measurement. We use it to see which pages and which experiences people read, and whether our advertising reaches the right travellers.",
          "In the EEA, the United Kingdom and Switzerland nothing is stored on your device until you choose. Until then Google receives only a cookieless signal that a page was viewed, with no identifier. Outside those countries measurement runs by default and you can turn it off with the Cookie settings link in the footer.",
          "We do not run any other tracker, advertising pixel, social plugin or chat widget. When a page embeds a Google map, Google receives the request for that map; and when the booking system goes live, its own provider will be named here first.",
        ],
      },
      {
        heading: "Who else sees it, and where",
        body: [
          "Google Ireland / Google LLC process the measurement data described above, which can involve a transfer to the United States under the European Commission's standard contractual clauses and the EU–US Data Privacy Framework. Cloudflare serves the site and processes the technical request data any web server needs. Our email provider carries your enquiry. Each of them acts on our instructions only.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Wherever you live, you can ask us what we hold about you, ask for it to be corrected or deleted, ask us to restrict what we do with it, object to it, or ask for a copy in a portable form. You can withdraw consent to measurement at any time through the Cookie settings link in the footer, without affecting what was done before.",
          "Ask at hello@kamehame-japan.com. If you are in the EEA or the UK and you think we have it wrong, you may also complain to your national data protection authority.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "When the site starts taking bookings and payments online, or adds any new tool that touches your data, this page changes before that goes live, and the date below moves with it.",
        ],
      },
    ],
    cookies: {
      heading: "What is stored on your device",
      intro: "Only the first entry is set before you choose. The rest arrive only if you accept.",
      cols: ["Name", "What it does", "Kept for"],
      rows: [
        ["kh-consent", "Remembers your cookie choice so you are not asked again.", "6 months"],
        ["_ga, _ga_*", "Google Analytics: tells returning visits apart from new ones.", "2 years"],
        ["_gcl_*", "Google Ads: links a visit to the advert it came from.", "90 days"],
      ],
    },
  },

  ja: {
    title: "プライバシーとCookie",
    metaDescription: "KAMEHAME JAPANがお送りいただいた内容をどう扱うか、サイトが使用するCookie、設定の変更方法について。",
    lead: "お送りいただいた内容の取り扱いと、サイトが計測している内容、そして設定の変え方をご説明します。",
    updated: "最終更新",
    sections: [
      {
        heading: "運営者",
        body: [
          "KAMEHAME JAPANは、Prosent Inc.(〒104-0054 東京都中央区勝どき1-3-1 43F)が運営し、ここに記載する情報の取り扱いを決定しています。本ページやお客様ご自身の情報についてのご質問は hello@kamehame-japan.com までご連絡ください。",
        ],
      },
      {
        heading: "お問い合わせをいただいたとき",
        body: [
          "フォームでは、お名前・メールアドレス・ご希望の日程と開始時刻・ご人数・受け入れ先に確認しておきたいことをお伺いします。内容はメールとして当方に届きます。公開することも、第三者に販売することもありません。",
          "ご返信のために、必要な範囲(通常は日程・人数・食事や移動のご事情)を、お問い合わせの体験の受け入れ先と、予約を担当する旅行手配パートナー(株式会社ELNX TRAVEL)にお伝えします。直接のおつなぎをご希望でない限り、メールアドレスはお伝えしません。",
          "お問い合わせの内容は、ご返信と、そこから生じたご予約の履行に必要な期間、およびその後3年間(過去のご予約に関するお問い合わせに対応するため)保管します。それより早い削除をご希望の場合はお申し付けください。",
        ],
      },
      {
        heading: "取り扱いの根拠",
        body: [
          "お問い合わせとご予約については、契約の締結に向けたお申し出と、成立後の契約の履行のため。計測と広告については、お客様の同意(いつでも撤回できます)。過去のご予約の記録の保管については、それに関するお問い合わせに対応できるようにするという当方の正当な利益に基づきます。",
        ],
      },
      {
        heading: "計測と広告",
        body: [
          "本サイトはGoogleタグマネージャーを読み込み、その中でGoogleアナリティクス4と、同意をいただいた場合にGoogle広告の効果測定を実行します。どのページやどの体験が読まれているか、広告が適切な旅行者に届いているかを把握するために使用します。",
          "EEA・英国・スイスからのアクセスでは、お選びいただくまでお客様の端末に何も保存しません。それまでGoogleに送られるのは、識別子を含まない「ページが表示された」という情報のみです。これらの地域以外では計測が初期状態で有効になっており、フッターの「Cookie設定」からいつでも無効にできます。",
          "これ以外の解析ツール・広告ピクセル・SNSプラグイン・チャットツールは使用していません。Googleマップを埋め込んだページでは、その地図の読み込みのためGoogleにリクエストが送られます。予約システムを導入する際は、事前に本ページに記載します。",
        ],
      },
      {
        heading: "第三者への提供と保管場所",
        body: [
          "上記の計測データはGoogle Ireland / Google LLCが処理し、欧州委員会の標準契約条項およびEU–US データプライバシーフレームワークに基づき米国へ移転される場合があります。サイトの配信はCloudflareが行い、ウェブサーバーが必要とする技術的なリクエスト情報を処理します。お問い合わせの配送はメール事業者が行います。いずれも当方の指示の範囲でのみ取り扱います。",
        ],
      },
      {
        heading: "お客様の権利",
        body: [
          "お住まいの地域にかかわらず、当方が保有する情報の開示・訂正・削除・利用の制限・利用への異議・可搬な形式での提供を求めることができます。計測への同意は、フッターの「Cookie設定」からいつでも撤回できます(撤回前の処理の適法性には影響しません)。",
          "ご請求は hello@kamehame-japan.com へ。EEAまたは英国にお住まいで、当方の取り扱いに問題があるとお考えの場合は、各国のデータ保護当局に申し立てることもできます。",
        ],
      },
      {
        heading: "変更",
        body: [
          "オンラインでの予約・決済の受付を開始する場合や、お客様の情報に触れるツールを新たに導入する場合は、公開前に本ページを更新し、下記の日付も更新します。",
        ],
      },
    ],
    cookies: {
      heading: "端末に保存されるもの",
      intro: "お選びいただく前に保存されるのは最初の1つだけです。残りは同意された場合にのみ保存されます。",
      cols: ["名称", "用途", "保存期間"],
      rows: [
        ["kh-consent", "Cookieの選択を記憶し、繰り返し確認しないようにします。", "6か月"],
        ["_ga, _ga_*", "Googleアナリティクス:再訪と新規の訪問を区別します。", "2年"],
        ["_gcl_*", "Google広告:どの広告から訪問したかを対応づけます。", "90日"],
      ],
    },
  },

  es: {
    title: "Privacidad y cookies",
    metaDescription: "Qué hace KAMEHAME JAPAN con los datos que nos envía, qué cookies utiliza el sitio y cómo cambiar su elección.",
    lead: "Esta página explica qué ocurre con los datos que nos envía, qué mide el sitio y cómo cambiar de opinión.",
    updated: "Última actualización",
    sections: [
      {
        heading: "Quién es responsable",
        body: [
          "KAMEHAME JAPAN es operado por Prosent Inc., Kachidoki 1-3-1, 43F, Chuo-ku, Tokio 104-0054, Japón, que decide cómo se utiliza la información descrita aquí. Escriba a hello@kamehame-japan.com con cualquier duda sobre esta página o sobre sus datos.",
        ],
      },
      {
        heading: "Cuando envía una consulta",
        body: [
          "El formulario pide su nombre, su correo electrónico, las fechas y horas de inicio que prefiere, cuántas personas son y cualquier cosa que quiera que consultemos con el local. Nos llega como un correo; no se publica nada ni se vende nada.",
          "Para responderle trasladamos lo necesario —normalmente la fecha, el número de personas y cualquier necesidad dietética o de acceso— al anfitrión de la experiencia y a nuestro socio de organización de viajes, ELNX TRAVEL Co., Ltd., cuando es quien gestiona la reserva. No les damos su correo electrónico salvo que nos pida ponerle en contacto directo.",
          "Conservamos las consultas el tiempo necesario para responderle y cumplir una reserva derivada de ellas, y hasta tres años después para poder atender preguntas sobre una reserva pasada. Si prefiere que la borremos antes, díganoslo.",
        ],
      },
      {
        heading: "Por qué podemos usarlos",
        body: [
          "Para consultas y reservas: porque nos pidió dar pasos previos a un contrato y ejecutarlo una vez existe. Para medición y publicidad: su consentimiento, que puede retirar cuando quiera. Para conservar el registro de reservas pasadas: nuestro interés legítimo en poder responder preguntas sobre ellas.",
        ],
      },
      {
        heading: "Medición y publicidad",
        body: [
          "El sitio carga Google Tag Manager, que a su vez ejecuta Google Analytics 4 y, si usted lo acepta, la medición de Google Ads. Lo usamos para ver qué páginas y qué experiencias se leen y si nuestra publicidad llega a los viajeros adecuados.",
          "En el EEE, el Reino Unido y Suiza no se guarda nada en su dispositivo hasta que usted elija. Hasta entonces Google solo recibe una señal sin cookies de que se vio una página, sin identificador. Fuera de esos países la medición funciona por defecto y puede desactivarla con el enlace «Configuración de cookies» del pie de página.",
          "No usamos ningún otro rastreador, píxel publicitario, complemento social ni chat. Cuando una página incrusta un mapa de Google, Google recibe la petición de ese mapa; y cuando entre en servicio el sistema de reservas, su proveedor se indicará aquí antes.",
        ],
      },
      {
        heading: "Quién más lo ve, y dónde",
        body: [
          "Google Ireland / Google LLC tratan los datos de medición descritos arriba, lo que puede implicar una transferencia a Estados Unidos al amparo de las cláusulas contractuales tipo de la Comisión Europea y del Marco de Privacidad de Datos UE–EE. UU. Cloudflare sirve el sitio y trata los datos técnicos de la petición que necesita cualquier servidor web. Nuestro proveedor de correo transporta su consulta. Todos actúan únicamente siguiendo nuestras instrucciones.",
        ],
      },
      {
        heading: "Sus derechos",
        body: [
          "Viva donde viva, puede pedirnos qué datos suyos tenemos, pedir que se corrijan o se borren, que limitemos su uso, oponerse a él o pedir una copia en formato portátil. Puede retirar el consentimiento a la medición cuando quiera desde «Configuración de cookies» en el pie de página, sin que ello afecte a lo hecho antes.",
          "Escriba a hello@kamehame-japan.com. Si está en el EEE o el Reino Unido y cree que no lo hacemos bien, también puede reclamar ante su autoridad nacional de protección de datos.",
        ],
      },
      {
        heading: "Cambios",
        body: [
          "Cuando el sitio empiece a aceptar reservas y pagos en línea, o incorpore cualquier herramienta nueva que trate sus datos, esta página cambiará antes de que eso entre en servicio, y la fecha de abajo cambiará con ella.",
        ],
      },
    ],
    cookies: {
      heading: "Qué se guarda en su dispositivo",
      intro: "Solo la primera entrada se guarda antes de su elección. El resto llega únicamente si acepta.",
      cols: ["Nombre", "Para qué sirve", "Duración"],
      rows: [
        ["kh-consent", "Recuerda su elección sobre cookies para no volver a preguntar.", "6 meses"],
        ["_ga, _ga_*", "Google Analytics: distingue las visitas nuevas de las recurrentes.", "2 años"],
        ["_gcl_*", "Google Ads: relaciona una visita con el anuncio del que procede.", "90 días"],
      ],
    },
  },

  fr: {
    title: "Confidentialité et cookies",
    metaDescription: "Ce que KAMEHAME JAPAN fait des informations que vous envoyez, les cookies déposés par le site et comment changer votre choix.",
    lead: "Cette page explique ce que deviennent les informations que vous nous envoyez, ce que le site mesure et comment revenir sur votre choix.",
    updated: "Dernière mise à jour",
    sections: [
      {
        heading: "Qui est responsable",
        body: [
          "KAMEHAME JAPAN est exploité par Prosent Inc., Kachidoki 1-3-1, 43F, Chuo-ku, Tokyo 104-0054, Japon, qui décide de l'usage des informations décrites ici. Écrivez à hello@kamehame-japan.com pour toute question sur cette page ou sur vos propres données.",
        ],
      },
      {
        heading: "Lorsque vous envoyez une demande",
        body: [
          "Le formulaire demande votre nom, votre adresse e-mail, les dates et heures de début souhaitées, le nombre de personnes et ce que vous voulez que nous vérifiions auprès du lieu. Il nous parvient sous forme d'e-mail ; rien n'est publié, rien n'est vendu.",
          "Pour vous répondre, nous transmettons le nécessaire — en général la date, le nombre de personnes et toute contrainte alimentaire ou d'accès — à l'hôte de l'expérience et à notre partenaire d'organisation de voyages, ELNX TRAVEL Co., Ltd., lorsqu'il gère la réservation. Nous ne leur communiquons pas votre adresse e-mail, sauf si vous nous demandez une mise en relation directe.",
          "Nous conservons les demandes le temps de vous répondre et d'honorer une réservation qui en découle, puis jusqu'à trois ans afin de pouvoir traiter les questions sur une réservation passée. Demandez-nous de supprimer la vôtre plus tôt et nous le ferons.",
        ],
      },
      {
        heading: "Sur quelle base",
        body: [
          "Pour les demandes et les réservations : parce que vous nous avez demandé des démarches précontractuelles, puis l'exécution du contrat. Pour la mesure et la publicité : votre consentement, que vous pouvez retirer à tout moment. Pour la conservation des réservations passées : notre intérêt légitime à pouvoir répondre aux questions les concernant.",
        ],
      },
      {
        heading: "Mesure et publicité",
        body: [
          "Le site charge Google Tag Manager, qui exécute Google Analytics 4 et, si vous l'acceptez, la mesure Google Ads. Nous l'utilisons pour voir quelles pages et quelles expériences sont lues, et si notre publicité touche les bons voyageurs.",
          "Dans l'EEE, au Royaume-Uni et en Suisse, rien n'est enregistré sur votre appareil avant votre choix. Jusque-là, Google ne reçoit qu'un signal sans cookie indiquant qu'une page a été vue, sans identifiant. En dehors de ces pays, la mesure est active par défaut et le lien « Paramètres des cookies » en bas de page permet de la désactiver.",
          "Nous n'utilisons aucun autre traceur, pixel publicitaire, module social ou outil de chat. Lorsqu'une page intègre une carte Google, Google reçoit la requête correspondante ; et lorsque le système de réservation sera en service, son prestataire sera indiqué ici au préalable.",
        ],
      },
      {
        heading: "Qui d'autre y a accès, et où",
        body: [
          "Google Ireland / Google LLC traitent les données de mesure décrites ci-dessus, ce qui peut impliquer un transfert vers les États-Unis au titre des clauses contractuelles types de la Commission européenne et du cadre de protection des données UE–États-Unis. Cloudflare sert le site et traite les données techniques de requête dont tout serveur web a besoin. Notre prestataire de messagerie achemine votre demande. Chacun agit uniquement sur nos instructions.",
        ],
      },
      {
        heading: "Vos droits",
        body: [
          "Où que vous viviez, vous pouvez demander ce que nous détenons à votre sujet, en demander la rectification ou l'effacement, demander la limitation du traitement, vous y opposer ou en demander une copie dans un format portable. Vous pouvez retirer votre consentement à la mesure à tout moment via « Paramètres des cookies » en bas de page, sans effet sur ce qui a été fait auparavant.",
          "Écrivez à hello@kamehame-japan.com. Si vous êtes dans l'EEE ou au Royaume-Uni et estimez que nous avons tort, vous pouvez aussi saisir votre autorité nationale de protection des données.",
        ],
      },
      {
        heading: "Modifications",
        body: [
          "Lorsque le site commencera à accepter réservations et paiements en ligne, ou ajoutera un outil touchant à vos données, cette page sera modifiée avant la mise en service, et la date ci-dessous suivra.",
        ],
      },
    ],
    cookies: {
      heading: "Ce qui est enregistré sur votre appareil",
      intro: "Seule la première entrée est déposée avant votre choix. Les autres n'arrivent que si vous acceptez.",
      cols: ["Nom", "Rôle", "Durée"],
      rows: [
        ["kh-consent", "Mémorise votre choix pour ne plus vous le demander.", "6 mois"],
        ["_ga, _ga_*", "Google Analytics : distingue les visites nouvelles des visites répétées.", "2 ans"],
        ["_gcl_*", "Google Ads : relie une visite à l'annonce dont elle provient.", "90 jours"],
      ],
    },
  },

  "zh-tw": {
    title: "隱私權與 Cookie",
    metaDescription: "KAMEHAME JAPAN 如何處理您送出的資料、本網站使用哪些 Cookie，以及如何變更您的選擇。",
    lead: "本頁說明您送出的資料會如何被處理、網站衡量了哪些內容，以及如何改變您的選擇。",
    updated: "最後更新",
    sections: [
      {
        heading: "營運者",
        body: [
          "KAMEHAME JAPAN 由 Prosent Inc.（〒104-0054 日本東京都中央區勝どき 1-3-1 43F）營運，並決定本頁所述資料的使用方式。對本頁或您個人資料有任何疑問，請來信 hello@kamehame-japan.com。",
        ],
      },
      {
        heading: "當您送出詢問時",
        body: [
          "表單會詢問您的姓名、電子郵件、希望的日期與開始時間、人數，以及希望我們向店家確認的事項。內容以電子郵件送達我們，不會公開，也不會出售。",
          "為了回覆您，我們會將必要範圍（通常是日期、人數，以及飲食或行動方面的需求）轉達給該體驗的店家，以及負責處理預約的旅遊安排合作夥伴 ELNX TRAVEL Co., Ltd.。除非您希望我們直接為您牽線，否則不會提供您的電子郵件。",
          "詢問內容會保存至回覆完成、並履行由此產生的預約為止，之後再保存最多三年，以便處理關於既往預約的問題。若希望提前刪除，請告知我們。",
        ],
      },
      {
        heading: "處理的法律依據",
        body: [
          "關於詢問與預約：因為您要求我們進行締約前的準備，並在契約成立後履行。關於成效衡量與廣告：您的同意，且可隨時撤回。關於保存既往預約紀錄：我們對於能夠回覆相關問題的正當利益。",
        ],
      },
      {
        heading: "成效衡量與廣告",
        body: [
          "本網站載入 Google 代碼管理工具，並由其執行 Google Analytics 4，以及在您同意時執行 Google Ads 成效衡量。我們用來了解哪些頁面與體驗被閱讀，以及廣告是否觸及合適的旅客。",
          "在歐洲經濟區、英國與瑞士，在您做出選擇之前不會在您的裝置上儲存任何資料；在此之前 Google 只會收到「有人看了某個頁面」的無 Cookie 訊號，不含任何識別碼。在這些地區之外，成效衡量預設啟用，您可透過頁尾的「Cookie 設定」關閉。",
          "我們不使用其他追蹤工具、廣告像素、社群外掛或客服聊天工具。當頁面嵌入 Google 地圖時，Google 會收到該地圖的載入請求；預約系統上線時，其服務供應商會事先記載於本頁。",
        ],
      },
      {
        heading: "還有誰會接觸到，以及在哪裡",
        body: [
          "上述成效衡量資料由 Google Ireland / Google LLC 處理，可能依歐盟執委會的標準契約條款與歐盟—美國資料隱私框架傳輸至美國。網站由 Cloudflare 提供服務，並處理任何網頁伺服器所需的技術性請求資料。您的詢問由我們的電子郵件服務商傳送。以上各方均僅依我們的指示處理。",
        ],
      },
      {
        heading: "您的權利",
        body: [
          "無論您居住於何處，都可以要求查詢我們持有的您的資料、要求更正或刪除、要求限制處理、表示反對，或要求以可攜格式提供副本。您可隨時透過頁尾的「Cookie 設定」撤回對成效衡量的同意，且不影響撤回前已進行的處理。",
          "請來信 hello@kamehame-japan.com。若您位於歐洲經濟區或英國並認為我們處理不當，亦可向所屬國家的資料保護主管機關提出申訴。",
        ],
      },
      {
        heading: "變更",
        body: [
          "當本網站開始接受線上預約與付款，或導入任何接觸您資料的新工具時，將於上線前更新本頁，下方日期亦會一併更新。",
        ],
      },
    ],
    cookies: {
      heading: "會儲存在您裝置上的項目",
      intro: "只有第一項會在您選擇之前儲存，其餘僅在您同意後才會出現。",
      cols: ["名稱", "用途", "保存期間"],
      rows: [
        ["kh-consent", "記住您對 Cookie 的選擇，以免重複詢問。", "6 個月"],
        ["_ga, _ga_*", "Google Analytics：區分新訪客與回訪訪客。", "2 年"],
        ["_gcl_*", "Google Ads：將造訪與來源廣告對應起來。", "90 天"],
      ],
    },
  },
};

export const privacyFor = (lang: Lang) => PRIVACY[lang];
export const privacyUpdated = UPDATED;
