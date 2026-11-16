"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Button, Card, Field, Loading, Notice, Table } from "../ui";

interface Member { temporary_expires_at?: string; membership_id: string; user_id: string; email: string; name: string | null; role: string; status: string; last_login_at: string | null }
const ROLE: Record<string, string> = { ops_admin: "管理者", ops_booking: "予約運営", ops_finance: "経理" };

export function OpsMembers() {
  const [rows, setRows] = useState<Member[] | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [busy,setBusy]=useState(false);
  const [issued,setIssued] = useState<{email:string;temporaryPassword:string;expiresAt:string}|null>(null);
  const [f, setF] = useState({ email: "", name: "", role: "ops_booking" });
  const load = () => api<{ members: Member[] }>("GET", "ops/ops-members").then((d) => setRows(d.members)).catch((e) => setErr(errorText(e)));
  useEffect(() => { void load(); }, []);
  const run = async (fn: () => Promise<unknown>, ok: string) => { if(busy)return; setBusy(true); setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } finally {setBusy(false)} };
  if (!rows) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      {issued && <Card title="仮アカウントを発行しました"><p>{issued.email}</p><p>仮パスワード（この画面でのみ表示）</p><code style={{overflowWrap:"anywhere"}}>{issued.temporaryPassword}</code><p>有効期限：{jst(issued.expiresAt)}。本人に安全な方法でお伝えください。初回ログイン時に必ず変更が必要です。</p><Button onClick={()=>setIssued(null)}>閉じる</Button></Card>}
      <Card title="運営メンバー">
        <p className="pt-note-box">マスター: メンバーの仮発行・再発行・権限取り消し。同じメールアドレスで再発行すると現在のパスワードとログインが無効になります。管理者: 業務設定。予約運営: 実施確認・紹介元訂正・リンク発行・提携パートナー登録。経理: 料率、明細・入金の登録、返金配賦、CSV出力。口座情報と支払確定は経理と管理者だけが扱います。</p>
        <Table head={["メール", "氏名", "役割", "状態", "最終サインイン", ""]} rows={rows.map((m) => [m.email, m.name ?? "—", m.email === "yukihiro_ito@prosent.co.jp" ? "マスター" : ROLE[m.role] ?? m.role, m.temporary_expires_at ? "初回変更待ち" : m.status, jst(m.last_login_at), m.email === "yukihiro_ito@prosent.co.jp" ? null : <Button disabled={busy} key="r" kind="danger" small onClick={() => { if (confirm(`${m.email} の ${ROLE[m.role]} 権限を取り消しますか？`)) void run(() => api("POST", `ops/members/${m.membership_id}/revoke`, {}), "取り消しました。"); }}>取り消す</Button>])} />
        <div className="pt-form">
          <Field label="メールアドレス"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="氏名（任意）"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="役割"><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="ops_admin">管理者</option><option value="ops_booking">予約運営</option><option value="ops_finance">経理</option></select></Field>
          <div className="pt-row"><Button disabled={busy||!f.email} onClick={() => run(async () => { const r = await api<{ temporaryPassword:string; expiresAt:string }>("POST", "ops/ops-members", f); setIssued({email:f.email,...r}); setF({ email: "", name: "", role: "ops_booking" }); }, "仮発行しました。")}>仮発行・再発行する</Button></div>
        </div>
      </Card>
    </>
  );
}
