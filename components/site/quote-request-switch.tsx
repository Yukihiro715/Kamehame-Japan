"use client";
import { useBooking } from "@/components/site/booking-context";
import type { Lang } from "@/lib/i18n";
export const quoteCopy = {
  en: { start: "Request a quote for children or special arrangements", back: "Return to standard booking", heading: "Request a custom quote", note: "No payment now. Tell us the children's ages or your requirements. We will check with the host and email your quote and payment instructions.", details: "Children's ages and special requirements (required)" },
  ja: { start: "子供料金・特別手配のお見積もり", back: "通常の仮予約・決済に戻る", heading: "個別見積もりを依頼", note: "この時点ではお支払いは不要です。お子様の年齢やご希望をお知らせください。施設へ確認後、お見積もりとお支払い方法をメールでご案内します。", details: "お子様の年齢・特別手配のご希望（必須）" },
  es: { start: "Solicitar presupuesto para niños o servicios especiales", back: "Volver a la reserva estándar", heading: "Solicitar presupuesto personalizado", note: "Sin pago ahora. Indica las edades de los niños o tus necesidades. Consultaremos con el anfitrión y enviaremos el presupuesto y las instrucciones de pago por correo.", details: "Edades de los niños y necesidades especiales (obligatorio)" },
  fr: { start: "Demander un devis pour enfants ou prestations particulières", back: "Revenir à la réservation standard", heading: "Demander un devis personnalisé", note: "Aucun paiement maintenant. Indiquez l’âge des enfants ou vos besoins. Nous vérifierons auprès de l’hôte puis vous enverrons le devis et les modalités de paiement par e-mail.", details: "Âge des enfants et besoins particuliers (obligatoire)" },
  "zh-tw": { start: "詢問兒童費用或特殊安排報價", back: "返回一般暫訂與付款", heading: "申請個別報價", note: "目前無需付款。請告知兒童年齡或特殊需求。我們向主辦單位確認後，會以郵件提供報價與付款方式。", details: "兒童年齡與特殊需求（必填）" },
};
export function QuoteRequestSwitch({lang,onStart}:{lang:Lang;onStart?:()=>void}) {
  const b=useBooking();
  if(!b?.experience.provisionalCheckout)return null;
  const Q=quoteCopy[lang];
  if(b.largeParty)return <div className="quote-request-switch"><p role="status">{Q.note}</p></div>;
  return <div className="quote-request-switch"><button type="button" className="underlined-link" aria-pressed={!!b.quoteRequested} onClick={()=>{b.set({quoteRequested:!b.quoteRequested});if(!b.quoteRequested)onStart?.();}}>{b.quoteRequested?Q.back:Q.start}</button>{b.quoteRequested&&<p role="status">{Q.note}</p>}</div>;
}
export function BookingRequestHeading({lang,defaultTitle}:{lang:Lang;defaultTitle:string}) {
  const b=useBooking();
  return <h2 className="xp-sub" id="request-form">{b?.experience.provisionalCheckout&&(b.quoteRequested||b.largeParty)?quoteCopy[lang].heading:defaultTitle}</h2>;
}
