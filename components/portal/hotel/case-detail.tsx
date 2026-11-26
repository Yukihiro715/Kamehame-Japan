"use client";

import { GuestGuide } from "../guest-guide";
import { CaseDate } from "./case-date";
import { Nationality } from "./nationality";
import { usePortal } from "../shell";
import { AgencyProposal } from "./proposal";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { label, t } from "../i18n";
import {
  Button,
  Card,
  CopyLink,
  Field,
  Loading,
  Notice,
  ReasonAction,
} from "../ui";
import {
  CaseFacts,
  CaseLedger,
  CaseMessages,
  QuoteCard,
  StatusBadge,
  caseTitle,
  type CaseDetail,
} from "../case-common";

export function HotelCaseDetail({
  id,
  inModal = false,
}: {
  id: string;
  inModal?: boolean;
}) {
  const { lang, me } = usePortal();
  const en = lang === "en";
  const [newDate, setNewDate] = useState<string[]>([]),
    [reason, setReason] = useState(""),
    [changing, setChanging] = useState(false),
    [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const K = t().cases,
    C = t().common;
  const [d, setD] = useState<CaseDetail | null>(null),
    [err, setErr] = useState<string | null>(null),
    [msg, setMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState(false),
    [f, setF] = useState({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerCountry: "",
      requirements: "",
      preferredDate: "",
      guests: "",
    });
  const load = useCallback(
    () =>
      api<CaseDetail>("GET", `hotel/cases/${id}`)
        .then((x) => {
          setD(x);
          setF({
            customerName: x.case.customer_name,
            customerEmail: x.case.customer_email ?? "",
            customerPhone: x.case.customer_phone ?? "",
            customerCountry: x.case.customer_country ?? "",
            requirements: x.case.requirements ?? "",
            preferredDate: x.case.preferred_date ?? "",
            guests: x.case.guests ? String(x.case.guests) : "",
          });
        })
        .catch((e) => setErr(errorText(e))),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setErr(null);
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e) {
      setErr(errorText(e));
    }
  };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const c = d.case;
  const open = ![
    "paid",
    "confirmed",
    "performed",
    "cancelled",
    "unavailable",
  ].includes(c.displayStatus);
  const current = d.quotes.find((q) => ["shared", "paid"].includes(q.status));
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card
        title={
          <span>
            {c.public_ref} · {caseTitle(c)}{" "}
            <StatusBadge status={c.displayStatus} />
          </span>
        }
        actions={
          !inModal && (
            <Link
              className="pt-btn pt-btn-link pt-btn-small"
              href="/partner/cases/"
            >
              {C.back}
            </Link>
          )
        }
      >
        <p className="pt-note-box">{label(K.next, c.displayStatus, "")}</p>
        {!me.demo &&
          !["performed", "cancelled", "unavailable"].includes(
            c.displayStatus,
          ) && (
            <Card title={en ? "Request a date change" : "日程変更を依頼"}>
              {changing ? (
                <form
                  className="pt-request-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newDate[0] || sending) return;
                    setSending(true);
                    await run(
                      async () => {
                        await api("POST", `hotel/cases/${id}/message`, {
                          body:
                            (en ? "Date change request: " : "日程変更希望：") +
                            newDate[0] +
                            (reason ? "\n" + reason : ""),
                        });
                        setChanging(false);
                        setReason("");
                        setNewDate([]);
                      },
                      en
                        ? "Date change request sent."
                        : "日程変更の依頼を送りました。",
                    );
                    setSending(false);
                  }}
                >
                  <CaseDate
                    en={en}
                    label={
                      en
                        ? "Preferred new date (required)"
                        : "変更希望日（必須）"
                    }
                    values={newDate}
                    onChange={setNewDate}
                  />
                  <Field
                    label={en ? "Details (optional)" : "希望時間・補足（任意）"}
                  >
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={1500}
                    />
                  </Field>
                  <div className="pt-row">
                    <Button type="submit" disabled={!newDate.length || sending}>
                      {en ? "Send request" : "変更を依頼する"}
                    </Button>
                    <Button kind="link" onClick={() => setChanging(false)}>
                      {C.cancel}
                    </Button>
                  </div>
                </form>
              ) : (
                <Button kind="secondary" onClick={() => setChanging(true)}>
                  {en ? "Choose a new date" : "変更希望日を選ぶ"}
                </Button>
              )}
            </Card>
          )}
        {!me.demo && (
          <GuestGuide path={`hotel/cases/${id}/guest-guide`} en={en} />
        )}
        {!!c.agency_pays &&
          current?.status === "shared" &&
          current.paymentMode === "stripe" &&
          open && (
            <Button
              disabled={paying}
              onClick={async () => {
                setPaying(true);
                setErr(null);
                try {
                  const result = await api<{ url: string }>(
                    "POST",
                    `hotel/cases/${id}/pay-wholesale`,
                    { quoteId: current.id },
                  );
                  window.location.assign(result.url);
                } catch (e) {
                  setErr(errorText(e));
                  setPaying(false);
                }
              }}
            >
              {lang === "en" ? "Pay wholesale amount" : "卸値をカードで支払う"}
            </Button>
          )}
        {current?.shareUrl && (
          <div className="pt-generated-link">
            <span className="pt-small">{K.customerUrl}</span>
            <a href={current.shareUrl} target="_blank" rel="noreferrer">
              {current.shareUrl}
            </a>
            <CopyLink url={current.shareUrl} />
          </div>
        )}
        {!edit ? (
          <CaseFacts c={c} />
        ) : (
          <div className="pt-form">
            <Field label={K.customerName}>
              <input
                value={f.customerName}
                onChange={(e) => setF({ ...f, customerName: e.target.value })}
              />
            </Field>
            <Field label={K.email}>
              <input
                type="email"
                value={f.customerEmail}
                onChange={(e) => setF({ ...f, customerEmail: e.target.value })}
              />
            </Field>
            <Field label={K.phone}>
              <input
                value={f.customerPhone}
                onChange={(e) => setF({ ...f, customerPhone: e.target.value })}
              />
            </Field>
            <Field label={en ? "Nationality" : "国籍"}>
              <Nationality
                en={en}
                value={f.customerCountry}
                onChange={(v) => setF({ ...f, customerCountry: v })}
              />
            </Field>
            <Field label={K.date}>
              <input
                type="date"
                value={f.preferredDate}
                onChange={(e) => setF({ ...f, preferredDate: e.target.value })}
              />
            </Field>
            <Field label={K.guests}>
              <input
                type="number"
                min={1}
                max={99}
                value={f.guests}
                onChange={(e) => setF({ ...f, guests: e.target.value })}
              />
            </Field>
            <div className="pt-form-full">
              <Field label={K.requirements}>
                <textarea
                  value={f.requirements}
                  onChange={(e) => setF({ ...f, requirements: e.target.value })}
                />
              </Field>
            </div>
            <div className="pt-row pt-form-full">
              <Button
                onClick={() =>
                  run(async () => {
                    await api("POST", `hotel/cases/${id}/update`, {
                      ...f,
                      guests: f.guests ? Number(f.guests) : null,
                    });
                    setEdit(false);
                  }, K.saved)
                }
              >
                {C.save}
              </Button>
              <Button kind="link" onClick={() => setEdit(false)}>
                {C.cancel}
              </Button>
            </div>
          </div>
        )}
        <p className="pt-small pt-muted">
          {K.meta(jst(c.created_at), jst(c.updated_at), c.createdBy ?? "—")}
        </p>
        {open && !edit && (
          <div className="pt-row">
            <Button kind="secondary" small onClick={() => setEdit(true)}>
              {K.edit}
            </Button>
            <ReasonAction
              label={K.withdraw}
              kind="danger"
              confirmLabel={K.withdrawConfirm}
              placeholder={K.withdrawPh}
              onConfirm={(reason) =>
                run(
                  () => api("POST", `hotel/cases/${id}/cancel`, { reason }),
                  K.withdrawn,
                )
              }
            />
          </div>
        )}
      </Card>
      {!!c.agency_pays && current && (
        <AgencyProposal c={c} q={current} en={lang === "en"} />
      )}
      <Card title={K.quotes}>
        {d.quotes.length === 0 ? (
          <p className="pt-small pt-muted">{K.noQuotes}</p>
        ) : (
          d.quotes.map((q) => <QuoteCard key={q.id} q={q} kind="hotel" />)
        )}
      </Card>
      <Card title={K.ledger}>
        <CaseLedger d={d} kind="hotel" />
      </Card>
      <Card title={K.messagesH}>
        <CaseMessages
          kind="hotel"
          caseId={id}
          messages={d.messages}
          onPosted={load}
        />
      </Card>
    </>
  );
}
