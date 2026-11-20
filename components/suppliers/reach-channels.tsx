import { ArrowUpRight } from 'lucide-react';

const discoveryBrands = [
  ['Google', 'google.png'], ['ChatGPT', 'chatgpt.svg'], ['Claude', 'claude.svg'],
  ['Gemini', 'googlegemini.svg'], ['Perplexity', 'perplexity.svg'],
];
const socialBrands = [
  ['Instagram', 'instagram.svg'], ['TikTok', 'tiktok.svg'], ['Threads', 'threads.svg'],
  ['Facebook', 'facebook.svg'], ['X', 'x.svg'],
];
function ChannelBrands({ brands, label }: { brands: string[][]; label: string }) {
  return <ul className="kh-channel-brands" aria-label={label}>{brands.map(([name, file]) =>
    <li key={name}><img src={`/brands/suppliers/${file}`} width="24" height="24" alt=""/><span>{name}</span></li>
  )}</ul>;
}
export function ReachChannels() {
  return <section className="kh-reach sp-wrap" id="reach" aria-labelledby="reach-title">
    <div className="kh-section-intro" data-reveal><div><p className="sp-eyebrow">HOW WE REACH GUESTS</p><h2 id="reach-title">体験との出会いは、<br/>ひとつの場所から<br className="kh-only-mobile"/>とは限らない。</h2></div><p>旅を調べるとき。SNSを眺めるとき。<br/>ホテルで、おすすめを尋ねるとき。<br/>その一つひとつを、あなたの体験への入口に。</p></div>
    <div className="kh-online">
      <figure className="kh-online-photo" data-reveal><img src="/images/suppliers/craft-hands.jpg" alt="畳の茶室でお茶を差し出す、茶道体験のひとこま" loading="lazy"/><figcaption><span>心に残る体験を、まだ出会っていない誰かへ。</span><span>JAPAN, THROUGH EXPERIENCE.</span></figcaption></figure>
      <div className="kh-online-stories">
        <article data-reveal><div className="kh-story-kicker"><span>01 — SEARCH & DISCOVERY</span><ArrowUpRight size={18} aria-hidden="true"/></div><ChannelBrands brands={discoveryBrands} label="検索・AIの接点"/><h3>「日本で何をしよう？」<br/>その検索から、出会いを。</h3><p>Google広告やSEOに加え、AIで旅を調べる人にも届くコンテンツづくり。検索からAIとの会話まで、旅の計画段階で見つけてもらう接点を広げます。</p></article>
        <article data-reveal><div className="kh-story-kicker"><span>02 — SOCIAL & INSPIRATION</span><ArrowUpRight size={18} aria-hidden="true"/></div><ChannelBrands brands={socialBrands} label="SNSの接点"/><h3>何気ない発見が、<br/>旅の目的になる。</h3><p>写真や動画で伝わる、体験の空気感。SNSの発信・広告・インフルエンサーとの連携を組み合わせ、「ここに行ってみたい」を育てます。</p></article>
      </div>
    </div>
    <p className="kh-reach-note">体験に合わせて販促方法を検討します。広告配信・紹介件数・予約件数を保証するものではありません。</p>
  </section>;
}
