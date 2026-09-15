"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { articleDate, latestArticles } from "@/lib/articles";
import { catalogFor, TOURS_PUBLISHED } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";

const FEATURED = ["sushi-masterclass", "sumo-morning-practice", "evening-with-geiko"];
const MARKS: Record<string, string> = {
  "sushi-masterclass": "寿", "sumo-morning-practice": "相", "evening-with-geiko": "芸",
};

const COPY = {
  en: {
    heroEyebrow: "Tokyo · Kyoto",
    heroTitle: ["Meet the masters.", "Go beyond the surface."],
    heroLede: "Intimate cultural experiences led by Japan's craftspeople, with a private interpreter guide by your side.",
    heroCta: "Explore experiences", heroLink: "Why we are different",
    heroBubble: "Not a demonstration —\nthis seat is yours.", heroSpeaker: "— your master",
    trustEyebrow: "The KAMEHAME standard", trustTitle: ["Every detail,", "considered."],
    trust: [
      { h: "Led by the master", p: "Learn directly from the people who have devoted their lives to the craft—not a scripted presenter." },
      { h: "Guided in your language", p: "Your interpreter guide bridges every word and gesture, so the story behind the craft is never lost." },
      { h: "Clear from the start", p: "Book online, pay securely in yen, and see the cancellation policy before you commit." },
    ],
    trustSeal: "Small groups · Local experts · Thoughtful access",
    craftQuote: "Watch my hands — every movement has a meaning.", craftSpeaker: "— a Kyoto tea master",
    craftAlt: "Tea ceremony host in kimono placing a tea bowl on tatami before seated guests",
    cityEyebrow: "Choose your city", cityTitle: ["Two cities.", "Countless stories."],
    cityLead: "Begin with where you'll be, then discover the people and practices that give each place its character.",
    cityTaglines: { tokyo: ["Modern rhythm.", "Enduring craft."], kyoto: ["Quiet rituals.", "Living heritage."] },
    cityAlts: {
      tokyo: "Five-storied pagoda of Senso-ji temple illuminated at night, Asakusa, Tokyo",
      kyoto: "Lantern-lined Yasaka-dori street at dawn with the Yasaka pagoda, Higashiyama, Kyoto",
    },
    kicker: ["Explore by interest", "8 ways into Japan"], catTitle: "Follow your curiosity.",
    catTypes: { sushi: "Food culture", sumo: "Living tradition", "tea-ceremony": "Mindful ritual", kimono: "Craft & style", geisha: "Performing arts", swordsmith: "Heritage craft", "anime-nail-art": "Pop culture" } as Record<string, string>,
    toursCard: { title: "Private tours", type: "Made for you" },
    expEyebrow: "Selected experiences", expTitle: ["Start somewhere", "unforgettable."], expLink: "View all experiences",
    tourEyebrow: "Private guided days", tourTitle: ["Let the experience", "become the journey."],
    tourBody: "Spend a full day with a private licensed guide in Tokyo or Kyoto. We can place any masterclass at the heart of a route shaped around your interests.",
    tourDetails: ["8 hours", "Private group", "Tokyo / Kyoto"], tourCta: "Explore private tours",
    tourAlt: "Vermilion torii gates and a stone lantern along a path at Fushimi Inari shrine",
    reviewEyebrow: "Guest confidence", reviewTitle: ["Book with clarity.", "Remember it for life."],
    reviewBody: "Every guest receives clear inclusions, meeting details, and cancellation terms before payment. After the experience, verified guest feedback is collected through Google.",
    reviewPh: "Google guest reviews", reviewPhSub: "Verified reviews will be displayed here after launch.",
    closingP: "Travelling as a group, or dreaming of something one-of-a-kind?",
    closingTitle: ["We'll shape Japan", "around your story."], closingCta: "Plan a private experience",
  },
  es: {
    heroEyebrow: "Tokio · Kioto",
    heroTitle: ["Conoce a los maestros.", "Ve más allá de la superficie."],
    heroLede: "Experiencias culturales íntimas dirigidas por los artesanos de Japón, con un guía intérprete privado a tu lado.",
    heroCta: "Explora las experiencias", heroLink: "Por qué somos diferentes",
    heroBubble: "Esto no es una demostración —\neste asiento es tuyo.", heroSpeaker: "— tu maestro",
    trustEyebrow: "El estándar KAMEHAME", trustTitle: ["Cada detalle,", "pensado."],
    trust: [
      { h: "Dirigido por el maestro", p: "Aprende directamente de quienes han dedicado su vida al oficio — no de un presentador con guion." },
      { h: "Guiado en tu idioma", p: "Tu guía intérprete traduce cada palabra y cada gesto, para que la historia detrás del oficio nunca se pierda." },
      { h: "Claro desde el principio", p: "Reserva online, paga de forma segura en yenes y consulta la política de cancelación antes de decidir." },
    ],
    trustSeal: "Grupos reducidos · Expertos locales · Acceso cuidado",
    craftQuote: "Mira mis manos: cada movimiento tiene un significado.", craftSpeaker: "— una maestra de té de Kioto",
    craftAlt: "Anfitriona de la ceremonia del té dejando un cuenco sobre el tatami ante sus invitados",
    cityEyebrow: "Elige tu ciudad", cityTitle: ["Dos ciudades.", "Historias infinitas."],
    cityLead: "Empieza por donde vas a estar, y descubre a las personas y los oficios que dan carácter a cada lugar.",
    cityTaglines: { tokyo: ["Ritmo moderno.", "Oficio eterno."], kyoto: ["Rituales serenos.", "Herencia viva."] },
    cityAlts: {
      tokyo: "Pagoda de cinco pisos del templo Senso-ji iluminada de noche, Asakusa, Tokio",
      kyoto: "Calle Yasaka-dori con farolillos y la pagoda de Yasaka al amanecer, Higashiyama, Kioto",
    },
    kicker: ["Explora por interés", "8 puertas a Japón"], catTitle: "Sigue tu curiosidad.",
    catTypes: { sushi: "Cultura gastronómica", sumo: "Tradición viva", "tea-ceremony": "Ritual consciente", kimono: "Oficio y estilo", geisha: "Artes escénicas", swordsmith: "Oficio ancestral", "anime-nail-art": "Cultura pop" } as Record<string, string>,
    toursCard: { title: "Tours privados", type: "A tu medida" },
    expEyebrow: "Experiencias seleccionadas", expTitle: ["Empieza por algo", "inolvidable."], expLink: "Ver todas las experiencias",
    tourEyebrow: "Días privados con guía", tourTitle: ["Deja que la experiencia", "se vuelva el viaje."],
    tourBody: "Pasa un día completo con un guía privado titulado en Tokio o Kioto. Podemos poner cualquier clase magistral en el corazón de una ruta hecha a tu medida.",
    tourDetails: ["8 horas", "Grupo privado", "Tokio / Kioto"], tourCta: "Descubre los tours privados",
    tourAlt: "Torii bermellón y un farol de piedra en un sendero del santuario Fushimi Inari",
    reviewEyebrow: "Confianza del viajero", reviewTitle: ["Reserva con claridad.", "Recuérdalo toda la vida."],
    reviewBody: "Cada viajero recibe antes de pagar qué incluye la experiencia, el punto de encuentro y las condiciones de cancelación. Después, las reseñas verificadas se recogen a través de Google.",
    reviewPh: "Reseñas de Google", reviewPhSub: "Las reseñas verificadas se mostrarán aquí tras el lanzamiento.",
    closingP: "¿Viajáis en grupo, o soñáis con algo único?",
    closingTitle: ["Daremos forma a Japón", "alrededor de tu historia."], closingCta: "Planifica una experiencia privada",
  },
  ja: {
    heroEyebrow: "東京 · 京都",
    heroTitle: ["師に会いに行く。", "表面の先へ。"],
    heroLede: "日本の作り手が直接教える少人数の文化体験を、通訳ガイド同行で海外のお客様にご提供しています。",
    heroCta: "体験を見る", heroLink: "私たちの考え方",
    heroBubble: "これは実演ではありません。\nこの席は、あなたのものです。", heroSpeaker: "— 師より",
    trustEyebrow: "KAMEHAME の基準", trustTitle: ["細部まで、", "考え抜く。"],
    trust: [
      { h: "師が直接教える", p: "台本を読む案内役ではなく、その道に人生を注いできた本人から学びます。" },
      { h: "母語で理解できる", p: "通訳ガイドが言葉も所作も訳します。技の背後にある物語が失われません。" },
      { h: "最初から明快に", p: "オンラインで予約、日本円で安全に決済。キャンセル規定はお申し込み前にご確認いただけます。" },
    ],
    trustSeal: "少人数 · 現地の専門家 · 選び抜いた受け入れ先",
    craftQuote: "手を見ていてください。すべての動きに意味があります。", craftSpeaker: "— 京都の茶道家",
    craftAlt: "客の前の畳に茶碗を置く茶道の亭主",
    cityEyebrow: "都市を選ぶ", cityTitle: ["二つの都市。", "尽きない物語。"],
    cityLead: "滞在される街から始めてください。その土地の人と技が見えてきます。",
    cityTaglines: { tokyo: ["今日の速さ。", "変わらぬ手仕事。"], kyoto: ["静かな儀礼。", "生きた継承。"] },
    cityAlts: {
      tokyo: "夜間にライトアップされた浅草・浅草寺の五重塔",
      kyoto: "夜明けの東山、八坂通と八坂の塔",
    },
    kicker: ["関心から探す", "日本への8つの扉"], catTitle: "気になるものから。",
    catTypes: { sushi: "食文化", sumo: "生きた伝統", "tea-ceremony": "静かな儀礼", kimono: "技と装い", geisha: "舞と芸", swordsmith: "古来の手仕事", "anime-nail-art": "ポップカルチャー" } as Record<string, string>,
    toursCard: { title: "プライベートツアー", type: "ご要望に合わせて" },
    expEyebrow: "おすすめの体験", expTitle: ["忘れられない", "一つから。"], expLink: "すべての体験を見る",
    tourEyebrow: "ガイドと過ごす一日", tourTitle: ["その体験が、", "旅そのものになる。"],
    tourBody: "東京または京都で、専属の全国通訳案内士と一日を過ごしていただけます。どのマスタークラスでも、一日の中心に据えて組み立てられます。",
    tourDetails: ["8時間", "貸切", "東京 / 京都"], tourCta: "プライベートツアーを見る",
    tourAlt: "伏見稲荷の参道に立つ朱塗りの鳥居と石灯籠",
    reviewEyebrow: "安心してお申し込みいただくために", reviewTitle: ["明快に予約する。", "一生おぼえている。"],
    reviewBody: "含まれるもの、集合場所、キャンセル規定は、お支払いの前にすべてお伝えします。体験後の認証済みレビューはGoogleを通じて集めています。",
    reviewPh: "Googleのレビュー", reviewPhSub: "認証済みのレビューは販売開始後にこちらへ掲載します。",
    closingP: "グループでのご旅行ですか。特別な一日をお考えですか。",
    closingTitle: ["あなたの物語に合わせて", "日本を組み立てます。"], closingCta: "貸切の体験を相談する",
  },
} as const;

