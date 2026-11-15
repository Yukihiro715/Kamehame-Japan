"use client";

import Link from "next/link";
import { ArrowRight, MessagesSquare, Globe2, BadgeJapaneseYen, Languages, Building2, Plane, MapPinned } from "lucide-react";
import { Brand } from "@/components/site/brand";
import { ConsultationForm } from "./consultation-form";
import { SUPPLIER_PRICE_NOTE } from "@/lib/supplier-policy";
import { ReachChannels } from "./reach-channels";
import { PartnerBrochure } from "./partner-brochure";
import { useReveal } from "./use-reveal";

const faqs = [
  ["一般販売価格と同じ金額で掲載されますか？", "販売価格はKAMEHAME JAPANが設定し、集客・予約対応などを踏まえて一般販売価格を上回る場合があります。貴社には合意した卸価格をお支払いします。販売条件は掲載前に確認します。"],
  ["25％引きの卸価格でないと申し込めませんか？", "25％引きは目安であり、必須条件ではありません。ご希望の卸価格を入力してください。人数別料金や繁忙期の料金も個別にご相談いただけます。"],
  ["ホテル・ガイドへの紹介料は別途引かれますか？", "いいえ。紹介料は当社が負担し、合意した卸価格から別途差し引くことはありません。精算時期やキャンセル時の扱いは掲載前に確認します。"],
  ["外国語での対応ができなくても相談できますか？", "はい。KAMEHAME JAPAN経由の外国語のお問い合わせ・予約調整をサポートします。当日の対応言語や通訳の必要性は、体験に合わせて確認します。すべての体験への通訳同行を約束するものではありません。"],
  ["必ず広告が出たり、予約が入ったりしますか？", "体験の内容や対象となる旅行者に合わせて販促方法を検討します。すべての体験への広告配信や、一定の予約件数を保証するものではありません。"],
  ["写真や資料がまだ揃っていません。", "まずはご相談いただけます。掲載申請では既存ページや資料の共有リンクもご利用いただけます。公開前に、必要な写真・受入条件などを確認します。"],
];

