/** Mail for shared-bus golf tour enquiries. Customer-facing text shows one
 *  tax-inclusive total and the rental option only; the partner's price and
 *  the amount added per person appear in staff and partner mail alone. */
import { yen, type PublicTour } from "./golfpaq";

export interface EnquiryFacts {
  reference: string; tour: Pick<PublicTour, "course" | "date" | "departure" | "pickup">;
  people: number; renters: number; perPersonYen: number; toursYen: number; rentalsYen: number; totalYen: number;
  name: string; email: string; phone?: string; note?: string; lang: string;
}
export interface InternalFacts extends EnquiryFacts { sourceYen: number; feeYen: number; seatsShown: number | null; snapshotUpdatedAt: string | null; tourId: string }

const dateEn = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dateJa = (d: string) => { const x = new Date(`${d}T00:00:00Z`); return `${x.getUTCFullYear()}年${x.getUTCMonth() + 1}月${x.getUTCDate()}日（${"日月火水木金土"[x.getUTCDay()]}）`; };
const departureEn = (t: EnquiryFacts["tour"]) => `${t.departure.area}${t.departure.via ? ` ${t.departure.via}` : ""}${t.departure.time ? `, departs ${t.departure.time}` : ""}`;

/** The customer's lines: totals only (要件 1, 2, 6). */
export function priceLinesEn(f: EnquiryFacts): string[] {
  const lines = [`Tour price: ${yen(f.perPersonYen)} /person × ${f.people} = ${yen(f.toursYen)}`];
  if (f.renters > 0) lines.push(`Rental clubs: ¥5,500 /person × ${f.renters} = ${yen(f.rentalsYen)}`);
  lines.push(`Total (tax included): ${yen(f.totalYen)}`);
  return lines;
}
export function priceLinesJa(f: EnquiryFacts): string[] {
  const lines = [`ツアー料金: ${yen(f.perPersonYen)} /人 × ${f.people}名 = ${yen(f.toursYen)}`];
  if (f.renters > 0) lines.push(`レンタルクラブ: ¥5,500 /人 × ${f.renters}名 = ${yen(f.rentalsYen)}`);
  lines.push(`合計（税込）: ${yen(f.totalYen)}`);
  return lines;
}

/** The acknowledgement the customer receives right after sending (要件 3, 6). */
export function customerConfirmation(f: EnquiryFacts): { subject: string; text: string } {
  const en = [
    `Thank you for your enquiry!`,
    ``,
    `We have received your request.`,
    `Our travel partner will contact you by email with the purchase details and next steps.`,
    `Your booking is not yet confirmed, and no payment has been taken.`,
    ``,
    `Enquiry reference: ${f.reference}`,
    `Tour: ${f.tour.course}`,
    `Date: ${dateEn(f.tour.date)}`,
    `Departure: ${departureEn(f.tour)}`,
    `Golfers: ${f.people}${f.renters ? ` (rental clubs for ${f.renters})` : ""}`,
    ...priceLinesEn(f),
    ``,
    `The price includes the round of golf and round-trip bus transportation. Availability is subject to final confirmation.`,
    ``,
    `How booking works`,
    `1. Our travel partner emails you the purchase details and payment instructions.`,
    `2. You review the terms and complete your purchase with the travel partner.`,
    `3. Once your booking is confirmed, you receive the meeting details and our golf guide.`,
    ``,
    `Questions? Reply to this email.`,
    ``,
    `KAMEHAME JAPAN`,
    `hello@kamehame-japan.com`,
  ];
  const ja = f.lang === "ja" ? [
    ``, `――――――――――――`, ``,
    `お問い合わせありがとうございます。`,
    `内容を受け付けました。提携旅行会社より、購入方法とお支払いについてメールでご案内します。`,
    `当サイトでのお支払いは不要です。お問い合わせのみでは予約は確定しません。`,
    ``,
    `受付番号: ${f.reference}`,
    `ツアー: ${f.tour.course}`,
    `日程: ${dateJa(f.tour.date)}`,
    `出発: ${f.tour.pickup}${f.tour.departure.time ? ` ${f.tour.departure.time}発` : ""}`,
    `人数: ${f.people}名${f.renters ? `（レンタルクラブ ${f.renters}名）` : ""}`,
    ...priceLinesJa(f),
    ``,
    `料金にはゴルフのプレーと往復バスが含まれます。空席は最終確認の結果によります。`,
  ] : [];
  return { subject: `Your enquiry ${f.reference}: ${f.tour.course}, ${f.tour.date} | KAMEHAME JAPAN`, text: [...en, ...ja].join("\n") };
}

