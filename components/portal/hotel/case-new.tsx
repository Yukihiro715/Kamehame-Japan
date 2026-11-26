"use client";

import { CaseDate } from "./case-date";
import { Nationality } from "./nationality";
import { addLocalDemoCase } from "./demo-cases";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText } from "../client";
import { portalLang, t } from "../i18n";
import { usePortal } from "../shell";
import { Button, Card, Field, Loading, Notice } from "../ui";
import { extraLabel, optionLabel, type ExtraField } from "../case-common";

interface Option {
  dates?: { date: string; times: string[] }[];
  startTimes?: string[];
  slug: string;
  title: string;
  titleEn: string;
  area: string | null;
  duration: string | null;
  group: string | null;
  price: string | null;
  bookingMode: string;
  extraFields: ExtraField[];
}
interface Options {
  experiences: Option[];
  members: {
    userId: string;
    email: string;
    name: string | null;
    role: string;
  }[];
  me: string;
}

/** Register a case (要件 5-1): the experience or a free consultation, the wishes, the customer's name and contact, the partner's own reference. */
export function HotelCaseNew({ experience }: { experience?: string } = {}) {
  const { hotel, me } = usePortal();
  const K = t().cases,
    S = t().status,
    en = portalLang() === "en";
  const [opt, setOpt] = useState<Options | null>(null),
    [err, setErr] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [denied, setDenied] = useState(false);
  const [f, setF] = useState({
    kind: "experience",
    experience: "",
    preferredDate: "",
    altDates: "",
    timePref: "",
    guests: "2",
    lang: "en",
    requirements: "",
    customerName: "",
    customerEmail: "",
    customerCountry: "",
    partnerRef: "",
    assigneeUserId: "",
  });
  const [previousCase, setPreviousCase] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((v) => ({ ...v, [k]: e.target.value }));
  useEffect(() => {
    if (!hotel) return;
    const previous = new URLSearchParams(window.location.search).get(
      "previousCase",
    );
    const prior = previous
      ? api<{ case: { customer_name: string; customer_email: string | null } }>(
          "GET",
          "hotel/cases/" + encodeURIComponent(previous),
        )
      : Promise.resolve(null);
    Promise.all([
      prior,
      api<Options>("GET", `hotel/case-options?hotel=${hotel.id}`),
    ])
      .then(([prior, o]) => {
        if (prior && previous) {
          setPreviousCase(previous);
          setF((v) => ({
            ...v,
            customerName: prior.case.customer_name,
            customerEmail: prior.case.customer_email ?? "",
          }));
        }
        setOpt(o);
        const pre =
          experience ??
          new URLSearchParams(window.location.search).get("experience");
        setF((v) => ({
          ...v,
          experience:
            pre && o.experiences.some((x) => x.slug === pre) ? pre : "",
          assigneeUserId: o.me,
        }));
      })
      .catch((e) => {
        if ((e as { status?: number }).status === 403) setDenied(true);
        else setErr(errorText(e));
      });
  }, [hotel, experience]);
  if (denied) return <Notice tone="warn">{K.noAccess}</Notice>;
  if (err && !opt) return <Notice tone="bad">{err}</Notice>;
  if (!opt || !hotel) return <Loading />;
  const chosen =
    f.kind === "experience"
      ? opt.experiences.find((x) => x.slug === f.experience)
      : null;
  const times =
    chosen?.dates && f.preferredDate
      ? (chosen.dates.find((d) => d.date === f.preferredDate)?.times ?? [])
      : (chosen?.startTimes ?? []);
  const fields = chosen?.extraFields ?? [];
  const submit = async () => {
    if (busy) return;
    if (!f.customerName.trim()) {
      setErr(t().errors.customer_name_required);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (me.demo) {
        const id = "local-" + crypto.randomUUID();
        addLocalDemoCase({
          id,
          publicRef: "DEMO-" + id.slice(6, 14).toUpperCase(),
          experienceSlug: f.experience,
          experienceTitle: chosen?.title ?? K.kindFree,
          experienceTitleEn: chosen?.titleEn ?? K.kindFree,
          customerName: f.customerName.trim(),
          preferredDate: f.preferredDate,
          guests: f.guests,
          timePref: f.timePref,
          updatedAt: new Date().toISOString(),
        });
        window.location.href = "/partner/cases/?demo=" + id;
        return;
      }
      const r = await api<{ id: string }>("POST", "hotel/cases", {
        hotel: hotel.id,
        ...f,
        previousCase,
        guests: f.guests ? Number(f.guests) : null,
        altDates: f.altDates,
        extra,
      });
      window.location.href = `/partner/cases/${r.id}/`;
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  };
  const required = (label: string) => (
    <>
      {label}
      <span className="pt-required">{en ? "Required" : "必須"}</span>
    </>
  );
  const optional = (label: string) => label + (en ? " (optional)" : "（任意）");
  return (
    <form
      className="pt-request-form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="pt-page-description">
        {en
          ? "Tell us what your guest would like. We will check availability and prepare a quote. This request does not confirm a booking."
          : "お客様のご希望をお知らせください。運営が空き確認と見積もりを行います。この登録だけで予約は確定しません。"}
      </p>
      <Card title={`01 / ${K.wishes}`}>
        <div className="pt-form">
          {!experience && (
            <Field label={K.kind}>
              <select
                value={f.kind}
                onChange={(e) => {
                  set("kind")(e);
                  setExtra({});
                }}
              >
                <option value="experience">{K.kindExperience}</option>
                <option value="free">{K.kindFree}</option>
              </select>
            </Field>
          )}
          {!experience && f.kind === "experience" && (
            <Field
              label={required(K.experience)}
              hint={
                chosen
                  ? [chosen.area, chosen.duration, chosen.group, chosen.price]
                      .filter(Boolean)
                      .join(" · ")
                  : undefined
              }
            >
              <select
                required
                value={f.experience}
                onChange={(e) => {
                  setF((v) => ({ ...v, timePref: "" }));
                  set("experience")(e);
                  setExtra({});
                }}
              >
                <option value="">
                  {en ? "Select an experience" : "体験を選択してください"}
                </option>
                {opt.experiences.map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {en ? x.titleEn : x.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <CaseDate
            label={optional(K.date)}
            values={f.preferredDate ? [f.preferredDate] : []}
            en={en}
            onChange={(v) =>
              setF((old) => ({
                ...old,
                preferredDate: v[0] ?? "",
                timePref: "",
                altDates: old.altDates
                  .split(",")
                  .filter((d) => d && d !== v[0])
                  .join(","),
              }))
            }
          />
          <CaseDate
            label={optional(
              en ? "Alternative dates (up to 5)" : "代替日（最大5日）",
            )}
            values={f.altDates.split(",").filter(Boolean)}
            en={en}
            multiple
            onChange={(v) =>
              setF((old) => ({
                ...old,
                altDates: v.filter((d) => d !== old.preferredDate).join(","),
              }))
            }
          />
          <Field label={optional(K.timePref)}>
            {chosen?.startTimes?.length ? (
              <select value={f.timePref} onChange={set("timePref")}>
                <option value="">—</option>
                {times.map((time) => (
                  <option key={time}>{time}</option>
                ))}
              </select>
            ) : (
              <input
                value={f.timePref}
                onChange={set("timePref")}
                placeholder={K.timePh}
              />
            )}
          </Field>
          <div className="pt-guest-field">
            <label className="pt-field-l" htmlFor="case-guests">
              {optional(K.guests)}
            </label>
            <div className="pt-guest-stepper">
              <button
                type="button"
                className="pt-btn pt-btn-secondary"
                aria-label={en ? "Fewer guests" : "人数を減らす"}
                disabled={Number(f.guests) <= 1}
                onClick={() =>
                  setF((v) => ({
                    ...v,
                    guests: String(Math.max(1, Number(v.guests) - 1)),
                  }))
                }
              >
                −
              </button>
              <input
                id="case-guests"
                type="number"
                min={1}
                max={99}
                inputMode="numeric"
                value={f.guests}
                onChange={set("guests")}
              />
              <button
                type="button"
                className="pt-btn pt-btn-secondary"
                aria-label={en ? "More guests" : "人数を増やす"}
                disabled={Number(f.guests) >= 99}
                onClick={() =>
                  setF((v) => ({
                    ...v,
                    guests: String(Math.min(99, Number(v.guests) + 1)),
                  }))
                }
              >
                +
              </button>
            </div>
          </div>
          <Field label={optional(K.lang)}>
            <select value={f.lang} onChange={set("lang")}>
              {Object.entries(S.lang).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <div className="pt-form-full">
            <Field label={optional(K.requirements)}>
              <textarea
                value={f.requirements}
                onChange={set("requirements")}
                placeholder={K.requirementsPh}
              />
            </Field>
          </div>
          {fields.length > 0 && (
            <div className="pt-form-full">
              <b className="pt-small">{K.extraH}</b>
            </div>
          )}
          {fields.map((x) => (
            <Field key={x.key} label={optional(extraLabel(x))}>
              {x.type === "select" ? (
                <select
                  value={extra[x.key] ?? ""}
                  onChange={(e) =>
                    setExtra((v) => ({ ...v, [x.key]: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  {x.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {optionLabel(o)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={extra[x.key] ?? ""}
                  onChange={(e) =>
                    setExtra((v) => ({ ...v, [x.key]: e.target.value }))
                  }
                />
              )}
            </Field>
          ))}
        </div>
      </Card>
      <Card title={en ? "Guest information" : "お客様情報"}>
        <div className="pt-form">
          <Field label={required(en ? "Lead guest name" : "代表者名")}>
            <input
              readOnly={!!previousCase}
              value={f.customerName}
              onChange={set("customerName")}
              maxLength={120}
              required
            />
          </Field>
          <Field
            label={optional(en ? "Guest email" : "お客様のメールアドレス")}
          >
            <input
              type="email"
              value={f.customerEmail}
              onChange={set("customerEmail")}
            />
          </Field>
          <Field label={optional(en ? "Nationality" : "国籍")}>
            <Nationality
              en={en}
              value={f.customerCountry}
              onChange={(v) => setF((o) => ({ ...o, customerCountry: v }))}
            />
          </Field>
        </div>
      </Card>
      <Card title={en ? "Partner contact" : "貴社の担当者"}>
        <div className="pt-form">
          <Field label={K.assignee}>
            <select value={f.assigneeUserId} onChange={set("assigneeUserId")}>
              {opt.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label={K.partnerRef}>
            <input value={f.partnerRef} onChange={set("partnerRef")} />
          </Field>
        </div>
      </Card>
      {err && <Notice tone="bad">{err}</Notice>}
      <footer className="pt-case-submit">
        {!experience && (
          <Link className="pt-btn pt-btn-link" href="/partner/cases/">
            {K.backToList}
          </Link>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? K.submitting : K.submit}
        </Button>
      </footer>
    </form>
  );
}
