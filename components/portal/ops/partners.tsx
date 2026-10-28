"use client";

import { useEffect, useState } from "react";
import { api, errorText } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, Table } from "../ui";

interface Entity { id: string; name: string; registration_status: string; registration_number: string | null }
interface Hotel { id: string; legal_entity_id: string; public_id: string; name: string; status: string; referrals: number; profileId: string | null }
interface Profile { id: string; legal_entity_id: string; name: string; valid_from: string; valid_to: string | null; min_payout_jpy: number; hotelIds: string[] }
interface Data { entities: Entity[]; hotels: Hotel[]; profiles: Profile[] }

const STATUS: Record<string, [string, "ok" | "warn" | "bad"]> = { active: ["提携中", "ok"], suspended: ["一時停止", "warn"], terminated: ["提携終了", "bad"] };

export function OpsPartners() {
  const [d, setD] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [le, setLe] = useState({ name: "", address: "", registrationNumber: "" });
  const [h, setH] = useState({ legalEntityId: "", name: "", publicId: "" });
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
      <Card title="ホテル（施設）">
        <Table head={["施設ID", "名称", "契約法人", "状態", "紹介予約", "精算設定", ""]} rows={d.hotels.map((x) => [x.public_id, x.name, entityName(x.legal_entity_id), <Badge key="s" tone={STATUS[x.status]?.[1] ?? "neutral"}>{STATUS[x.status]?.[0] ?? x.status}</Badge>, x.referrals, d.profiles.find((pr) => pr.id === x.profileId)?.name ?? <span className="pt-muted">未設定</span>, <a key="a" href={`/ops/hotels/${x.id}/`}>詳細・担当者・リンク</a>])} empty="ホテルはまだ登録されていません。下のフォームで契約法人 → 施設の順に登録します。" />
      </Card>
      <div className="pt-grid-2">
        <Card title="契約法人を登録">
          <div className="pt-form">
            <Field label="正式名称"><input value={le.name} onChange={(e) => setLe({ ...le, name: e.target.value })} /></Field>
            <Field label="所在地"><input value={le.address} onChange={(e) => setLe({ ...le, address: e.target.value })} /></Field>
            <Field label="登録番号（T+13桁、任意）" hint="番号の形式だけでは登録済みにしません。確認後に運営が状態を更新します。"><input value={le.registrationNumber} onChange={(e) => setLe({ ...le, registrationNumber: e.target.value })} /></Field>
            <div className="pt-row"><Button disabled={!le.name} onClick={() => run(() => api("POST", "ops/legal-entities", le), "契約法人を登録しました。")}>登録</Button></div>
          </div>
          <Table head={["名称", "登録番号", "登録状態"]} rows={d.entities.map((e) => [e.name, e.registration_number ?? "—", e.registration_status])} empty="なし" compact />
        </Card>
        <Card title="施設を登録">
          <div className="pt-form">
            <Field label="契約法人"><select value={h.legalEntityId} onChange={(e) => setH({ ...h, legalEntityId: e.target.value })}><option value="">選ぶ</option>{d.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
            <Field label="施設名"><input value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} /></Field>
            <Field label="施設ID（任意、例 HP-0001）" hint="空なら自動採番。施設ごとの精算設定も同時に作ります。"><input value={h.publicId} onChange={(e) => setH({ ...h, publicId: e.target.value })} /></Field>
            <div className="pt-row"><Button disabled={!h.legalEntityId || !h.name} onClick={() => run(() => api("POST", "ops/hotels", h), "施設を登録しました。")}>登録</Button></div>
          </div>
        </Card>
      </div>
      <Card title="精算・振込設定（複数施設の一括）">
        <p className="pt-note-box">基本は1施設1設定（施設登録時に自動作成）。同じ契約法人の複数施設をまとめて精算・振込する場合だけ、ここで一括設定を作ります。選んだ施設の現在の設定は、適用開始日で終了します。最低振込額 3,000 円と繰越は設定ごとに判定します。</p>
        <div className="pt-form">
          <Field label="契約法人"><select value={p.legalEntityId} onChange={(e) => setP({ ...p, legalEntityId: e.target.value, hotelIds: [] })}><option value="">選ぶ</option>{d.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
          <Field label="設定名"><input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
          <Field label="適用開始日"><input type="date" value={p.validFrom} onChange={(e) => setP({ ...p, validFrom: e.target.value })} /></Field>
          <div className="pt-form-full pt-row">
            {d.hotels.filter((x) => x.legal_entity_id === p.legalEntityId).map((x) => (
              <label key={x.id} className="pt-chip" style={{ cursor: "pointer" }}><input type="checkbox" checked={p.hotelIds.includes(x.id)} onChange={(e) => setP({ ...p, hotelIds: e.target.checked ? [...p.hotelIds, x.id] : p.hotelIds.filter((i) => i !== x.id) })} /> {x.name}</label>
            ))}
          </div>
          <div className="pt-row"><Button disabled={!p.legalEntityId || !p.name || p.hotelIds.length < 2} onClick={() => run(() => api("POST", "ops/profiles", p), "精算設定を作成しました。")}>一括設定を作る</Button></div>
        </div>
        <Table head={["設定名", "契約法人", "対象施設", "適用", "最低振込額"]} rows={d.profiles.map((pr) => [pr.name, entityName(pr.legal_entity_id), pr.hotelIds.map((id) => d.hotels.find((x) => x.id === id)?.name ?? id).join("、") || "—", `${pr.valid_from}〜${pr.valid_to ?? ""}`, `¥${pr.min_payout_jpy.toLocaleString()}`])} empty="なし" compact />
      </Card>
    </>
  );
}
