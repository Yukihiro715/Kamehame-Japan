"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, errorText } from "./client";
import { asPortalLang, detectPortalLang, DICT, PORTAL_LANG_NAME, PORTAL_LANGS, setPortalLang, type PortalLang } from "./i18n";
import { Button, Loading, Notice } from "./ui";

export type Kind = "hotel" | "ops";
export interface HotelInfo { id: string; name: string; public_id: string; status: string; brochure_url: string | null }
export interface Me { user: { email: string; name: string | null; lang?: string }; memberships?: { role: string; scopeType: string; scopeId: string | null }[]; hotels?: HotelInfo[]; roles?: string[] }

interface PortalState { kind: Kind; me: Me; hotel: HotelInfo | null; setHotel: (id: string) => void; refresh: () => void; lang: PortalLang; setLang: (l: PortalLang) => void }
const Ctx = createContext<PortalState | null>(null);
export const usePortal = () => { const c = useContext(Ctx); if (!c) throw new Error("usePortal outside PortalShell"); return c; };

/** Partner navigation is labelled from the dictionary; operations stay Japanese. */
const HOTEL_NAV: [string, keyof typeof DICT.ja.nav][] = [["/hotel/", "dashboard"], ["/hotel/reservations/", "reservations"], ["/hotel/cases/", "cases"], ["/hotel/experiences/", "experiences"], ["/hotel/materials/", "materials"], ["/hotel/settlement/", "settlement"], ["/hotel/guide/", "guide"]];
const NAV: Record<Kind, [string, string][]> = {
  hotel: [],
  ops: [["/ops/", "概要"], ["/ops/exceptions/", "例外"], ["/ops/reservations/", "予約"], ["/ops/cases/", "取り次ぎ"], ["/ops/bus-tours/", "乗合ゴルフ"], ["/ops/golf-courses/", "コース名"], ["/ops/popular/", "人気体験"], ["/ops/reviews/", "レビュー素材"], ["/ops/partners/", "提携パートナー"], ["/ops/settlement/", "精算"], ["/ops/payouts/", "支払"], ["/ops/policies/", "料率"], ["/ops/members/", "運営メンバー"], ["/ops/audit/", "操作履歴"], ["/ops/settings/", "設定"]],
};
const HOTEL_KEY = "kh-portal-hotel";
const LANG_KEY = "kh-portal-lang";

/** The frame around every portal page: sign-in when there is no session, the
 *  navigation, the hotel switcher, sign-out. Everything is fetched from the
 *  API; the HTML the server sends holds nothing about any hotel. */
/** `titleKey` names a dictionary entry ("nav.dashboard"); server pages cannot hand a function to this client component. */
export function PortalShell({ kind, children, title, titleKey }: { kind: Kind; children: ReactNode; title?: string; titleKey?: string }) {
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
        if (data.user.lang === "en" || data.user.lang === "ja") applyLang(asPortalLang(data.user.lang));
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
  useEffect(() => { void load(); }, [load]);
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const isLogin = path.endsWith("/login/") || path.endsWith("/login");

  if (me === undefined) return <div className="pt-root"><Loading /></div>;
  if (me === null) {
    if (error) return <div className="pt-root"><div className="pt-login"><Notice tone="bad">{error}</Notice></div></div>;
    return <div className="pt-root" lang={lang}><Login kind={kind} onDone={load} lang={lang} onLang={applyLang} /></div>;
  }
  if (isLogin && typeof window !== "undefined") { window.location.replace(`/${kind}/`); return null; }
  const hotel = kind === "hotel" ? (me.hotels ?? []).find((h) => h.id === hotelId) ?? null : null;
  const setHotel = (id: string) => { setHotelId(id); try { localStorage.setItem(HOTEL_KEY, id); } catch { /* ignore */ } };
  // A partner's choice is saved on their profile so mails follow it too.
  const setLang = (l: PortalLang) => { applyLang(l); if (kind === "hotel") void api("POST", "hotel/lang", { lang: l }).catch(() => {}); };
  const T = DICT[lang];
  const nav: [string, string][] = kind === "hotel" ? HOTEL_NAV.map(([href, key]) => [href, T.nav[key]]) : NAV.ops;
  const pageTitle = titleKey ? titleKey.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), T) as string | undefined : title;
  return (
    <Ctx.Provider value={{ kind, me, hotel, setHotel, refresh: load, lang, setLang }}>
      <div className="pt-root" lang={lang}>
        <header className="pt-top">
          <a className="pt-brand" href={`/${kind}/`}>KAMEHAME JAPAN <span>{kind === "hotel" ? T.brand.partner : T.brand.ops}</span></a>
          <nav className="pt-nav" aria-label={lang === "en" ? "Menu" : "メニュー"}>
            {nav.map(([href, label]) => <a key={href} href={href} className={path === href || (href !== `/${kind}/` && path.startsWith(href)) ? "on" : ""}>{label}</a>)}
          </nav>
          <div className="pt-user">
            {kind === "hotel" && (me.hotels?.length ?? 0) > 1 && (
              <select value={hotelId ?? ""} onChange={(e) => setHotel(e.target.value)} aria-label={T.shell.chooseSite}>{me.hotels!.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
            )}
            {kind === "hotel" && <LangSwitch lang={lang} onChange={setLang} />}
            <span className="pt-user-mail">{me.user.name ?? me.user.email}</span>
            <Button kind="link" small onClick={async () => { await api("POST", "auth/signout", { kind }); window.location.href = `/${kind}/login/`; }}>{T.shell.signOut}</Button>
          </div>
        </header>
        <main className="pt-main">
          {pageTitle && <h1 className="pt-h1">{pageTitle}</h1>}
          {kind === "hotel" && !hotel ? <Notice tone="warn">{T.shell.noSite}</Notice> : children}
        </main>
        <footer className="pt-foot">{T.shell.footer}</footer>
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
  const request = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
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
        <h1>{L.h}</h1>
        {step === "email" ? (
          <form onSubmit={(e) => { e.preventDefault(); void request(); }}>
            <label className="pt-field"><span className="pt-field-l">{L.email}</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
            <p className="pt-login-note">{L.note}</p>
            <Button type="submit" disabled={busy || !email}>{L.send}</Button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void verify(); }}>
            {msg && <Notice tone="info">{msg}</Notice>}
            {devCode && <p className="pt-devcode">{L.codeLabel}: <b>{devCode}</b></p>}
            <label className="pt-field"><span className="pt-field-l">{L.code}</span><input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus /></label>
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
