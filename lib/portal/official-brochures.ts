import { catalogFor } from '@/lib/catalog';
import { listPrice } from '@/lib/pricing';
import type { SqlDb } from '@/lib/referral/db';
import { partnerExperienceOrder } from './experience-sort';
import { createLink, publicLinkUrl, targetFor, type LinkRow } from './links-admin';
import { bad } from './util';
import type { OfficialBrochureCatalog, OfficialBrochureExperience, OfficialBrochureInput, OfficialBrochureLanguage } from './official-brochure-types';

export function officialBrochureLanguage(value: unknown): OfficialBrochureLanguage {
  if(value !== 'ja' && value !== 'en') throw bad('brochure_language');
  return value;
}
export function officialBrochureCatalog(): OfficialBrochureCatalog {
  const titles=(lang:OfficialBrochureLanguage)=>partnerExperienceOrder(catalogFor(lang).experiences).filter(e=>e.status==='live').map(({slug,title})=>({slug,title}));
  return {experiences:{ja:titles('ja'),en:titles('en')}};
}
export function officialBrochureItems(lang:OfficialBrochureLanguage, slug:string|null): OfficialBrochureExperience[] {
  const live=partnerExperienceOrder(catalogFor(lang).experiences).filter(e=>e.status==='live');
  // The evergreen overview describes themes, not a fixed list of live products.
  if(!slug)return [];
  const selected=live.filter(e=>e.slug===slug);
  if(!selected.length)throw bad('unknown_experience');
  return selected.map(e=>{
    const p=listPrice(e,lang),numeric=/^(?:約|approx\.\s*)?¥[\d,]+$/.test(p.price);
    const price=e.pricePending?(lang==='en'?'See website for prices':'料金はサイトでご確認ください'):numeric?(lang==='en'?`From ${p.price}`:`${p.price}〜`):p.price;
    const unit=lang==='en'?(p.unit==='person'?'Tax incl. / person':'Tax incl. / group'):(p.unit==='person'?'税込・1名':'税込・1組');
    return {slug:e.slug,title:e.title,area:e.area,img:e.img,tagline:e.tagline,duration:e.duration,group:e.group,highlights:e.whatYoullDo.slice(0,3),price,priceNote:[e.pricePending?'':unit,p.note].filter(Boolean).join(' · ')};
  });
}
/** Reuse a stable brochure QR per hotel, target and language. These links never reference agency price settings. */
export async function officialBrochureInput(db:SqlDb,hotelId:string,lang:OfficialBrochureLanguage,slug:string|null,origin:string,by:string,demo=false):Promise<OfficialBrochureInput> {
  const items=officialBrochureItems(lang,slug);
  let referralUrl=`https://example.invalid/demo/brochure/${lang}/${slug??'all'}`;
  if(!demo) {
    const target=targetFor(slug).replace(/^\/en(?=\/)/,`/${lang}`);
    const existing=await db.first<LinkRow>(`SELECT * FROM referral_links WHERE hotel_id=? AND experience_slug IS ? AND medium='brochure' AND kind='qr' AND target_path=? AND status='active' ORDER BY created_at LIMIT 1`,[hotelId,slug,target]);
    const link=existing??await createLink(db,{hotelId,experienceSlug:slug,medium:'brochure',kind:'qr',targetLanguage:lang,label:`KAMEHAME JAPAN ${slug??'総合案内'} (${lang})`,by});
    referralUrl=publicLinkUrl(origin,link.token);
  }
  return {lang,experience:slug,items,referralUrl,demo,issuedOn:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'})};
}
