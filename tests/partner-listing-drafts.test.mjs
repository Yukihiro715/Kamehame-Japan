import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test('partner listing drafts stay unlisted and cannot accept reservations',async()=>{
 const slugs=['tokyo-ninja-zen-night-walk','mukojima-geisha-evening','japanese-home-cooking-class','tokyo-matcha-cultural-experience','arashiyama-private-terrace-gathering','sumi-e-ink-painting'];
 for(const slug of slugs)for(const lang of ['en','ja']){
  const response=await render(`/previews/partner-listings/${slug}/?lang=${lang}`);
  assert.equal(response.status,200,slug);const html=await response.text();
  assert.match(html, /class="subpage detail-page xp xp2"/, slug);
  assert.match(html, /class="site-header solid"/, slug);
  assert.match(html, /id="overview"/, slug);
  assert.match(html, /id="booking-facts"/, slug);
  assert.match(html, /class="bk-card" id="booking"/, slug);
  assert.match(html,/noindex/);
  assert.ok(!html.includes('<form'),slug);
  assert.doesNotMatch(html, /\/api\/experience-checkout|checkout\.stripe\.com/, slug);
  assert.ok(!html.includes('\"@type\":\"Product\"'),slug);
  const bookingNotice = slug === "sumi-e-ink-painting"
    ? (lang === 'ja' ? 'お問い合わせ・予約受付停止中' : 'Closed to enquiries and bookings')
    : (lang === 'ja' ? '予約受付前' : 'Not open for booking');
  assert.ok(html.includes(bookingNotice), slug);
 }
 const missing=await render('/previews/partner-listings/not-a-listing/');assert.equal(missing.status,404);
});


