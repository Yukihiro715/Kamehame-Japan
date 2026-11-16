import type { SqlDb } from '@/lib/referral/db';
import { ApiError } from '@/lib/portal/util';

export type StripeIdentityEnv={STRIPE_READ_KEY?:string};
export type StripeIdentity={source_id:string;payment_intent:string|null};
export const isChargeSource=(id:string)=>/^(ch|py)_[A-Za-z0-9]+$/.test(id);

/** Only exact relationships returned by Stripe are persisted. No name, amount,
 * ID-prefix similarity or other inference can link two financial records. */
export async function verifyStripeIdentities(db:SqlDb,env:StripeIdentityEnv,sourceIds:string[]):Promise<StripeIdentity[]> {
  const ids=[...new Set(sourceIds)].filter(isChargeSource);
  if(!ids.length)return [];
  if(ids.length>25)throw new ApiError(422,'stripe_identity_limit','未照合のStripe決済IDが多いため、案件の照合IDを確認してください。原価を重複して集計しないため、読み込みを停止しています。');
  if(!env.STRIPE_READ_KEY)throw new ApiError(503,'stripe_identity_unconfigured','案件と予約の決済IDを照合するため、Stripeの読み取り接続を設定してください。');
  const verified:StripeIdentity[]=[];
  for(let i=0;i<ids.length;i+=5){
    const group=await Promise.all(ids.slice(i,i+5).map(async id=>{
      let response:Response;
      try{response=await fetch('https://api.stripe.com/v1/charges/'+id,{headers:{Authorization:'Bearer '+env.STRIPE_READ_KEY},redirect:'manual',signal:AbortSignal.timeout(15000)});}
      catch{throw new ApiError(502,'stripe_identity_unreachable','Stripeの決済IDを照合できませんでした。保存済みの原価は保持しています。');}
      if(!response.ok)throw new ApiError(502,'stripe_identity_failed','Stripeの決済IDを照合できませんでした。決済の読み取り権限と登録した照合IDを確認してください。');
      let charge:{id?:unknown;object?:unknown;livemode?:unknown;currency?:unknown;payment_intent?:unknown};
      try{charge=await response.json();}catch{throw new ApiError(502,'stripe_identity_invalid');}
      if(!charge||charge.id!==id||!['charge','payment'].includes(String(charge.object))||charge.livemode!==true||charge.currency!=='jpy'||charge.payment_intent!==null&&!(typeof charge.payment_intent==='string'&&/^pi_[A-Za-z0-9]+$/.test(charge.payment_intent)))throw new ApiError(502,'stripe_identity_invalid','Stripe決済IDの対応を確認できないため、集計を停止しました。');
      return {source_id:id,payment_intent:charge.payment_intent as string|null};
    }));verified.push(...group);
  }
  // Validate every provider result before persisting any of the relationships.
  await db.batch(verified.map(v=>({sql:`INSERT INTO business_stripe_identities (source_id,payment_intent,verified_at) VALUES (?,?,?) ON CONFLICT(source_id) DO NOTHING`,params:[v.source_id,v.payment_intent,new Date().toISOString()]})));
  return verified;
}
