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

const UPDATED = "2026-09-29";

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
          "For enquiries and bookings: because you asked us to take steps before entering into a contract, and to perform that contract once it exists. For measurement and advertising: in the EEA, the United Kingdom and Switzerland, your consent, which you can withdraw at any time; elsewhere it runs unless you turn it off with the Cookie settings link in the footer. For sending your hashed email address to Google and Meta, wherever you are: your consent, given only by choosing Accept in the cookie settings, which you can withdraw at any time. For keeping records of past bookings: our legitimate interest in being able to answer questions about them.",
        ],
      },
      {
        heading: "Measurement and advertising",
        body: [
          "The site loads Google Tag Manager, which in turn runs Google Analytics 4 and — in the EEA, the United Kingdom and Switzerland only if you accept, elsewhere unless you turn it off — Google Ads measurement. We use it to see which pages and which experiences people read, and whether our advertising reaches the right travellers. When you send an enquiry after arriving from one of our adverts, the email address you entered is passed to Google in hashed (irreversibly scrambled) form so the enquiry can be matched to that advert — only if you have chosen Accept in the cookie settings.",
          "In the EEA, the United Kingdom and Switzerland nothing is stored on your device until you choose, apart from the first four entries in the table below. Until then Google receives only a cookieless signal that a page was viewed, with no identifier. Outside those countries measurement runs by default and you can turn it off with the Cookie settings link in the footer.",
          "Where measurement is on, Microsoft Clarity records how pages are used — scrolling, taps, clicks and mouse movement — so we can see where the site is hard to use. Form fields and anything you type are masked in your browser before anything is sent, and in the EEA, the United Kingdom and Switzerland Clarity loads only after you accept.",
          "In the EEA, the United Kingdom and Switzerland only if you accept advertising measurement, and elsewhere unless you turn it off, the site also loads the Meta Pixel from Meta. It tells Meta which pages were viewed and when you send an enquiry or pay for a booking, with the amount, the currency and a reference number, so we can measure our adverts on Facebook and Instagram and show them to people who have visited the site. With it Meta receives the page address (including any parameters), the page you came from, your IP address, browser and device details, and the identifiers in the _fbp and _fbc cookies. If you have chosen Accept in the cookie settings, it also receives, when you send an enquiry or pay, the email address you used, which the pixel scrambles irreversibly (hashes) in your browser before sending, so that Meta can match it to a Facebook or Instagram account; that hashed address then also goes with the pages you view afterwards, until you reload the page or leave the site, and can go again if you return to that page with your browser's Back or Forward button. Meta also uses this information for its own purposes (to personalise the ads and other content it shows people on and off its services, to improve its products and to keep them secure), as its privacy policy explains. We never send Meta what you write in the notes, anything about diet or health, or your name.",
          "You can stop this at any time with the Cookie settings link in the footer. To control ads based on your activity on other sites, use your ad preferences in Facebook or Instagram, or the industry opt-out pages at www.aboutads.info/choices and www.youronlinechoices.eu.",
          "We do not run any other tracker, social plugin or chat widget. When a page embeds a Google map, Google receives the request for that map.",
        ],
      },
      {
        heading: "Who else sees it, and where",
        body: [
          "Google Ireland / Google LLC process the measurement data described above, which can involve a transfer to the United States under the European Commission's standard contractual clauses and the EU–US Data Privacy Framework. Cloudflare serves the site and processes the technical request data any web server needs. Our email provider carries your enquiry, and Slack shows our team a short alert (the experience, dates, party size and your first name — not your email address or notes). Microsoft processes the Clarity data, also under the Data Privacy Framework. Each of them acts on our instructions only.",
          "Meta handles the Meta Pixel data differently: Meta Platforms Ireland Limited (Block J, Serpentine Avenue, Dublin 4, Ireland) for visitors in the EEA, and Meta Platforms, Inc. (1 Meta Way, Menlo Park, California, USA) for everyone else. We and Meta are joint controllers for collecting that data on this site and sending it to Meta: with Meta Ireland in the EEA, and with Meta Platforms, Inc. in the United Kingdom. Under our arrangement with Meta, we give you this information, and Meta answers requests to access, correct, delete, restrict or port the data it holds once it has received it. From then on Meta is responsible for its own use of it. Its privacy policy at www.facebook.com/about/privacy gives its contact details, the legal basis it relies on and how to exercise your rights with Meta. Meta Platforms, Inc. is certified under the EU–US and Swiss–US Data Privacy Frameworks; transfers from the EEA rely on the EU–US framework and on standard contractual clauses, transfers from Switzerland on the Swiss–US framework, and transfers from the United Kingdom on Meta's UK Data Transfer Addendum.",
          "When you pay through the link in our reply, the payment page is run by Stripe, which handles your card details under its own privacy policy; we never see your card number. You then return to our site, which reads back from Stripe only the amount, the currency and the email address of that payment, to confirm your booking and, where advertising measurement is on, to report it to Google Ads and Meta — with the email address, in the same hashed form as above, only if you have chosen Accept in the cookie settings.",
          "If you choose Accept, your hashed email address can reach Google LLC and Meta Platforms, Inc. in the United States. Japan's Personal Information Protection Commission describes the United States' system for protecting personal information at www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku (in Japanese). The measures each company takes to protect it are described in its privacy policy: policies.google.com/privacy and www.facebook.com/about/privacy.",
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
          "Whenever we add a new tool that touches your data, this page changes before that goes live, and the date at the top of this page moves with it.",
        ],
      },
    ],
    cookies: {
      heading: "What is stored on your device",
      intro: "In the EEA, the United Kingdom and Switzerland only the first four entries can be set before you choose, and the rest arrive only if you accept. Elsewhere the rest are set by default unless you turn measurement off with the Cookie settings link in the footer.",
      cols: ["Name", "What it does", "Kept for"],
      rows: [
        ["kh-consent-2", "Remembers your cookie choice so you are not asked again.", "6 months"],
        ["kh-checkout-session (browser storage, this tab only)", "Holds the Stripe reference of your payment so the confirmation page can check it without keeping it in the page address.", "Until you close the tab"],
        ["kh-enquiry-sent (browser storage, this tab only)", "Carries a summary of your enquiry to the confirmation page, which deletes it once read.", "Until the confirmation page opens"],
        ["kh-paid-… (browser storage)", "Remembers that a payment was already confirmed, so reloading the confirmation page never reports it twice.", "Until you clear your browser data"],
        ["_ga, _ga_*", "Google Analytics: tells returning visits apart from new ones.", "2 years"],
        ["_gcl_*", "Google Ads: links a visit to the advert it came from.", "90 days"],
        ["_clck, _clsk", "Microsoft Clarity: keeps the pages of one visit together.", "1 year / 1 day"],
        ["_fbp, _fbc", "Meta Pixel: recognises your browser, and a visit that came from a Meta ad, to measure and show our adverts.", "90 days, renewed on each visit"],
        ["fr (facebook.com)", "Meta: kept on Meta's own domain to deliver and measure ads. If you use Facebook in this browser and it allows third-party cookies, Meta can also read the other cookies it has set on facebook.com when the pixel contacts it.", "90 days"],
        ["lastExternalReferrer, lastExternalReferrerTime, multiFbc (browser storage)", "Meta Pixel: notes whether you last arrived from Facebook, Instagram, another site or directly, and recent clicks on Meta ads, to link visits to our adverts.", "90 days"],
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
          "お問い合わせとご予約については、契約の締結に向けたお申し出と、成立後の契約の履行のため。計測と広告については、EEA・英国・スイスではお客様の同意(いつでも撤回できます)、それ以外の地域ではフッターの「Cookie設定」で無効にしない限り実施します。ハッシュ化したメールアドレスのGoogleとMetaへの提供については、地域にかかわらず、Cookie設定で「同意する」を選択いただくことによるお客様の同意(いつでも撤回できます)に基づきます。過去のご予約の記録の保管については、それに関するお問い合わせに対応できるようにするという当方の正当な利益に基づきます。",
        ],
      },
      {
        heading: "計測と広告",
        body: [
          "本サイトはGoogleタグマネージャーを読み込み、その中でGoogleアナリティクス4と、Google広告の効果測定(EEA・英国・スイスでは同意いただいた場合のみ、それ以外の地域では無効にしない限り)を実行します。どのページやどの体験が読まれているか、広告が適切な旅行者に届いているかを把握するために使用します。広告から訪問された方がお問い合わせを送信した場合、Cookie設定で「同意する」を選択いただいているときに限り、入力されたメールアドレスを復元できない形(ハッシュ化)にしてGoogleに送り、どの広告からのお問い合わせかを照合します。",
          "EEA・英国・スイスからのアクセスでは、お選びいただくまで、下の表の最初の4つを除き、お客様の端末に何も保存しません。それまでGoogleに送られるのは、識別子を含まない「ページが表示された」という情報のみです。これらの地域以外では計測が初期状態で有効になっており、フッターの「Cookie設定」からいつでも無効にできます。",
          "計測が有効な場合、Microsoft Clarityでページの使われ方(スクロール、タップ、クリック、マウスの動き)を記録し、使いにくい箇所の改善に役立てます。入力欄とその入力内容は送信前にブラウザ上で伏せ字にされ、EEA・英国・スイスからのアクセスでは、同意いただいた後にのみClarityを読み込みます。",
          "EEA・英国・スイスでは広告の効果測定に同意いただいた場合に、それ以外の地域では無効にしない限り、MetaのMetaピクセルも読み込みます。表示されたページと、お問い合わせの送信・ご予約のお支払いがあったこと(金額・通貨・管理番号)をMetaに知らせ、FacebookやInstagramの広告の効果を測定し、サイトを訪れた方に広告を表示するために使用します。その際Metaには、ページのアドレス(パラメータを含む)、参照元のページ、IPアドレス、ブラウザや端末の情報、_fbp・_fbc Cookieの識別子が送られます。Cookie設定で「同意する」を選択いただいている場合は、お問い合わせの送信時やお支払い時に、ご利用のメールアドレスも、ブラウザ上で復元できない形(ハッシュ化)にしてから送られ、MetaはこれをFacebookやInstagramのアカウントとの照合に使います。このハッシュ化したアドレスは、ページを再読み込みするかサイトを離れるまで、その後に表示したページの情報にも付けて送られ、ブラウザの「戻る」「進む」でそのページに戻った場合にも再び送られることがあります。Metaはこれらの情報を、自社サービスの内外で表示する広告やコンテンツのパーソナライズ、製品の改善、安全の確保といった自らの目的にも利用します(詳しくはMetaのプライバシーポリシーをご覧ください)。備考欄の内容、食事や健康に関する情報、お名前はMetaに送りません。",
          "Metaピクセルによる計測は、フッターの「Cookie設定」からいつでも停止できます。他のサイトでの行動に基づく広告は、FacebookやInstagramの広告設定、または業界団体のオプトアウトページ(www.aboutads.info/choices、www.youronlinechoices.eu)から管理できます。",
          "これ以外の解析ツール・SNSプラグイン・チャットツールは使用していません。Googleマップを埋め込んだページでは、その地図の読み込みのためGoogleにリクエストが送られます。",
        ],
      },
      {
        heading: "第三者への提供と保管場所",
        body: [
          "上記の計測データはGoogle Ireland / Google LLCが処理し、欧州委員会の標準契約条項およびEU–US データプライバシーフレームワークに基づき米国へ移転される場合があります。サイトの配信はCloudflareが行い、ウェブサーバーが必要とする技術的なリクエスト情報を処理します。お問い合わせの配送はメール事業者が行い、社内への通知にはSlackを使います(体験・日程・人数・お名前のみで、メールアドレスや備考は含みません)。Clarityのデータは Microsoft が処理し、同じくデータプライバシーフレームワークの対象です。いずれも当方の指示の範囲でのみ取り扱います。",
          "Metaピクセルのデータの取り扱いは、上記とは異なります。EEAからの訪問者についてはMeta Platforms Ireland Limited(Block J, Serpentine Avenue, Dublin 4, Ireland)が、それ以外の訪問者についてはMeta Platforms, Inc.(1 Meta Way, Menlo Park, California, USA)が取り扱います。本サイトでのデータの収集とMetaへの送信については、EEAでは当方とMeta Irelandが、英国では当方とMeta Platforms, Inc.が共同管理者となります。Metaとの取り決めにより、この説明は当方が行い、Metaが受け取った後のデータの開示・訂正・削除・利用制限・可搬性に関するご請求にはMetaが対応します。送信後の利用はMetaが自らの責任で行います。Metaの連絡先、依拠する法的根拠、Metaに対する権利の行使方法は、Metaのプライバシーポリシー(www.facebook.com/about/privacy)に記載されています。Meta Platforms, Inc.はEU–USおよびスイス–USデータプライバシーフレームワークの認証を受けています。EEAからの移転はEU–USフレームワークと標準契約条項に、スイスからの移転はスイス–USフレームワークに、英国からの移転はMetaの英国データ移転補遺(UK Data Transfer Addendum)に基づきます。",
          "ご返信内のリンクからお支払いいただく際の決済ページはStripeが運営し、カード情報はStripeが自社のプライバシーポリシーに基づいて取り扱います。当方がカード番号を目にすることはありません。お支払い後に本サイトへ戻った際、ご予約の確定と、広告の効果測定が有効な場合のGoogle広告・Metaへの成果報告(メールアドレスは、Cookie設定で「同意する」を選択いただいている場合に限り、上記と同じハッシュ化)のため、Stripeからそのお支払いの金額・通貨・メールアドレスのみを取得します。",
          "「同意する」を選択いただいた場合、ハッシュ化したメールアドレスは米国のGoogle LLCおよびMeta Platforms, Inc.に提供されることがあります。米国の個人情報の保護に関する制度については、個人情報保護委員会の調査結果(www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku)をご覧ください。各社が講じる個人情報の保護のための措置は、各社のプライバシーポリシー(policies.google.com/privacy、www.facebook.com/about/privacy)に記載されています。",
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
          "お客様の情報に触れるツールを新たに導入する場合は、公開前に本ページを更新し、ページ上部の日付も更新します。",
        ],
      },
    ],
    cookies: {
      heading: "端末に保存されるもの",
      intro: "EEA・英国・スイスでは、お選びいただく前に保存されうるのは最初の4つだけで、残りは同意された場合にのみ保存されます。それ以外の地域では、フッターの「Cookie設定」で計測を無効にしない限り、残りも保存されます。",
      cols: ["名称", "用途", "保存期間"],
      rows: [
        ["kh-consent-2", "Cookieの選択を記憶し、繰り返し確認しないようにします。", "6か月"],
        ["kh-checkout-session(ブラウザのストレージ、このタブのみ)", "確認ページがお支払いを照会できるよう、Stripeのお支払いの識別番号を、ページのアドレスに残さずに保持します。", "タブを閉じるまで"],
        ["kh-enquiry-sent(ブラウザのストレージ、このタブのみ)", "お問い合わせの概要を確認ページに引き継ぎます。確認ページが読み込んだ時点で削除されます。", "確認ページが開くまで"],
        ["kh-paid-…(ブラウザのストレージ)", "お支払いを確認済みであることを記録し、確認ページを再読み込みしても二重に報告されないようにします。", "ブラウザのデータを消去するまで"],
        ["_ga, _ga_*", "Googleアナリティクス:再訪と新規の訪問を区別します。", "2年"],
        ["_gcl_*", "Google広告:どの広告から訪問したかを対応づけます。", "90日"],
        ["_clck, _clsk", "Microsoft Clarity:1回の訪問のページをまとめて扱います。", "1年/1日"],
        ["_fbp, _fbc", "Metaピクセル:ブラウザと、Meta広告からの訪問であることを識別し、広告の測定と表示に使います。", "90日(訪問のたびに更新)"],
        ["fr(facebook.com)", "Meta:Metaのドメインに保存され、広告の配信と測定に使われます。このブラウザでFacebookをご利用で、サードパーティCookieが許可されている場合、ピクセルの通信時に、Metaがfacebook.comに既に保存している他のCookieもMetaに読み取られます。", "90日"],
        ["lastExternalReferrer, lastExternalReferrerTime, multiFbc(ブラウザのストレージ)", "Metaピクセル:直前の訪問がFacebook・Instagram・その他のサイト・直接のいずれからだったかと、Meta広告の最近のクリックを記録し、広告からの訪問を対応づけます。", "90日"],
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
          "Para consultas y reservas: porque nos pidió dar pasos previos a un contrato y ejecutarlo una vez existe. Para medición y publicidad: en el EEE, el Reino Unido y Suiza, su consentimiento, que puede retirar cuando quiera; en los demás países funcionan salvo que las desactive con el enlace «Configuración de cookies» del pie de página. Para enviar su correo cifrado (hash) a Google y a Meta: en todos los países, su consentimiento, que solo da al elegir «Aceptar» en la configuración de cookies y que puede retirar cuando quiera. Para conservar el registro de reservas pasadas: nuestro interés legítimo en poder responder preguntas sobre ellas.",
        ],
      },
      {
        heading: "Medición y publicidad",
        body: [
          "El sitio carga Google Tag Manager, que a su vez ejecuta Google Analytics 4 y la medición de Google Ads (en el EEE, el Reino Unido y Suiza solo si la acepta; en los demás países, salvo que la desactive). Lo usamos para ver qué páginas y qué experiencias se leen y si nuestra publicidad llega a los viajeros adecuados. Si envía una consulta tras llegar desde uno de nuestros anuncios, el correo que escribió se transmite a Google cifrado de forma irreversible (hash) para asociar la consulta a ese anuncio, solo si eligió «Aceptar» en la configuración de cookies.",
          "En el EEE, el Reino Unido y Suiza no se guarda nada en su dispositivo hasta que usted elija, salvo las cuatro primeras entradas de la tabla de abajo. Hasta entonces Google solo recibe una señal sin cookies de que se vio una página, sin identificador. Fuera de esos países la medición funciona por defecto y puede desactivarla con el enlace «Configuración de cookies» del pie de página.",
          "Cuando la medición está activa, Microsoft Clarity registra cómo se usan las páginas (desplazamiento, toques, clics y movimiento del ratón) para ver dónde el sitio resulta difícil de usar. Los campos de formulario y lo que escribe se ocultan en su navegador antes de enviar nada, y en el EEE, el Reino Unido y Suiza Clarity solo se carga después de que usted acepte.",
          "En el EEE, el Reino Unido y Suiza solo si acepta la medición publicitaria, y en los demás países salvo que la desactive, el sitio carga también el píxel de Meta. Informa a Meta de las páginas vistas y de cuándo envía una consulta o paga una reserva, con el importe, la moneda y un número de referencia, para medir nuestros anuncios en Facebook e Instagram y mostrarlos a quienes han visitado el sitio. Meta recibe así la dirección de la página (con sus parámetros), la página de procedencia, su dirección IP, datos del navegador y del dispositivo y los identificadores de las cookies _fbp y _fbc. Si ha elegido «Aceptar» en la configuración de cookies, recibe además, cuando envía una consulta o paga, el correo que utilizó, que el píxel cifra de forma irreversible (hash) en su navegador antes de enviarlo, para que Meta pueda asociarlo a una cuenta de Facebook o Instagram; ese correo cifrado se envía también con las páginas que vea después, hasta que recargue la página o salga del sitio, y puede enviarse de nuevo si vuelve a esa página con los botones Atrás o Adelante del navegador. Meta usa también esta información para sus propios fines (personalizar los anuncios y otros contenidos que muestra dentro y fuera de sus servicios, mejorar sus productos y mantenerlos seguros), como explica su política de privacidad. Nunca enviamos a Meta lo que escribe en las notas, información sobre alimentación o salud, ni su nombre.",
          "Puede detenerlo en cualquier momento con el enlace «Configuración de cookies» del pie de página. Para controlar los anuncios basados en su actividad en otros sitios, use sus preferencias de anuncios en Facebook o Instagram, o las páginas de exclusión del sector: www.aboutads.info/choices y www.youronlinechoices.eu.",
          "No usamos ningún otro rastreador, complemento social ni chat. Cuando una página incrusta un mapa de Google, Google recibe la petición de ese mapa.",
        ],
      },
      {
        heading: "Quién más lo ve, y dónde",
        body: [
          "Google Ireland / Google LLC tratan los datos de medición descritos arriba, lo que puede implicar una transferencia a Estados Unidos al amparo de las cláusulas contractuales tipo de la Comisión Europea y del Marco de Privacidad de Datos UE–EE. UU. Cloudflare sirve el sitio y trata los datos técnicos de la petición que necesita cualquier servidor web. Nuestro proveedor de correo transporta su consulta y Slack muestra a nuestro equipo un aviso breve (experiencia, fechas, número de personas y su nombre, sin su correo ni sus notas). Microsoft trata los datos de Clarity, también al amparo del Marco de Privacidad de Datos. Todos actúan únicamente siguiendo nuestras instrucciones.",
          "Meta trata los datos del píxel de Meta de otra manera: Meta Platforms Ireland Limited (Block J, Serpentine Avenue, Dublin 4, Irlanda) para los visitantes del EEE y Meta Platforms, Inc. (1 Meta Way, Menlo Park, California, EE. UU.) para los demás. Nosotros y Meta somos corresponsables de la recogida de esos datos en este sitio y de su envío a Meta: con Meta Ireland en el EEE y con Meta Platforms, Inc. en el Reino Unido. Según nuestro acuerdo con Meta, nosotros le damos esta información y Meta atiende las solicitudes de acceso, rectificación, supresión, limitación o portabilidad de los datos que conserva una vez recibidos. A partir de ahí, Meta es responsable del uso que haga de ellos. Su política de privacidad, en www.facebook.com/about/privacy, indica sus datos de contacto, la base jurídica en la que se apoya y cómo ejercer sus derechos ante Meta. Meta Platforms, Inc. está certificada en los Marcos de Privacidad de Datos UE–EE. UU. y Suiza–EE. UU.; las transferencias desde el EEE se basan en el marco UE–EE. UU. y en cláusulas contractuales tipo, las transferencias desde Suiza en el marco Suiza–EE. UU. y las transferencias desde el Reino Unido en el UK Data Transfer Addendum de Meta.",
          "Cuando paga con el enlace de nuestra respuesta, la página de pago la gestiona Stripe, que trata los datos de su tarjeta según su propia política de privacidad; nosotros nunca vemos el número de la tarjeta. Después vuelve a nuestro sitio, que solo consulta a Stripe el importe, la moneda y el correo de ese pago, para confirmar su reserva y, si la medición publicitaria está activa, comunicarla a Google Ads y a Meta; el correo, con el mismo cifrado (hash) descrito arriba, solo si eligió «Aceptar» en la configuración de cookies.",
          "Si elige «Aceptar», su correo cifrado (hash) puede llegar a Google LLC y a Meta Platforms, Inc., en Estados Unidos. La Comisión de Protección de la Información Personal de Japón describe el sistema estadounidense de protección de datos personales en www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku (en japonés). Las medidas que cada empresa aplica para protegerlo se describen en su política de privacidad: policies.google.com/privacy y www.facebook.com/about/privacy.",
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
          "Cuando incorporemos cualquier herramienta nueva que trate sus datos, esta página cambiará antes de que entre en servicio, y la fecha del principio de la página cambiará con ella.",
        ],
      },
    ],
    cookies: {
      heading: "Qué se guarda en su dispositivo",
      intro: "En el EEE, el Reino Unido y Suiza solo las cuatro primeras entradas pueden guardarse antes de su elección y el resto llega únicamente si acepta. En los demás países el resto se guarda por defecto, salvo que desactive la medición con el enlace «Configuración de cookies» del pie de página.",
      cols: ["Nombre", "Para qué sirve", "Duración"],
      rows: [
        ["kh-consent-2", "Recuerda su elección sobre cookies para no volver a preguntar.", "6 meses"],
        ["kh-checkout-session (almacenamiento del navegador, solo esta pestaña)", "Guarda la referencia de Stripe de su pago para que la página de confirmación pueda comprobarlo sin dejarla en la dirección de la página.", "Hasta que cierre la pestaña"],
        ["kh-enquiry-sent (almacenamiento del navegador, solo esta pestaña)", "Lleva un resumen de su consulta a la página de confirmación, que lo borra tras leerlo.", "Hasta que se abre la página de confirmación"],
        ["kh-paid-… (almacenamiento del navegador)", "Recuerda que un pago ya se confirmó, para que al recargar la página de confirmación no se comunique dos veces.", "Hasta que borre los datos del navegador"],
        ["_ga, _ga_*", "Google Analytics: distingue las visitas nuevas de las recurrentes.", "2 años"],
        ["_gcl_*", "Google Ads: relaciona una visita con el anuncio del que procede.", "90 días"],
        ["_clck, _clsk", "Microsoft Clarity: agrupa las páginas de una misma visita.", "1 año / 1 día"],
        ["_fbp, _fbc", "Píxel de Meta: reconoce su navegador, y una visita que llega desde un anuncio de Meta, para medir y mostrar nuestros anuncios.", "90 días, renovados en cada visita"],
        ["fr (facebook.com)", "Meta: se guarda en el dominio de Meta para mostrar y medir anuncios. Si usa Facebook en este navegador y este admite cookies de terceros, Meta también puede leer las demás cookies que tiene en facebook.com cuando el píxel se comunica con ella.", "90 días"],
        ["lastExternalReferrer, lastExternalReferrerTime, multiFbc (almacenamiento del navegador)", "Píxel de Meta: anota si su última llegada fue desde Facebook, Instagram, otro sitio o directa, y los clics recientes en anuncios de Meta, para relacionar las visitas con nuestros anuncios.", "90 días"],
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
          "Pour les demandes et les réservations : parce que vous nous avez demandé des démarches précontractuelles, puis l'exécution du contrat. Pour la mesure et la publicité : dans l'EEE, au Royaume-Uni et en Suisse, votre consentement, que vous pouvez retirer à tout moment ; ailleurs, elles fonctionnent sauf si vous les désactivez avec le lien « Paramètres des cookies » en bas de page. Pour la transmission de votre adresse e-mail hachée à Google et à Meta : partout, votre consentement, donné uniquement en choisissant « Accepter » dans les paramètres des cookies, que vous pouvez retirer à tout moment. Pour la conservation des réservations passées : notre intérêt légitime à pouvoir répondre aux questions les concernant.",
        ],
      },
      {
        heading: "Mesure et publicité",
        body: [
          "Le site charge Google Tag Manager, qui exécute Google Analytics 4 et la mesure Google Ads (dans l'EEE, au Royaume-Uni et en Suisse uniquement si vous l'acceptez ; ailleurs, sauf si vous la désactivez). Nous l'utilisons pour voir quelles pages et quelles expériences sont lues, et si notre publicité touche les bons voyageurs. Si vous envoyez une demande après être arrivé par l'une de nos annonces, l'adresse e-mail saisie est transmise à Google sous forme hachée (brouillée de façon irréversible) pour rattacher la demande à cette annonce, uniquement si vous avez choisi « Accepter » dans les paramètres des cookies.",
          "Dans l'EEE, au Royaume-Uni et en Suisse, rien n'est enregistré sur votre appareil avant votre choix, hormis les quatre premières entrées du tableau ci-dessous. Jusque-là, Google ne reçoit qu'un signal sans cookie indiquant qu'une page a été vue, sans identifiant. En dehors de ces pays, la mesure est active par défaut et le lien « Paramètres des cookies » en bas de page permet de la désactiver.",
          "Lorsque la mesure est active, Microsoft Clarity enregistre la façon dont les pages sont utilisées (défilement, touchers, clics et mouvements de souris) afin de repérer ce qui est difficile à utiliser. Les champs de formulaire et ce que vous saisissez sont masqués dans votre navigateur avant tout envoi, et dans l'EEE, au Royaume-Uni et en Suisse, Clarity ne se charge qu'après votre accord.",
          "Dans l'EEE, au Royaume-Uni et en Suisse uniquement si vous acceptez la mesure publicitaire, et ailleurs sauf si vous la désactivez, le site charge aussi le pixel Meta. Il indique à Meta les pages consultées et le moment où vous envoyez une demande ou payez une réservation, avec le montant, la devise et un numéro de référence, afin de mesurer nos publicités sur Facebook et Instagram et de les montrer aux personnes qui ont visité le site. Meta reçoit ainsi l'adresse de la page (paramètres compris), la page de provenance, votre adresse IP, des informations sur votre navigateur et votre appareil, et les identifiants des cookies _fbp et _fbc. Si vous avez choisi « Accepter » dans les paramètres des cookies, elle reçoit aussi, lorsque vous envoyez une demande ou payez, l'adresse e-mail utilisée, que le pixel brouille de façon irréversible (hachage) dans votre navigateur avant l'envoi, afin que Meta puisse la rapprocher d'un compte Facebook ou Instagram ; cette adresse hachée accompagne ensuite aussi les pages que vous consultez, jusqu'à ce que vous rechargiez la page ou quittiez le site, et peut être renvoyée si vous revenez sur cette page avec les boutons Précédent ou Suivant du navigateur. Meta utilise aussi ces informations à ses propres fins (personnaliser les publicités et autres contenus qu'elle montre sur ses services et en dehors, améliorer ses produits et en assurer la sécurité), comme l'explique sa politique de confidentialité. Nous n'envoyons jamais à Meta ce que vous écrivez dans les remarques, aucune information sur l'alimentation ou la santé, ni votre nom.",
          "Vous pouvez l'arrêter à tout moment avec le lien « Paramètres des cookies » en bas de page. Pour gérer les publicités fondées sur votre activité sur d'autres sites, utilisez vos préférences publicitaires dans Facebook ou Instagram, ou les pages d'opposition du secteur : www.aboutads.info/choices et www.youronlinechoices.eu.",
          "Nous n'utilisons aucun autre traceur, module social ou outil de chat. Lorsqu'une page intègre une carte Google, Google reçoit la requête correspondante.",
        ],
      },
      {
        heading: "Qui d'autre y a accès, et où",
        body: [
          "Google Ireland / Google LLC traitent les données de mesure décrites ci-dessus, ce qui peut impliquer un transfert vers les États-Unis au titre des clauses contractuelles types de la Commission européenne et du cadre de protection des données UE–États-Unis. Cloudflare sert le site et traite les données techniques de requête dont tout serveur web a besoin. Notre prestataire de messagerie achemine votre demande, et Slack affiche à notre équipe une brève alerte (expérience, dates, nombre de personnes et prénom, sans votre adresse e-mail ni vos remarques). Microsoft traite les données de Clarity, également dans le cadre de protection des données. Chacun agit uniquement sur nos instructions.",
          "Meta traite les données du pixel Meta autrement : Meta Platforms Ireland Limited (Block J, Serpentine Avenue, Dublin 4, Irlande) pour les visiteurs de l'EEE, et Meta Platforms, Inc. (1 Meta Way, Menlo Park, Californie, États-Unis) pour les autres. Nous sommes responsables conjoints avec Meta de la collecte de ces données sur ce site et de leur transmission à Meta : avec Meta Ireland dans l'EEE, et avec Meta Platforms, Inc. au Royaume-Uni. Selon notre accord avec Meta, c'est nous qui vous donnons ces informations, et Meta répond aux demandes d'accès, de rectification, d'effacement, de limitation ou de portabilité concernant les données qu'elle conserve après les avoir reçues. Meta est ensuite responsable de l'utilisation qu'elle en fait. Sa politique de confidentialité, sur www.facebook.com/about/privacy, indique ses coordonnées, la base juridique sur laquelle elle s'appuie et la manière d'exercer vos droits auprès de Meta. Meta Platforms, Inc. est certifiée au titre des cadres de protection des données UE–États-Unis et Suisse–États-Unis ; les transferts depuis l'EEE reposent sur le cadre UE–États-Unis et sur des clauses contractuelles types, ceux depuis la Suisse sur le cadre Suisse–États-Unis, et ceux depuis le Royaume-Uni sur le UK Data Transfer Addendum de Meta.",
          "Lorsque vous payez via le lien de notre réponse, la page de paiement est gérée par Stripe, qui traite les données de votre carte selon sa propre politique de confidentialité ; nous ne voyons jamais le numéro de carte. Vous revenez ensuite sur notre site, qui ne lit auprès de Stripe que le montant, la devise et l'adresse e-mail de ce paiement, pour confirmer votre réservation et, si la mesure publicitaire est active, la signaler à Google Ads et à Meta ; l'adresse e-mail, sous la même forme hachée que ci-dessus, uniquement si vous avez choisi « Accepter » dans les paramètres des cookies.",
          "Si vous choisissez « Accepter », votre adresse e-mail hachée peut parvenir à Google LLC et à Meta Platforms, Inc., aux États-Unis. La Commission japonaise de protection des informations personnelles décrit le système américain de protection des données personnelles sur www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku (en japonais). Les mesures que chaque société prend pour la protéger sont décrites dans sa politique de confidentialité : policies.google.com/privacy et www.facebook.com/about/privacy.",
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
          "Lorsque nous ajouterons un outil touchant à vos données, cette page sera modifiée avant sa mise en service, et la date en haut de cette page suivra.",
        ],
      },
    ],
    cookies: {
      heading: "Ce qui est enregistré sur votre appareil",
      intro: "Dans l'EEE, au Royaume-Uni et en Suisse, seules les quatre premières entrées peuvent être déposées avant votre choix, et les autres n'arrivent que si vous acceptez. Ailleurs, les autres sont déposées par défaut, sauf si vous désactivez la mesure avec le lien « Paramètres des cookies » en bas de page.",
      cols: ["Nom", "Rôle", "Durée"],
      rows: [
        ["kh-consent-2", "Mémorise votre choix pour ne plus vous le demander.", "6 mois"],
        ["kh-checkout-session (stockage du navigateur, cet onglet uniquement)", "Conserve la référence Stripe de votre paiement pour que la page de confirmation puisse le vérifier sans la laisser dans l'adresse de la page.", "Jusqu'à la fermeture de l'onglet"],
        ["kh-enquiry-sent (stockage du navigateur, cet onglet uniquement)", "Transmet un résumé de votre demande à la page de confirmation, qui l'efface après l'avoir lu.", "Jusqu'à l'ouverture de la page de confirmation"],
        ["kh-paid-… (stockage du navigateur)", "Mémorise qu'un paiement a déjà été confirmé, pour qu'un rechargement de la page de confirmation ne le signale pas deux fois.", "Jusqu'à l'effacement des données du navigateur"],
        ["_ga, _ga_*", "Google Analytics : distingue les visites nouvelles des visites répétées.", "2 ans"],
        ["_gcl_*", "Google Ads : relie une visite à l'annonce dont elle provient.", "90 jours"],
        ["_clck, _clsk", "Microsoft Clarity : regroupe les pages d'une même visite.", "1 an / 1 jour"],
        ["_fbp, _fbc", "Pixel Meta : reconnaît votre navigateur, et une visite venue d'une publicité Meta, pour mesurer et diffuser nos publicités.", "90 jours, renouvelés à chaque visite"],
        ["fr (facebook.com)", "Meta : déposé sur le domaine de Meta pour diffuser et mesurer les publicités. Si vous utilisez Facebook dans ce navigateur et qu'il accepte les cookies tiers, Meta peut aussi lire les autres cookies qu'elle a déposés sur facebook.com lorsque le pixel la contacte.", "90 jours"],
        ["lastExternalReferrer, lastExternalReferrerTime, multiFbc (stockage du navigateur)", "Pixel Meta : note si votre dernière arrivée venait de Facebook, d'Instagram, d'un autre site ou d'un accès direct, ainsi que les clics récents sur des publicités Meta, pour relier les visites à nos publicités.", "90 jours"],
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
          "關於詢問與預約：因為您要求我們進行締約前的準備，並在契約成立後履行。關於成效衡量與廣告：在歐洲經濟區、英國與瑞士為您的同意，且可隨時撤回；在其他地區則預設啟用，您可透過頁尾的「Cookie 設定」關閉。關於將雜湊處理後的電子郵件地址提供給 Google 與 Meta：無論您位於何處，均僅依據您在 Cookie 設定中點選「同意」所表示的同意，且可隨時撤回。關於保存既往預約紀錄：我們對於能夠回覆相關問題的正當利益。",
        ],
      },
      {
        heading: "成效衡量與廣告",
        body: [
          "本網站載入 Google 代碼管理工具，並由其執行 Google Analytics 4，以及 Google Ads 成效衡量（在歐洲經濟區、英國與瑞士僅限您同意時；在其他地區則預設啟用，除非您關閉）。我們用來了解哪些頁面與體驗被閱讀，以及廣告是否觸及合適的旅客。若您透過我們的廣告進入網站並送出詢問，且已在 Cookie 設定中點選「同意」，您輸入的電子郵件地址會以無法還原的雜湊形式傳送給 Google，用來比對該詢問來自哪則廣告。",
          "在歐洲經濟區、英國與瑞士，在您做出選擇之前，除下表前四項外，不會在您的裝置上儲存任何資料；在此之前 Google 只會收到「有人看了某個頁面」的無 Cookie 訊號，不含任何識別碼。在這些地區之外，成效衡量預設啟用，您可透過頁尾的「Cookie 設定」關閉。",
          "在成效衡量啟用時，我們透過 Microsoft Clarity 記錄頁面的使用方式（捲動、點按、點擊與滑鼠移動），以找出網站不易使用之處。表單欄位與您輸入的內容會在傳送前於瀏覽器中遮蔽；來自歐洲經濟區、英國與瑞士的造訪，僅在您同意後才會載入 Clarity。",
          "本網站也會載入 Meta 的 Meta 像素：在歐洲經濟區、英國與瑞士，僅限您同意廣告成效衡量時；在其他地區則預設啟用，除非您關閉。它會告知 Meta 您瀏覽了哪些頁面，以及您送出詢問或支付預約的時間，連同金額、幣別與參考編號，用於衡量我們在 Facebook 與 Instagram 的廣告成效，並向曾造訪本網站的人顯示廣告。Meta 因此會收到頁面網址（含參數）、來源頁面、您的 IP 位址、瀏覽器與裝置資訊，以及 _fbp、_fbc Cookie 中的識別碼。若您已在 Cookie 設定中點選「同意」，在您送出詢問或付款時，還會收到您使用的電子郵件地址，該地址會先在您的瀏覽器中以無法還原的方式（雜湊）處理後再傳送，供 Meta 與 Facebook 或 Instagram 帳號比對；在您重新整理頁面或離開本網站之前，此雜湊地址也會隨您之後瀏覽的頁面一併傳送；若您以瀏覽器的「上一頁」或「下一頁」回到該頁面，也可能再次傳送。Meta 也會將這些資訊用於自身目的，包括個人化其在自家服務內外顯示的廣告與其他內容、改善產品及維護安全，詳情請參閱 Meta 的隱私權政策。我們絕不會將備註欄內容、飲食或健康相關資訊或您的姓名傳送給 Meta。",
          "您可隨時透過頁尾的「Cookie 設定」停止 Meta 像素傳送資料。若要管理依您在其他網站的活動而投放的廣告，請使用 Facebook 或 Instagram 的廣告偏好設定，或業界的選擇退出頁面：www.aboutads.info/choices 與 www.youronlinechoices.eu。",
          "我們不使用其他追蹤工具、社群外掛或客服聊天工具。當頁面嵌入 Google 地圖時，Google 會收到該地圖的載入請求。",
        ],
      },
      {
        heading: "還有誰會接觸到，以及在哪裡",
        body: [
          "上述成效衡量資料由 Google Ireland / Google LLC 處理，可能依歐盟執委會的標準契約條款與歐盟—美國資料隱私框架傳輸至美國。網站由 Cloudflare 提供服務，並處理任何網頁伺服器所需的技術性請求資料。您的詢問由我們的電子郵件服務商傳送，並透過 Slack 向我們的團隊發送簡短通知（體驗、日期、人數與您的名字，不含電子郵件地址與備註）。Clarity 的資料由 Microsoft 處理，同樣適用資料隱私框架。以上各方均僅依我們的指示處理。",
          "Meta 像素的資料則由 Meta 處理：歐洲經濟區的訪客由 Meta Platforms Ireland Limited（Block J, Serpentine Avenue, Dublin 4, Ireland）處理，其他訪客由 Meta Platforms, Inc.（1 Meta Way, Menlo Park, California, USA）處理。就本網站蒐集該資料並傳送給 Meta 而言，我們與 Meta 為共同控管者：在歐洲經濟區為 Meta Ireland，在英國為 Meta Platforms, Inc.。依我們與 Meta 的約定，由我們向您提供本說明；Meta 收到資料後所保存資料的查閱、更正、刪除、限制處理與可攜權請求，由 Meta 負責回應。此後由 Meta 自行負責其使用。Meta 的聯絡方式、其依據的法律基礎，以及如何向 Meta 行使權利，請見其隱私權政策 www.facebook.com/about/privacy。Meta Platforms, Inc. 已取得歐盟—美國及瑞士—美國資料隱私框架認證；自歐洲經濟區的傳輸依據歐盟—美國框架及標準契約條款，自瑞士的傳輸依據瑞士—美國框架，自英國的傳輸則依據 Meta 的英國資料傳輸附約（UK Data Transfer Addendum）。",
          "透過我們回覆中的連結付款時，付款頁面由 Stripe 營運，您的信用卡資料由 Stripe 依其隱私權政策處理，我們不會看到卡號。付款後您會回到本網站，本網站僅向 Stripe 讀取該筆付款的金額、幣別與電子郵件，用於確認預約，並在廣告成效衡量啟用時回報給 Google Ads 與 Meta；電子郵件僅在您已於 Cookie 設定中點選「同意」時，以與上述相同的雜湊形式傳送。",
          "若您點選「同意」，經雜湊處理的電子郵件地址可能會提供給位於美國的 Google LLC 與 Meta Platforms, Inc.。關於美國的個人資料保護制度，請參閱日本個人資訊保護委員會公布的調查結果：www.ppc.go.jp/personalinfo/legal/kaiseihogohou/#gaikoku（日文）。各公司為保護個人資料所採取的措施，請見其隱私權政策：policies.google.com/privacy 與 www.facebook.com/about/privacy。",
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
          "當我們導入任何接觸您資料的新工具時，將於上線前更新本頁，頁面上方的日期亦會一併更新。",
        ],
      },
    ],
    cookies: {
      heading: "會儲存在您裝置上的項目",
      intro: "在歐洲經濟區、英國與瑞士，只有前四項可能在您選擇之前儲存，其餘僅在您同意後才會出現；在其他地區，除非您透過頁尾的「Cookie 設定」關閉成效衡量，其餘項目會預設儲存。",
      cols: ["名稱", "用途", "保存期間"],
      rows: [
        ["kh-consent-2", "記住您對 Cookie 的選擇，以免重複詢問。", "6 個月"],
        ["kh-checkout-session（瀏覽器儲存空間，僅限此分頁）", "保存您付款的 Stripe 參考編號，讓確認頁不必將其留在頁面網址中即可查詢。", "至您關閉分頁為止"],
        ["kh-enquiry-sent（瀏覽器儲存空間，僅限此分頁）", "將您的詢問摘要帶到確認頁，確認頁讀取後即刪除。", "至確認頁開啟為止"],
        ["kh-paid-…（瀏覽器儲存空間）", "記錄該筆付款已確認，避免重新整理確認頁時重複回報。", "至您清除瀏覽器資料為止"],
        ["_ga, _ga_*", "Google Analytics：區分新訪客與回訪訪客。", "2 年"],
        ["_gcl_*", "Google Ads：將造訪與來源廣告對應起來。", "90 天"],
        ["_clck, _clsk", "Microsoft Clarity：將同一次造訪的頁面歸為一組。", "1 年／1 天"],
        ["_fbp, _fbc", "Meta 像素：辨識您的瀏覽器，以及來自 Meta 廣告的造訪，用於衡量與顯示我們的廣告。", "90 天（每次造訪時更新）"],
        ["fr（facebook.com）", "Meta：儲存在 Meta 的網域，用於投放與衡量廣告。若您在此瀏覽器使用 Facebook 且瀏覽器允許第三方 Cookie，像素與 Meta 連線時，Meta 也能讀取其先前在 facebook.com 設定的其他 Cookie。", "90 天"],
        ["lastExternalReferrer、lastExternalReferrerTime、multiFbc（瀏覽器儲存空間）", "Meta 像素：記錄您上次是從 Facebook、Instagram、其他網站或直接進入，以及近期點擊 Meta 廣告的紀錄，用於將造訪與我們的廣告對應起來。", "90 天"],
      ],
    },
  },
};

export const privacyFor = (lang: Lang) => PRIVACY[lang];
export const privacyUpdated = UPDATED;
