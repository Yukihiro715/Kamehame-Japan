/** Photo email layout approved on 15 October. Assets are the approved originals.
 * Content comes from the text alternative; no independent price/cancellation copy.
 */
export const GOLF_EMAIL_VERSION = "photo-2026-10-16";
const photos = {
  fuji: [["fuji-oyama", "Fuji Oyama Golf Club"], ["asagiri", "Asagiri Country Club"]],
  tokyo: [["chiba-isumi", "Chiba Isumi Golf Club"], ["bristol-hill", "Bristol Hill Golf Club"]],
};
export function escapeEmailHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const heading = (s: string) => `<h2 style="font-size:19px;line-height:1.45;color:#234b41;margin:30px 0 16px">${s}</h2>`;
const button = () => `<p style="margin:24px 0"><a href="{{PAYMENT_URL}}" style="display:inline-block;background:#234b41;color:#ffffff;text-decoration:none;padding:16px 24px;border-radius:4px;font-size:17px;font-weight:bold">Proceed to payment — ¥{{TOTAL}}</a></p>`;
export function golfEmailHtml(text: string, area: string | undefined, payment = false): string {
  const cards = (area === "fuji" ? photos.fuji : photos.tokyo).map(([file, name]) => `<p style="margin:24px 0 10px"><strong>${name}</strong></p><img src="https://kamehame-japan.com/images/golf-email/${file}.jpg" width="592" alt="${name}" style="display:block;width:100%;max-width:592px;height:auto;border:0">`).join("");
  const gallery = heading("A glimpse of your golf day") + cards + '<p style="font-size:14px;color:#56635b">Photos show example courses, not a confirmed reservation. The course depends on availability. Views and snow on Mt. Fuji vary with weather and season.</p>';
  const sections = text.split("\n\n");
  // Keep payment near the top, before the course photographs, as approved.
  if (payment) {
    const price = sections.findIndex(s => s.startsWith("Price\n"));
    const pay = sections.findIndex(s => s.startsWith("Payment\n"));
    if (price >= 0 && pay > price) {
      const moved = sections.splice(price, pay - price + 1);
      sections.splice(3, 0, ...moved);
    }
  }
  let galleryAdded = false;
  let body = sections.map(section => {
    const lines = section.split("\n");
    const title = /^(Your golf day|Your course, arranged by our team|Price|Payment|Cancellation — all dates and times are Japan time|A few details to complete your arrangements|An example day)$/.test(lines[0]);
    let result = title ? heading(escapeEmailHtml(lines.shift()!)) : "";
    result += `<p style="margin:0 0 18px">${lines.map(line => line === "{{PAYMENT_URL}}" ? '<a href="{{PAYMENT_URL}}">{{PAYMENT_URL}}</a>' : escapeEmailHtml(line)).join("<br>")}</p>`;
    if (payment && section.startsWith("Payment\n")) result += button();
    if (section.startsWith("Your course, arranged by our team\n")) result += gallery;
    if (payment && section.startsWith("Cancellation —")) result += button();
    if (!payment && !galleryAdded && /^(-----|Best regards|Kind regards)/.test(section)) {
      galleryAdded = true; result = gallery + result;
    }
    return result;
  }).join("");
  if (!payment && !galleryAdded) body += gallery;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px"><tr><td style="padding:28px 24px 36px;font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#252b28">${body}</td></tr></table></td></tr></table></body></html>`;
}
