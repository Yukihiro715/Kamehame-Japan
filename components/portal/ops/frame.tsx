"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, LayoutDashboard, Tags, Megaphone, Search, Package, History, Menu, X, LogOut } from "lucide-react";
import { api } from "../client";
import type { Me } from "../shell";
const business = [["overview","事業サマリー",LayoutDashboard],["bookings","案件・原価管理",BriefcaseBusiness],["masters","卸値マスター",Tags],["ads","広告パフォーマンス",Megaphone],["search","SEO・AI検索",Search],["products","商品カタログ",Package],["history","変更履歴",History]] as const;
const operations = [["reservations","予約管理"],["cases","取り次ぎ案件"],["referrals","紹介料サマリー"],["exceptions","要対応"],["bus-tours","乗合ゴルフ"],["golf-courses","ゴルフ場"],["popular","人気体験"],["reviews","レビュー素材"],["partners","提携パートナー"],["settlement","精算"],["payouts","支払"],["policies","紹介料率"],["members","運営メンバー"],["audit","操作履歴"],["settings","設定"]];
export function OpsFrame({me, children, title}:{me:Me;children:ReactNode;title?:string}) {
 const [open,setOpen]=useState(false),[hash,setHash]=useState('overview');
 const finance=me.roles?.some(r=>r==='ops_admin'||r==='ops_finance');
 const path=typeof window==='undefined'?'':window.location.pathname;
 const home=/^\/ops\/?$/.test(path);
 useEffect(()=>{const change=()=>{setHash(window.location.hash.slice(1)||'overview');setOpen(false)};change();window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change)},[]);
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const items=Array.from(document.querySelectorAll<HTMLElement>('#ops-navigation a[href],#ops-navigation button'));const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};window.addEventListener('keydown',handler);document.getElementById('ops-close')?.focus();return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',handler)}},[open]);
 const label=home?business.find(x=>x[0]===hash)?.[1]??'事業サマリー':title??'運営管理';
 return <div className="ops-workspace"><div className="app-shell">
 {open&&<button className="ops-backdrop" aria-label="メニューを閉じる" onClick={()=>setOpen(false)}/>}
 <aside className={'sidebar '+(open?'open':'')} id="ops-navigation" aria-label="運営メニュー"><button id="ops-close" className="icon-button ops-close" onClick={()=>setOpen(false)} aria-label="メニューを閉じる"><X/></button><Link className="brand" href="/ops/"><div className="brand-mark">K<span>↗</span></div><div>KAMEHAME<small>JAPAN · BUSINESS</small></div></Link>
 <div className="workspace-label">WORKSPACE</div><nav>{finance&&business.map(([key,label,Icon])=><a key={key} href={'/ops/#'+key} onClick={()=>setOpen(false)} className={home&&hash===key?'active':''} aria-current={home&&hash===key?'page':undefined}><Icon size={19}/>{label}</a>)}<div className="workspace-label ops-nav-label">運営管理</div>{operations.filter(([key])=>!['members','settings','policies'].includes(key)||me.roles?.includes('ops_admin')).map(([key,label])=><a key={key} href={'/ops/'+key+'/'} className={path.startsWith('/ops/'+key+'/')?'active':''}>{label}</a>)}</nav>
 <div className="sidebar-bottom"><a href="/en/" target="_blank" rel="noreferrer">公開サイトを開く<ArrowUpRight size={15}/></a></div></aside>
 <div className="main-shell" inert={open}><header className="topbar"><button className="icon-button mobile-menu" aria-label="メニューを開く" aria-expanded={open} aria-controls="ops-navigation" onClick={()=>setOpen(!open)}><Menu/></button><div className="breadcrumb">Workspace / <span>{label}</span></div><div className="top-right"><span className="user-name">{me.user.name??me.user.email}</span><button className="icon-button" aria-label="ログアウト" onClick={async()=>{await api('POST','auth/signout',{kind:'ops'});window.location.replace('/ops/login/')}}><LogOut size={18}/></button></div></header><main>{!home&&<div className="page-heading"><h1>{label}</h1></div>}{children}</main></div>
 </div></div>;
}
