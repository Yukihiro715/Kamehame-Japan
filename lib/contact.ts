// Contact routes.
//
// Enquiries go through the /api/contact route handler, which delivers them
// with the Worker's send_email binding. The addresses below are what a
// visitor sees; delivery goes to the CONTACT_TO secret (see
// app/api/contact/route.ts). Mailto links were tried first and abandoned:
// on a machine with no mail client they do nothing at all.

export const CONTACT_EMAIL = "hello@kamehame-japan.com";
export const TRADE_EMAIL = "trade@kamehame-japan.com";
export const PARTNER_EMAIL = "partners@kamehame-japan.com";

/** The personal follow-up e-mail scheduled 15 minutes after the acknowledgement.
 *  2026-10-19: paused by the owner while its wording is reworked — no follow-up
 *  is scheduled and the team notification says so. Set true to resume; the
 *  cancellation link and the ledger's stop control are unchanged either way. */
export const FOLLOW_UP_ENABLED = false;

export type EnquiryKind = "guest" | "trade";

export interface Enquiry {
  attribution?: import("./attribution").Attribution;
  requestId?: string;
  pickupRegion?: "tokyo" | "saitama" | "chiba" | "other";
  caddie?: "none" | "required" | "unsure";
  /** Booking service: an English-speaking assistant for the day, quoted separately. */
  assistant?: "none" | "required" | "unsure";
  /** Booking service: a transfer is not ours to sell; "introduce" means the guest wants the transfer partner's contact. */
  transfer?: "none" | "introduce" | "unsure";
  addonIds?: string[];
  kind: EnquiryKind;
  name: string;
  email: string;
  company?: string;
  country?: string;
  dates?: string;
  party?: string;
  /** Experience pages: the chosen plan, extras and the on-page estimate. */
  plan?: string;
  addons?: string;
  estimate?: string;
  /** Interpreter guide language chosen on an experience page (included). */
  interpreter?: string;
  /** The golf page: the chosen area (its title, and its id for the price
   *  master), how the course is chosen, and the group, rental and pick-up
   *  details its form asks for. `priceNote` is the server's own reading of
   *  the price master for this request (internal notification only). */
  area?: string;
  areaId?: string;
  courseMode?: "recommended" | "specific";
  course?: string;
  courseUrl?: string;
  level?: string;
  rental?: string;
  clubs?: string;
  pickup?: string;
  whatsapp?: string;
  priceNote?: string;
  /** The golf form's choices as keys (level, handicap, "required:right,own" per golfer),
   *  so the team's notification can say them in Japanese. */
  levelKey?: string;
  handicap?: string;
  rentalKeys?: string;
  /** "Golfer 1: 26.5 cm · Golfer 2: Own shoes" and the keys ("26.5,own") behind it. */
  shoes?: string;
  shoeKeys?: string;
  message: string;
  /** Page language, so the confirmation can be answered in it. */
  lang: string;
  /** Catalog slug when the enquiry came from an experience page. */
  experience?: string;
  /** Honeypot. Real people never fill it; bots usually do. */
  website?: string;
}
