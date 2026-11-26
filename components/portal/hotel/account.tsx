"use client";
import { GuestGuideDefault } from "../guest-guide";
import { useState, useEffect } from "react";
import { usePortal } from "../shell";
import { Button, Card, Field, Notice } from "../ui";
import { api, errorText } from "../client";
export function PartnerAccount() {
  const { hotel, me, lang } = usePortal(),
    en = lang === "en";
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const [members, setMembers] = useState<
    { userId: string; name: string | null; email: string }[]
  >([]);
  const manage =
    hotel?.features?.cases &&
    me.memberships?.some(
      (m) =>
        m.role === "partner_manager" &&
        m.scopeId === hotel.id &&
        m.scopeType === "hotel",
    );
  const staff=manage&&hotel?.features?.members;
  useEffect(() => {
    if (!staff || !hotel) return;
    let live = true;
    api<{ members: typeof members }>(
      "GET",
      "hotel/case-options?hotel=" + hotel.id,
    )
      .then((r) => {
        if (live) setMembers(r.members);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      });
    return () => {
      live = false;
    };
  }, [staff, hotel, version]);
  if (!manage)
    return (
      <Notice>
        {en
          ? "Member management requires manager access."
          : "担当者登録は権限を持つ管理者が利用できます。"}
      </Notice>
    );
  return (<>
    {!me.demo&&hotel&&<GuestGuideDefault path="hotel/guest-guide-settings" site={hotel.id} en={en}/>}
    {staff&&<Card title={en ? "Team members" : "担当者登録"}>
      <ul>
        {members.map((m) => (
          <li key={m.userId}>
            {m.name} {m.email}
          </li>
        ))}
      </ul>
      <form
        className="pt-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          setMessage("");
          try {
            const r = await api<{ mail: string }>("POST", "hotel/staff", {
              hotel: hotel!.id,
              name,
              email,
              lang,
            });
            setMessage(
              (en ? "Member registered" : "担当者を登録しました") +
                " · " +
                r.mail,
            );
            setEmail("");
            setName("");
            setVersion((v) => v + 1);
          } catch (ex) {
            setError(errorText(ex));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={en ? "Name" : "担当者名"}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={en ? "Email" : "メールアドレス"}>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy || me.demo}>
          {en ? "Register and invite" : "登録して招待する"}
        </Button>
      </form>
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="bad">{error}</Notice>}
    </Card>}
  </>);
}
