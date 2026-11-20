import type { SqlDb } from '@/lib/referral/db';
import { jstDate } from '@/lib/referral/db';
import { catalogFor } from '@/lib/catalog';
import { golfersOf } from '@/lib/golfpaq-ops';
import type { Booking, Master } from './model';
import { isChargeSource, verifyStripeIdentities, type StripeIdentityEnv, type StripeIdentity } from './stripe-identities';
import { ApiError } from '@/lib/portal/util';

export type AutoCostRule={slug:string;from:string;through:string;quantity:'person'|'booking'};
/** Only an explicitly enabled, dated, confirmed master may supply a cost.
 * Ambiguous overlaps, cancelled bookings, and unknown quantities stay pending. */
export function knownCosts(b:Booking,slug:string,masters:Master[]):Booking {
 if(b.complete||b.costs.length||!b.date||b.status==='キャンセル')return b;
 const matches=masters.filter(m=>m.autoCost&&m.status==='confirmed'&&m.price!==null&&m.source&&m.autoCost.slug===slug&&m.autoCost.from<=b.date&&(!m.autoCost.through||b.date<=m.autoCost.through));
 if(matches.length!==1)return b;
 const m=matches[0],qty=m.autoCost!.quantity==='person'?b.people:1;
 if(!qty)return b;
 return {...b,costs:[{id:'master:'+m.id,label:m.name,supplier:m.supplier,unit:m.price,qty,status:'confirmed',payer:'company',paid:false,source:m.source,note:'卸値マスターから自動入力。'+m.note}],complete:false};
}
interface Reservation {id:string;request_id:string;external_ref:string|null;experience_slug:string;experience_date:string|null;guests:number|null;status:string;payment_status:string;customer_name:string|null}
interface Payment {reservation_id:string;id:string;stripe_payment_intent:string|null;stripe_session_id:string|null;amount_total_jpy:number;occurred_at:string}
/** Project the actual booking ledger, then let an existing operator record win.
 * Linking uses stable request/reservation/Stripe identities, never name or amount. */
