import { CONTACT_EMAIL, TRADE_EMAIL, type Enquiry } from "@/lib/contact";

// The cloudflare:* modules exist only inside the Worker runtime. They are
// imported lazily so the Node preview server (`vinext start`) and the test
// runner can still load this route; outside the Worker, delivery reports
// itself as unconfigured and the page falls back to the plain address.
async function bindings() {
  try {
    const [{ env }, { EmailMessage }] = await Promise.all([
      import("cloudflare:workers"),
      import("cloudflare:email"),
    ]);
    return { env, EmailMessage };
  } catch {
    return null;
  }
}

// Delivery target. A Worker secret named CONTACT_TO holds the inbox that
// receives enquiries; it must be a destination address verified in Cloudflare
// Email Routing, which is the only place send_email is allowed to deliver.
// The From address must be on our own zone.
const FROM = "enquiries@kamehame-japan.com";

const MAX = { name: 120, email: 200, company: 160, country: 80, dates: 120, party: 60, message: 4000, experience: 80 };

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "";
}

function parse(body: Record<string, unknown>): Enquiry | null {
  const kind = body.kind === "trade" ? "trade" : "guest";
  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  // The message keeps its line breaks; everything else is single-line.
  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX.message) : "";
  if (!name || !email || !message) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    kind, name, email, message,
    company: clean(body.company, MAX.company) || undefined,
    country: clean(body.country, MAX.country) || undefined,
    dates: clean(body.dates, MAX.dates) || undefined,
    party: clean(body.party, MAX.party) || undefined,
    lang: clean(body.lang, 5) || "en",
    experience: clean(body.experience, MAX.experience) || undefined,
    website: clean(body.website, 200) || undefined,
  };
}

/** Plain-text email. Headers are folded onto one line each; the body is
 *  whatever the visitor wrote, quoted as-is. */
function raw(e: Enquiry, to: string): string {
  const subject = e.kind === "trade"
    ? `[Trade] ${e.company ?? e.name} — ${e.country ?? ""}`.trim()
    : `[Request] ${e.experience ? `${e.experience} — ` : ""}${e.name}${e.dates ? ` — ${e.dates}` : ""}`;
  const lines = [
    `Kind:     ${e.kind}`,
    e.experience && `Experience: ${e.experience}`,
    `Name:     ${e.name}`,
    `Email:    ${e.email}`,
    e.company && `Company:  ${e.company}`,
    e.country && `Country:  ${e.country}`,
    e.dates && `Dates:    ${e.dates}`,
    e.party && `Party:    ${e.party}`,
    `Language: ${e.lang}`,
    "",
    e.message,
  ].filter((l): l is string => typeof l === "string");
  // RFC 5322: CRLF line endings, blank line between headers and body.
  // Cloudflare rejects a message without Message-ID and Date outright.
  return [
    `Message-ID: <${crypto.randomUUID()}@kamehame-japan.com>`,
    `Date: ${new Date().toUTCString()}`,
    `From: KAMEHAME JAPAN <${FROM}>`,
    `To: ${to}`,
    `Reply-To: ${e.name.replace(/[<>"]/g, "")} <${e.email}>`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    "",
    ...lines,
  ].join("\r\n");
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const enquiry = parse(body);
  if (!enquiry) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  // A filled honeypot is a bot. Answer as if it worked so it moves on.
  if (enquiry.website) return Response.json({ ok: true });

  const fallback = enquiry.kind === "trade" ? TRADE_EMAIL : CONTACT_EMAIL;
  const cf = await bindings();
  const to = cf?.env.CONTACT_TO;

  if (!cf || !cf.env.EMAIL || !to) {
    // Not configured yet. Say so plainly rather than pretending; the page
    // then shows the address so the visitor can still reach us.
    console.error("contact: send_email binding or CONTACT_TO secret missing");
    return Response.json({ ok: false, error: "unconfigured", fallback }, { status: 503 });
  }

  try {
    await cf.env.EMAIL.send(new cf.EmailMessage(FROM, to, raw(enquiry, to)));
  } catch (err) {
    console.error("contact: send failed", err);
    return Response.json({ ok: false, error: "send_failed", fallback }, { status: 502 });
  }
  return Response.json({ ok: true });
}