/** Staff copy (internal: includes the breakdown). */
export function staffNotification(f: InternalFacts): { subject: string; text: string } {
  return {
    subject: `[乗合ゴルフ] ${f.tour.date} ${f.tour.course} ${f.people}名 ${f.reference}`,
    text: [
      `受付番号: ${f.reference}`,
      `ツアー: ${f.tour.course}（${f.tourId}）`,
      `日程: ${f.tour.date} / 出発: ${f.tour.pickup}${f.tour.departure.time ? ` ${f.tour.departure.time}` : ""}`,
      `人数: ${f.people}名 / レンタル: ${f.renters}名 / 表示残席: ${f.seatsShown ?? "?"}（データ更新 ${f.snapshotUpdatedAt ?? "?"}）`,
      ``,
      `【社内内訳・非公開】`,
      `GOLFPAQ価格: ${yen(f.sourceYen)} /人`,
      `KAMEHAME追加分: ${yen(f.feeYen)} /人`,
      `お客様表示: ${yen(f.perPersonYen)} /人 × ${f.people} = ${yen(f.toursYen)}`,
      `レンタル: ¥5,500 × ${f.renters} = ${yen(f.rentalsYen)}`,
      `お客様総額: ${yen(f.totalYen)}`,
      `粗利相当（レンタル除く）: ${yen(f.feeYen * f.people)}`,
      ``,
      `お名前: ${f.name}`,
      `メール: ${f.email}`,
      `電話: ${f.phone || "—"}`,
      `備考: ${f.note || "—"}`,
      `言語: ${f.lang}`,
      ``,
      `次: 提携旅行会社へ引き継ぎ → 購入案内メール → 購入 → 予約確定。運営画面 /ops/bus-tours/ で状態を更新してください。`,
    ].join("\n"),
  };
}

/** Hand-over to the travel partner (internal: includes the breakdown they need to invoice). */
export function partnerHandover(f: InternalFacts): { subject: string; text: string } {
  return {
    subject: `【引き継ぎ】乗合ゴルフ ${f.tour.date} ${f.tour.course} ${f.people}名（${f.reference}）`,
    text: [
      `KAMEHAME JAPAN より、乗合バスゴルフツアーのお問い合わせを引き継ぎます。購入方法・料金・条件のご案内をお客様へお願いします。`,
      ``,
      `受付番号: ${f.reference}`,
      `ツアー: ${f.tour.course}`,
      `開催日: ${f.tour.date}`,
      `出発プラン: ${f.tour.pickup}${f.tour.departure.time ? `（${f.tour.departure.time}発）` : ""}`,
      `参加人数: ${f.people}名`,
      `レンタルクラブ希望: ${f.renters}名`,
      `お客様表示料金: ${yen(f.perPersonYen)} /人（税込）、レンタル ¥5,500 /人`,
      `お客様総額: ${yen(f.totalYen)}（税込）`,
      ``,
      `【内訳（お客様には非表示）】`,
      `GOLFPAQ販売価格: ${yen(f.sourceYen)} /人`,
      `追加分: ${yen(f.feeYen)} /人`,
      ``,
      `お名前: ${f.name}`,
      `メール: ${f.email}`,
      `電話: ${f.phone || "—"}`,
      `備考: ${f.note || "—"}`,
      `希望言語: ${f.lang}`,
      ``,
      `お客様には「提携旅行会社から購入方法のご案内が届く」「問い合わせのみでは予約確定・決済は発生しない」と案内済みです。`,
      `購入案内には、ツアー・開催日、人数・レンタル、最新料金、契約・販売会社名、購入方法・支払い先、予約成立条件、キャンセル・返金条件、問い合わせ先を含めてください。`,
    ].join("\n"),
  };
}

/** A draft the partner (or operations, on the partner's approved route) can send: totals only, placeholders for the seller's own particulars. */
export function purchaseGuidanceDraft(f: EnquiryFacts, seller: { name: string; registration: string; contact: string } = { name: "[販売会社名]", registration: "[旅行業登録番号]", contact: "[問い合わせ先]" }): { subject: string; text: string } {
  return {
    subject: `Purchase instructions for your golf tour (${f.reference})`,
    text: [
      `Dear ${f.name},`,
      ``,
      `Thank you for your enquiry through KAMEHAME JAPAN. Here is how to complete your purchase.`,
      ``,
      `Tour: ${f.tour.course}`,
      `Date: ${dateEn(f.tour.date)}`,
      `Departure: ${departureEn(f.tour)}`,
      `Golfers: ${f.people}${f.renters ? ` (rental clubs for ${f.renters})` : ""}`,
      ...priceLinesEn(f),
      ``,
      `Seller: ${seller.name} (travel agency registration ${seller.registration})`,
      `How to pay: [購入方法・支払い先]`,
      `Your booking is confirmed when: [予約成立条件]`,
      `Cancellation and refunds: [キャンセル・返金条件]`,
      `Contact: ${seller.contact}`,
      ``,
      `Availability is subject to final confirmation at the time of purchase. If the tour cannot be secured after payment, we will offer an alternative or refund the purchase in full.`,
    ].join("\n"),
  };
}
