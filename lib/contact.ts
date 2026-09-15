// Contact routes.
//
// There is no form backend yet, so every route here is an email address on our
// own domain. That is deliberate: a form that silently drops enquiries is worse
// than a mailto link that works. Set these up as forwarding addresses first
// (Cloudflare Email Routing is free and forwards to any inbox); swap in a real
// form once there is somewhere for submissions to land.

export const CONTACT_EMAIL = "hello@kamehame-japan.com";
export const TRADE_EMAIL = "trade@kamehame-japan.com";
export const PARTNER_EMAIL = "partners@kamehame-japan.com";

/** Prefilled mailto, so an enquiry arrives with the details we need. */
export function mailto(address: string, subject: string, lines: string[]) {
  const body = lines.join("\n");
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