export async function reservationBookings(db:SqlDb,saved:Booking[],masters:Master[],env:StripeIdentityEnv={}):Promise<Booking[]> {
 const [reservations,payments,refunds,bus,identities]=await Promise.all([
  db.all<Reservation>(`SELECT r.*, c.customer_name FROM reservations r LEFT JOIN business_booking_context c ON c.reservation_id=r.id ORDER BY r.created_at DESC`),
  db.all<Payment>(`SELECT * FROM payments WHERE payment_status='paid' AND livemode=1 ORDER BY occurred_at DESC`),
  db.all<{reservation_id:string;amount:number}>(`SELECT reservation_id,SUM(amount_delta_jpy) amount FROM refunds WHERE reservation_id IS NOT NULL GROUP BY reservation_id`),
  db.all<{id:string;request_id:string;reference:string;name:string;course:string;tour_date:string;people:number;source_yen:number;total_yen:number;renters:number;shoe_renters:number;golfers_json:string|null;status:string;snapshot_updated_at:string|null}>(`SELECT id,request_id,reference,name,course,tour_date,people,source_yen,total_yen,renters,shoe_renters,golfers_json,status,snapshot_updated_at FROM bus_tour_enquiries ORDER BY created_at DESC`),
  db.all<StripeIdentity>(`SELECT source_id,payment_intent FROM business_stripe_identities UNION SELECT stripe_charge_id source_id,stripe_payment_intent payment_intent FROM refunds WHERE stripe_charge_id IS NOT NULL AND stripe_payment_intent IS NOT NULL`),
 ]);
 const stripeIds=new Map<string,string|null>();
 for(const identity of identities){
  const prior=stripeIds.get(identity.source_id);
  if(prior&&identity.payment_intent&&prior!==identity.payment_intent)throw new ApiError(409,'stripe_identity_conflict','Stripe決済IDの対応が一致しません。重複して集計しないため、照合を停止しました。');
  if(!stripeIds.has(identity.source_id)||identity.payment_intent)stripeIds.set(identity.source_id,identity.payment_intent);
 }
 const matches=(b:Booking,r:Reservation,list:Payment[])=>b.id==='reservation:'+r.id||b.reservationId===r.id||b.requestId===r.request_id||!!r.external_ref&&(b.id===r.external_ref||b.externalRef===r.external_ref)||b.id===r.request_id||!!b.stripeSource&&list.some(p=>p.stripe_payment_intent===b.stripeSource||p.stripe_session_id===b.stripeSource||!!p.stripe_payment_intent&&stripeIds.get(b.stripeSource)===p.stripe_payment_intent);
 const unmatchedPaid=reservations.some(r=>{const list=payments.filter(p=>p.reservation_id===r.id);return list.length&&!saved.some(b=>matches(b,r,list));});
 if(unmatchedPaid){
  const missing=saved.map(b=>b.stripeSource).filter(id=>isChargeSource(id)&&!stripeIds.has(id));
  for(const identity of await verifyStripeIdentities(db,env,missing))stripeIds.set(identity.source_id,identity.payment_intent);
 }
 const titles=new Map(catalogFor('ja').experiences.map(e=>[e.slug,e.title]));
 const result=[...saved];
 for(const r of reservations){
  const paid=new Map<string,Payment>();for(const p of payments.filter(p=>p.reservation_id===r.id)){const key=p.stripe_payment_intent||p.stripe_session_id||p.id;if(!paid.has(key))paid.set(key,p)}
  if(saved.some(b=>matches(b,r,[...paid.values()])))continue;
  const list=[...paid.values()],gross=list.reduce((s,p)=>s+p.amount_total_jpy,0),refund=refunds.find(x=>x.reservation_id===r.id)?.amount??0;
  const b:Booking={id:'reservation:'+r.id,reservationId:r.id,requestId:r.request_id,name:r.customer_name||r.external_ref||'予約 '+r.request_id.slice(0,8),product:titles.get(r.experience_slug)||r.experience_slug,date:r.experience_date??'',people:r.guests,status:r.status==='cancelled'?'キャンセル':r.status==='completed'?'実施済':list.length?'予約確定':'問い合わせ',sales:list.length?gross:null,received:list.length?Math.max(0,gross-refund):null,fee:null,paymentDate:list[0]?jstDate(list[0].occurred_at):'',stripeSource:list[0]?.stripe_payment_intent??'',costs:[],complete:false,note:'予約台帳から自動表示。未確認の原価・決済手数料は確認が必要です。'+(r.payment_status==='refunded'?' 全額返金済み。予約状況とは別に管理しています。':''),revision:0};
  result.push(knownCosts(b,r.experience_slug,masters));
 }
 for(const r of bus){
  if(result.some(b=>b.id==='bus:'+r.id||b.id===r.reference||b.externalRef===r.reference||b.requestId===r.request_id))continue;
  const costs:Booking['costs']=[];
  if(r.status!=='cancelled'&&r.status!=='unavailable'){
   costs.push({id:'bus-tour-cost',label:'ツアー仕入価格',supplier:'GOLFPAQ',unit:r.source_yen>0?r.source_yen:null,qty:r.people,status:r.source_yen<=0?'unknown':r.status==='confirmed'?'confirmed':'estimate',payer:'company',paid:false,source:'/ops/bus-tours/'+r.id+'/',note:'申込時の日程データに記録された仕入単価。'+(r.snapshot_updated_at??'')});
   if(r.renters){const standard=golfersOf(r).length===r.people&&golfersOf(r).filter(g=>g.clubs).length===r.renters&&golfersOf(r).filter(g=>g.clubs).every(g=>g.hand==='right');const rate=masters.find(m=>m.id==='golfpaq-club'&&m.status==='confirmed'&&m.price!==null);costs.push({id:'bus-club-cost',label:'クラブレンタル',supplier:'GOLFPAQ',unit:standard&&rate?rate.price:null,qty:r.renters,status:standard&&rate?'confirmed':'unknown',payer:'company',paid:false,source:standard&&rate?rate.source:'/ops/bus-tours/'+r.id+'/',note:'通常右用セット以外は個別確認。お客様向け販売額を仕入原価に転用しない。'})}
   if(r.shoe_renters)costs.push({id:'bus-shoes-cost',label:'シューズレンタル',supplier:'GOLFPAQ',unit:null,qty:r.shoe_renters,status:'unknown',payer:'company',paid:false,source:'/ops/bus-tours/'+r.id+'/',note:'仕入単価は未確認。'});
  }
  result.push({id:'bus:'+r.id,requestId:r.request_id,externalRef:r.reference,name:r.name,product:r.course+'／乗合ゴルフ',date:r.tour_date,people:r.people,status:r.status==='cancelled'||r.status==='unavailable'?'キャンセル':r.status==='confirmed'?'予約確定':'確認中',sales:r.total_yen,received:null,fee:null,paymentDate:'',stripeSource:'',costs,complete:false,note:'乗合ゴルフ申込台帳から自動表示。入金・追加費用・最終精算は別途照合。',revision:0});
 }
 return result;
}
