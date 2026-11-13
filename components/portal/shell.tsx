"use client";

import Link from "next/link";
import { Fragment, createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, ClipboardList, LayoutDashboard, MapPin, Menu, QrCode, Wallet, X } from "lucide-react";
import { partnerAccess, type PartnerSite } from "./partner-access";
import { api, errorText } from "./client";
import { asPortalLang, detectPortalLang, DICT, PORTAL_LANG_NAME, PORTAL_LANGS, setPortalLang, type PortalLang } from "./i18n";
import { DEMO_EMAIL } from "@/lib/portal/demo-config";
import { Button, Loading, Notice } from "./ui";

export type Kind = "hotel" | "ops";
export interface HotelInfo extends PartnerSite { id: string; name: string; public_id: string; status: string; brochure_url: string | null }
export interface Me { demo?: boolean; user: { email: string; name: string | null; lang?: string }; memberships?: { role: string; scopeType: string; scopeId: string | null }[]; hotels?: HotelInfo[]; roles?: string[] }

interface PortalState { kind: Kind; me: Me; hotel: HotelInfo | null; setHotel: (id: string) => void; refresh: () => void; lang: PortalLang; setLang: (l: PortalLang) => void }
const Ctx = createContext<PortalState | null>(null);
export const usePortal = () => { const c = useContext(Ctx); if (!c) throw new Error("usePortal outside PortalShell"); return c; };

/** Partner navigation is labelled from the dictionary; operations stay Japanese. */
const HOTEL_NAV: [string, keyof typeof DICT.ja.nav][] = [["/hotel/", "dashboard"], ["/hotel/experiences/", "experiences"], ["/hotel/cases/", "cases"], ["/hotel/reservations/", "reservations"], ["/hotel/materials/", "materials"], ["/hotel/settlement/", "settlement"], ["/hotel/guide/", "guide"]];
const NAV: Record<Kind, [string, string][]> = {
  hotel: [],
  ops: [["/ops/", "概要"], ["/ops/exceptions/", "例外"], ["/ops/reservations/", "予約"], ["/ops/cases/", "取り次ぎ"], ["/ops/bus-tours/", "乗合ゴルフ"], ["/ops/golf-courses/", "コース名"], ["/ops/popular/", "人気体験"], ["/ops/reviews/", "レビュー素材"], ["/ops/partners/", "提携パートナー"], ["/ops/settlement/", "精算"], ["/ops/payouts/", "支払"], ["/ops/policies/", "料率"], ["/ops/members/", "運営メンバー"], ["/ops/audit/", "操作履歴"], ["/ops/settings/", "設定"]],
};
const NAV_ICONS = { dashboard: LayoutDashboard, experiences: MapPin, cases: ClipboardList, reservations: CalendarDays, materials: QrCode, settlement: Wallet, guide: BookOpen };
const HOTEL_KEY = "kh-portal-hotel";
const LANG_KEY = "kh-portal-lang";

/** The frame around every portal page: sign-in when there is no session, the
 *  navigation, the hotel switcher, sign-out. Everything is fetched from the
 *  API; the HTML the server sends holds nothing about any hotel. */
