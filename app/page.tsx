"use client";

import { ArrowDownRight, ArrowRight, Clock3, Globe2, MapPin, Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  ["Tokyo", "#cities"],
  ["Kyoto", "#cities"],
  ["Experiences", "#experiences"],
  ["Private tours", "#tours"],
  ["Our approach", "#approach"],
] as const;

const categories = [
  ["寿", "Sushi", "Food culture"], ["相", "Sumo", "Living tradition"], ["茶", "Tea ceremony", "Mindful ritual"],
  ["着", "Kimono", "Craft & style"], ["芸", "Geisha", "Performing arts"], ["刀", "Swordsmith", "Heritage craft"],
  ["爪", "Anime nail art", "Pop culture"], ["旅", "Private tours", "Made for you"],
] as const;

const experiences = [
  { no:"01", city:"Tokyo", title:"Edo-mae Sushi Masterclass", line:"Shape, season and serve nigiri at a third-generation chef's own counter.", duration:"2.5 hours", price:"¥45,000", mark:"寿", tone:"cream" },
  { no:"02", city:"Tokyo", title:"Inside Sumo Morning Practice", line:"Observe the discipline and rituals of a working sumo stable at close range.", duration:"2 hours", price:"¥38,000", mark:"相", tone:"red" },
  { no:"03", city:"Kyoto", title:"Private Evening with Geiko", line:"Share conversation, dance and seasonal cuisine in an intimate Kyoto setting.", duration:"2 hours", price:"¥120,000", mark:"芸", tone:"dark" },
] as const;

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="OMOTENASHI JAPAN home">
      <span className="brand-mark" aria-hidden="true">お</span>
      <span><b>OMOTENASHI</b><small>JAPAN</small></span>
    </a>
  );
}

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <div className="header-tools">
          <button className="language-button" type="button" aria-label="Language: English"><Globe2 size={16} /> EN</button>
          <Button asChild className="header-cta"><a href="#experiences">Find an experience</a></Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="menu-button" size="icon" variant="outline" aria-label="Open menu"><Menu size={20} /></Button>
            </SheetTrigger>
            <SheetContent className="mobile-menu">
              <SheetTitle><Brand /></SheetTitle>
              <nav aria-label="Mobile navigation">
                {navigation.map(([label, href]) => <a key={label} href={href}>{label}<ArrowDownRight size={18} /></a>)}
              </nav>
              <p>English · Français · Español · 繁體中文</p>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> Tokyo · Kyoto</p>
          <h1 id="hero-heading">Meet the masters.<br />Go beyond the surface.</h1>
          <p className="hero-lede">Intimate cultural experiences led by Japan&apos;s craftspeople, with a private interpreter guide by your side.</p>
          <div className="hero-actions">
            <Button asChild size="lg"><a href="#experiences">Explore experiences <ArrowDownRight /></a></Button>
            <a className="text-link" href="#approach">Why we are different</a>
          </div>
        </div>
        <div className="hero-note"><span>01</span><p>Not a demonstration.<br />A seat at the master&apos;s table.</p></div>
      </section>

      <section className="trust-strip" id="approach" aria-label="Why choose us">
        <div className="trust-intro">
          <p className="eyebrow dark"><span /> The OMOTENASHI standard</p>
          <h2>Every detail,<br />considered.</h2>
        </div>
        <div className="trust-grid">
          <article><span>01</span><h3>Led by the master</h3><p>Learn directly from the people who have devoted their lives to the craft—not a scripted presenter.</p></article>
          <article><span>02</span><h3>Guided in your language</h3><p>Your interpreter guide bridges every word and gesture, so the story behind the craft is never lost.</p></article>
          <article><span>03</span><h3>Clear from the start</h3><p>Book online, pay securely in yen, and see the cancellation policy before you commit.</p></article>
        </div>
        <div className="trust-seal"><ShieldCheck size={18} /> Small groups · Local experts · Thoughtful access</div>
      </section>

      <section className="city-section" id="cities">
        <div className="section-heading">
          <p className="eyebrow dark"><span /> Choose your city</p>
          <h2>Two cities.<br />Countless stories.</h2>
          <p>Begin with where you&apos;ll be, then discover the people and practices that give each place its character.</p>
        </div>
        <div className="city-cards">
          <a className="city-card tokyo" href="#experiences">
            <span className="city-index">01 / 東京</span>
            <div><p>Modern rhythm.<br />Enduring craft.</p><h3>Tokyo</h3></div>
            <span className="circle-arrow"><ArrowDownRight /></span>
          </a>
          <a className="city-card kyoto" href="#experiences">
            <span className="city-index">02 / 京都</span>
            <div><p>Quiet rituals.<br />Living heritage.</p><h3>Kyoto</h3></div>
            <span className="circle-arrow"><ArrowDownRight /></span>
          </a>
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-heading">
        <div className="section-kicker"><span>Explore by interest</span><span>8 ways into Japan</span></div>
        <h2 id="category-heading">Follow your curiosity.</h2>
        <div className="category-grid">
          {categories.map(([mark, title, type], index) => (
            <a href="#experiences" className="category-card" key={title}>
              <span className="category-no">{String(index + 1).padStart(2, "0")}</span>
              <span className="category-mark" aria-hidden="true">{mark}</span>
              <span><b>{title}</b><small>{type}</small></span>
              <ArrowDownRight size={18} />
            </a>
          ))}
        </div>
      </section>

      <section className="experiences-section" id="experiences">
        <div className="section-heading horizontal">
          <div><p className="eyebrow"><span /> Selected experiences</p><h2>Start somewhere<br />unforgettable.</h2></div>
          <a className="underlined-link" href="#all">View all experiences <ArrowRight /></a>
        </div>
        <div className="experience-grid">
          {experiences.map((item) => (
            <article className="experience-card" key={item.title}>
              <div className={`experience-art ${item.tone}`}><span>{item.mark}</span><small>{item.no}</small></div>
              <div className="experience-copy">
                <p className="experience-city"><MapPin size={14} /> {item.city} · Interpreter included</p>
                <h3>{item.title}</h3>
                <p>{item.line}</p>
                <div className="experience-meta"><span><Clock3 size={14} /> {item.duration}</span><span>from <b>{item.price}</b> / person</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tour-section" id="tours">
        <div className="tour-monogram" aria-hidden="true">旅</div>
        <div className="tour-copy">
          <p className="eyebrow"><span /> Private guided days</p>
          <h2>Let the experience<br />become the journey.</h2>
          <p>Spend a full day with a private licensed guide in Tokyo or Kyoto. We can place any masterclass at the heart of a route shaped around your interests.</p>
          <div className="tour-details"><span>8 hours</span><span>Private group</span><span>Tokyo / Kyoto</span></div>
          <Button asChild variant="outline"><a href="#contact">Explore private tours <ArrowRight /></a></Button>
        </div>
      </section>

      <section className="review-section">
        <p className="eyebrow dark"><span /> Guest confidence</p>
        <div className="review-layout">
          <h2>Book with clarity.<br />Remember it for life.</h2>
          <div className="review-copy">
            <p>Every guest receives clear inclusions, meeting details, and cancellation terms before payment. After the experience, verified guest feedback is collected through Google.</p>
            <div className="review-placeholder"><ShieldCheck /><span><b>Google guest reviews</b><small>Verified reviews will be displayed here after launch.</small></span></div>
          </div>
        </div>
      </section>

      <section className="closing-section" id="contact">
        <p>Travelling as a group, or dreaming of something one-of-a-kind?</p>
        <h2>We&apos;ll shape Japan<br />around your story.</h2>
        <Button asChild size="lg"><a href="/en/contact/">Plan a private experience <ArrowDownRight /></a></Button>
      </section>

      <footer>
        <Brand />
        <div className="footer-links"><a href="#cities">Tokyo</a><a href="#cities">Kyoto</a><a href="#experiences">Experiences</a><a href="#tours">Tours</a><a href="#approach">About</a></div>
        <div className="footer-meta"><p>Operated by Prosent Inc. with our tour operations partner.</p><p>© 2026 OMOTENASHI JAPAN</p></div>
        <a className="partner-link" href="/partners/">体験パートナー募集 →</a>
      </footer>
    </main>
  );
}
