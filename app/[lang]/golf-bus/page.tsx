import type {Metadata} from "next";
import {GolfpaqBook} from "@/components/site/golfpaq-book";
import {readGolfpaqSnapshot,snapshotIsFresh,firstPublicDay} from "@/lib/golfpaq";
import {SiteHeader} from "@/components/site/site-header";
import {SiteFooter} from "@/components/site/site-footer";
import {isLang} from "@/lib/i18n";
import {notFound} from "next/navigation";
export const metadata:Metadata={title:"Shared Bus Golf Tours | KAMEHAME JAPAN",description:"Shared-bus golf tours from Tokyo. Browse dates and prices for 18-hole rounds with return coach transport."};
export default async function Page({params}:{params:Promise<{lang:string}>}){
 const {lang}=await params;if(!isLang(lang))notFound();
 let snapshot=null;
 try{const {env}=await import("cloudflare:workers");snapshot=await readGolfpaqSnapshot(env.READY_STATE);}catch{}
 const tours=snapshot&&snapshotIsFresh(snapshot)?snapshot.tours.filter(t=>t.date>=firstPublicDay()&&t.date<=snapshot!.through):[];
 return <><SiteHeader variant="solid" lang={lang}/><main className="subpage" lang={lang}><GolfpaqBook lang={lang} tours={tours} updatedAt={snapshotIsFresh(snapshot)?snapshot!.updatedAt:""}/></main><SiteFooter lang={lang}/></>;
}