/** `titleKey` names a dictionary entry ("nav.dashboard"); server pages cannot hand a function to this client component. */
export function PortalShell({ kind, children, title, titleKey }: { kind: Kind; children: ReactNode; title?: string; titleKey?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  // Language: operations is Japanese; partners start from their stored choice or browser, then from their profile.
  const [lang, setLangState] = useState<PortalLang>("ja");
  const applyLang = useCallback((l: PortalLang) => { setPortalLang(l); setLangState(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the stored choice and the browser language exist only after mount
  useEffect(() => { if (kind === "hotel") applyLang(detectPortalLang()); else applyLang("ja"); }, [kind, applyLang]);
  const load = useCallback(() => api<Me & { ok: boolean }>("GET", `${kind}/me`)
    .then((data) => {
      setMe(data); setError(null);
      if (kind === "hotel") {
        if (!data.demo && (data.user.lang === "en" || data.user.lang === "ja")) applyLang(asPortalLang(data.user.lang));
        let stored: string | null = null;
        try { stored = localStorage.getItem(HOTEL_KEY); } catch { stored = null; }
        const hotels = data.hotels ?? [];
        setHotelId(hotels.find((h) => h.id === stored)?.id ?? hotels[0]?.id ?? null);
      }
    })
    .catch((e: unknown) => {
      const status = (e as { status?: number }).status;
      setMe(null);
      if (status !== 401) setError(errorText(e));
    }), [kind, applyLang]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronize the incoming reset link after hydration
    if (kind === "hotel" && new URLSearchParams(window.location.hash.slice(1)).has("password-token")) setMe(null);
    else void load();
  }, [load, kind]);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => document.getElementById("partner-menu-toggle")?.focus());
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const drawer = document.getElementById("partner-navigation");
    const focusables = () => Array.from(drawer?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? []);
    focusables()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); }
      if (e.key === "Tab") {
        const items = focusables(), first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); };
  }, [menuOpen, closeMenu]);
  const rootClass = kind === "hotel" ? "pt-root pt-partner" : "pt-root";
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const isLogin = path.endsWith("/login/") || path.endsWith("/login");

  if (me === undefined) return <div className={rootClass}><Loading /></div>;
  if (me === null) {
    if (error) return <div className={rootClass}><div className="pt-login"><div className="pt-login-box"><Notice tone="bad">{error}</Notice><Button onClick={() => void load()}>{lang === "en" ? "Try again" : "再読み込み"}</Button></div></div></div>;
    return <div className={rootClass} lang={lang}><Login kind={kind} onDone={load} lang={lang} onLang={applyLang} /></div>;
  }
  if (isLogin && typeof window !== "undefined") { window.location.replace(`/${kind}/`); return null; }
  const hotel = kind === "hotel" ? (me.hotels ?? []).find((h) => h.id === hotelId) ?? null : null;
  const setHotel = (id: string) => { setHotelId(id); try { localStorage.setItem(HOTEL_KEY, id); } catch { /* ignore */ } };
  // A partner's choice is saved on their profile so mails follow it too.
  const setLang = (l: PortalLang) => { applyLang(l); if (kind === "hotel" && !me.demo) void api("POST", "hotel/lang", { lang: l }).catch(() => {}); };
  const T = DICT[lang];
  const access = partnerAccess(hotel, me.memberships);
  const hotelNav = HOTEL_NAV.filter(([, key]) => key === "cases" ? access.cases : key === "materials" ? access.refer : key === "settlement" ? access.settlement : true);
  const nav: [string, string][] = kind === "hotel" ? hotelNav.map(([href, key]) => [href, T.nav[key]]) : NAV.ops;
  const active = (href: string) => path.replace(/\/$/, "") === href.replace(/\/$/, "") || (href !== `/${kind}/` && path.startsWith(href));
  const pageTitle = titleKey ? titleKey.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), T) as string | undefined : title;
  return (
    <Ctx.Provider value={{ kind, me, hotel, setHotel, refresh: load, lang, setLang }}>
      <div className={`${rootClass}${menuOpen ? " pt-menu-open" : ""}`} lang={lang}>
        {kind === "hotel" && <>
          <a className="pt-skip" href="#partner-main">{lang === "en" ? "Skip to content" : "本文へ移動"}</a>
          {menuOpen && <><button className="pt-menu-backdrop" type="button" tabIndex={-1} aria-label={lang === "en" ? "Close menu" : "メニューを閉じる"} onClick={closeMenu} />
          <aside className="pt-sidebar" id="partner-navigation" role="dialog" aria-modal="true" aria-label={lang === "en" ? "Main menu" : "メインメニュー"}>
            <button className="pt-drawer-close" type="button" onClick={closeMenu} aria-label={lang === "en" ? "Close menu" : "メニューを閉じる"}><X size={22} /></button>
            <Link className="pt-partner-brand" href="/hotel/"><span className="pt-brand-symbol">K<span>+</span></span><span>KAMEHAME<small>JAPAN / PARTNER</small></span></Link>
            <p className="pt-nav-label">{lang === "en" ? "YOUR WORKSPACE" : "パートナーワークスペース"}</p>
            <nav aria-label={lang === "en" ? "Main menu" : "メインメニュー"}>
              {hotelNav.map(([href, key]) => { const Icon = NAV_ICONS[key]; return <a key={href} href={href} onClick={closeMenu} className={active(href) ? "on" : ""} aria-current={active(href) ? "page" : undefined}><Icon size={18} aria-hidden="true"/><span>{T.nav[key]}</span></a>; })}
            </nav>
            <div className="pt-sidebar-bottom"><span>KAMEHAME JAPAN</span><p>{lang === "en" ? "Bring Japan closer to your guests." : "日本の体験を、お客様へ。"}</p><a href="mailto:hello@kamehame-japan.com">{lang === "en" ? "Contact our team" : "運営に問い合わせる"}<ArrowUpRight size={15} aria-hidden="true"/></a></div>
          </aside></>}
        </>}
        <header className="pt-top" inert={kind === "hotel" && menuOpen}>
          {kind === "hotel" && <button id="partner-menu-toggle" type="button" className="pt-menu-toggle" aria-expanded={menuOpen} aria-controls="partner-navigation" aria-label={lang === "en" ? (menuOpen ? "Close menu" : "Open menu") : (menuOpen ? "メニューを閉じる" : "メニューを開く")} onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>}
          <a className="pt-brand" href={`/${kind}/`}>KAMEHAME JAPAN <span>{kind === "hotel" ? T.brand.partner : T.brand.ops}</span></a>
          {kind === "ops" && <nav className="pt-nav" aria-label={lang === "en" ? "Menu" : "メニュー"}>
            {nav.map(([href, label]) => <a key={href} href={href} className={active(href) ? "on" : ""}>{label}</a>)}
          </nav>}
          <div className="pt-user">
            {kind === "hotel" && (me.hotels?.length ?? 0) > 1 && (
              <select value={hotelId ?? ""} onChange={(e) => setHotel(e.target.value)} aria-label={T.shell.chooseSite}>{me.hotels!.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
            )}
            {kind === "hotel" && <LangSwitch lang={lang} onChange={setLang} />}
            <span className="pt-user-mail">{me.user.name ?? me.user.email}</span>
            <Button kind="link" small onClick={async () => { await api("POST", "auth/signout", { kind }); window.location.href = `/${kind}/login/`; }}>{T.shell.signOut}</Button>
          </div>
        </header>
        <main className="pt-main" id="partner-main" tabIndex={-1} inert={kind === "hotel" && menuOpen}>
          {me.demo && <Notice tone="info">{lang === "en" ? "Demo · All figures and bookings are fictional samples. Read only." : "デモ画面：実績・予約情報は架空のサンプルです。閲覧専用で、実際の予約・精算には反映されません。"}</Notice>}
          {pageTitle && (kind === "hotel" ? <div className="pt-page-heading"><div><p className="pt-eyebrow">{hotel?.name ?? "PARTNER PORTAL"}</p><h1 className="pt-h1">{pageTitle}</h1></div><span className="pt-site-id">{hotel?.public_id}</span></div> : <h1 className="pt-h1">{pageTitle}</h1>)}
          {kind === "hotel" && !hotel ? <Notice tone="warn">{T.shell.noSite}</Notice> : <Fragment key={hotel?.id ?? kind}>{children}</Fragment>}
        </main>
        <footer className="pt-foot" inert={kind === "hotel" && menuOpen}>{T.shell.footer}</footer>
      </div>
    </Ctx.Provider>
  );
}

