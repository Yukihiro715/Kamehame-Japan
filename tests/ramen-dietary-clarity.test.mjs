import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../dist/server/index.js';
const phrases = { en: 'not halal-certified', ja: 'ハラール認証は取得していません', es: 'no cuenta con certificación halal', fr: 'n’est pas certifiée halal', 'zh-tw': '未取得第三方清真認證' };
test('Tokyo and Osaka ramen distinguish dietary plans from halal certification in every language', async () => {
 for(const [lang,phrase] of Object.entries(phrases)) for(const [city,slug] of [['tokyo','shibuya-ramen-class'],['osaka','dotonbori-ramen-class']]) {
  const path=`/${lang}/${city}/${slug}/`;
  const r=await worker.fetch(new Request('https://kamehame-japan.com'+path),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(r.status,200,path);const html=await r.text();assert.ok(html.includes(phrase),path);
  assert.doesNotMatch(html,/ベジタリアン・ヴィーガンは追加料金なし|sin coste adicional|sans supplément|不加價/);
 }
});

test('all seven kendo FAQs include the small-group sizing exception in every locale', async () => {
 const {readFileSync}=await import('node:fs');
 const checks={en:/groups of up to five, two days before/,ja:/5名以内は2日前/,es:/dos días antes para grupos de cinco/,fr:/deux jours avant pour un groupe de cinq/,'zh-tw':/5 人以下可於兩天前/};
 for(const [lang,pattern] of Object.entries(checks)) {
  const source=readFileSync(new URL(`../lib/catalog${lang==='en'?'':'.'+lang}.ts`,import.meta.url),'utf8');
  const faqs=source.split('\n').filter(line=>line.includes('{ q:')&&/Why do you need our height|なぜ身長と性別|Por qué necesitáis nuestra estatura|Pourquoi avez-vous besoin de notre taille|為什麼需要我們的身高/.test(line));
  assert.equal(faqs.length,7,lang);for(const line of faqs)assert.match(line,pattern,lang);
 }
});
