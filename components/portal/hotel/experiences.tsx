"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, pct, yen } from "../client";
import { usePortal } from "../shell";
import { Badge, Button, Card, Loading, Notice } from "../ui";

interface Term { slug: string; title: string; tagline: string; city: string; area: string; duration: string; group: string; img: string; basePrice: string; priceUnit: "person" | "group"; priceNote?: string; referable: boolean; rateBp: number | null; referenceAvgJpy: number | null; referenceNote: string | null; commissionExampleNet: number | null; policyFrom: string | null }

export function HotelExperiences() {
  const { hotel } = usePortal();
  const [rows, setRows] = useState<Term[] | null>(null), [err, setErr] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, { qr: string; url: string }>>({});
  useEffect(() => { if (hotel) api<{ experiences: Term[] }>("GET", `hotel/experiences?hotel=${hotel.id}`).then((d) => setRows(d.experiences)).catch((e) => setErr(errorText(e))); }, [hotel]);
  const getLink = async (slug: string) => {
    if (!hotel) return;
    const r = await api<{ qr: { id: string; url: string }; url: { id: string; url: string } }>("POST", "hotel/materials", { hotel: hotel.id, experience: slug });
    setLinks((l) => ({ ...l, [slug]: { qr: r.qr.url, url: r.url.url } }));
  };
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!rows) return <Loading />;
  return (
    <Card title="体験一覧と紹介条件">
      <p className="pt-note-box">基本料金は税込です。紹介料は「割引後の対象料金（税抜）× 紹介料率」で、現地払い・追加オプション・別途手配費は含みません。目安は基本料金1単位で計算したもので、実際の人数・割引で変わります。参考予約単価は実績がない間は運営の入力値です。</p>
      <div>
        {rows.map((x) => (
          <div className="pt-exp" key={x.slug}>
            <img src={x.img} alt="" loading="lazy" />
            <div>
              <b>{x.title} {x.referable ? <Badge tone="ok">紹介可</Badge> : <Badge tone="warn">紹介対象外・設定待ち</Badge>}</b>
              <div className="pt-exp-meta">{x.area} · {x.duration} · {x.group}</div>
              <div className="pt-exp-terms">
                <span>基本料金 <b>{x.basePrice}</b>{x.priceUnit === "group" ? "（税込・1組）" : "（税込・1名）"}</span>
                {x.priceNote && <span className="pt-muted">{x.priceNote}</span>}
                <span>参考予約単価 <b>{x.referenceAvgJpy ? yen(x.referenceAvgJpy) : "—"}</b>{x.referenceNote ? <span className="pt-muted">（{x.referenceNote}）</span> : null}</span>
                <span>紹介料率 <b>{x.referable ? pct(x.rateBp) : "—"}</b></span>
                <span>紹介料の目安（税抜） <b>{x.commissionExampleNet !== null ? yen(x.commissionExampleNet) : "—"}</b></span>
              </div>
              <div className="pt-row" style={{ marginTop: 6 }}>
                {links[x.slug] ? (
                  <span className="pt-small">紹介URL: <a href={links[x.slug].url} target="_blank" rel="noreferrer">{links[x.slug].url}</a> · <Link href="/hotel/materials/">QRを取得</Link></span>
                ) : <Button kind="secondary" small onClick={() => void getLink(x.slug)}>この体験の紹介リンクを取得</Button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
