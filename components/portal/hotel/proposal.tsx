"use client";
import { useState } from "react";
import { Button, Card, Field, Notice } from "../ui";
import type { CaseView, QuoteView } from "../case-common";

export function AgencyProposal({
  c,
  q,
  en,
}: {
  c: CaseView;
  q: QuoteView;
  en: boolean;
}) {
  const [language, setLanguage] = useState(en ? "en" : "ja"),
    [amount, setAmount] = useState(""),
    [show, setShow] = useState(false),
    [error, setError] = useState("");
  function print() {
    const win = window.open("", "_blank");
    if (!win) {
      setError(
        en
          ? "Allow pop-ups to open the proposal."
          : "ポップアップを許可してください。",
      );
      return;
    }
    win.opener = null;
    const doc = win.document,
      isEn = language === "en";
    doc.documentElement.lang = language;
    doc.title = isEn ? "Experience proposal" : "体験のご提案";
    const style = doc.createElement("style");
    style.textContent =
      "body{max-width:680px;margin:56px auto;padding:24px;color:#222;font:16px/1.7 sans-serif}h1{border-bottom:3px solid #ee7c18}p{white-space:pre-wrap}h3{margin-bottom:0}";
    doc.head.append(style);
    function line(tag: string, value: string) {
      const node = doc.createElement(tag);
      node.textContent = value;
      doc.body.append(node);
    }
    line("p", c.siteName);
    line("h1", doc.title);
    line("h2", isEn ? c.experienceTitleEn : c.experienceTitle);
    line(
      "p",
      [
        c.customer_name,
        c.preferred_date,
        c.time_pref,
        c.guests ? (isEn ? c.guests + " guests" : c.guests + "名") : "",
      ]
        .filter(Boolean)
        .join(" · "),
    );
    if (show)
      line(
        "h3",
        (isEn ? "Total price  " : "ご提案総額　") +
          "JPY " +
          Number(amount).toLocaleString(),
      );
    for (const [title, value] of [
      [isEn ? "Includes" : "含まれるもの", q.includes],
      [isEn ? "Excludes" : "含まれないもの", q.excludes],
      [
        isEn ? "Pay locally" : "現地でのお支払い",
        q.onsiteJpy ? "JPY " + q.onsiteJpy.toLocaleString() : "",
      ],
      [isEn ? "Local payment details" : "現地払いの詳細", q.onsiteNote],
      [isEn ? "Cancellation" : "キャンセル条件", q.cancelTerms],
      [isEn ? "Booking conditions" : "予約条件", q.confirmationNote],
      [isEn ? "Offer valid through" : "回答期限", q.validUntil],
    ]) {
      if (title && value) {
        line("h3", title);
        line("p", value);
      }
    }
    win.focus();
    win.print();
  }
  return (
    <Card title={en ? "Customer proposal" : "顧客向け提案書"}>
      <form
        className="pt-form"
        onSubmit={(e) => {
          e.preventDefault();
          print();
        }}
      >
        <Field label={en ? "PDF language" : "PDFの見出し言語"}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </Field>
        <label>
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
          />
          {en ? "Include selling price" : "販売総額を掲載する"}
        </label>
        {show && (
          <Field label={en ? "Selling price (JPY)" : "販売総額（円）"}>
            <input
              type="number"
              required
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
        )}
        <Button type="submit">
          {en ? "Print / save PDF" : "印刷・PDF保存"}
        </Button>
        {error && <Notice>{error}</Notice>}
      </form>
    </Card>
  );
}
