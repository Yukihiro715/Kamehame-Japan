"use client";
import { useEffect, useState } from "react";
import { api, errorText, jst } from "./client";
import { Button, Card, CopyLink, Field, Notice } from "./ui";
import type { MessageRow } from "./case-common";

type Settings = {
  mode: "default" | "auto" | "manual";
  defaultAuto: boolean;
  instructions: string;
  fileKey: string;
  url: string | null;
  hasGuestEmail: boolean;
  sentAt: string | null;
  outcome: string | null;
};
export function GuestGuide({
  path,
  operator = false,
  en = false,
  messages = [],
}: {
  path: string;
  operator?: boolean;
  en?: boolean;
  messages?: MessageRow[];
}) {
  const [value, setValue] = useState<Settings>();
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    api<Settings>("GET", path)
      .then((v) => {
        if (live) setValue(v);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      });
    return () => {
      live = false;
    };
  }, [path]);
  async function save(send = false) {
    if (!value || busy) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const next = await api<Settings & { attemptOutcome?: string }>(
        "POST",
        path,
        send
          ? { send: true }
          : operator
            ? {
                mode: value.mode,
                instructions: value.instructions,
                fileKey: value.fileKey,
              }
            : { mode: value.mode },
      );
      setValue(next);
      if (send && !next.sentAt) {
        setError(
          en
            ? "Delivery did not complete. Check the guest email and mail configuration."
            : "案内を送信できませんでした。お客様のメールアドレスとメール配信設定を確認してください。",
        );
      } else setNotice(en ? "Saved" : "反映しました");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title={en ? "Guest guide & tickets" : "お客様への案内・チケット"}>
      {error && <Notice tone="bad">{error}</Notice>}
      {notice && <Notice tone="ok">{notice}</Notice>}
      {value && (
        <>
          <Field label={en ? "Delivery for this case" : "この案件の案内送信"}>
            <select
              value={value.mode}
              onChange={(e) =>
                setValue({ ...value, mode: e.target.value as Settings["mode"] })
              }
            >
              <option value="default">
                {en ? "Use account setting" : "アカウント設定に従う"}（
                {value.defaultAuto
                  ? en
                    ? "Automatic"
                    : "自動送信"
                  : en
                    ? "Manual"
                    : "個別案内"}
                ）
              </option>
              <option value="auto">
                {en
                  ? "Send automatically after payment and confirmation"
                  : "決済・予約確定後に自動送信"}
              </option>
              <option value="manual">
                {en ? "Share manually" : "担当者が個別に案内"}
              </option>
            </select>
          </Field>
          {operator && (
            <>
              <Field label="アクセス・集合場所・当日のご案内">
                <textarea
                  maxLength={5000}
                  rows={5}
                  value={value.instructions}
                  onChange={(e) =>
                    setValue({ ...value, instructions: e.target.value })
                  }
                />
              </Field>
              <Field
                label="添付するチケット・案内資料"
                hint="「連絡・資料」でお客様に公開した添付ファイルから選択できます。"
              >
                <select
                  value={value.fileKey}
                  onChange={(e) =>
                    setValue({ ...value, fileKey: e.target.value })
                  }
                >
                  <option value="">添付なし</option>
                  {messages
                    .filter(
                      (m) => m.visibility === "customer" && m.attachment_key,
                    )
                    .map((m) => (
                      <option key={m.id} value={m.attachment_key!}>
                        {m.attachment_name}
                      </option>
                    ))}
                </select>
              </Field>
            </>
          )}
          {!operator && value.instructions && (
            <p className="pt-guest-instructions">{value.instructions}</p>
          )}
          {!operator && value.fileKey && (
            <a
              className="pt-inline-link"
              href={`/api/portal/hotel/case-file?download=1&key=${encodeURIComponent(value.fileKey)}`}
            >
              {en ? "Download guide or ticket" : "案内・チケットを確認"}
            </a>
          )}
          <div className="pt-row">
            <Button small disabled={busy} onClick={() => void save()}>
              {en ? "Save" : "設定を保存"}
            </Button>
            {value.url && (
              <>
                <a
                  href={value.url}
                  className="pt-btn pt-btn-secondary pt-btn-small"
                  target="_blank"
                  rel="noreferrer"
                >
                  {en ? "Preview guest guide" : "お客様向け案内を確認"}
                </a>
                <CopyLink url={value.url} />
              </>
            )}
            {operator && value.url && value.hasGuestEmail && !value.sentAt && (
              <Button
                small
                kind="secondary"
                disabled={busy}
                onClick={() => void save(true)}
              >
                お客様にメールで送る
              </Button>
            )}
          </div>
          {!value.url && (
            <p className="pt-small pt-muted">
              {en
                ? "A shareable link is available after payment, confirmation and preparation of the guide."
                : "決済・予約確定後、ご案内の準備ができると、お客様に共有できるリンクが表示されます。"}
            </p>
          )}
          {value.sentAt && (
            <p className="pt-small">
              {en ? "Email sent" : "メール送信済み"} · {jst(value.sentAt)}
            </p>
          )}
          {!value.hasGuestEmail && (
            <p className="pt-small pt-muted">
              {en
                ? "Add a guest email to enable delivery by email."
                : "メール送信にはお客様のメールアドレスが必要です。"}
            </p>
          )}
          {value.outcome &&
            ["failed", "unconfigured", "blocked"].includes(value.outcome) && (
              <Notice tone="warn">
                {en
                  ? "Guest guide email could not be sent."
                  : "お客様への案内メールは送信できていません。"}
              </Notice>
            )}
        </>
      )}
    </Card>
  );
}
export function GuestGuideDefault({
  path,
  site,
  en = false,
}: {
  path: string;
  site?: string;
  en?: boolean;
}) {
  const [enabled, setEnabled] = useState<boolean>(),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api<{ enabled: boolean }>(
      "GET",
      path + (site ? "?hotel=" + encodeURIComponent(site) : ""),
    )
      .then((x) => {
        if (live) setEnabled(x.enabled);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      });
    return () => {
      live = false;
    };
  }, [path, site]);
  return (
    <Card title={en ? "Guest guide delivery" : "お客様への案内送信"}>
      {error && <Notice tone="bad">{error}</Notice>}
      {status && <Notice tone="ok">{status}</Notice>}
      {enabled !== undefined && (
        <>
          <label className="pt-check">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                setStatus("");
              }}
            />
            {en
              ? "Automatically email the guide after payment and confirmation"
              : "決済・予約確定後、お客様に案内を自動送信する"}
          </label>
          <p className="pt-small pt-muted">
            {en
              ? "Individual cases can override this setting."
              : "案件ごとに送信方法を変更できます。"}
          </p>
          <Button
            small
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await api("POST", path, { hotel: site, enabled });
                setStatus(en ? "Saved" : "保存しました");
              } catch (e) {
                setError(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {en ? "Save" : "保存"}
          </Button>
        </>
      )}
    </Card>
  );
}
