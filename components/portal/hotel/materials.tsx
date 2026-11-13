"use client";

import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { label, t } from "../i18n";
import { usePortal } from "../shell";
import { Button, Card, CopyLink, Loading, Notice, Table } from "../ui";

interface Link { id: string; experience: string | null; medium: string; kind: string; label: string | null; url: string; createdAt: string }
interface Data { hotelName: string; brochureUrl: string | null; links: Link[] }

export function HotelMaterials() {
  const { hotel, me, lang } = usePortal();
  const M = t().materials, S = t().status;
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const [experience, setExperience] = useState(""), [options, setOptions] = useState<{slug:string;title:string;titleEn:string}[]>([]);
  useEffect(() => { if (hotel) api<{experiences: typeof options}>("GET", `hotel/experiences?hotel=${hotel.id}`).then(d => setOptions(d.experiences)).catch(e => setErr(errorText(e))); }, [hotel]);
  const load = useCallback(() => { if (hotel) api<Data>("GET", `hotel/materials?hotel=${hotel.id}`).then((d) => { setData(d); setErr(null); }).catch((e) => setErr(errorText(e))); }, [hotel]);
  useEffect(load, [load]);
  const ensureAll = async (slug?: string) => { if (!hotel) return; setBusy(true); try { if (me.demo) {
      const r = await api<{qr:{id:string;url:string};url:{id:string;url:string}}>("GET", `hotel/demo-material?hotel=${hotel.id}${slug ? `&experience=${encodeURIComponent(slug)}` : ""}`);
      setData(d => d ? {...d, links: [...d.links.filter(l => l.experience !== (slug || null)), ...(["qr","url"] as const).map(kind => ({id:r[kind].id,url:r[kind].url,kind,experience:slug || null,medium:"other",label:null,createdAt:new Date().toISOString()}))]} : d);
    } else { await api("POST", "hotel/materials", { hotel: hotel.id, experience: slug }); load(); } } catch (e) { setErr(errorText(e)); } finally { setBusy(false); } };
  if (err && !data) return <><Notice tone="bad">{err}</Notice><Button kind="secondary" onClick={load}>{t().common.retry}</Button></>;
  if (!data) return <Loading />;
  const general = data.links.filter((l) => !l.experience);
  const qr = general.find((l) => l.kind === "qr"), url = general.find((l) => l.kind === "url");
  const qrCell = (l: Link) => l.kind === "qr" ? <span key="q" className="pt-row"><a href={`/api/portal/hotel/qr?link=${l.id}&format=svg&download=1`} download>SVG</a><a href={`/api/portal/hotel/qr?link=${l.id}&format=png`} download>PNG</a></span> : "—";
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      <Card title={M.allTitle}>
        <p className="pt-note-box">{M.note}</p>
        {!qr ? <Button onClick={() => void ensureAll()} disabled={busy}>{M.issue}</Button> : (
          <div className="pt-grid-2">
            <div className="pt-row" style={{ alignItems: "flex-start" }}>
              <img className="pt-qr" src={`/api/portal/hotel/qr?link=${qr.id}`} alt={M.qrAlt} />
              <div>
                <b>{M.qrPrint}</b>
                <div className="pt-row" style={{ marginTop: 6 }}>
                  <a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/hotel/qr?link=${qr.id}&format=svg&download=1`} download>SVG</a>
                  <a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/hotel/qr?link=${qr.id}&format=png`} download>PNG</a>
                </div>
                <p className="pt-small pt-muted" style={{ marginTop: 6 }}>{M.qrContent}: {qr.url}</p>
              </div>
            </div>
            <div>
              <b>{M.linkCopy}</b>
              <p><a href={url?.url} target="_blank" rel="noreferrer">{url?.url}</a></p>
              {url && <CopyLink url={url.url}/>}
            </div>
          </div>
        )}
      </Card>
      <Card title={M.perTitle}>
        <p className="pt-small pt-muted">{lang === "en" ? "Select an experience and create its QR code and link here." : M.perNote}</p>
        <div className="pt-row"><label className="pt-field"><span>{lang === "en" ? "Experience" : "体験を選択"}</span><select value={experience} onChange={e => setExperience(e.target.value)}><option value="">{lang === "en" ? "Select an experience" : "体験を選んでください"}</option>{options.map(x => <option key={x.slug} value={x.slug}>{lang === "en" ? x.titleEn : x.title}</option>)}</select></label><Button disabled={busy || !experience} onClick={() => void ensureAll(experience)}>{lang === "en" ? "Create QR & link" : "この体験のQR・リンクを発行"}</Button></div>
        <Table head={M.perHead} rows={data.links.filter((l) => l.experience).map((l) => [options.find(x => x.slug === l.experience)?.[lang === "en" ? "titleEn" : "title"] ?? l.experience, l.kind === "qr" ? "QR" : M.link, <a key="u" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>, qrCell(l), jst(l.createdAt, false)])} empty={M.perEmpty} />
      </Card>
      <Card title={M.brochure}>
        <NextLink className="pt-btn pt-btn-secondary" href="/partner/brochures/">{lang === "en" ? "Create branded sales PDF" : "自社ブランド・自社価格の紹介PDFを作成"}</NextLink>
        {data.brochureUrl ? <p><a href={data.brochureUrl} target="_blank" rel="noreferrer">{M.brochureOpen}</a></p> : <p className="pt-muted">{M.brochureSoon}</p>}
      </Card>
      {data.links.filter((l) => l.medium !== "other").length > 0 && (
        <Card title={M.issuedTitle}>
          <Table head={M.issuedHead} rows={data.links.filter((l) => l.medium !== "other").map((l) => [l.label ?? "—", label(S.medium, l.medium), l.experience ?? M.allExperiences, l.kind === "qr" ? "QR" : M.link, <a key="u" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>, qrCell(l)])} />
        </Card>
      )}
    </>
  );
}