export function HomePage({ lang }: { lang: Lang }) {
  const C = COPY[lang];
  const T = t(lang);
  const { cities, categories, experiences } = catalogFor(lang);
  const p = (path: string) => `/${lang}${path}`;
  const featured = FEATURED.map((slug) => experiences.find((e) => e.slug === slug)!);
  const [bubbleL1, bubbleL2] = C.heroBubble.split("\n");
  const journal = latestArticles(lang, 3);

  return (
    <main id="top" lang={lang}>
      <SiteHeader lang={lang} />

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> {C.heroEyebrow}</p>
          <h1 id="hero-heading">{C.heroTitle[0]}<br />{C.heroTitle[1]}</h1>
          <p className="hero-lede">{C.heroLede}</p>
          <div className="hero-actions">
            <Button asChild size="lg"><Link href={p("/experiences/")}>{C.heroCta} <ArrowDownRight /></Link></Button>
            <a className="text-link" href="#approach">{C.heroLink}</a>
          </div>
        </div>
        <div className="hero-note bubble tail-left">
          <p>&ldquo;{bubbleL1}<br />{bubbleL2}&rdquo;</p>
          <small>{C.heroSpeaker}</small>
        </div>
      </section>

      <section className="trust-strip" id="approach" aria-label="Why choose us">
        <div className="trust-intro">
          <p className="eyebrow dark"><span /> {C.trustEyebrow}</p>
          <h2>{C.trustTitle[0]}<br />{C.trustTitle[1]}</h2>
        </div>
        <div className="trust-grid">
          {C.trust.map((item, i) => (
            <article key={item.h}><span>{String(i + 1).padStart(2, "0")}</span><h3>{item.h}</h3><p>{item.p}</p></article>
          ))}
        </div>
        <div className="trust-seal"><ShieldCheck size={18} /> {C.trustSeal}</div>
        <figure className="craft-band">
          <img src="/images/craft-hands.jpg" alt={C.craftAlt} loading="lazy" />
          <figcaption className="bubble tail-right craft-bubble">
            <p>&ldquo;{C.craftQuote}&rdquo;</p>
            <small>{C.craftSpeaker}</small>
          </figcaption>
        </figure>
      </section>

      <section className="city-section" id="cities">
        <div className="section-heading">
          <p className="eyebrow dark"><span /> {C.cityEyebrow}</p>
          <h2>{C.cityTitle[0]}<br />{C.cityTitle[1]}</h2>
          <p>{C.cityLead}</p>
        </div>
        <div className="city-cards">
          {cities.map((city, i) => {
            const tag = C.cityTaglines[city.slug];
            return (
              <Link className={`city-card ${city.slug}`} href={p(`/${city.slug}/`)} key={city.slug} aria-label={city.title}>
                <img className="city-photo" src={city.img} alt={C.cityAlts[city.slug]} loading="lazy" />
                <span className="city-index">{String(i + 1).padStart(2, "0")} / {city.jp}</span>
                <span className={`sfx ${city.slug === "kyoto" ? "quiet" : ""}`} aria-hidden="true">{city.slug === "tokyo" ? "ドドンッ" : "しん…"}</span>
                <div>
                  <p>{tag[0]}<br />{tag[1]}</p><h3>{city.title}</h3>
                  <small className="city-place">{city.slug === "tokyo" ? "Sensō-ji · Asakusa" : "Yasaka-dōri · Higashiyama"}</small>
                </div>
                <span className="circle-arrow"><ArrowDownRight /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-heading">
        <div className="section-kicker"><span>{C.kicker[0]}</span><span>{C.kicker[1]}</span></div>
        <h2 id="category-heading">{C.catTitle}</h2>
        <div className="category-grid">
          {categories.map((cat, index) => (
            <Link href={p(`/${cat.slug}/`)} className="category-card" key={cat.slug}>
              <img className="category-photo" src={cat.img} alt={cat.title} loading="lazy" />
              <span className="category-no">{String(index + 1).padStart(2, "0")}</span>
              <span className="category-mark" aria-hidden="true">{cat.mark}</span>
              <span className="category-label"><b>{cat.title}</b><small>{C.catTypes[cat.slug]}</small></span>
              <ArrowDownRight size={18} />
            </Link>
          ))}
          {TOURS_PUBLISHED && (
            <Link href={p("/tours/")} className="category-card" key="tours">
              <img className="category-photo" src="/images/cat-tours.jpg" alt={C.toursCard.title} loading="lazy" />
              <span className="category-no">08</span>
              <span className="category-mark" aria-hidden="true">旅</span>
              <span className="category-label"><b>{C.toursCard.title}</b><small>{C.toursCard.type}</small></span>
              <ArrowDownRight size={18} />
            </Link>
          )}
        </div>
      </section>

      <section className="experiences-section" id="experiences">
        <div className="section-heading horizontal">
          <div><p className="eyebrow"><span /> {C.expEyebrow}</p><h2>{C.expTitle[0]}<br />{C.expTitle[1]}</h2></div>
          <Link className="underlined-link" href={p("/experiences/")}>{C.expLink} <ArrowRight /></Link>
        </div>
        <div className="experience-grid">
          {featured.map((item, i) => (
            <Link className="experience-card" href={p(`/${item.city}/${item.slug}/`)} key={item.slug}>
              <div className="experience-art">
                <img src={item.img} alt={item.alt} loading="lazy" />
                <span aria-hidden="true">{MARKS[item.slug]}</span>
                <small>{String(i + 1).padStart(2, "0")}</small>
              </div>
              <div className="experience-copy">
                <p className="experience-city"><MapPin size={14} /> {cities.find((c) => c.slug === item.city)?.title} · {T.interpreterIncluded}</p>
                <h3>{item.title}</h3>
                <p>{item.tagline}</p>
                <div className="experience-meta"><span><Clock3 size={14} /> {item.duration}</span><span>{T.from} <b>{item.price}</b> {item.priceUnit === "group" ? T.perGroupShort : T.perPerson}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {TOURS_PUBLISHED && (
      <section className="tour-section" id="tours">
        <div className="tour-monogram">
          <img src="/images/tour-journey.jpg" alt={C.tourAlt} loading="lazy" />
          <span aria-hidden="true">旅</span>
        </div>
        <div className="tour-copy">
          <p className="eyebrow"><span /> {C.tourEyebrow}</p>
          <h2>{C.tourTitle[0]}<br />{C.tourTitle[1]}</h2>
          <p>{C.tourBody}</p>
          <div className="tour-details">{C.tourDetails.map((d) => <span key={d}>{d}</span>)}</div>
          <Button asChild variant="outline"><Link href={p("/tours/")}>{C.tourCta} <ArrowRight /></Link></Button>
        </div>
      </section>
      )}

      {journal.length > 0 && (
        <section className="journal-section">
          <div className="section-heading horizontal">
            <div>
              <p className="eyebrow"><span /> {T.journalHomeEyebrow}</p>
              <h2>{T.journalHomeTitle}</h2>
            </div>
            <Link className="underlined-link" href={p("/journal/")}>{T.journalAll} <ArrowRight /></Link>
          </div>
          <div className="journal-grid home">
            {journal.map((a) => (
              <Link className="journal-card" key={a.slug} href={p(`/journal/${a.slug}/`)}>
                <img src={a.img} alt={a.alt} loading="lazy" />
                <div>
                  <p className="journal-meta">{articleDate(a.date, lang)} · {T.readMinutes(a.minutes)}</p>
                  <h3>{a.copy[lang]!.title}</h3>
                  <p>{a.copy[lang]!.standfirst}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="review-section">
        <p className="eyebrow dark"><span /> {C.reviewEyebrow}</p>
        <div className="review-layout">
          <h2>{C.reviewTitle[0]}<br />{C.reviewTitle[1]}</h2>
          <div className="review-copy">
            <p>{C.reviewBody}</p>
            <div className="review-placeholder"><ShieldCheck /><span><b>{C.reviewPh}</b><small>{C.reviewPhSub}</small></span></div>
          </div>
        </div>
      </section>

      <section className="closing-section" id="contact">
        <p>{C.closingP}</p>
        <h2>{C.closingTitle[0]}<br />{C.closingTitle[1]}</h2>
        <Button asChild size="lg"><Link href={p("/contact/")}>{C.closingCta} <ArrowDownRight /></Link></Button>
      </section>

      <SiteFooter lang={lang} />
    </main>
  );
}
