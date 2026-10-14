import type { Enquiry } from "@/lib/contact";
import { GOLF_PRICE_VERSION, golfPackagePrice, isGolfArea, isGolfGolfers } from "@/lib/golf-prices";
import { SIGN, acknowledgement, followUp, threadSubject } from "@/lib/mail-copy";

export interface GolfAutomationEnv { GOLF_AUTOMATION_URL?: string; GOLF_AUTOMATION_TOKEN?: string }
export const automationConfigured = (env: GolfAutomationEnv) => !!env.GOLF_AUTOMATION_URL && !!env.GOLF_AUTOMATION_TOKEN;

/** This endpoint stores the request before acknowledging it, deduplicates by
 * requestId, and owns BOTH delayed messages. Never also schedule the old 15m mail. */
export async function submitGolfAutomation(env: GolfAutomationEnv, e: Enquiry, title: string | undefined, teamText: string, ledger: unknown) {
  if (!env.GOLF_AUTOMATION_URL?.startsWith("https://script.google.com/macros/s/") || !env.GOLF_AUTOMATION_TOKEN) throw new Error("Golf automation is not configured");
  const golfers = Number(e.party);
  const price = isGolfArea(e.areaId) && isGolfGolfers(golfers) ? golfPackagePrice(e.areaId, golfers, e.courseMode) : null;
  const res = await fetch(env.GOLF_AUTOMATION_URL, {
    method: "POST", headers: { "content-type": "application/json" }, redirect: "follow", signal: AbortSignal.timeout(25000),
    body: JSON.stringify({ action: "enqueue", token: env.GOLF_AUTOMATION_TOKEN,
      requestId: e.requestId, enquiry: e, receivedAt: new Date().toISOString(), priceVersion: GOLF_PRICE_VERSION,
      baseTotal: price?.groupTotal ?? null, ack: acknowledgement(e, title), followUp: followUp(e, title),
      payment: paymentTemplate(e, title), subject: threadSubject(e, title), teamText, ledger,
    }),
  });
  if (!res.ok) throw new Error("Golf automation did not accept the request");
  const result = await res.json() as { ok?: boolean; id?: string; error?: string; ackSent?: boolean };
  if (!result.ok || !result.id) throw new Error("Golf automation could not persist the request");
  return result;
}

/** A reviewed English template; other languages stay manual until their payment
 * templates have been reviewed. Amount/link placeholders are replaced by the
 * queue from the approved live master, never by customer input or an LLM. */
export function paymentTemplate(e: Enquiry, title?: string) {
  const day = e.dates?.slice(0, 10) ?? "";
  const date = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return null;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const before = (days: number) => fmt(new Date(date.getTime() - days * 86400000));
  const courses = e.areaId === "fuji" ? ["Fuji Oyama Golf Club", "Asagiri Country Club", "Sanko Golf Club, Fuji Course", "Fuji Heigen Golf Club", "Fuji Country Club"] : ["Chiba Isumi Golf Club", "Anegasaki Country Club", "PGM Sohsei Golf Club", "Bristol Hill Golf Club", "Narita Hills Country Club", "Tateno Classic Golf Club"];
  const text = [
    `Hello ${e.name},`, "", `Thank you for your request. We would be happy to arrange a private golf day in the ${e.areaId === "fuji" ? "Mt. Fuji area" : "Tokyo area"} on ${fmt(date)} for ${e.party} golfers.`, "",
    "Your golf day", `• Pick-up and return: ${e.pickup || "Please confirm your hotel"}`, `• Preferred departure: ${e.dates?.slice(11) || "To be arranged"}. We will confirm the final pick-up time with your course and tee time.`, `• Players: ${e.party}`, `• Rental clubs: ${e.rental || "Please confirm each golfer's requirements"}`, ...(e.clubs ? [`• Club preferences: ${e.clubs}`] : []), "• Clubhouse lunch: included", "{{CADDIE_LINE}}", "",
    "Your course, arranged by our team", "We will select and reserve a suitable course from the following options, depending on availability:", ...courses.map(c => `• ${c}`), "",
    "Once you approve the package and complete payment, our team takes care of your course reservation, tee time, private transfers and rental arrangements. We will send your confirmed course and tee time within 24 hours of payment.",
    "Your booking is confirmed when we send those details. If we cannot arrange a suitable course, we will discuss an alternative with you or provide a full refund. We will not make changes or add charges without your agreement.", "",
    "Price", "The total is ¥{{TOTAL}}, including tax — approximately ¥{{PER_PERSON}} per golfer.", "This includes private return hotel transfers, green fees, a golf cart, standard rental clubs, clubhouse lunch and English-speaking assistance. Your guide assists with transfers and clubhouse arrangements; your group plays independently.",
    "Golf shoes and gloves are not included. Please bring your own. If you need rental shoes, send your sizes so we can check availability and any additional charge.", "",
    "Payment", "To proceed with these arrangements, please use our secure Stripe payment link:", "{{PAYMENT_URL}}", "",
    "Cancellation — all dates and times are Japan time", `• Free cancellation until 6:00 pm on ${before(7)}.`, `• After that deadline through ${before(3)}: 50% of the total price.`, `• From ${before(2)}: 100% of the total price.`,
    "If the free-cancellation deadline has already passed, please review the applicable cancellation charge before paying.", "If the course closes because of weather, the club makes the closure decision, sometimes on the day. You will be refunded the amount paid less any costs already incurred.", "",
    "A few details to complete your arrangements", "Please confirm your hotel's full name and address, all golfers' full names, and whether each rental set should be men's or women's, with any shaft-flex preference. If you have already provided these details, there is no need to send them again.", "Driver and guide contact details will follow the day before your golf day.", "", "I look forward to arranging an enjoyable day for your group.", "", SIGN.en.replace(/^-----\n/, ""),
  ].join("\n");
  return { subject: threadSubject(e, title), text };
}
