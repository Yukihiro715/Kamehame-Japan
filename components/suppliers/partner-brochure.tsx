export function PartnerBrochure() {
  return <figure className="kh-brochure" data-reveal aria-label="日本の体験を紹介する三つ折りパンフレットのイメージ">
    <div className="kh-brochure-spread">
      <div className="kh-brochure-panel kh-brochure-left">
        <span className="kh-brochure-label">TASTE & CREATE</span>
        <h3>つくる。<br/>味わう。<br/>思い出に。</h3>
        <img src="/images/suppliers/ramen-fresh-noodles.jpg" alt="ラーメンづくりを楽しむ旅行者" loading="lazy"/>
        <p>土地の味と、<br/>人の温もりに出会う。</p>
        <span className="kh-brochure-bottom">FOOD / CRAFT / CULTURE</span>
      </div>
      <div className="kh-brochure-panel kh-brochure-center">
        <span className="kh-brochure-label">EXPERIENCE JAPAN</span>
        <img src="/images/suppliers/tea-yotsuya-guests.jpg" alt="茶道体験に参加する旅行者" loading="lazy"/>
        <h3>旅の記憶に、<br/>日本の体験を。</h3>
        <p>その土地でしか<br/>出会えないひととき。</p>
        <span className="kh-brochure-bottom">KAMEHAME JAPAN</span>
      </div>
      <div className="kh-brochure-panel kh-brochure-right">
        <img src="/images/suppliers/craft-hands.jpg" alt="茶室でお茶を楽しむひととき" loading="lazy"/>
        <span className="kh-brochure-label">A MOMENT TO REMEMBER</span>
        <h3>日本文化に、<br/>ふれる時間。</h3>
        <div className="kh-brochure-topics"><span>茶道・伝統文化</span><span>食・ものづくり</span><span>自然・アクティビティ</span></div>
        <span className="kh-brochure-bottom">FIND YOUR EXPERIENCE</span>
      </div>
    </div>
  </figure>;
}