test('Ginza sumi-e preview shows confirmed details without supplier pricing', async () => {
  for (const lang of ['en', 'ja']) {
    const response = await render(`/previews/partner-listings/sumi-e-ink-painting/?lang=${lang}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /SPACE KONA/);
    assert.match(html, /3-12-16/);
    assert.match(html, lang === 'ja' ? /3階/ : /3rd floor/);
    assert.match(html, /80/);
    assert.match(html, lang === 'ja' ? /コースター3枚/ : /three coasters/);
    assert.match(html, lang === 'ja' ? /別途オプション/ : /not included in the standard lesson/);
    assert.match(html, /noindex/);
    assert.ok(!html.includes('11,500'));
    assert.ok(!html.includes('15,000'));
    assert.ok(!html.includes('17,500'));
    assert.ok(!html.includes('18,500'));
    assert.ok(!html.includes('23,000'));
  }
});

test('supplied artwork and confirmed terrace terms appear without opening sales', async () => {
 for (const lang of ['ja', 'en']) {
  const sumi = await (await render(`/previews/partner-listings/sumi-e-ink-painting/?lang=${lang}`)).text();
  for (const name of ['rensui-koi', 'rensui-plum']) assert.ok(sumi.includes(`/images/partner-listings/sumi-e/${name}.webp`));
  assert.match(sumi, lang === 'ja' ? /講師の蓮水さんによるお手本/ : /Examples painted by the instructor, Rensui/);
  assert.doesNotMatch(sumi, /\/images\/partner-listings\/sumi-e\/(scroll|fuji|landscape)\.webp/);
  const terrace = await (await render(`/previews/partner-listings/arashiyama-private-terrace-gathering/?lang=${lang}`)).text();
  assert.match(terrace, /50%/); assert.match(terrace, /100%/); assert.match(terrace, /14/);
  assert.match(terrace, /noindex/); assert.ok(!terrace.includes('<form'));
 }
});

test("Bamboo Sky Terrace is listed in Kyoto and accepts venue-specific enquiries", async () => {
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const path = `/${lang}/kyoto/bamboo-sky-terrace/`;
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /<h1>Bamboo Sky Terrace<\/h1>/);
    assert.match(html, /class="subpage detail-page xp xp2"/);
    assert.match(html, /class="xp-hero-photo"/);
    assert.match(html, /class="xp-side"/);
    assert.match(html, /class="bk-cta" href="#request-form"/);
    assert.match(html, /id="request-form"/);
    for (const photo of ["terrace", "view", "lounge", "lantern", "entry"]) {
      assert.ok(html.includes(`/images/bamboo-sky-terrace-${photo}.webp`), `${lang}: ${photo}`);
    }
    assert.match(html, /<link rel="canonical" href="https:\/\/kamehame-japan\.com\//);
    assert.ok(html.includes(`https://kamehame-japan.com${path}`));
    assert.match(html, /<form[^>]+action="\/api\/contact"/);
    assert.match(html, /class="form-context"[^>]*>.*?<b>Bamboo Sky Terrace<\/b>/s);
    assert.doesNotMatch(html, /noindex|checkout\.stripe\.com|"@type":"Product"/);
    if (lang === "ja") {
      assert.match(html, /最大50名/);
      assert.match(html, /飲食は別途お見積もり/);
    }
    const kyotoHtml = await (await render(`/${lang}/kyoto/`)).text();
    assert.ok(kyotoHtml.includes(`href="${path}"`));
  }
});

test('confirmed partner answers replace pending questions without publishing supplier prices', async () => {
 const cases = {
  'tokyo-ninja-zen-night-walk': ['開始1日前まで全額返金', '原則雨天決行', '18歳以上'],
  'arashiyama-private-terrace-gathering': ['最低保証額なし', '利用日時・利用時間・人数'],
  'sumi-e-ink-painting': ['材料費を含む', '英語対応費を含む', '体験日の3日前', '同伴・見学不可', '別々のコースは選べません'],
 };
 for(const [slug,phrases] of Object.entries(cases)) {
  const html=await (await render(`/previews/partner-listings/${slug}/?lang=ja`)).text();
  for(const phrase of phrases) assert.ok(html.includes(phrase),`${slug}: ${phrase}`);
  assert.match(html,/noindex/);
  assert.doesNotMatch(html,/(?<![0-9])(11,500|17,500|18,500|23,000|5,000|8,000)(?![0-9])/);
 }
});

test('Sumi-e preview retains reference prices but does not accept enquiries or bookings', async () => {
  for (const lang of ['en', 'ja']) {
    // React's SSR may place a `<!-- -->` text separator inside a cell; it is invisible and not part of the content.
    const html = (await (await render('/previews/partner-listings/sumi-e-ink-painting/?lang=' + lang)).text()).replace(/<!-- -->/g, '');
    assert.match(html, /class="site-header solid"/);
    assert.match(html, /class="subpage detail-page xp xp2"/);
    assert.match(html, /class="gallery" id="photos"/);
    assert.match(html, /id="booking-facts"/);
    assert.match(html, /class="bk-card" id="booking".*?¥22,000.*?href="#pricing"/s);
    assert.match(html, lang === 'ja' ? /表示は参考価格案/ : /proposed prices are for reference only/);
    assert.match(html, lang === 'ja' ? /土日祝は18:00のみ/ : /public holidays: 18:00 only/);
    assert.match(html, lang === 'ja' ? /3日前23:59まで/ : /23:59 three days before/);
    assert.match(html, lang === 'ja' ? /前日の20:00まで/ : /20:00 the day before/);
    assert.match(html, lang === 'ja' ? /2027年1月1日以降を想定した税込価格案/ : /Proposed prices for sessions from 1 January 2027. Tax included/);
    const priceTable = html.match(/<table class="xp-pricing compact preview-pricing".*?<\/table>/s)?.[0];
    assert.ok(priceTable);
    const courses = [...priceTable.matchAll(/<tr><th scope="row">([^<]+)<\/th><td class="total">([^<]+)<\/td><td class="total">([^<]+)<\/td><\/tr>/g)]
      .map(row => row.slice(1));
    const names = lang === 'ja'
      ? ['色紙', 'コースター3枚', 'ランプシェード', '掛軸']
      : ['Shikishi art board', 'Three coasters', 'Lampshade', 'Hanging scroll'];
    assert.deepEqual(courses, [
      [names[0], '¥38,000', '¥22,000'],
      [names[1], '¥38,000', '¥22,000'],
      [names[2], '¥30,500', '¥30,500'],
      [names[3], '¥32,000', '¥32,000'],
    ]);
    assert.match(html, lang === 'ja' ? /お問い合わせ・予約受付停止中/ : /Closed to enquiries and bookings/);
    assert.match(html, /noindex/);
    assert.doesNotMatch(html, /<form\b|#request-form|id="request-form"/);
    assert.doesNotMatch(html, /\/api\/experience-checkout|checkout\.stripe\.com/);
    for (const wholesale of ['11,500', '17,500', '18,500', '23,000']) assert.ok(!html.includes(wholesale));
  }
});

test('Matsuyama pottery course: review link redirects, product page previews in five languages without naming the kiln', async () => {
  for (const lang of ['en', 'ja']) {
    const r = await render(`/previews/partner-listings/matsuyama-tobe-pottery-full-course/?lang=${lang}`);
    assert.ok([301, 302, 307, 308].includes(r.status), `${lang} redirect status ${r.status}`);
    assert.ok((r.headers.get('location') || '').includes(`/${lang}/matsuyama/matsuyama-tobe-pottery-full-course/`), `${lang} redirect target`);
  }
  for (const lang of ['en', 'ja', 'es', 'fr', 'zh-tw']) {
    const path = `/${lang}/matsuyama/matsuyama-tobe-pottery-full-course/`;
    const r = await render(path);
    assert.equal(r.status, 200, path);
    const html = await r.text();
    const text = html.replace(/<[^>]+>/g, ' ');
    assert.match(html, /name="robots" content="noindex/, `${lang} stays unlisted until the owner releases it`);
    assert.ok(text.includes('¥12,500'), `${lang} price`);
    assert.ok(html.includes('/images/partner-listings/matsuyama-pottery/wheel-instruction.webp'), `${lang} hero photo`);
    assert.match(html, /class="bk-card" id="booking"/, `${lang} booking card`);
    assert.ok(html.includes('id="access"'), `${lang} access section`);
    assert.doesNotMatch(text, /玄彩|Gensai|gensaiyo|河野|玄容|Kono|Kōno|089-975|791-0243|平井町|Hirai-cho|jalan|じゃらん/i, `${lang} partner identity stays private`);
  }
  // The city stays off the home page and listings while its only experience is a preview.
  const home = await (await render('/en/')).text();
  assert.ok(!home.includes('href="/en/matsuyama/"'), 'Matsuyama is not listed yet');
});

test('Yakushima tours and the ninja night walk show the rule price built on the confirmed wholesale', async () => {
  const lists = { 'yakushima-jomonsugi-trekking': '10,500', 'yakushima-shiratani-moss-forest': '7,500', 'yakushima-shiratani-taikoiwa': '11,000', 'yakushima-shiratani-taikoiwa-old-growth': '12,000', 'yakushima-sea-turtle-snorkeling': '5,000', 'yakushima-discover-scuba-one-dive': '7,000', 'yakushima-discover-scuba-extended-dive': '11,000', 'yakushima-discover-scuba-two-dives': '14,000', 'tokyo-ninja-zen-night-walk': '15,000' };
  for (const [slug, price] of [
  ['yakushima-jomonsugi-trekking', 18000],
  ['yakushima-shiratani-moss-forest', 15000],
  ['yakushima-shiratani-taikoiwa', 19000],
  ['yakushima-shiratani-taikoiwa-old-growth', 20000],
  ['yakushima-sea-turtle-snorkeling', 12000],
  ['yakushima-discover-scuba-one-dive', 14500],
  ['yakushima-discover-scuba-extended-dive', 19000],
  ['yakushima-discover-scuba-two-dives', 22000],
  ['tokyo-ninja-zen-night-walk', 23500],
  ]) for (const lang of ['en', 'ja']) {
    const html = await (await render(`/previews/partner-listings/${slug}/?lang=${lang}`)).text();
    const text = html.replace(/<[^>]+>/g, ' ');
    assert.ok(text.includes(`¥${price.toLocaleString('en-US')}`), `${lang} ${slug} price`);
    assert.ok(!text.includes(`¥${lists[slug]}`) && !text.includes(`${lists[slug]}円`), `${lang} ${slug} list price stays off the page`);
    assert.ok(!/仮の参考価格|Provisional reference price/.test(text), `${lang} ${slug} no provisional label`);
  }
});

test('Yotsuya matcha preview carries the confirmed brief without naming the academy', async () => {
  for (const lang of ['en', 'ja']) {
    const html = await (await render(`/previews/partner-listings/tokyo-matcha-cultural-experience/?lang=${lang}`)).text();
    const text = html.replace(/<[^>]+>/g, ' ');
    for (const s of lang === 'ja' ? ['約1.5時間', 'LUUPスタンド前', '英語インストラクター', '簡易着物レンタル込み', '一番茶の抹茶', '開始24時間前まで無料'] : ['About 1.5 hours', 'LUUP stand', 'English-speaking instructor', 'kimono rental included', 'First-flush matcha', '24 hours before']) {
      assert.ok(text.includes(s), `${lang}: ${s}`);
    }
    assert.ok(html.includes('/images/partner-listings/tokyo-matcha/whisking.webp'), `${lang} photos`);
    assert.doesNotMatch(text, /Matcha Academy|MATCHA ACADEMY|matchajaponica|Japonica/i, `${lang} academy name stays private`);
  }
});
