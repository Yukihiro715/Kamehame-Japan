import { reservationBookings } from "./reservation-data";
import type { Booking, Master } from "./model";
import { z } from 'zod';
import type { SqlDb } from '@/lib/referral/db';
import { ApiError } from '@/lib/portal/util';
import type { StripeIdentityEnv } from './stripe-identities';
const text=z.string().max(2000), money=z.number().int().min(0).max(100000000).nullable();
const status=z.enum(['confirmed','estimate','unknown']);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
const cost=z.object({id:z.string().max(100),label:text,supplier:text,unit:money,qty:z.number().min(0).max(10000),status,payer:z.enum(['company','customer']),paid:z.boolean(),source:text,note:text}).refine(c=>c.status!=='confirmed'||c.unit!==null);
export const booking=z.object({id:z.string().min(1).max(100),reservationId:z.string().max(100).optional(),requestId:z.string().max(100).optional(),externalRef:z.string().max(100).optional(),name:text,product:text,date:z.union([date,z.literal('')]),people:z.number().int().min(1).max(10000).nullable(),status:text,sales:money,received:money,fee:money,paymentDate:z.union([date,z.literal('')]),stripeSource:z.string().max(100),costs:z.array(cost).max(100),complete:z.boolean(),note:text});
export const master=z.object({id:z.string().min(1).max(100),name:text,supplier:text,category:text,price:money,unit:text,status,source:text,note:text,autoCost:z.object({slug:z.string().min(1).max(150),from:date,through:z.union([date,z.literal('')]),quantity:z.enum(['person','booking'])}).optional()}).refine(m=>m.status!=='confirmed'||m.price!==null).refine(m=>!m.autoCost||m.status==='confirmed'&&!!m.source&&(!m.autoCost.through||m.autoCost.from<=m.autoCost.through));
export const range=z.object({source:z.enum(['google','meta','stripe','seo','aio','organic']),start:date,end:date}).refine(v=>v.start<=v.end&&(Date.parse(v.end)-Date.parse(v.start))/86400000<=180);
export const snapshot=range.and(z.object({id:z.string().max(150),data:z.record(z.unknown()),updatedAt:z.string().datetime().optional()}));
export async function allData(db:SqlDb,env:StripeIdentityEnv={}){
 const rows=await db.all<{kind:string;payload:string;revision:number;updated_at:string}>(`SELECT kind,payload,revision,updated_at FROM business_records`);
 const items=(kind:string)=>rows.filter(r=>r.kind===kind).map(r=>{const p=JSON.parse(r.payload);return {...p,revision:r.revision,updatedAt:kind==='snapshot'?(p.updatedAt??r.updated_at):r.updated_at}});
 const snapshots=items('snapshot') as Array<z.infer<typeof snapshot>>;
 const paidStripeSources=new Set<string>();
 for(const s of snapshots){
  if(s.source!=='stripe'||!Array.isArray(s.data.payments))continue;
  for(const p of s.data.payments){
   if(typeof p?.source==='string'&&p.source&&typeof p.amount==='number'&&p.amount>0)paidStripeSources.add(p.source);
  }
 }
 const masters=items('master') as Master[];
 return {bookings:await reservationBookings(db,items('booking') as Booking[],masters,env,paidStripeSources),masters,snapshots,audit:await db.all(`SELECT * FROM business_audit ORDER BY created_at DESC LIMIT 50`)};
}
export async function saveRecord(db:SqlDb,kind:'booking'|'master'|'snapshot',payload:unknown,revision:unknown,actor:string){
 const parsed=(kind==='booking'?booking:kind==='master'?master:snapshot).safeParse(payload);
 if(!parsed.success||!Number.isSafeInteger(revision)||Number(revision)<0)throw new ApiError(400,'invalid_record','入力内容を確認してください。');
 const p=parsed.data,key=kind+':'+p.id,at=new Date().toISOString(),auditId=crypto.randomUUID(),data=JSON.stringify(p);
 if(data.length>500000)throw new ApiError(400,'record_too_large');
 const old=await db.first<{payload:string;revision:number}>(`SELECT payload,revision FROM business_records WHERE key=?`,[key]);
 if((old?.revision??0)!==revision)throw new ApiError(409,'conflict','他の人が更新しました。再読み込みしてから編集してください。');
 await db.batch([
 old?{sql:`UPDATE business_records SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE key=? AND revision=?`,params:[data,at,actor,key,revision]}:{sql:`INSERT OR IGNORE INTO business_records VALUES (?,?,?,1,?,?)`,params:[key,kind,data,at,actor]},
 {sql:`INSERT INTO business_audit SELECT ?,?,?,?,?,?,? WHERE changes()>0`,params:[auditId,key,old?'更新':'登録',old?.payload??null,data,at,actor]}
 ]);
 if(!await db.first(`SELECT id FROM business_audit WHERE id=?`,[auditId]))throw new ApiError(409,'conflict','他の人が更新しました。再読み込みしてください。');
 return {revision:Number(revision)+1,updatedAt:at};
}
export async function importData(db:SqlDb,input:unknown,actor:string){
 const schema=z.object({bookings:z.array(booking).max(1000),masters:z.array(master).max(1000),snapshots:z.array(snapshot).max(1000)});
 const result=schema.safeParse(input);if(!result.success)throw new ApiError(400,'invalid_import','移行ファイルの形式を確認してください。');
 let imported=0,skipped=0;
 // Retry-safe: only insert missing identities. Never overwrite a newer local edit.
 for(const [kind,list] of Object.entries(result.data))for(const payload of list){
  const type=kind==='bookings'?'booking':kind==='masters'?'master':'snapshot';
  if(await db.first(`SELECT key FROM business_records WHERE key=?`,[type+':'+payload.id])){skipped++;continue;}
  try{await saveRecord(db,type,payload,0,actor);imported++;}catch(e){if(e instanceof ApiError&&e.status===409)skipped++;else throw e;}
 }
 return {imported,skipped};
}
