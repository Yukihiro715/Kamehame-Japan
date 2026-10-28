"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, ReasonAction, Table } from "../ui";

interface Detail {
  hotel: { id: string; public_id: string; name: string; status: string; brochure_url: string | null; notes: string | null; created_at: string };
  entity: { id: string; name: string; registration_status: string; registration_number: string | null; address: string | null } | null;
  members: { membership_id: string; user_id: string; email: string; name: string | null; role: string; user_status: string; last_login_at: string | null }[];
  links: { id: string; token: string; experience_slug: string | null; medium: string; kind: string; label: string | null; status: string; created_at: string; url: string; accesses: number }[];
  profiles: { id: string; name: string; valid_from: string; valid_to: string | null }[];
}
const ROLE: Record<string, string> = { hotel_viewer: "閲覧担当者", hotel_billing: "請求担当者" };
const MEDIUM: Record<string, string> = { brochure: "パンフレット", room_tv: "客室TV", front: "フロント", web: "Web", other: "共通（ホテル自身が発行）" };
const STATUS: Record<string, [string, "ok" | "warn" | "bad"]> = { active: ["提携中", "ok"], suspended: ["一時停止", "warn"], terminated: ["提携終了", "bad"] };

export function OpsHotelDetail({ id }: { id: string }) {
  const [d, setD] = useState<Detail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [inv, setInv] = useState({ email: "", name: "", role: "hotel_viewer" });
  const [lk, setLk] = useState({ medium: "brochure", kind: "qr", experience: "", label: "" });
  const [edit, setEdit] = useState({ brochureUrl: "", notes: "" });
  const [experiences, setExperiences] = useState<{ slug: string; title: string }[]>([]);
  const load = useCallback(() => api<Detail>("GET", `ops/hotels/${id}`).then((x) => { setD(x); setEdit({ brochureUrl: x.hotel.brochure_url ?? "", notes: x.hotel.notes ?? "" }); }).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); api<{ experiences: { slug: string; title: string }[] }>("GET", "ops/policies").then((x) => setExperiences(x.experiences)).catch(() => {}); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); throw e; } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const st = STATUS[d.hotel.status] ?? [d.hotel.status, "neutral" as const];
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={`${d.hotel.name}（${d.hotel.public_id}）`}>
        <dl className="pt-kv">
          <dt>状態</dt><dd><Badge tone={st[1]}>{st[0]}</Badge></dd>
          <dt>契約法人</dt><dd>{d.entity?.name ?? "—"} · 登録状態 {d.entity?.registration_status ?? "—"} {d.entity?.registration_number ? `· ${d.entity.registration_number}` : ""}</dd>
          <dt>精算設定</dt><dd>{d.profiles.map((p) => `${p.name}（${p.valid_from}〜${p.valid_to ?? ""}）`).join(" / ") || <span className="pt-muted">未設定</span>}</dd>
          <dt>登録日</dt><dd>{jst(d.hotel.created_at, false)}</dd>
        </dl>
        <div className="pt-row">
          {d.hotel.status !== "active" && <ReasonAction label="提携中に戻す" onConfirm={(reason) => run(() => api("POST", `ops/hotels/${id}`, { status: "active", reason }), "状態を更新しました。")} />}
          {d.hotel.status === "active" && <ReasonAction label="一時停止" onConfirm={(reason) => run(() => api("POST", `ops/hotels/${id}`, { status: "suspended", reason }), "状態を更新しました。")} />}
          {d.hotel.status !== "terminated" && <ReasonAction label="提携終了" kind="danger" onConfirm={(reason) => run(() => api("POST", `ops/hotels/${id}`, { status: "terminated", reason }), "提携を終了しました。既存予約の条件と未払額は維持されます。")} />}
        </div>
        <p className="pt-small pt-muted">提携終了後、このホテルのQR・リンクは通常の体験一覧へ案内し、新しい紹介料は発生しません。過去の予約の紹介料と未払額は残ります。</p>
        <div className="pt-form">
          <Field label="パンフレットURL（https://）"><input value={edit.brochureUrl} onChange={(e) => setEdit({ ...edit, brochureUrl: e.target.value })} /></Field>
          <Field label="運営メモ（ホテルには表示されません）"><input value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
          <div className="pt-row"><Button kind="secondary" onClick={() => run(() => api("POST", `ops/hotels/${id}`, edit), "保存しました。")}>保存</Button></div>
        </div>
      </Card>

      <Card title="担当者">
        <Table head={["メール", "氏名", "役割", "状態", "最終サインイン", ""]} rows={d.members.map((m) => [m.email, m.name ?? "—", ROLE[m.role] ?? m.role, m.user_status, jst(m.last_login_at), <Button key="r" kind="danger" small onClick={() => { if (confirm(`${m.email} の権限を取り消しますか？`)) void run(() => api("POST", `ops/members/${m.membership_id}/revoke`, {}), "権限を取り消しました。"); }}>取り消す</Button>])} empty="担当者はまだいません。" compact />
        <div className="pt-form">
          <Field label="メールアドレス"><input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></Field>
          <Field label="氏名（任意）"><input value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} /></Field>
          <Field label="役割" hint="請求担当者だけが精算書の確認と口座登録を行えます。"><select value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}><option value="hotel_viewer">閲覧担当者</option><option value="hotel_billing">請求担当者</option></select></Field>
          <div className="pt-row"><Button disabled={!inv.email} onClick={() => run(async () => { const r = await api<{ mail: string }>("POST", `ops/hotels/${id}/members`, inv); if (r.mail !== "sent") setMsg(`登録しました（招待メールは送られていません: ${r.mail}。サインイン手順を別途伝えてください）。`); setInv({ email: "", name: "", role: "hotel_viewer" }); }, "招待しました。サインイン手順をメールで送りました。")}>招待する</Button></div>
        </div>
      </Card>

      <Card title="QRコード・紹介リンク">
        <Table head={["ラベル", "媒体", "対象", "種類", "状態", "アクセス", "URL", "QR", ""]} rows={d.links.map((l) => [l.label ?? "—", MEDIUM[l.medium] ?? l.medium, l.experience_slug ?? "全体験一覧", l.kind === "qr" ? "QR" : "リンク", <Badge key="s" tone={l.status === "active" ? "ok" : "warn"}>{l.status}</Badge>, l.accesses, <a key="u" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>, l.kind === "qr" ? <span key="q" className="pt-row"><a href={`/api/portal/ops/qr?link=${l.id}&format=svg&download=1`} download>SVG</a><a href={`/api/portal/ops/qr?link=${l.id}&format=png`} download>PNG</a></span> : "—",
          <span key="x" className="pt-row">{l.status === "active" ? <Button kind="secondary" small onClick={() => run(() => api("POST", `ops/links/${l.id}`, { status: "paused" }), "停止しました。")}>停止</Button> : <Button kind="secondary" small onClick={() => run(() => api("POST", `ops/links/${l.id}`, { status: "active" }), "再開しました。")}>再開</Button>}{l.status !== "retired" && <Button kind="danger" small onClick={() => { if (confirm("このリンクを廃止しますか？印刷物のQRは通常ページへ案内されます。")) void run(() => api("POST", `ops/links/${l.id}`, { status: "retired" }), "廃止しました。"); }}>廃止</Button>}</span>])} empty="リンクはまだありません。" compact />
        <div className="pt-form">
          <Field label="媒体"><select value={lk.medium} onChange={(e) => setLk({ ...lk, medium: e.target.value })}><option value="brochure">パンフレット</option><option value="room_tv">客室TV</option><option value="front">フロント</option><option value="web">Web</option><option value="other">その他</option></select></Field>
          <Field label="種類"><select value={lk.kind} onChange={(e) => setLk({ ...lk, kind: e.target.value })}><option value="qr">QR</option><option value="url">リンク</option></select></Field>
          <Field label="対象"><select value={lk.experience} onChange={(e) => setLk({ ...lk, experience: e.target.value })}><option value="">全体験一覧</option>{experiences.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}</select></Field>
          <Field label="ラベル"><input value={lk.label} onChange={(e) => setLk({ ...lk, label: e.target.value })} placeholder="例: 2026冬パンフレット" /></Field>
          <div className="pt-row"><Button onClick={() => run(() => api("POST", `ops/hotels/${id}/links`, lk), "リンクを発行しました。")}>発行</Button></div>
        </div>
      </Card>
    </>
  );
}
