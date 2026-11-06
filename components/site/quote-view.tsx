"use client";

/** The customer's side of a partner case (docs/PARTNER_PLATFORM_STAGE1.md 4.5):
 *  what was quoted, the terms, and the payment button. Nothing here names the
 *  partner, the commission or an internal reference. */
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

export interface QuoteViewData {
  state: "open" | "paid" | "expired" | "superseded" | "void"; lang: Lang; title: string; experienceTitle: string; date: string | null; guests: number | null;
  lines: { description: string; quantity: number; unitJpy: number; grossJpy: number; onsite: boolean }[]; totalJpy: number; onsiteJpy: number;
  includes: string | null; excludes: string | null; onsiteNote: string | null; cancelTerms: string | null; confirmationNote: string | null; validUntil: string | null;
  paymentMode: string; canPay: boolean; customerName: string; version: number; newerToken: string | null;
}
export interface QuoteFile { key: string; name: string; type: string; size: number | null; at: string }

const T: Record<Lang, Record<string, string>> = {
  en: { h: "Your quote", for: "Prepared for", experience: "Experience", date: "Date", alt: "Alternative dates", time: "Time", guests: "Guests", items: "What you pay", qty: "Qty", amount: "Amount", onsite: "paid on the day", total: "Total (tax included)", onsiteTotal: "Paid on the day", includes: "Included", excludes: "Not included", onsiteNote: "Paid on the day", cancel: "Cancellation", confirm: "How the booking is confirmed", valid: "Quote valid until", pay: "Pay securely by card", paying: "Opening payment…", payNote: "Payment is handled by Stripe. You will receive a receipt by e-mail.", docs: "Documents", paid: "Thank you, your payment is complete.", paidBody: "We are confirming your booking with the venue and will e-mail you the confirmation and the meeting details.", paidQuery: "Thank you. We are checking your payment and will confirm shortly.", expired: "This quote has expired.", expiredBody: "Please ask the person who sent you this link for an updated quote.", superseded: "There is a newer version of this quote.", open: "Open the current quote", void: "This quote is no longer available.", external: "Payment for this booking is arranged separately; no online payment is needed here.", none: "There is nothing to pay online: everything is paid on the day.", questions: "Questions? Reply to the e-mail you received, or write to", version: "Version" },
  ja: { h: "お見積もり", for: "宛名", experience: "体験", date: "日程", alt: "代替日", time: "時間帯", guests: "人数", items: "お支払い内容", qty: "数量", amount: "金額", onsite: "現地払い", total: "合計（税込）", onsiteTotal: "現地払い合計", includes: "含まれるもの", excludes: "含まれないもの", onsiteNote: "現地払いについて", cancel: "キャンセル条件", confirm: "予約確定について", valid: "見積もりの有効期限", pay: "カードで安全にお支払い", paying: "お支払い画面を開いています…", payNote: "お支払いは Stripe で処理されます。領収書はメールでお届けします。", docs: "資料", paid: "お支払いありがとうございます。", paidBody: "会場と予約を確定し、確認書と集合のご案内をメールでお送りします。", paidQuery: "ありがとうございます。お支払いを確認中です。まもなくご連絡します。", expired: "この見積もりは有効期限を過ぎました。", expiredBody: "このリンクをお送りした担当者に、新しい見積もりをご依頼ください。", superseded: "この見積もりには新しい版があります。", open: "最新の見積もりを開く", void: "この見積もりは現在ご利用いただけません。", external: "このご予約のお支払いは別途ご案内します。ここでのオンライン決済は不要です。", none: "オンラインでのお支払いはありません。すべて当日現地でお支払いください。", questions: "ご質問は、お受け取りのメールへの返信、または次の宛先へ:", version: "版" },
  es: { h: "Su presupuesto", for: "Preparado para", experience: "Experiencia", date: "Fecha", alt: "Fechas alternativas", time: "Horario", guests: "Personas", items: "Lo que paga", qty: "Cant.", amount: "Importe", onsite: "se paga el día", total: "Total (impuestos incluidos)", onsiteTotal: "Se paga el día", includes: "Incluido", excludes: "No incluido", onsiteNote: "Pago en el lugar", cancel: "Cancelación", confirm: "Cómo se confirma la reserva", valid: "Presupuesto válido hasta", pay: "Pagar con tarjeta de forma segura", paying: "Abriendo el pago…", payNote: "El pago lo gestiona Stripe. Recibirá un recibo por correo.", docs: "Documentos", paid: "Gracias, su pago se ha completado.", paidBody: "Estamos confirmando la reserva con el lugar y le enviaremos la confirmación y el punto de encuentro por correo.", paidQuery: "Gracias. Estamos comprobando su pago y confirmaremos en breve.", expired: "Este presupuesto ha caducado.", expiredBody: "Pida un presupuesto actualizado a la persona que le envió este enlace.", superseded: "Hay una versión más reciente de este presupuesto.", open: "Abrir el presupuesto actual", void: "Este presupuesto ya no está disponible.", external: "El pago de esta reserva se gestiona aparte; no hace falta pagar aquí.", none: "No hay nada que pagar en línea: todo se paga el día.", questions: "¿Preguntas? Responda al correo recibido o escriba a", version: "Versión" },
  fr: { h: "Votre devis", for: "Préparé pour", experience: "Expérience", date: "Date", alt: "Dates alternatives", time: "Horaire", guests: "Participants", items: "Ce que vous réglez", qty: "Qté", amount: "Montant", onsite: "réglé sur place", total: "Total (taxes comprises)", onsiteTotal: "Réglé sur place", includes: "Inclus", excludes: "Non inclus", onsiteNote: "Règlement sur place", cancel: "Annulation", confirm: "Confirmation de la réservation", valid: "Devis valable jusqu'au", pay: "Payer par carte en toute sécurité", paying: "Ouverture du paiement…", payNote: "Le paiement est traité par Stripe. Vous recevrez un reçu par e-mail.", docs: "Documents", paid: "Merci, votre paiement est effectué.", paidBody: "Nous confirmons la réservation auprès du lieu et vous enverrons la confirmation et le point de rendez-vous par e-mail.", paidQuery: "Merci. Nous vérifions votre paiement et confirmons sous peu.", expired: "Ce devis a expiré.", expiredBody: "Demandez un devis à jour à la personne qui vous a envoyé ce lien.", superseded: "Une version plus récente de ce devis existe.", open: "Ouvrir le devis actuel", void: "Ce devis n'est plus disponible.", external: "Le règlement de cette réservation est organisé séparément ; aucun paiement en ligne ici.", none: "Rien à régler en ligne : tout se règle sur place.", questions: "Des questions ? Répondez à l'e-mail reçu ou écrivez à", version: "Version" },
  "zh-tw": { h: "您的報價", for: "收件人", experience: "體驗", date: "日期", alt: "備選日期", time: "時段", guests: "人數", items: "付款內容", qty: "數量", amount: "金額", onsite: "當日現場支付", total: "合計（含稅）", onsiteTotal: "現場支付合計", includes: "包含項目", excludes: "不包含項目", onsiteNote: "現場支付說明", cancel: "取消條款", confirm: "預約確認方式", valid: "報價有效期限", pay: "以信用卡安全付款", paying: "正在開啟付款頁面…", payNote: "付款由 Stripe 處理，收據將以電子郵件寄送。", docs: "資料", paid: "感謝您，付款已完成。", paidBody: "我們正在向場地確認預約，確認書與集合資訊將以電子郵件寄給您。", paidQuery: "感謝您。我們正在確認付款，稍後將與您聯繫。", expired: "此報價已過期。", expiredBody: "請向寄送此連結的人員索取最新報價。", superseded: "此報價已有新版本。", open: "開啟最新報價", void: "此報價目前無法使用。", external: "本預約的付款另行安排，此處無需線上付款。", none: "無需線上付款，所有費用於當日現場支付。", questions: "如有疑問，請回覆您收到的電子郵件，或來信至", version: "版本" },
};
const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;

