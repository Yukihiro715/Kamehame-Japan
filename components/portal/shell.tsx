"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, errorText } from "./client";
import { Button, Loading, Notice } from "./ui";

export type Kind = "hotel" | "ops";
export interface HotelInfo { id: string; name: string; public_id: string; status: string; brochure_url: string | null }
export interface Me { user: { email: string; name: string | null }; memberships?: { role: string; scopeType: string; scopeId: string | null }[]; hotels?: HotelInfo[]; roles?: string[] }

interface PortalState { kind: Kind; me: Me; hotel: HotelInfo | null; setHotel: (id: string) => void; refresh: () => void }
const Ctx = createContext<PortalState | null>(null);
export const usePortal = () => { const c = useContext(Ctx); if (!c) throw new Error("usePortal outside PortalShell"); return c; };

const NAV: Record<Kind, [string, string][]> = {
  hotel: [["/hotel/", "実績"], ["/hotel/reservations/", "紹介予約"], ["/hotel/experiences/", "体験一覧"], ["/hotel/materials/", "QR・リンク"], ["/hotel/settlement/", "精算"]],
  ops: [["/ops/", "概要"], ["/ops/exceptions/", "例外"], ["/ops/reservations/", "予約"], ["/ops/partners/", "ホテル・法人"], ["/ops/policies/", "料率"], ["/ops/members/", "運営メンバー"], ["/ops/audit/", "操作履歴"], ["/ops/settings/", "設定"]],
};
const HOTEL_KEY = "kh-portal-hotel";

/** The frame around every portal page: sign-in when there is no session, the
 *  navigation, the hotel switcher, sign-out. Everything is fetched from the
 *  API; the HTML the server sends holds nothing about any hotel. */
export function PortalShell({ kind, children, title }: { kind: Kind; children: ReactNode; title?: string }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const load = useCallback(() => api<Me & { ok: boolean }>("GET", `${kind}/me`)
    .then((data) => {
      setMe(data); setError(null);
      if (kind === "hotel") {
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
    }), [kind]);
  useEffect(() => { void load(); }, [load]);
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const isLogin = path.endsWith("/login/") || path.endsWith("/login");

  if (me === undefined) return <div className="pt-root"><Loading /></div>;
  if (me === null) {
    if (error) return <div className="pt-root"><div className="pt-login"><Notice tone="bad">{error}</Notice></div></div>;
    return <div className="pt-root"><Login kind={kind} onDone={load} /></div>;
  }
  if (isLogin && typeof window !== "undefined") { window.location.replace(`/${kind}/`); return null; }
  const hotel = kind === "hotel" ? (me.hotels ?? []).find((h) => h.id === hotelId) ?? null : null;
  const setHotel = (id: string) => { setHotelId(id); try { localStorage.setItem(HOTEL_KEY, id); } catch { /* ignore */ } };
  return (
    <Ctx.Provider value={{ kind, me, hotel, setHotel, refresh: load }}>
      <div className="pt-root">
        <header className="pt-top">
          <a className="pt-brand" href={`/${kind}/`}>KAMEHAME JAPAN <span>{kind === "hotel" ? "ホテル向け" : "運営"}</span></a>
          <nav className="pt-nav" aria-label="メニュー">
            {NAV[kind].map(([href, label]) => <a key={href} href={href} className={path === href || (href !== `/${kind}/` && path.startsWith(href)) ? "on" : ""}>{label}</a>)}
          </nav>
          <div className="pt-user">
            {kind === "hotel" && (me.hotels?.length ?? 0) > 1 && (
              <select value={hotelId ?? ""} onChange={(e) => setHotel(e.target.value)} aria-label="施設を選ぶ">{me.hotels!.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
            )}
            <span className="pt-user-mail">{me.user.name ?? me.user.email}</span>
            <Button kind="link" small onClick={async () => { await api("POST", "auth/signout", { kind }); window.location.href = `/${kind}/login/`; }}>サインアウト</Button>
          </div>
        </header>
        <main className="pt-main">
          {title && <h1 className="pt-h1">{title}</h1>}
          {kind === "hotel" && !hotel ? <Notice tone="warn">閲覧できる施設がありません。KAMEHAME JAPAN にお問い合わせください。</Notice> : children}
        </main>
        <footer className="pt-foot">KAMEHAME JAPAN 紹介管理 · 株式会社プロセント · お問い合わせ hello@kamehame-japan.com</footer>
      </div>
    </Ctx.Provider>
  );
}

function Login({ kind, onDone }: { kind: Kind; onDone: () => void }) {
  const [email, setEmail] = useState(""), [code, setCode] = useState(""), [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<string | null>(null), [err, setErr] = useState<string | null>(null), [devCode, setDevCode] = useState<string | null>(null);
  const request = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r = await api<{ sent: boolean; devCode?: string; mail?: string }>("POST", "auth/request-code", { email, kind });
      setStep("code");
      setDevCode(r.devCode ?? null);
      setMsg(r.devCode ? "検証環境: メールは送らず、コードをここに表示しています。" : "登録済みのアドレスなら、6桁のコードをメールでお送りしました。届かない場合は迷惑メールもご確認ください。");
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
        <p className="pt-brand">KAMEHAME JAPAN <span>{kind === "hotel" ? "ホテル向け画面" : "運営画面"}</span></p>
        <h1>サインイン</h1>
        {step === "email" ? (
          <form onSubmit={(e) => { e.preventDefault(); void request(); }}>
            <label className="pt-field"><span className="pt-field-l">メールアドレス</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
            <p className="pt-login-note">パスワードはありません。登録されたメールアドレスに6桁のコードをお送りします。</p>
            <Button type="submit" disabled={busy || !email}>コードを送る</Button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void verify(); }}>
            {msg && <Notice tone="info">{msg}</Notice>}
            {devCode && <p className="pt-devcode">コード: <b>{devCode}</b></p>}
            <label className="pt-field"><span className="pt-field-l">6桁のコード</span><input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus /></label>
            <div className="pt-row">
              <Button type="submit" disabled={busy || code.length !== 6}>サインイン</Button>
              <Button kind="link" onClick={() => { setStep("email"); setCode(""); setErr(null); }}>アドレスを変える</Button>
            </div>
          </form>
        )}
        {err && <Notice tone="bad">{err}</Notice>}
      </div>
    </div>
  );
}
