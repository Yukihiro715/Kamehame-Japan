"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, LayoutDashboard, Tags, Megaphone, Search, Package, History, Menu, X, LogOut } from "lucide-react";
import { api } from "../client";
import type { Me } from "../shell";
const business = [["overview","事業サマリー",LayoutDashboard],["bookings","案件・原価管理",BriefcaseBusiness],["masters","卸値マスター",Tags],["ads","広告パフォーマンス",Megaphone],["search","SEO・AI検索",Search],["products","商品カタログ",Package],["history","変更履歴",History]] as const;
const groups = [
 {label:"予約・手配", items:[["reservations","予約一覧"],["cases","取り次ぎ案件"],["bus-tours","乗合ゴルフ"],["exceptions","要対応"]]},
 {label:"ゴルフ場",items:[["golf-courses","ゴルフ場・料金"]]},
 {label:"提携・精算",items:[["partners","提携パートナー"],["referrals","紹介料サマリー"],["settlement","精算書"],["payouts","支払"],["policies","紹介料率"]]},
 {label:"掲載コンテンツ",items:[["popular","人気体験"],["reviews","レビュー素材"]]},
 {label:"管理・設定",items:[["settings","設定"],["members","運営メンバー"],["audit","操作履歴"],["export","CSV出力"]]},
];
const extraTitles:Record<string,string>={hotels:"拠点の詳細"};
export function OpsFrame({me, children, title}:{me:Me;children:ReactNode;title?:string}) {
 const [open,setOpen]=useState(false),[hash,setHash]=useState('overview');
 const finance=me.roles?.some(r=>r==='ops_admin'||r==='ops_finance');
 const path=usePathname()??'/ops/';
 const allowed=(key:string)=>key==='members'?!!me.isMaster:!['settings','policies'].includes(key)||!!me.roles?.includes('ops_admin');
 const visibleGroups=groups.map(g=>({...g,items:g.items.filter(([key])=>allowed(key))})).filter(g=>g.items.length);
 const routeKey=path.split('/')[2];
 const group=visibleGroups.find(g=>g.items.some(([key])=>key===routeKey));
 const home=/^\/ops\/?$/.test(path);
 useEffect(()=>{const change=()=>{setHash(window.location.hash.slice(1)||'overview');setOpen(false)};change();window.addEventListener('hashchange',change);window.addEventListener('popstate',change);return()=>{window.removeEventListener('hashchange',change);window.removeEventListener('popstate',change)}},[path]);
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const items=Array.from(document.querySelectorAll<HTMLElement>('#ops-navigation a[href],#ops-navigation button'));const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};window.addEventListener('keydown',handler);document.getElementById('ops-close')?.focus();return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',handler)}},[open]);
 const label=home?business.find(x=>x[0]===hash)?.[1]??'事業サマリー':title??group?.items.find(([key])=>key===routeKey)?.[1]??extraTitles[routeKey]??'運営管理';
 return <div className="ops-workspace"><div className="app-shell">
 {open&&<button className="ops-backdrop" aria-label="メニューを閉じる" onClick={()=>setOpen(false)}/>}
 <aside className={'sidebar '+(open?'open':'')} id="ops-navigation" aria-label="運営メニュー"><button id="ops-close" className="icon-button ops-close" onClick={()=>setOpen(false)} aria-label="メニューを閉じる"><X/></button><Link className="brand" href="/ops/" onClick={e=>{if(home&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();window.history.pushState({...window.history.state},'','#overview');window.dispatchEvent(new HashChangeEvent('hashchange'))}}}><div className="brand-mark">K<span>↗</span></div><div>KAMEHAME<small>JAPAN · BUSINESS</small></div></Link>
 <div className="workspace-label">WORKSPACE</div><nav>{finance&&business.map(([key,label,Icon])=><Link key={key} href={'/ops/#'+key} onClick={e=>{setOpen(false);if(home&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();window.history.pushState({...window.history.state},'', '#'+key);window.dispatchEvent(new HashChangeEvent('hashchange'));window.scrollTo(0,0)}}} className={home&&hash===key?'active':''} aria-current={home&&hash===key?'page':undefined}><Icon size={19}/>{label}</Link>)}<div className="workspace-label ops-nav-label">運営管理</div>{visibleGroups.map(g=><Link key={g.label} href={'/ops/'+g.items[0][0]+'/'} onClick={()=>setOpen(false)} className={group?.label===g.label?'active':''}>{g.label}</Link>)}</nav>
 <div className="sidebar-bottom"><a href="/en/" target="_blank" rel="noreferrer">公開サイトを開く<ArrowUpRight size={15}/></a></div></aside>
 <div className="main-shell" inert={open}><header className="topbar"><button className="icon-button mobile-menu" aria-label="メニューを開く" aria-expanded={open} aria-controls="ops-navigation" onClick={()=>setOpen(!open)}><Menu/></button><div className="breadcrumb">Workspace / <span>{label}</span></div><div className="top-right"><span className="user-name">{me.user.name??me.user.email}</span><button className="icon-button" aria-label="ログアウト" onClick={async()=>{await api('POST','auth/signout',{kind:'ops'});window.location.replace('/ops/login/')}}><LogOut size={18}/></button></div></header><main>{!home&&<div className="page-heading"><h1>{label}</h1></div>}{!home&&group&&group.items.length>1&&<nav className="ops-section-tabs" aria-label={group.label}>{group.items.map(([key,label])=><Link href={'/ops/'+key+'/'} key={key} aria-current={routeKey===key?'page':undefined}>{label}</Link>)}</nav>}<div className={home?undefined:"ops-page-stack"}>{children}</div></main></div>
 </div></div>;
}