export default function SupplierLandingPage() {
  const pageRef = useReveal();
  return <main ref={pageRef} className="sp-page" lang="ja">
    <header className="sp-header"><Brand lang="ja"/><span className="sp-header-label">体験事業者様へ</span></header>
    <section className="sp-hero sp-wrap" aria-labelledby="partner-title">
      <div className="sp-hero-copy">
        <p className="sp-eyebrow">KAMEHAME JAPAN / EXPERIENCE PARTNERS</p>
        <h1 id="partner-title">インバウンド集客の、<br/><span>新たな選択肢。</span></h1>
        <p className="sp-lead">ホテル・旅行会社の紹介から、<br/>検索・AI・SNSまで。</p>
        <p className="sp-sublead">旅の計画中にも、旅先でも。<br/>広告やインフルエンサーとの連携も組み合わせ、<br className="sp-desktop-break"/>あなたの体験と、世界の旅行者をつなぎます。</p>
        <ul className="sp-benefits" aria-label="掲載の特徴">
          <li><BadgeJapaneseYen aria-hidden="true"/><strong>掲載無料</strong><small>掲載にかかる費用なし</small></li>
          <li><Languages aria-hidden="true"/><strong>日本語登録のみ</strong><small>外国語の原稿は不要</small></li>
          <li><MessagesSquare aria-hidden="true"/><strong>顧客対応不要</strong><small>問い合わせ・予約調整</small></li>
        </ul>
        <div className="sp-actions"><a href="#consult" className="sp-button">まずは相談する <ArrowRight size={18}/></a></div>
      </div>
      <div className="kh-hero-visual">
        <img className="kh-hero-main" src="/images/suppliers/tea-yotsuya-guests.jpg" alt="茶道を楽しむ訪日旅行者" fetchPriority="high"/>
        <img className="kh-hero-inset" src="/images/suppliers/ramen-fresh-noodles.jpg" alt="手作りの麺を手に、笑顔でラーメン体験を楽しむお客様"/>
        <div className="kh-hero-caption"><span>A MOMENT IN JAPAN.</span><p>あなたの日常が、<br/>旅の特別な一日に。</p></div>
      </div>
    </section>
    <section className="sp-experiences sp-wrap" aria-labelledby="experiences-title">
      <div className="sp-experiences-heading" data-reveal><p className="sp-eyebrow">THE EXPERIENCES</p><h2 id="experiences-title">日本の魅力は、<br/>ひとつじゃない。</h2><p>食べる、つくる、動く、整う。<br/>地域に根ざした体験を、旅の目的に。</p></div>
      <ul className="sp-experience-index">{[
        ["01", "食・料理", "FOOD & COOKING"],
        ["02", "伝統文化", "CULTURE & HERITAGE"],
        ["03", "工芸・ものづくり", "ARTS & CRAFTS"],
        ["04", "スポーツ", "SPORTS"],
        ["05", "自然・アウトドア", "NATURE & OUTDOORS"],
        ["06", "ウェルネス", "WELLNESS"],
      ].map(([n, title, en])=><li key={n} data-reveal><span className="sp-index-number">{n}</span><div><span className="sp-index-title">{title}</span><span className="sp-index-en">{en}</span></div></li>)}</ul>
    </section>
    <ReachChannels/>
    <section className="kh-partners"><div className="sp-wrap kh-partners-grid">
      <div className="kh-partners-copy" data-reveal><p className="sp-eyebrow">03 — LOCAL CONNECTIONS</p><h2>旅先で頼る人の、<br/>「おすすめ」になる。</h2><p>ホテルのフロント、旅を案内するガイド、旅行会社。<br/>旅行者のすぐそばにいるパートナーが、<br/>あなたの体験を紹介できる仕組みを。</p><ul className="kh-partner-types" aria-label="紹介パートナーの種類"><li><Building2 aria-hidden="true"/><span>ホテル</span></li><li><Plane aria-hidden="true"/><span>旅行会社</span></li><li><MapPinned aria-hidden="true"/><span>ツアーガイド</span></li></ul><dl className="kh-partner-details"><div><dt>知ってもらう</dt><dd>専用管理画面で、体験内容や条件を確認。</dd></div><div><dt>薦めてもらう</dt><dd>紹介ページやパンフレットで、お客様に提案。</dd></div><div><dt>つながる</dt><dd>紹介後の問い合わせ・予約調整は、カメハメへ。</dd></div></dl><p className="kh-partner-footnote">紹介実績に応じた紹介料で、継続的な提案を後押しします。</p></div>
      <div className="kh-partner-visual"><figure className="kh-partner-photo" data-reveal><img src="/images/suppliers/hotel-concierge-recommendation.webp" alt="ホテルのフロントで、旅行者に体験を紹介する場面のイメージ" width="1536" height="1024" loading="lazy"/></figure><PartnerBrochure/></div>
    </div></section>
    <section className="sp-section sp-wrap"><div className="sp-section-heading" data-reveal><p className="sp-eyebrow">FOCUS ON YOUR EXPERIENCE</p><h2>体験を届ける時間に、<br/><span className="sp-emphasis">もっと、集中を。</span></h2></div><div className="sp-support-grid"><article data-reveal><Globe2 size={25}/><h3><span className="kh-heading-phrase">日本語で登録。</span><span className="kh-heading-phrase">多言語で世界へ。</span></h3><p>日本語で登録いただいた体験情報を、カメハメが英語をはじめとするさまざまな言語に翻訳して掲載。体験の魅力や受入条件を、世界の旅行者に伝えます。</p></article><article data-reveal><MessagesSquare size={25}/><h3>問い合わせ・予約調整をサポート。</h3><p>カメハメ経由のお客様とのやり取りを担当。事業者様には、空き状況や受入可否を、日本語またはご希望の言語で確認します。</p></article></div><div className="sp-responsibility"><b>事業者様にお願いすること</b><p>正確な体験情報・写真のご提供、受入可否へのご回答、当日の体験提供と安全管理。通訳や送迎が必要な場合は、個別に調整します。</p></div></section>
    <section className="sp-pricing"><div className="sp-wrap sp-pricing-grid"><div data-reveal><p className="sp-eyebrow">SIMPLE PRICING</p><h2>受け取りたい金額を、<br/><span>先に決める。</span></h2><p>ご相談後、一般販売価格と希望卸価格を伺います。<br/>条件を確認し、合意した卸価格をお支払いします。</p></div><div className="sp-price-card" data-reveal><p className="sp-tag">卸価格の設定例</p><div><span>一般販売価格</span><strong>¥10,000</strong></div><div className="sp-price-highlight"><span>希望卸価格の目安<small>一般価格の25％引き</small></span><strong>¥7,500</strong></div><p>同じ体験内容・人数条件での税込金額の例です。<br/>卸価格はご希望に合わせてご相談いただけます。</p></div><p className="sp-pricing-note">{SUPPLIER_PRICE_NOTE}</p></div></section>
    <section className="sp-section sp-wrap"><div className="sp-section-heading" data-reveal><p className="sp-eyebrow">GETTING STARTED</p><h2>まずは相談から。</h2></div><ol className="sp-steps">{[["まずは相談", "体験の内容や集客のお悩みを、相談フォームからお知らせください。"], ["メールでご案内", "担当者が内容を確認し、ご連絡。掲載をご希望の場合は、登録フォームをメールでご案内します。"], ["情報登録・審査", "別の登録フォームで体験情報をご入力。受入条件や希望卸価格を確認します。"], ["条件確認・掲載", "販売条件と掲載内容の合意後に公開。体験に合った集客・紹介を進めます。"]].map(([t,d],i)=><li key={t} data-reveal><span>0{i+1}</span><h3>{t}</h3><p>{d}</p></li>)}</ol></section>
    <section className="sp-faq-section"><div className="sp-wrap sp-faq-grid"><div data-reveal><p className="sp-eyebrow">FAQ</p><h2>よくあるご質問</h2></div><div>{faqs.map(([q,a])=><details key={q} data-reveal><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
    <section className="kh-consult" id="consult"><div className="sp-wrap kh-consult-grid"><div className="kh-consult-intro"><p className="sp-eyebrow">LET’S TALK</p><h2>まずは、お話から。</h2><p>「うちの体験も、掲載できる？」<br/>そんなご相談からで大丈夫です。</p><p>体験の魅力も、集客のお悩みも。<br/>これからの可能性を、一緒に考えましょう。</p><div className="kh-consult-after"><span>ご相談のあと</span><p>担当者からメールでご連絡します。<br/>詳細な体験情報は、その後にご案内する<br className="sp-desktop-break"/>登録フォームからお知らせください。</p></div></div><ConsultationForm/></div></section>
    <footer className="sp-footer"><div className="sp-wrap"><Brand lang="ja"/><p>運営：株式会社プロセント<br/>KAMEHAME JAPAN — 日本の体験を、世界の旅行者へ。</p><div><Link href="/ja/">旅行者向けサイト</Link><Link href="/ja/privacy/">プライバシーポリシー</Link><a href="mailto:hello@kamehame-japan.com">お問い合わせ</a></div><small>© 2026 KAMEHAME JAPAN</small></div></footer>
  </main>;
}
