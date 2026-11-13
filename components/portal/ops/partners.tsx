"use client";

import { useEffect, useState } from "react";
import { api, errorText } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, Table } from "../ui";
import { ENTITY_KIND_JA, FEATURE_JA, FEATURE_KEYS, PARTNER_TYPE_JA, SITE_KIND_JA, type Features } from "@/lib/portal/partner";

interface Entity { id: string; name: string; registration_status: string; registration_number: string | null; partner_type: string; entity_kind: string; contact_email: string | null }
interface Hotel { id: string; legal_entity_id: string; public_id: string; name: string; status: string; site_kind: string; features: Features; referrals: number; profileId: string | null }
interface Profile { id: string; legal_entity_id: string; name: string; valid_from: string; valid_to: string | null; min_payout_jpy: number; hotelIds: string[] }
interface Data { entities: Entity[]; hotels: Hotel[]; profiles: Profile[] }

const STATUS: Record<string, [string, "ok" | "warn" | "bad"]> = { active: ["提携中", "ok"], suspended: ["一時停止", "warn"], terminated: ["提携終了", "bad"] };

export function OpsPartners() {
  const [bank, setBank] = useState<{name:string;value:string}|null>(null);
  const [d, setD] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [le, setLe] = useState({ name: "", address: "", registrationNumber: "", partnerType: "hotel", entityKind: "company", contactEmail: "", withSite: false, features: { refer: true, cases: false, settlement: true, members: false } as Features });
  const [h, setH] = useState({ legalEntityId: "", name: "", publicId: "", siteKind: "hotel", features: { refer: true, cases: false, settlement: true, members: false } as Features });
  const [p, setP] = useState({ legalEntityId: "", name: "", hotelIds: [] as string[], validFrom: "" });
  const load = () => api<Data>("GET", "ops/partners").then(setD).catch((e) => setErr(errorText(e)));
  useEffect(() => { void load(); }, []);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const entityName = (id: string) => d.entities.find((e) => e.id === id)?.name ?? id;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <p className="pt-note-box">提携パートナーは「契約先（精算先）→ 拠点（紹介元）→ 担当者」で管理します。種別（ホテル・旅行代理店・ガイド・その他）と、拠点ごとに使える機能（リンク紹介・予約取り次ぎ・精算・メンバー管理）は別々に設定できます。個人ガイドや支店のない代理店は「契約先の登録」で「拠点も同時に作る」を選ぶと、契約先と同名の拠点が1つできます。</p>
      <Card title="拠点（紹介元）">
        <Table head={["拠点ID", "名称", "種別", "契約先", "機能", "状態", "紹介予約", "精算設定", ""]} rows={d.hotels.map((x) => [x.public_id, x.name, SITE_KIND_JA[x.site_kind as keyof typeof SITE_KIND_JA] ?? x.site_kind, entityName(x.legal_entity_id), FEATURE_KEYS.filter((k) => x.features?.[k]).map((k) => FEATURE_JA[k]).join("・") || "—", <Badge key="s" tone={STATUS[x.status]?.[1] ?? "neutral"}>{STATUS[x.status]?.[0] ?? x.status}</Badge>, x.referrals, d.profiles.find((pr) => pr.id === x.profileId)?.name ?? <span className="pt-muted">未設定</span>, <a key="a" href={`/ops/hotels/${x.id}/`}>詳細・担当者・リンク</a>])} empty="拠点はまだ登録されていません。下のフォームで契約先 → 拠点の順に登録します。" />
      </Card>
      <div className="pt-grid-2">
        <Card title="契約先（精算先）を登録">
          <div className="pt-form">
            <Field label="種別"><select value={le.partnerType} onChange={(e) => setLe({ ...le, partnerType: e.target.value, entityKind: e.target.value === "guide" ? "individual" : le.entityKind })}>{Object.entries(PARTNER_TYPE_JA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="形態"><select value={le.entityKind} onChange={(e) => setLe({ ...le, entityKind: e.target.value })}>{Object.entries(ENTITY_KIND_JA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="正式名称（個人は氏名）"><input value={le.name} onChange={(e) => setLe({ ...le, name: e.target.value })} /></Field>
            <Field label="連絡先メール（任意）"><input type="email" value={le.contactEmail} onChange={(e) => setLe({ ...le, contactEmail: e.target.value })} /></Field>
            <Field label="所在地"><input value={le.address} onChange={(e) => setLe({ ...le, address: e.target.value })} /></Field>
            <Field label="登録番号（T+13桁、任意）" hint="番号の形式だけでは登録済みにしません。確認後に運営が状態を更新します。"><input value={le.registrationNumber} onChange={(e) => setLe({ ...le, registrationNumber: e.target.value })} /></Field>
            <label className="pt-form-full" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={le.withSite} onChange={(e) => setLe({ ...le, withSite: e.target.checked })} /> 拠点も同時に作る（個人ガイド・支店のない代理店向け。契約先と同名の拠点と精算設定ができます）</label>
            {le.withSite && <div className="pt-form-full pt-row">{FEATURE_KEYS.map((k) => <label key={k} className="pt-chip" style={{ cursor: "pointer" }}><input type="checkbox" checked={le.features[k]} onChange={(e) => setLe({ ...le, features: { ...le.features, [k]: e.target.checked } })} /> {FEATURE_JA[k]}</label>)}</div>}
            <div className="pt-row"><Button disabled={!le.name} onClick={() => run(() => api("POST", "ops/legal-entities", le), "契約先を登録しました。")}>登録</Button></div>
          </div>
          <Table head={["名称", "種別", "形態", "連絡先", "登録番号", "登録状態"]} rows={d.entities.map((e) => [e.name, PARTNER_TYPE_JA[e.partner_type as keyof typeof PARTNER_TYPE_JA] ?? e.partner_type, ENTITY_KIND_JA[e.entity_kind as keyof typeof ENTITY_KIND_JA] ?? e.entity_kind, e.contact_email ?? "—", e.registration_number ?? "—", e.registration_status])} empty="なし" compact />
        </Card>
        <Card title="拠点を登録">
          <div className="pt-form">
            <Field label="契約先"><select value={h.legalEntityId} onChange={(e) => setH({ ...h, legalEntityId: e.target.value })}><option value="">選ぶ</option>{d.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
            <Field label="拠点の種別"><select value={h.siteKind} onChange={(e) => setH({ ...h, siteKind: e.target.value })}>{Object.entries(SITE_KIND_JA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="拠点名（施設名・支店名・ガイド名）"><input value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} /></Field>
            <Field label="拠点ID（任意、例 HP-0001）" hint="空なら自動採番。拠点ごとの精算設定も同時に作ります。"><input value={h.publicId} onChange={(e) => setH({ ...h, publicId: e.target.value })} /></Field>
            <div className="pt-form-full pt-row">{FEATURE_KEYS.map((k) => <label key={k} className="pt-chip" style={{ cursor: "pointer" }}><input type="checkbox" checked={h.features[k]} onChange={(e) => setH({ ...h, features: { ...h.features, [k]: e.target.checked } })} /> {FEATURE_JA[k]}</label>)}</div>
            <div className="pt-row"><Button disabled={!h.legalEntityId || !h.name} onClick={() => run(() => api("POST", "ops/hotels", h), "拠点を登録しました。")}>登録</Button></div>
          </div>
        </Card>
      </div>
      <Card title="精算・振込設定（複数拠点の一括）">
        <p className="pt-note-box">基本は1施設1設定（施設登録時に自動作成）。同じ契約法人の複数施設をまとめて精算・振込する場合だけ、ここで一括設定を作ります。選んだ施設の現在の設定は、適用開始日で終了します。最低振込額 3,000 円と繰越は設定ごとに判定します。</p>
        <div className="pt-form">
          <Field label="契約先"><select value={p.legalEntityId} onChange={(e) => setP({ ...p, legalEntityId: e.target.value, hotelIds: [] })}><option value="">選ぶ</option>{d.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
          <Field label="設定名"><input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
          <Field label="適用開始日"><input type="date" value={p.validFrom} onChange={(e) => setP({ ...p, validFrom: e.target.value })} /></Field>
          <div className="pt-form-full pt-row">
            {d.hotels.filter((x) => x.legal_entity_id === p.legalEntityId).map((x) => (
              <label key={x.id} className="pt-chip" style={{ cursor: "pointer" }}><input type="checkbox" checked={p.hotelIds.includes(x.id)} onChange={(e) => setP({ ...p, hotelIds: e.target.checked ? [...p.hotelIds, x.id] : p.hotelIds.filter((i) => i !== x.id) })} /> {x.name}</label>
            ))}
          </div>
          <div className="pt-row"><Button disabled={!p.legalEntityId || !p.name || p.hotelIds.length < 2} onClick={() => run(() => api("POST", "ops/profiles", p), "精算設定を作成しました。")}>一括設定を作る</Button></div>
        </div>
        {bank && <Notice tone="info"><b>{bank.name}</b><p>{bank.value}</p><Button kind="link" onClick={()=>setBank(null)}>閉じる</Button></Notice>}
        <Table head={["設定名", "契約先", "対象拠点", "適用", "最低振込額", "振込先（経理・管理者）"]} rows={d.profiles.map((pr) => [pr.name, entityName(pr.legal_entity_id), pr.hotelIds.map((id) => d.hotels.find((x) => x.id === id)?.name ?? id).join("、") || "—", `${pr.valid_from}〜${pr.valid_to ?? ""}`, `¥${pr.min_payout_jpy.toLocaleString()}`, <Button key="bank" kind="link" onClick={async()=>{setBank(null);try {const r=await api<{bank:{bank:string;branch:string;type:string;number:string;holder:string}|null}>("GET",`ops/bank/${pr.id}`);setBank({name:pr.name,value:r.bank?`${r.bank.bank} ${r.bank.branch} ${r.bank.type === "ordinary" ? "普通" : "当座"} ${r.bank.number} ${r.bank.holder}`:"未登録"});}catch(e){setErr(errorText(e));}}}>口座を確認</Button>])} empty="なし" compact />
      </Card>
    </>
  );
}
