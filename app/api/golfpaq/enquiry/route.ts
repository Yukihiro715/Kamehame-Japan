import {firstPublicDay,lastPublishedDay,readGolfpaqSnapshot,snapshotIsFresh,GOLFPAQ_RENTAL_JPY} from "@/lib/golfpaq";
import {notifySlack} from "@/lib/slack";
const REPLY="hello@kamehame-japan.com";
const headers={"cache-control":"no-store"};
function clean(x:unknown,n:number){return typeof x==="string"?x.trim().slice(0,n):""}
export async function POST(req:Request){
 if(req.headers.get("origin")!==new URL(req.url).origin)return Response.json({ok:false,error:"origin"},{status:403,headers});
 if(!req.headers.get("content-type")?.startsWith("application/json"))return Response.json({ok:false,error:"content_type"},{status:415,headers});
 const bodyText=await req.text();if(bodyText.length>8000)return Response.json({ok:false},{status:413,headers});
 let b:Record<string,unknown>;
 try{b=JSON.parse(bodyText)}catch{return Response.json({ok:false,error:"invalid"},{status:400,headers})}
 const id=clean(b.id,80),date=clean(b.date,12),name=clean(b.name,120),email=clean(b.email,200),note=clean(b.note,1000);
 const people=Number(b.people),rentals=Number(b.rentals);
 if(!/^\d+-\d+-\d+$/.test(id)||!/\d{4}-\d{2}-\d{2}/.test(date)||date<firstPublicDay()||date>lastPublishedDay()||!Number.isInteger(people)||people<1||people>4||!Number.isInteger(rentals)||rentals<0||rentals>people||!name||!/^\S+@\S+\.\S+$/.test(email)||b.consent!==true)return Response.json({ok:false,error:"invalid"},{status:400,headers});
 let env;
 try{({env}=await import("cloudflare:workers"))}catch{return Response.json({ok:false,error:"unavailable"},{status:503,headers})}
 const snapshot=await readGolfpaqSnapshot(env.READY_STATE);
 if(!snapshotIsFresh(snapshot))return Response.json({ok:false,error:"availability_unavailable"},{status:503,headers});
 const tour=snapshot!.tours.find(t=>t.id===id&&t.date===date&&t.seats>=people);
 if(!tour)return Response.json({ok:false,error:"availability_changed"},{status:409,headers});
 if(!env.RESEND_API_KEY||!env.CONTACT_TO)return Response.json({ok:false,error:"mail_unavailable"},{status:503,headers});
 const amount=tour.perPersonYen*people+GOLFPAQ_RENTAL_JPY*rentals;
 const reference="GP-"+crypto.randomUUID();
 const detail=[`Ref: ${reference}`,`Tour: ${tour.course} / ${tour.date}`,`Source: ${tour.detailUrl}`,`Party: ${people}, rentals: ${rentals}`,`Per person: JPY ${tour.perPersonYen}`,`Quoted total: JPY ${amount}`,`Remaining shown: ${tour.seats}`,`Name: ${name}`,`Email: ${email}`,`Notes: ${note}`].join("\n");
 const res=await fetch("https://api.resend.com/emails/batch",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+env.RESEND_API_KEY},body:JSON.stringify([
 {from:`KAMEHAME JAPAN <${REPLY}>`,to:[env.CONTACT_TO],reply_to:email,subject:`[GOLFPAQ] ${date} ${tour.course} - ${reference}`,text:detail},
 {from:`KAMEHAME JAPAN <${REPLY}>`,to:[email],reply_to:REPLY,subject:"Your shared bus golf tour request | KAMEHAME JAPAN",text:`Thank you for your request.\n\n${tour.course} — ${date}\n${people} golfer(s), ${rentals} club rental(s)\nEstimated total: JPY ${amount.toLocaleString("en-US")}\n\nThis is a request, not a confirmed booking. We will send a secure payment link separately if your request can proceed. Your places are not reserved until the booking is confirmed. Cancellation terms will be shared before payment.\n\nKAMEHAME JAPAN\n${REPLY}`}
 ])});
 if(!res.ok){console.error("golfpaq enquiry mail failed",res.status);return Response.json({ok:false,error:"mail_unavailable"},{status:502,headers})}
 try{await notifySlack(env.SLACK_WEBHOOK_URL,`[GOLFPAQ request] ${date} ${tour.course} | ${people} players | ${amount} JPY | ${reference}`)}catch{}
 return Response.json({ok:true,reference},{headers});
}
