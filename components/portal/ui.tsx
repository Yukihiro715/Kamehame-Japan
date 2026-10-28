"use client";

import { useState, type ReactNode } from "react";

export function Card({ title, children, actions, className = "" }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`pt-card ${className}`}>
      {(title || actions) && <header className="pt-card-h"><h2>{title}</h2>{actions && <div className="pt-card-actions">{actions}</div>}</header>}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "muted" | "accent" | "warn" }) {
  return (
    <div className={`pt-stat${tone ? ` pt-stat-${tone}` : ""}`}>
      <span className="pt-stat-l">{label}</span>
      <b className="pt-stat-v">{value}</b>
      {note && <small className="pt-stat-n">{note}</small>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" | "info" }) {
  return <span className={`pt-badge pt-badge-${tone}`}>{children}</span>;
}

export function Table({ head, rows, empty = "該当するデータはありません。", compact }: { head: ReactNode[]; rows: ReactNode[][]; empty?: string; compact?: boolean }) {
  return (
    <div className="pt-table-wrap">
      <table className={`pt-table${compact ? " pt-table-compact" : ""}`}>
        <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={head.length} className="pt-empty">{empty}</td></tr> : rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return <label className="pt-field"><span className="pt-field-l">{label}</span>{children}{hint && <small className="pt-field-hint">{hint}</small>}</label>;
}

export function Button({ children, onClick, kind = "primary", type = "button", disabled, small }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "secondary" | "danger" | "link"; type?: "button" | "submit"; disabled?: boolean; small?: boolean }) {
  return <button type={type} className={`pt-btn pt-btn-${kind}${small ? " pt-btn-small" : ""}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "ok" | "warn" | "bad" }) {
  return <p className={`pt-notice pt-notice-${tone}`}>{children}</p>;
}

export function Loading({ text = "読み込み中…" }: { text?: string }) { return <p className="pt-loading">{text}</p>; }

export const PERIODS: [string, string][] = [["this_month", "今月"], ["last_month", "先月"], ["this_quarter", "当四半期"], ["last_quarter", "前四半期"]];

/** Preset periods plus a custom range, as query-string parts. */
export function PeriodPicker({ value, onChange }: { value: { period?: string; from?: string; to?: string }; onChange: (v: { period?: string; from?: string; to?: string }) => void }) {
  const [from, setFrom] = useState(value.from ?? ""), [to, setTo] = useState(value.to ?? "");
  return (
    <div className="pt-period">
      {PERIODS.map(([k, label]) => <button key={k} type="button" className={`pt-chip${value.period === k && !value.from ? " on" : ""}`} onClick={() => onChange({ period: k })}>{label}</button>)}
      <span className="pt-period-custom">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="開始日" />
        <span>〜</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="終了日" />
        <Button kind="secondary" small onClick={() => { if (from && to && from <= to) onChange({ from, to }); }}>表示</Button>
      </span>
    </div>
  );
}

export const periodQuery = (v: { period?: string; from?: string; to?: string }) => (v.from && v.to ? `from=${v.from}&to=${v.to}` : `period=${v.period ?? "this_month"}`);

/** A dialog-free confirm: the action shows a reason box and a confirm button inline. */
export function ReasonAction({ label, onConfirm, kind = "secondary", placeholder = "理由（必須）", confirmLabel = "実行", extra }: { label: string; onConfirm: (reason: string) => Promise<void>; kind?: "primary" | "secondary" | "danger"; placeholder?: string; confirmLabel?: string; extra?: ReactNode }) {
  const [open, setOpen] = useState(false), [reason, setReason] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  if (!open) return <Button kind={kind} small onClick={() => setOpen(true)}>{label}</Button>;
  return (
    <div className="pt-reason">
      {extra}
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} maxLength={500} />
      <Button kind={kind} small disabled={busy || !reason.trim()} onClick={async () => { setBusy(true); setErr(null); try { await onConfirm(reason.trim()); setOpen(false); setReason(""); } catch (e) { setErr(e instanceof Error ? e.message : "エラー"); } finally { setBusy(false); } }}>{confirmLabel}</Button>
      <Button kind="link" small onClick={() => setOpen(false)}>やめる</Button>
      {err && <small className="pt-err">{err}</small>}
    </div>
  );
}
