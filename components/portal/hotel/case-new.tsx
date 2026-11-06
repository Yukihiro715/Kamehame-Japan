"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText } from "../client";
import { usePortal } from "../shell";
import { Button, Card, Field, Loading, Notice } from "../ui";
import { LANG_JA, type ExtraField } from "../case-common";

interface Option { slug: string; title: string; area: string | null; duration: string | null; group: string | null; price: string | null; bookingMode: string; extraFields: ExtraField[] }
interface Options { experiences: Option[]; members: { userId: string; email: string; name: string | null; role: string }[]; me: string }

/** Register a case (要件 5-1): the experience or a free consultation, the wishes, the customer's name and contact, the partner's own reference. */
export function HotelCaseNew() {
  const { hotel } = usePortal();
  const [opt, setOpt] = useState<Options | null>(null), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const [f, setF] = useState({ kind: "experience", experience: "", preferredDate: "", altDates: "", timePref: "", guests: "2", lang: "en", requirements: "", customerName: "", customerEmail: "", customerPhone: "", customerCountry: "", partnerRef: "", assigneeUserId: "" });
  const [extra, setExtra] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));
  useEffect(() => {
    if (!hotel) return;
    api<Options>("GET", `hotel/case-options?hotel=${hotel.id}`).then((o) => {
      setOpt(o);
      const pre = new URLSearchParams(window.location.search).get("experience");
      setF((v) => ({ ...v, experience: pre && o.experiences.some((x) => x.slug === pre) ? pre : o.experiences[0]?.slug ?? "", assigneeUserId: o.me }));
    }).catch((e) => setErr(errorText(e)));
  }, [hotel]);
  if (err && !opt) return <Notice tone="warn">{err.includes("権限") ? "この拠点では予約取り次ぎが使えないか、取り次ぎの役割が割り当てられていません。" : err}</Notice>;
  if (!opt || !hotel) return <Loading />;
  const chosen = f.kind === "experience" ? opt.experiences.find((x) => x.slug === f.experience) : null;
  const fields = chosen?.extraFields ?? [];
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ id: string }>("POST", "hotel/cases", { hotel: hotel.id, ...f, guests: f.guests ? Number(f.guests) : null, altDates: f.altDates, extra });
      window.location.href = `/hotel/cases/${r.id}/`;
    } catch (e) { setErr(errorText(e)); setBusy(false); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <Card title="ご希望の内容">
        <div className="pt-form">
          <Field label="種類"><select value={f.kind} onChange={set("kind")}><option value="experience">掲載中の体験・ツアー</option><option value="free">自由相談（内容を備考に）</option></select></Field>
          {f.kind === "experience" && <Field label="体験" hint={chosen ? [chosen.area, chosen.duration, chosen.group, chosen.price].filter(Boolean).join(" · ") : undefined}><select value={f.experience} onChange={set("experience")}>{opt.experiences.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}</select></Field>}
          <Field label="希望日"><input type="date" value={f.preferredDate} onChange={set("preferredDate")} /></Field>
          <Field label="代替日（カンマ区切り、最大5つ）"><input value={f.altDates} onChange={set("altDates")} placeholder="2026-12-11, 2026-12-12" /></Field>
          <Field label="時間帯の希望"><input value={f.timePref} onChange={set("timePref")} placeholder="午後、10時ごろ など" /></Field>
          <Field label="人数"><input type="number" min={1} max={99} value={f.guests} onChange={set("guests")} /></Field>
          <Field label="お客様の希望言語"><select value={f.lang} onChange={set("lang")}>{Object.entries(LANG_JA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <div className="pt-form-full"><Field label="希望条件・備考"><textarea value={f.requirements} onChange={set("requirements")} placeholder="食事制限、記念日、移動の都合、予算感など" /></Field></div>
          {fields.length > 0 && <div className="pt-form-full"><b className="pt-small">この商品の追加項目</b></div>}
          {fields.map((x) => (
            <Field key={x.key} label={x.label}>
              {x.type === "select" ? <select value={extra[x.key] ?? ""} onChange={(e) => setExtra((v) => ({ ...v, [x.key]: e.target.value }))}><option value="">—</option>{x.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                : <input value={extra[x.key] ?? ""} onChange={(e) => setExtra((v) => ({ ...v, [x.key]: e.target.value }))} />}
            </Field>
          ))}
        </div>
      </Card>
      <Card title="お客様と担当">
        <p className="pt-note-box">相談の段階では代表者名だけで登録できます。連絡先は予約に必要になった時点で追加してください。お客様向けの見積もりメールは、メールアドレスがある場合に運営から送れます。</p>
        <div className="pt-form">
          <Field label="お客様の代表者名（必須）"><input value={f.customerName} onChange={set("customerName")} required /></Field>
          <Field label="メールアドレス"><input type="email" value={f.customerEmail} onChange={set("customerEmail")} /></Field>
          <Field label="電話番号"><input value={f.customerPhone} onChange={set("customerPhone")} /></Field>
          <Field label="国・地域"><input value={f.customerCountry} onChange={set("customerCountry")} /></Field>
          <Field label="貴社の担当者"><select value={f.assigneeUserId} onChange={set("assigneeUserId")}>{opt.members.map((m) => <option key={m.userId} value={m.userId}>{m.name ?? m.email}</option>)}</select></Field>
          <Field label="貴社の管理番号（任意）"><input value={f.partnerRef} onChange={set("partnerRef")} /></Field>
        </div>
        {err && <Notice tone="bad">{err}</Notice>}
        <div className="pt-row"><Button type="submit" disabled={busy || !f.customerName.trim()}>{busy ? "登録中…" : "案件を登録する"}</Button><Link className="pt-btn pt-btn-link pt-btn-small" href="/hotel/cases/">一覧へ戻る</Link></div>
      </Card>
    </form>
  );
}