function LangSwitch({ lang, onChange }: { lang: PortalLang; onChange: (l: PortalLang) => void }) {
  return <select className="pt-lang" value={lang} onChange={(e) => onChange(asPortalLang(e.target.value))} aria-label={DICT[lang].shell.language}>{PORTAL_LANGS.map((l) => <option key={l} value={l}>{PORTAL_LANG_NAME[l]}</option>)}</select>;
}

function Login({ kind, onDone, lang, onLang }: { kind: Kind; onDone: () => void; lang: PortalLang; onLang: (l: PortalLang) => void }) {
  const L = DICT[lang].login;
  const [email, setEmail] = useState(""), [code, setCode] = useState(""), [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<string | null>(null), [err, setErr] = useState<string | null>(null), [devCode, setDevCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [resetMode, setResetMode] = useState(false), [resetToken, setResetToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  useEffect(() => {
    if (kind !== "hotel") return;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("password-token");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the fragment is available only in the browser
    if (token) { setResetToken(token); window.history.replaceState(null, "", window.location.pathname + window.location.search); }
  }, [kind]);
  const demoLogin = kind === "hotel" && email.trim().toLowerCase() === DEMO_EMAIL;
  const request = async () => {
    if (busy) return;
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (demoLogin && !resetMode && !resetToken) {
        await api("POST", "auth/demo-login", { email, password, kind });
        setPassword(""); onDone(); return;
      }
      if (kind === "hotel") {
        if (resetToken) {
          if (password !== confirmPassword) { setErr(lang === "en" ? "Passwords do not match." : "確認用パスワードが一致しません。"); return; }
          await api("POST", "auth/password-set", { kind, token: resetToken, password });
          setResetToken(""); setPassword(""); setConfirmPassword("");
          setMsg(lang === "en" ? "Password saved. Sign in with your email and password." : "パスワードを設定しました。メールアドレスとパスワードでログインしてください。");
        } else if (resetMode) {
          await api("POST", "auth/password-request", { kind, email });
          setMsg(lang === "en" ? "If this address is registered, a setup link will arrive by email. It expires in 30 minutes." : "登録済みのメールアドレスに設定用リンクを送信します。メールをご確認ください（有効期限30分）。");
        } else { await api("POST", "auth/password-login", { kind, email, password }); setPassword(""); onDone(); }
        return;
      }
      const r = await api<{ sent: boolean; devCode?: string; mail?: string }>("POST", "auth/request-code", { email, kind, lang });
      setStep("code");
      setDevCode(r.devCode ?? null);
      setMsg(r.devCode ? L.devNote : L.sentNote);
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setErr(null);
    try { await api("POST", "auth/verify", { email, code, kind }); onDone(); }
    catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  return (
    <div className="pt-login">
      <div className="pt-login-box">
        <div className="pt-row" style={{ justifyContent: "space-between" }}>
          <p className="pt-brand" style={{ margin: 0 }}>KAMEHAME JAPAN <span>{kind === "hotel" ? DICT[lang].brand.loginPartner : DICT[lang].brand.loginOps}</span></p>
          {kind === "hotel" && <LangSwitch lang={lang} onChange={onLang} />}
        </div>
        <h1>{resetToken ? (lang === "en" ? "Set password" : "パスワードを設定") : resetMode ? (lang === "en" ? "First-time setup / Reset" : "初回設定・パスワード再設定") : L.h}</h1>
        {step === "email" && msg && <Notice tone="info">{msg}</Notice>}
        {step === "email" ? (
          <form onSubmit={(e) => { e.preventDefault(); void request(); }}>
            {!resetToken && <label className="pt-field"><span className="pt-field-l">{L.email}</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>}
            {kind === "hotel" && !resetMode && <label className="pt-field"><span className="pt-field-l">{lang === "en" ? "Password" : "パスワード"}</span><input type="password" autoComplete={resetToken ? "new-password" : "current-password"} minLength={resetToken ? 12 : undefined} required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>}
            {resetToken && <label className="pt-field"><span className="pt-field-l">{lang === "en" ? "Confirm password" : "パスワード（確認）"}</span><input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>}
            <p className="pt-login-note">{demoLogin ? (lang === "en" ? "Sign in to the read-only partner demo." : "パートナー向けの閲覧専用デモにログインします。") : kind === "hotel" ? (lang === "en" ? (resetToken ? "Use 12–128 characters." : "Use your personal email address and password.") : (resetToken ? "12〜128文字で設定してください。" : "ご自身のメールアドレスとパスワードでログインしてください。")) : L.note}</p>
            <Button type="submit" disabled={busy}>{kind === "hotel" ? (resetToken ? (lang === "en" ? "Save password" : "パスワードを設定") : resetMode ? (lang === "en" ? "Send setup link" : "設定用リンクを送る") : L.signIn) : L.send}</Button>
            {kind === "hotel" && !resetToken && !resetMode && <Button kind="link" onClick={() => { setEmail(demoLogin ? "" : DEMO_EMAIL); setPassword(""); setErr(null); }}>{demoLogin ? (lang === "en" ? "Regular partner sign-in" : "通常のパートナーログインへ") : (lang === "en" ? "Demo sign-in" : "デモ用IDでログイン")}</Button>}
            {kind === "hotel" && <Button kind="link" onClick={() => { setResetMode(!resetMode && !resetToken); setResetToken(""); setEmail(""); setPassword(""); setErr(null); setMsg(null); }}>{resetMode || resetToken ? (lang === "en" ? "Back to sign-in" : "ログインに戻る") : (lang === "en" ? "First-time setup / Forgot password" : "初回設定・パスワードを忘れた方")}</Button>}
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void verify(); }}>
            {msg && <Notice tone="info">{msg}</Notice>}
            {devCode && <p className="pt-devcode">{L.codeLabel}: <b>{devCode}</b></p>}
            <label className="pt-field"><span className="pt-field-l">{L.code}</span><input autoComplete="one-time-code" aria-label={L.code} inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus /></label>
            <div className="pt-row">
              <Button type="submit" disabled={busy || code.length !== 6}>{L.signIn}</Button>
              <Button kind="link" onClick={() => { setStep("email"); setCode(""); setErr(null); }}>{L.changeEmail}</Button>
            </div>
          </form>
        )}
        {err && <Notice tone="bad">{err}</Notice>}
      </div>
    </div>
  );
}
