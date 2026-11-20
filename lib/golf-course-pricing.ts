import { z } from "zod";
import reference from "./golf-course-pricing-reference.json";
import { normaliseCourseName } from "./golf-course-images";
const money=z.number().int().min(0).max(10000000).nullable();
const https=z.string().max(1000).refine(v=>!v||(()=>{try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password}catch{return false}})(),"https_url_required");
export const coursePricingSchema=z.object({weekday:money,weekend:money,twoWeekday:money,twoWeekend:money,threeWeekday:money,threeWeekend:money,clubs:money,shoes:money,goraUrl:https.refine(v=>!v||["booking.gora.golf.rakuten.co.jp","gora.golf.rakuten.co.jp"].includes(new URL(v).hostname),"gora_url_required"),source:https,checkedOn:z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),conditions:z.string().max(4000)});
export type CoursePricing=z.infer<typeof coursePricingSchema>;
export const emptyCoursePricing:CoursePricing={weekday:null,weekend:null,twoWeekday:null,twoWeekend:null,threeWeekday:null,threeWeekend:null,clubs:null,shoes:null,goraUrl:"",source:"",checkedOn:"",conditions:""};
export function referencePricing(name:string):CoursePricing|null {const key=normaliseCourseName(name);const found=reference.find(c=>[c.name,...c.aliases].some(n=>normaliseCourseName(n)===key));return found?coursePricingSchema.parse(found.pricing):null}
export function pricingCourseKey(name:string):string {const key=normaliseCourseName(name);const found=reference.find(c=>[c.name,...c.aliases].some(n=>normaliseCourseName(n)===key));return normaliseCourseName(found?.name??name)}
export const referenceCourseNames=reference.map(c=>c.name);
