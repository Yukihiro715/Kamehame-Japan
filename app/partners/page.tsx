import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDownRight } from "lucide-react";
import { Brand } from "@/components/site/brand";
import { absolute, SITE_NAME } from "@/lib/seo";

const TITLE = "体験パートナー募集 | KAMEHAME JAPAN";
const DESCRIPTION =
  "訪日外国人向け高付加価値体験サービス KAMEHAME JAPAN の受け入れパートナー(職人・師匠・施設)を募集しています。集客・多言語対応・決済・当日の通訳はすべて運営が担います。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absolute("/partners/") },
  openGraph: {
    type: "website",
    url: absolute("/partners/"),
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "ja_JP",
    images: [{ url: absolute("/og-partners.jpg"), width: 1200, height: 630, alt: "体験パートナー募集 — KAMEHAME JAPAN" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [absolute("/og-partners.jpg")] },
};

const targets = ["寿司", "相撲部屋", "茶道", "着付け", "芸妓・舞妓", "刀鍛冶", "ネイル", "その他の伝統工芸・食"];

const steps = [
  { t: "Web広告・SEO", d: "英語・フランス語・スペイン語・繁体字中国語の4言語で、海外の旅行者に直接届けます。" },
  { t: "予約・決済", d: "自社サイトと海外OTAで事前決済。予約対応・多言語のやり取りはすべて運営側で行います。" },
  { t: "当日", d: "通訳ガイドが必ず同行し、進行・説明・ゲスト対応を担当。いつも通りの仕事に集中いただけます。" },
  { t: "お支払い", d: "月末締めでのお振込を基本に、契約時に条件を明確にご提示します。" },
];

const merits = [
  { t: "集客・営業コストゼロ", d: "広告費・OTA手数料は運営側が負担します。空き時間を収益に変える形でご参加いただけます。" },
  { t: "言葉の壁なし", d: "予約前のやり取りから当日の進行まで、通訳ガイドと運営が間に入ります。英語対応は不要です。" },
  { t: "ノーショー・キャンセル保証", d: "全予約が事前決済制です。直前キャンセル時の補償条件は契約書に明記します。" },
];

const faqs = [
  { q: "英語ができなくても大丈夫ですか?", a: "はい。当日は通訳ガイドが必ず同行し、事前のやり取りもすべて日本語で運営が対応します。" },
  { q: "受け入れは何人からですか?", a: "1回あたり2〜6名程度の少人数制を基本とし、受け入れ可能な人数・頻度は個別にご相談のうえ決定します。" },
  { q: "店名や住所は公開されますか?", a: "ご希望に応じて非公開にできます。サイト上では人物・技を中心に紹介し、正確な場所は予約確定者にのみ案内します。" },
  { q: "写真撮影への協力は必要ですか?", a: "掲載用写真の撮影にご協力をお願いしています。店名・看板が写らない構図など、ご要望に合わせて調整します。" },
  { q: "途中でやめることはできますか?", a: "可能です。契約期間・解約条件は契約時に明示し、掲載停止はご連絡ベースで速やかに対応します。" },
];

export default function PartnersPage() {
  return (
    <main className="partner-page" lang="ja">
      <header className="site-header solid partner-header">
        <Brand />
        <span className="partner-header-label">体験パートナー募集</span>
      </header>

      <section className="partner-hero">
        <img src="/images/craft-hands.jpg" alt="茶碗を差し出す茶道の点前" />
        <div className="partner-hero-copy">
          <p className="eyebrow"><span /> KAMEHAME JAPAN パートナー募集</p>
          <h1>あなたの技を、<br />世界の旅行者へ。</h1>
          <p className="partner-lede">集客・多言語対応・決済・当日の通訳は、すべて私たちが担います。<br />受け入れていただくのは、いつも通りの仕事だけです。</p>
          <a className="partner-cta" href="#partner-contact">掲載について相談する <ArrowDownRight size={16} /></a>
        </div>
      </section>

      <section className="partner-section">
        <h2>こんな方を探しています</h2>
        <p className="partner-note">訪日外国人のお客様に、本物の仕事を少人数で見せていただける職人・師匠・施設の方。</p>
        <div className="partner-tags">
          {targets.map((t) => <span key={t}>{t}</span>)}
        </div>
      </section>

      <section className="partner-section alt">
        <h2>集客の仕組み</h2>
        <div className="partner-steps">
          {steps.map((s, i) => (
            <div key={s.t}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="partner-section">
        <h2>受け入れ側のメリット</h2>
        <div className="partner-merits">
          {merits.map((m) => (
            <div key={m.t}><h3>{m.t}</h3><p>{m.d}</p></div>
          ))}
        </div>
      </section>

      <section className="partner-section alt">
        <h2>掲載条件・お願いしたいこと</h2>
        <ul className="partner-conditions">
          <li>受け入れ人数・開催頻度の目安を個別にご相談のうえ設定します。</li>
          <li>単価は送客手数料方式または卸価格方式から、業態に合わせてご提案します(具体的な料率は商談時にご説明します)。</li>
          <li>掲載用写真の撮影にご協力ください。店名・看板を写さない構図も選べます。</li>
          <li>店名・所在地の非公開を選択できます。予約確定者にのみ正確な場所を案内します。</li>
        </ul>
      </section>

      <section className="partner-section">
        <h2>運営について</h2>
        <div className="partner-trust">
          <div>
            <h3>運営会社</h3>
            <p>株式会社プロセントが、マーケティング・サイト運営・予約決済を担当します。オンライン診療サービス「Mimipo」などのWebサービス運営で培った集客ノウハウを活かします。</p>
          </div>
          <div>
            <h3>ガイドツアー提携会社</h3>
            <p>ガイドの手配とガイドツアーの運営は、提携する旅行事業者が担当します。通訳ガイドの品質管理を含め、当日運営の体制を整えています。</p>
          </div>
        </div>
      </section>

      <section className="partner-section alt">
        <h2>よくある質問</h2>
        <div className="partner-faq">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="partner-section" id="partner-contact">
        <h2>お問い合わせ</h2>
        <p className="partner-note">下記の内容をお知らせください。担当者よりご連絡のうえ、詳細をご説明します。</p>
        <form className="partner-form">
          <div className="form-grid">
            <label>店舗・工房名<input type="text" name="venue" autoComplete="organization" /></label>
            <label>業種<input type="text" name="type" placeholder="例:寿司、茶道、刀鍛冶" /></label>
            <label>所在地(市区まで)<input type="text" name="location" placeholder="例:東京都台東区" /></label>
            <label>ご担当者名<input type="text" name="name" autoComplete="name" /></label>
            <label>ご連絡先(電話・メール)<input type="text" name="contact" autoComplete="email" /></label>
          </div>
          <label>メッセージ<textarea name="message" rows={4} placeholder="受け入れ可能な曜日・時間帯、気になる点など" /></label>
          <div className="form-actions">
            <button type="button" disabled aria-disabled="true">送信する</button>
            <p>フォームは現在準備中です。当面はお打ち合わせの際に直接ご相談ください。</p>
          </div>
        </form>
      </section>

      <footer className="partner-footer">
        <Brand />
        <p>運営:株式会社プロセント(マーケティング・サイト運営・予約決済)/ ガイドツアー提携会社(ガイド手配・ツアー運営)</p>
        <p>© 2026 KAMEHAME JAPAN · <Link href="/">英語サイトトップへ</Link></p>
      </footer>
    </main>
  );
}
