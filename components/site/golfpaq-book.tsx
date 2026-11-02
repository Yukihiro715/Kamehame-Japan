"use client";
import { useMemo, useState } from "react";
import type { GolfpaqTour } from "@/lib/golfpaq";
import { GOLFPAQ_RENTAL_JPY } from "@/lib/golfpaq";

const yen=(n:number)=>"¥"+n.toLocaleString("en-US");
export function GolfpaqBook({ tours, lang, updatedAt }: {tours:GolfpaqTour[];lang:string;updatedAt:string}) {
 const isPreview=typeof window!=="undefined" && window.location.hostname.includes("-staging.");
 const [date,setDate]=useState("");
 const [people,setPeople]=useState(1);
 const [chosen,setChosen]=useState<GolfpaqTour|null>(null);
 const [rentals,setRentals]=useState(0);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [note,setNote]=useState("");
 const [agreed,setAgreed]=useState(false);
 const [status,setStatus]=useState<"idle"|"sending"|"sent"|"error">("idle");
 const [error,setError]=useState("");
 const filtered=useMemo(()=>tours.filter(t=>(!date||t.date===date)&&t.seats>=people),[tours,date,people]);
 const total=chosen ? chosen.perPersonYen*people+rentals*GOLFPAQ_RENTAL_JPY:0;
 async function submit(e:React.FormEvent) {
  e.preventDefault();if(isPreview||!chosen||!agreed)return;setStatus("sending");setError("");
  try{
   const r=await fetch("/api/golfpaq/enquiry",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:chosen.id,date:chosen.date,people,rentals,name,email,note,lang,consent:agreed,requestId:crypto.randomUUID()})});
   const j=await r.json() as {ok?:boolean;error?:string};
   if(!r.ok||!j.ok)throw Error(j.error||"We could not receive your enquiry.");
   setStatus("sent");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.");setStatus("error")}
 }
 return <div style={{maxWidth:1100,margin:"auto",padding:"30px 20px 70px"}}>
  <p style={{textTransform:"uppercase",letterSpacing:3,fontSize:12,color:"#888"}}>KAMEHAME JAPAN · GOLF</p>
  <h1 style={{fontFamily:"serif",fontSize:"clamp(32px,5vw,54px)",margin:"12px 0"}}>Shared Bus Golf Tours</h1>
  {isPreview?<p role="status" style={{padding:12,background:"#f9efe6",fontWeight:600}}>Design preview — requests and payments are disabled</p>:null}
  <p>Play 18 holes with round-trip shared coach transport from Tokyo. Suitable for solo golfers and pairs. Your party may be paired with other golfers. No private English-speaking guide or hotel pickup is included.</p>
  <p style={{marginTop:8,color:"#555"}}><strong>From ¥29,000+/person</strong> · Includes our ¥15,000/person arrangement fee · Club rental ¥5,500/person when selected</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"25px 0"}}>
   <label>Playing date <select value={date} onChange={e=>{setDate(e.target.value);setChosen(null)}} style={{padding:12,display:"block",minWidth:180}}><option value="">All dates</option>{[...new Set(tours.map(t=>t.date))].map(d=><option key={d}>{d}</option>)}</select></label>
   <label>Golfers <select value={people} onChange={e=>{setPeople(Number(e.target.value));setChosen(null);setRentals(0)}} style={{padding:12,display:"block"}}>{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
  </div>
  <p style={{fontSize:13,color:"#777"}}>Availability is indicative, last updated {updatedAt ? new Date(updatedAt).toLocaleString("en-US",{timeZone:"Asia/Tokyo"})+" JST":"unavailable"}. Seats and prices are reconfirmed before the booking is final.</p>
  {tours.length===0?<div style={{padding:24,background:"#f6f5f1"}}>The live schedule is temporarily unavailable. Please <a href={`/${lang}/contact/`}>contact us</a> for upcoming tours.</div>:null}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,margin:"22px 0"}}>
   {filtered.map(t=><article key={t.id} style={{border:"1px solid #ddd",padding:20,background:chosen?.id===t.id?"#f5f6f0":"white"}}>
    {t.imageUrl?<img src={t.imageUrl} alt={t.course} style={{width:"100%",height:155,objectFit:"cover",marginBottom:12}} loading="lazy" referrerPolicy="no-referrer"/>:null}
    <strong>{t.course}</strong><p>{t.date} · 18-hole self-play</p><p style={{fontSize:13}}>{t.pickup}</p>
    <p style={{fontSize:23,fontWeight:700,margin:"10px 0"}}>{yen(t.perPersonYen)} <span style={{fontSize:13,fontWeight:400}}>/person</span></p>
    <p style={{fontSize:13}}>{t.seats} seats shown · Includes shared coach transport</p>
    <button type="button" onClick={()=>{setChosen(t);setStatus("idle");setRentals(0);document.getElementById("golfpaq-request")?.scrollIntoView({behavior:"smooth"})}} style={{padding:"10px 22px",background:"#1d3426",color:"white",border:0,cursor:"pointer"}}>Request this tour</button>
   </article>)}
  </div>
  {tours.length>0&&filtered.length===0?<p>No matching seats. Try another date or number of golfers.</p>:null}
  {chosen?<section id="golfpaq-request" style={{background:"#f6f5f1",padding:"26px",marginTop:35}}>
   <h2>Request your tour</h2><p><strong>{chosen.course}</strong> · {chosen.date} · {people} golfer(s)</p>
   {status==="sent"?<p role="status">Thank you. We have received your request. A payment link will be sent only if the arrangements can proceed. Your booking is not confirmed yet.</p>:
   <form onSubmit={submit} style={{display:"grid",gap:14,maxWidth:600}}>
    <label>Club rental (¥5,500 per person) <select value={rentals} onChange={e=>setRentals(Number(e.target.value))} style={{display:"block",padding:10,width:"100%"}}>{Array.from({length:people+1},(_,i)=><option key={i} value={i}>{i} golfer(s)</option>)}</select></label>
    <p style={{fontSize:21,fontWeight:700}}>Estimated total: {yen(total)}</p>
    <label>Your name <input required value={name} onChange={e=>setName(e.target.value)} maxLength={120} style={{display:"block",width:"100%",padding:10}} /></label>
    <label>Email <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={200} style={{display:"block",width:"100%",padding:10}} /></label>
    <label>Rental needs, phone number or other notes (optional)<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1000} style={{display:"block",width:"100%",padding:10}} /></label>
    <label><input type="checkbox" required checked={agreed} onChange={e=>setAgreed(e.target.checked)}/> I understand that availability is not guaranteed, payment will be requested separately, and cancellation terms will be provided before payment.</label>
    <button disabled={isPreview||status==="sending"} type="submit" style={{padding:14,background:"#1d3426",color:"#fff",border:0}}>{status==="sending"?"Sending…":"Send request"}</button>
    {error?<p role="alert">{error}</p>:null}
   </form>}
  </section>:null}
  <div style={{marginTop:35}}><a href={`/${lang}/tokyo/mt-fuji-golf-day/`}>Prefer a specific course, tee time, or private transfer? Explore custom golf arrangements →</a></div>
 </div>
}
