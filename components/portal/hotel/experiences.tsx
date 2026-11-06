"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, pct, yen } from "../client";
import { label, portalLang, t } from "../i18n";
import { usePortal } from "../shell";
import { Badge, Button, Card, Loading, Notice } from "../ui";

interface Term { bookingMode: "instant" | "request" | "quote"; slug: string; title: string; titleEn: string; tagline: string; city: string; area: string; areaEn: string; duration: string; durationEn: string; group: string; groupEn: string; img: string; basePrice: string; priceUnit: "person" | "group"; priceNote?: string; referable: boolean; rateBp: number | null; referenceAvgJpy: number | null; referenceNote: string | null; commissionExampleNet: number | null; policyFrom: string | null }

export function HotelExperiences() {
  const { hotel } = usePortal();
  const X = t().experiences, S = t().status, en = portalLang() === "en";
  const [rows, setRows] = useState<Term[] | null>(null), [err, setErr] = useState<string | null>(null), [relay, setRelay] = useState(false);
  const [links, setLinks] = useState<Record<string, { qr: string; url: string }>>({});
  useEffect(() => { if (hotel) api<{ experiences: Term[]; relay: boolean }>("GET", `hotel/experiences?hotel=${hotel.id}`).then((d) => { setRows(d.experiences); setRelay(d.relay); }).catch((e) => setErr(errorText(e))); }, [hotel]);
  const getLink = async (slug: string) => {
    if (!hotel) return;
    const r = await api<{ qr: { id: string; url: string }; url: { id: string; url: string } }>("POST", "hotel/materials", { hotel: hotel.id, experience: slug });
    setLinks((l) => ({ ...l, [slug]: { qr: r.qr.url, url: r.url.url } }));
  };
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!rows) return <Loading />;
  return (
    <Card title={X.title}>
      <p className="pt-note-box">{X.note}</p>
      <div>
        {rows.map((x) => (
          <div className="pt-exp" key={x.slug}>
            <img src={x.img} alt="" loading="lazy" />
            <div>
              <b>{en ? x.titleEn : x.title} {x.referable ? <Badge tone="ok">{X.referable}</Badge> : <Badge tone="warn">{X.notReferable}</Badge>} <Badge tone={x.bookingMode === "instant" ? "ok" : x.bookingMode === "quote" ? "info" : "neutral"}>{label(S.bookingModeTag, x.bookingMode)}</Badge></b>
              <div className="pt-exp-meta">{en ? x.areaEn : x.area} · {en ? x.durationEn : x.duration} · {en ? x.groupEn : x.group}</div>
              <div className="pt-exp-terms">
                <span>{X.basePrice} <b>{x.basePrice}</b>{x.priceUnit === "group" ? X.perGroup : X.perPerson}</span>
                {x.priceNote && !en && <span className="pt-muted">{x.priceNote}</span>}
                <span>{X.refAvg} <b>{x.referenceAvgJpy ? yen(x.referenceAvgJpy) : "—"}</b>{x.referenceNote && !en ? <span className="pt-muted">（{x.referenceNote}）</span> : null}</span>
                <span>{X.rate} <b>{x.referable ? pct(x.rateBp) : "—"}</b></span>
                <span>{X.example} <b>{x.commissionExampleNet !== null ? yen(x.commissionExampleNet) : "—"}</b></span>
              </div>
              <div className="pt-row" style={{ marginTop: 6 }}>
                {links[x.slug] ? (
                  <span className="pt-small">{X.linkUrl}: <a href={links[x.slug].url} target="_blank" rel="noreferrer">{links[x.slug].url}</a> · <Link href="/hotel/materials/">{X.getQr}</Link></span>
                ) : <Button kind="secondary" small onClick={() => void getLink(x.slug)}>{X.getLink}</Button>}
                {relay && <Link className="pt-btn pt-btn-primary pt-btn-small" href={`/hotel/cases/new/?experience=${x.slug}`}>{label(S.bookingMode, x.bookingMode)}</Link>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
