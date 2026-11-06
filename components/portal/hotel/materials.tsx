"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { label, t } from "../i18n";
import { usePortal } from "../shell";
import { Button, Card, Loading, Notice, Table } from "../ui";

interface Link { id: string; experience: string | null; medium: string; kind: string; label: string | null; url: string; createdAt: string }
interface Data { hotelName: string; brochureUrl: string | null; links: Link[] }

export function HotelMaterials() {
  const { hotel } = usePortal();
  const M = t().materials, S = t().status;
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const load = () => { if (hotel) api<Data>("GET", `hotel/materials?hotel=${hotel.id}`).then(setData).catch((e) => setErr(errorText(e))); };
  useEffect(load, [hotel]); // eslint-disable-line react-hooks/exhaustive-deps
  const ensureAll = async () => { if (!hotel) return; setBusy(true); try { await api("POST", "hotel/materials", { hotel: hotel.id }); load(); } finally { setBusy(false); } };
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  const general = data.links.filter((l) => !l.experience);
  const qr = general.find((l) => l.kind === "qr"), url = general.find((l) => l.kind === "url");
  const qrCell = (l: Link) => l.kind === "qr" ? <span key="q" className="pt-row"><a href={`/api/portal/hotel/qr?link=${l.id}&format=svg&download=1`} download>SVG</a><a href={`/api/portal/hotel/qr?link=${l.id}&format=png`} download>PNG</a></span> : "—";
  return (
    <>
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
              <Button kind="secondary" small onClick={() => { if (url) void navigator.clipboard?.writeText(url.url); }}>{M.copyLink}</Button>
            </div>
          </div>
        )}
      </Card>
      <Card title={M.perTitle}>
        <p className="pt-small pt-muted">{M.perNote}</p>
        <Table head={M.perHead} rows={data.links.filter((l) => l.experience).map((l) => [l.experience, l.kind === "qr" ? "QR" : M.link, <a key="u" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>, qrCell(l), jst(l.createdAt, false)])} empty={M.perEmpty} />
      </Card>
      <Card title={M.brochure}>
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
