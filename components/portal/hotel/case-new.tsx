"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText } from "../client";
import { portalLang, t } from "../i18n";
import { usePortal } from "../shell";
import { Button, Card, Field, Loading, Notice } from "../ui";
import { extraLabel, optionLabel, type ExtraField } from "../case-common";

interface Option { slug: string; title: string; titleEn: string; area: string | null; duration: string | null; group: string | null; price: string | null; bookingMode: string; extraFields: ExtraField[] }
interface Options { experiences: Option[]; members: { userId: string; email: string; name: string | null; role: string }[]; me: string }

/** Register a case (要件 5-1): the experience or a free consultation, the wishes, the customer's name and contact, the partner's own reference. */
export function HotelCaseNew() {
  const { hotel, me } = usePortal();
  const K = t().cases, S = t().status, en = portalLang() === "en";
  const [opt, setOpt] = useState<Options | null>(null), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false), [denied, setDenied] = useState(false);
  const [f, setF] = useState({ kind: "experience", experience: "", preferredDate: "", altDates: "", timePref: "", guests: "2", lang: "en", requirements: "", customerName: "", customerEmail: "", customerPhone: "", customerCountry: "", partnerRef: "", assigneeUserId: "" });
  const [extra, setExtra] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [k]: e.target.value }));
  useEffect(() => {
    if (!hotel) return;
    api<Options>("GET", `hotel/case-options?hotel=${hotel.id}`).then((o) => {
      setOpt(o);
      const pre = new URLSearchParams(window.location.search).get("experience");
      setF((v) => ({ ...v, experience: pre && o.experiences.some((x) => x.slug === pre) ? pre : "", assigneeUserId: o.me }));
    }).catch((e) => { if ((e as { status?: number }).status === 403) setDenied(true); else setErr(errorText(e)); });
  }, [hotel]);
  if (denied) return <Notice tone="warn">{K.noAccess}</Notice>;
  if (err && !opt) return <Notice tone="bad">{err}</Notice>;
  if (!opt || !hotel) return <Loading />;
  const chosen = f.kind === "experience" ? opt.experiences.find((x) => x.slug === f.experience) : null;
  const fields = chosen?.extraFields ?? [];
  const submit = async () => {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const r = await api<{ id: string }>("POST", "hotel/cases", { hotel: hotel.id, ...f, guests: f.guests ? Number(f.guests) : null, altDates: f.altDates, extra });
      window.location.href = `/partner/cases/${r.id}/`;
    } catch (e) { setErr(errorText(e)); setBusy(false); }
  };
  return (
    <form className="pt-request-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <p className="pt-page-description">{en ? "Tell us what your guest would like. We will check availability and prepare a quote. This request does not confirm a booking." : "お客様のご希望をお知らせください。運営が空き確認と見積もりを行います。この登録だけで予約は確定しません。"}</p><Card title={`01 / ${K.wishes}`}>
        <div className="pt-form">
          <Field label={K.kind}><select value={f.kind} onChange={(e) => { set("kind")(e); setExtra({}); }}><option value="experience">{K.kindExperience}</option><option value="free">{K.kindFree}</option></select></Field>
          {f.kind === "experience" && <Field label={K.experience} hint={chosen ? [chosen.area, chosen.duration, chosen.group, chosen.price].filter(Boolean).join(" · ") : undefined}><select required value={f.experience} onChange={(e) => { set("experience")(e); setExtra({}); }}><option value="">{en ? "Select an experience" : "体験を選択してください"}</option>{opt.experiences.map((x) => <option key={x.slug} value={x.slug}>{en ? x.titleEn : x.title}</option>)}</select></Field>}
          <Field label={K.date}><input type="date" value={f.preferredDate} onChange={set("preferredDate")} /></Field>
          <Field label={K.altDates}><input value={f.altDates} onChange={set("altDates")} placeholder="2026-12-11, 2026-12-12" /></Field>
          <Field label={K.timePref}><input value={f.timePref} onChange={set("timePref")} placeholder={K.timePh} /></Field>
          <Field label={K.guests}><input type="number" min={1} max={99} value={f.guests} onChange={set("guests")} /></Field>
          <Field label={K.lang}><select value={f.lang} onChange={set("lang")}>{Object.entries(S.lang).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <div className="pt-form-full"><Field label={K.requirements}><textarea value={f.requirements} onChange={set("requirements")} placeholder={K.requirementsPh} /></Field></div>
          {fields.length > 0 && <div className="pt-form-full"><b className="pt-small">{K.extraH}</b></div>}
          {fields.map((x) => (
            <Field key={x.key} label={extraLabel(x)}>
              {x.type === "select" ? <select value={extra[x.key] ?? ""} onChange={(e) => setExtra((v) => ({ ...v, [x.key]: e.target.value }))}><option value="">—</option>{x.options?.map((o) => <option key={o.value} value={o.value}>{optionLabel(o)}</option>)}</select>
                : <input value={extra[x.key] ?? ""} onChange={(e) => setExtra((v) => ({ ...v, [x.key]: e.target.value }))} />}
            </Field>
          ))}
        </div>
      </Card>
      <Card title={`02 / ${K.customerH}`}>
        <p className="pt-note-box">{K.customerNote}</p>
        <div className="pt-form">
          <Field label={K.customerName}><input value={f.customerName} onChange={set("customerName")} required /></Field>
          <Field label={K.email}><input type="email" value={f.customerEmail} onChange={set("customerEmail")} /></Field>
          <Field label={K.phone}><input type="tel" autoComplete="off" value={f.customerPhone} onChange={set("customerPhone")} /></Field>
          <Field label={K.country}><input value={f.customerCountry} onChange={set("customerCountry")} /></Field>
          <Field label={K.assignee}><select value={f.assigneeUserId} onChange={set("assigneeUserId")}>{opt.members.map((m) => <option key={m.userId} value={m.userId}>{m.name ?? m.email}</option>)}</select></Field>
          <Field label={K.partnerRef}><input value={f.partnerRef} onChange={set("partnerRef")} /></Field>
        </div>
        {err && <Notice tone="bad">{err}</Notice>}
        <div className="pt-row"><Button type="submit" disabled={me.demo || busy || !f.customerName.trim() || (f.kind === "experience" && !f.experience)}>{busy ? K.submitting : K.submit}</Button><Link className="pt-btn pt-btn-link pt-btn-small" href="/partner/cases/">{K.backToList}</Link></div>
      </Card>
    </form>
  );
}
