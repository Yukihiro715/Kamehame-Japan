import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true}});
after(()=>vite.close());
const {catalogFor,previewsFor}=await vite.ssrLoadModule('/lib/catalog.ts');
const {pricingFor,quote}=await vite.ssrLoadModule('/lib/pricing.ts');
const {EXPERIENCE_PRODUCTS}=await vite.ssrLoadModule('/lib/provisional-booking.ts');
const {parseExperienceOrder,checkoutParameters}=await vite.ssrLoadModule('/lib/experience-checkout.ts');
const langs=['en','ja','es','fr','zh-tw'];
const cities=['tokyo','osaka','kyoto','nagoya','okinawa','kanazawa','himeji'];
const expectedPreviews={'samurai-street-walk-kitasenju':56500,'tokyo-tate-samurai-sword-experience':47500,'kichijoji-japanese-cuisine-class':29500,'asakusa-english-rakugo-walk':21500,'tokyo-ninja-zen-meditation':44000};
test('Samurai Trip display, quote, server amount and Stripe selection agree across seven cities',()=>{
 for(const lang of langs)for(const city of cities){
  const slug=`${city}-kendo-experience-tour`,x=catalogFor(lang).experiences.find(e=>e.slug===slug);
  assert.equal(x.price,'¥27,500');assert.equal(x.status,'live');
  assert.equal(EXPERIENCE_PRODUCTS[slug].amount,27500);
  for(let guests=2;guests<=13;guests++){
   const q=quote(pricingFor(x,lang),'select',guests,'2026-12-01');assert.equal(q.total,27500*guests);
   const o=parseExperienceOrder({request_id:'11111111-2222-4333-8444-555555555555',experience:slug,lang,name:'Example Guest',email:'guest@example.com',date:'2026-12-01',time:x.availability?.startTimes?.[0]??'10:00',guests,consent:true,standard:true,adultOnly:true,amount:1,price:'price_fake'},Date.parse('2026-11-14T00:00:00Z'));
   assert.ok(o,slug);assert.equal(o.amount,q.total);
   assert.equal(checkoutParameters(o,'KJ-E-11111111222243338444555555555555',Date.now()).get('line_items[0][price]'),EXPERIENCE_PRODUCTS[slug].price);
  }
 }
});
test('five repriced previews stay unpublished and street walk quotes the solo supplement',()=>{
 for(const lang of langs)for(const [slug,amount] of Object.entries(expectedPreviews)){
  const x=previewsFor(lang).experiences.find(e=>e.slug===slug);assert.ok(x,lang+' '+slug);
  assert.equal(x.price,'¥'+amount.toLocaleString('en-US'));assert.equal(x.status,'preview');
  assert.ok(!catalogFor(lang).experiences.some(e=>e.slug===slug));assert.equal(EXPERIENCE_PRODUCTS[slug],undefined);
  if(slug==='samurai-street-walk-kitasenju')for(let guests=1;guests<=5;guests++)assert.equal(quote(pricingFor(x,lang),'select',guests,'2026-12-01').total,guests===1?75000:56500*guests);
 }
});

test('remaining advertising prices keep locale quotes, tiers and checkout consistent',()=>{
 for(const lang of langs){
  const live=catalogFor(lang).experiences, preview=previewsFor(lang).experiences;
  const calligraphy=live.find(x=>x.slug==='kanji-name-calligraphy');
  assert.equal(calligraphy.price,'¥21,500');
  for(let guests=2;guests<=4;guests++){
   const q=quote(pricingFor(calligraphy,lang),'',guests,'2026-11-02');
   const o=parseExperienceOrder({request_id:'11111111-2222-4333-8444-555555555555',experience:calligraphy.slug,lang,name:'Example Guest',email:'guest@example.com',date:'2026-11-02',time:'10:30',guests,consent:true,standard:true,amount:1,price:'price_fake'},Date.parse('2026-10-22T08:00:00Z'));
   assert.equal(q.total,21500*guests);assert.equal(o.amount,q.total);
   assert.equal(checkoutParameters(o,'KJ-E-11111111222243338444555555555555',Date.now()).get('line_items[0][price]'),EXPERIENCE_PRODUCTS[calligraphy.slug].price);
  }
  const tea=live.find(x=>x.slug==='yotsuya-tea-ceremony');
  for(let n=1;n<=10;n++)assert.equal(quote(pricingFor(tea,lang),'',n).total,n===1?17500:n*(n<=4?16000:14500));
  const spa=live.find(x=>x.slug==='nerima-herbal-bath-private-spa');
  for(const [n,total] of [[1,24500],[2,42000],[3,60000]])assert.equal(quote(pricingFor(spa,lang),'',n).total,total);
  for(const [slug,price] of [['setagaya-omotesenke-tea-ceremony',25000],['asakusa-soba-making-class',16000],['asakusa-ramen-making-class',16000]]){
   const x=preview.find(x=>x.slug===slug);assert.ok(x);assert.equal(x.status,'preview');
   assert.equal(quote(pricingFor(x,lang),'',2).total,2*price);assert.equal(EXPERIENCE_PRODUCTS[slug],undefined);
   const faq=JSON.stringify(x.faq);assert.ok(faq.includes(slug.startsWith('setagaya')?'¥16,000':'¥14,500'));
  }
 }
});