export function QuoteView({ v, files, token, contactEmail }: { v: QuoteViewData; files: QuoteFile[]; token: string; contactEmail: string }) {
  const t = T[v.lang] ?? T.en;
  const [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null), [paidQuery, setPaidQuery] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after mount (Stripe's success_url)
  useEffect(() => { try { if (new URLSearchParams(window.location.search).get("paid") === "1") setPaidQuery(true); } catch { /* ignore */ } }, []);
  const pay = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`/api/quote/${encodeURIComponent(token)}/checkout`, { method: "POST", headers: { "content-type": "application/json" } });
      const d = (await r.json()) as { ok: boolean; url?: string; error?: string };
      if (d.ok && d.url) { window.location.href = d.url; return; }
      setErr(d.error === "checkout_unavailable" ? "Payment is temporarily unavailable. Please try again in a few minutes." : d.error ?? "error");
    } catch { setErr("Payment is temporarily unavailable. Please try again in a few minutes."); }
    setBusy(false);
  };
  const banner = v.state === "paid" ? <div className="qt-banner qt-ok"><b>{t.paid}</b><p>{t.paidBody}</p></div>
    : paidQuery ? <div className="qt-banner qt-ok"><b>{t.paidQuery}</b></div>
    : v.state === "expired" ? <div className="qt-banner qt-warn"><b>{t.expired}</b><p>{t.expiredBody}</p></div>
    : v.state === "superseded" ? <div className="qt-banner qt-warn"><b>{t.superseded}</b>{v.newerToken && <p><a className="gb-btn gb-btn-small" href={`/${v.lang}/quote/${v.newerToken}/`}>{t.open}</a></p>}</div>
    : v.state === "void" ? <div className="qt-banner qt-warn"><b>{t.void}</b></div> : null;
  return (
    <div className="qt">
      <p className="qt-for">{t.for}: <b>{v.customerName}</b> · {t.version} {v.version}</p>
      {banner}
      <h2 className="qt-title">{v.title}</h2>
      <dl className="qt-facts">
        <dt>{t.experience}</dt><dd>{v.experienceTitle}</dd>
        <dt>{t.date}</dt><dd>{v.date ?? "—"}</dd>
        {v.guests !== null && <><dt>{t.guests}</dt><dd>{v.guests}</dd></>}
      </dl>
      <h3>{t.items}</h3>
      <table className="qt-table">
        <thead><tr><th /><th className="num">{t.qty}</th><th className="num">{t.amount}</th></tr></thead>
        <tbody>
          {v.lines.map((l, i) => <tr key={i} className={l.onsite ? "qt-onsite" : ""}><td>{l.description}{l.onsite && <small> ({t.onsite})</small>}</td><td className="num">{l.quantity}</td><td className="num">{yen(l.grossJpy)}</td></tr>)}
          <tr className="qt-total"><td colSpan={2}>{t.total}</td><td className="num">{yen(v.totalJpy)}</td></tr>
          {v.onsiteJpy > 0 && <tr className="qt-onsite"><td colSpan={2}>{t.onsiteTotal}</td><td className="num">{yen(v.onsiteJpy)}</td></tr>}
        </tbody>
      </table>
      {v.state === "open" && (
        <div className="qt-pay">
          {v.canPay ? (
            <>
              <button type="button" className="gb-btn gb-btn-big" disabled={busy} onClick={() => void pay()}>{busy ? t.paying : t.pay}</button>
              <p className="qt-small">{t.payNote}</p>
              {err && <p className="qt-err">{err}</p>}
            </>
          ) : <p className="qt-small">{v.paymentMode === "external" ? t.external : t.none}</p>}
        </div>
      )}
      <dl className="qt-terms">
        {v.includes && <><dt>{t.includes}</dt><dd>{v.includes}</dd></>}
        {v.excludes && <><dt>{t.excludes}</dt><dd>{v.excludes}</dd></>}
        {v.onsiteNote && <><dt>{t.onsiteNote}</dt><dd>{v.onsiteNote}</dd></>}
        {v.cancelTerms && <><dt>{t.cancel}</dt><dd>{v.cancelTerms}</dd></>}
        {v.confirmationNote && <><dt>{t.confirm}</dt><dd>{v.confirmationNote}</dd></>}
        {v.validUntil && <><dt>{t.valid}</dt><dd>{v.validUntil}</dd></>}
      </dl>
      {files.length > 0 && (
        <section className="qt-docs"><h3>{t.docs}</h3><ul>{files.map((f) => <li key={f.key}><a href={`/api/quote/${encodeURIComponent(token)}/file?key=${encodeURIComponent(f.key)}`} target="_blank" rel="noreferrer">{f.name}</a></li>)}</ul></section>
      )}
      <p className="qt-small">{t.questions} <a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
    </div>
  );
}
