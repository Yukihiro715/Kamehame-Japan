export type Cost = {id:string; label:string; supplier:string; unit:number|null; qty:number; status:'confirmed'|'estimate'|'unknown'; payer:'company'|'customer'; paid:boolean; source:string; note:string};
export type Booking = {id:string; reservationId?:string; requestId?:string; externalRef?:string; name:string; product:string; date:string; people:number|null; status:string; sales:number|null; received:number|null; fee:number|null; paymentDate:string; stripeSource:string; costs:Cost[]; complete:boolean; note:string; revision?:number};
export type Master = {id:string; name:string; supplier:string; category:string; price:number|null; unit:string; status:'confirmed'|'estimate'|'unknown'; source:string; note:string; autoCost?:{slug:string;from:string;through:string;quantity:"person"|"booking"}; revision?:number};
export const statusLabel={confirmed:'確定',estimate:'見込',unknown:'未確認'};
export function costTotal(b:Booking){return b.costs.filter(c=>c.payer==='company').reduce((s,c)=>s+(c.unit??0)*c.qty,0)}
export function uncertain(b:Booking){return !b.complete||b.costs.some(c=>c.payer==='company'&&(c.status!=='confirmed'||c.unit===null))}
export function yen(n:number|null|undefined){return n==null?'—':new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(n)}
