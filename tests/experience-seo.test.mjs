import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType:'custom', configFile:false, root, resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const {catalogFor,previewsFor,SITE_ORIGIN}=await vite.ssrLoadModule('/lib/catalog.ts');
const {experienceJsonLd,experienceFacts}=await vite.ssrLoadModule('/lib/experience-seo.ts');
const {serializeJsonLd}=await vite.ssrLoadModule('/lib/seo.ts');
const {articlesFor}=await vite.ssrLoadModule('/lib/articles.ts');
const langs=['en','ja','es','fr','zh-tw'];
test('every published experience has linked identity, visible facts and exact local FAQ',()=>{
 for(const lang of langs)for(const exp of catalogFor(lang).experiences){
  const faq=exp.faq??[];const data=experienceJsonLd(exp,lang,faq);const [entity,page,faqEntity]=data['@graph'];
  assert.equal(entity.provider['@id'],`${SITE_ORIGIN}/#organization`);
  assert.equal(page.inLanguage,lang);assert.equal(page.mainEntity['@id'],entity['@id']);
  assert.deepEqual(entity.additionalProperty.map(({name,value})=>({name,value})),experienceFacts(exp,lang));
  if(faq.length)assert.deepEqual(faqEntity.mainEntity.map(f=>({q:f.name,a:f.acceptedAnswer.text})),faq);
  if(exp.consultationOnly||exp.pricePending||exp.bookingPaused)assert.equal(entity.offers,undefined);
  else {
   assert.ok((entity.offers.price ?? Number(entity.offers.lowPrice))>0,`${lang}/${exp.slug}`);
   assert.equal(entity.offers.url,entity.url);
   assert.equal(entity.offers.priceCurrency,'JPY');
   assert.equal(entity.offers.availability,'https://schema.org/LimitedAvailability',`${lang}/${exp.slug}`);
   for(const offer of entity.offers.offers??[])assert.equal(offer.availability,entity.offers.availability);
  }
 }
});
test('group quotes and golf fee do not turn into misleading per-person prices',()=>{
 const exps=catalogFor('en').experiences;
 const golf=exps.find(e=>e.slug==='mt-fuji-golf-day');
 const entity=experienceJsonLd(golf,'en')['@graph'][0];
 assert.equal(entity.offers.lowPrice,"15000");assert.equal(entity.offers.highPrice,"30000");assert.match(entity.offers.offers[0].priceSpecification.unitText,/group/);
 const group=exps.filter(e=>e.priceUnit==='group'&&!e.variants&&!e.consultationOnly&&!e.bookingPaused);
 for(const exp of group){const amount=experienceJsonLd(exp,'en')['@graph'][0].offers.price;assert.ok(amount>0);}
 for(const lang of langs)for(const exp of previewsFor(lang).experiences)assert.equal(experienceJsonLd(exp,lang),null);
});
test('JSON-LD escapes HTML without changing the JSON data',()=>{
 const source={name:'</script><img src=x>',description:'A < B'};const encoded=serializeJsonLd(source);
 assert.ok(!encoded.includes('<'));assert.deepEqual(JSON.parse(encoded),source);
});
test('comparison articles resolve to published options in every language',()=>{
 for(const lang of langs){
  const articles=articlesFor(lang).filter(a=>a.comparison);assert.equal(articles.length,2);
  for(const a of articles){const c=a.comparison;const rows=catalogFor("en").experiences.filter(e=>e.category===c.category&&(!c.city||e.city===c.city));assert.ok(rows.length>=2,`${lang}/${a.slug}: ${rows.length}`);}
 }
});

test('built HTML exposes experience graphs and comparison links without running JavaScript',async()=>{
 const {default:worker}=await import('../dist/server/index.js');
 const render=async path=>{const response=await worker.fetch(new Request(`https://kamehame-japan.com${path}`,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});assert.equal(response.status,200,path);return response.text();};
 for(const lang of langs){
  const html=await render(`/${lang}/tokyo/nihonbashi-kendo-experience/`);
  const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const s=JSON.parse(m[1]);return s['@graph']??[s]});
  assert.ok(html.includes('id="booking-facts"'));assert.ok(schemas.some(s=>s['@type']==='FAQPage'));
  const entity=schemas.find(s=>Array.isArray(s['@type'])&&s['@type'].includes('Service'));
  assert.ok(entity);assert.equal(entity.name,catalogFor(lang).experiences.find(e=>e.slug==="nihonbashi-kendo-experience").title);assert.equal(entity.offers.price,Number(catalogFor(lang).experiences.find(e=>e.slug==="nihonbashi-kendo-experience").price.replace(/[^\d]/g,"")));
  assert.equal(entity.offers.availability,'https://schema.org/LimitedAvailability');
  for(const slug of ['choosing-kendo-experience-japan','choosing-tea-ceremony-kyoto']){
   const article=await render(`/${lang}/journal/${slug}/`);
   assert.ok(article.includes('<caption>'));assert.ok(article.includes('"@type":"Article"'));
   if(lang!=='en'&&slug.includes('tea'))assert.ok(article.includes('href="/en/kyoto/kyoto-higashiyama-annex-tea-ceremony/"'),'untranslated options link to their actual English routes');
  }
 }
});
