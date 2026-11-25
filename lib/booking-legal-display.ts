import type { Lang } from "@/lib/i18n";
import { provisionalCopy } from "@/lib/provisional-booking";

export function paymentDisclosure(lang: Lang) {
  // The underlying legal texts use English except in the Japanese edition.
  const japanese = lang === "ja";
  const provisional = provisionalCopy(japanese ? "ja" : "en");
  return {
    paidTitle: japanese ? "体験ページで先に決済する仮予約" : "Paid provisional bookings",
    enquiryTitle: japanese ? "空き状況のお問い合わせからのお申し込み" : "Bookings made by availability enquiry",
    priorIntro: japanese
      ? "「仮予約として決済」と表示された体験には、上記に優先して以下が適用されます。"
      : "For experiences explicitly offered as a paid provisional booking, the following takes precedence:",
    paid: `${provisional.note} ${provisional.cancellation} ${provisional.refund}`,
    methods: japanese
      ? "体験ページの決済ボタンまたはメールでご案内する決済リンクからStripeの決済画面に進みます。銀行振込はご案内がある場合にご利用いただけます。"
      : "Pay by credit card through Stripe Checkout from the experience page or the payment link in your availability email. Bank transfer is available where offered.",
  };
}
