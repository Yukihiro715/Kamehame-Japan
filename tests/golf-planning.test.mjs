import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true}});
after(()=>vite.close());
const {golfPlanningNotes}=await vite.ssrLoadModule('/lib/golf-planning-copy.ts');
const {golfFirstReplyTemplate}=await vite.ssrLoadModule('/lib/golf-first-reply.ts');
const {golfCustomerEmail}=await vite.ssrLoadModule('/lib/golf-customer-email.ts');
const e={kind:'guest',experience:'mt-fuji-golf-day',lang:'en',name:'Example',party:'3',areaId:'tokyo',dates:'2099-11-04 08:00',message:''};
test('planning information survives in acknowledgement notes without assuming currency conversion or transport inclusion',()=>{
 const notes=golfPlanningNotes({golf_budget:'250',golf_currency:'USD',golf_budget_transport:'separate',golf_journey:'2 hours',golf_equipment:'US men 9.5',message:'Prefer morning'});
 const mail=golfCustomerEmail('ack',{...e,message:notes});
 for(const value of ['USD 250','transport: separate','US men 9.5','Prefer morning'])assert.ok(mail.text.includes(value));
 assert.equal(golfPlanningNotes({message:'Existing enquiry'}),'Existing enquiry');
 assert.ok(golfPlanningNotes({golf_budget:'100000000',golf_currency:'TWD',golf_journey:'x'.repeat(120),golf_equipment:'x'.repeat(300),message:'x'.repeat(3000)}).length<4000);
});
test('first reply uses whole-group master fee, preserves free enquiry and limits questions',()=>{
 const r={recommendation:'Independent travel may suit your group; we will check feasible routes.',missingQuestions:['What is your total budget per golfer, including our fee, and does it include transport?']};
 const m=golfFirstReplyTemplate(e,r);
 assert.match(m.text,/¥25,000 for your whole group/);assert.match(m.text,/no payment is needed now/);assert.doesNotMatch(m.text,/book.stripe.com/);
 assert.throws(()=>golfFirstReplyTemplate(e,{...r,missingQuestions:['1','2','3','4']}));
 assert.throws(()=>golfFirstReplyTemplate({...e,party:'5'},r));
});
