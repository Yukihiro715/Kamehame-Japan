import { CONTACT_EMAIL, TRADE_EMAIL, type Enquiry } from "@/lib/contact";
import { acknowledgement } from "@/lib/mail-copy";
import { catalogFor } from "@/lib/catalog";
import { isLang } from "@/lib/i18n";

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

// Delivery. Two routes, tried in this order:
//   1. Resend, when the RESEND_API_KEY secret exists — sends the internal
//      notification to CONTACT_TO and an acknowledgement to the visitor.
//   2. The Cloudflare send_email binding — internal notification only, and
//      only to a destination verified in Email Routing. Kept as the fallback
//      so a Resend outage or an unverified domain never loses an enquiry.
// The From addresses must be on our own domain.
const FROM = "enquiries@kamehame-japan.com";
const REPLY = "hello@kamehame-japan.com";

function subjectFor(e: Enquiry): string {
  return e.kind === "trade"
    ? `[Trade] ${e.company ?? e.name} — ${e.country ?? ""}`.trim()
    : `[Request] ${e.experience ? `${e.experience} — ` : ""}${e.name}${e.dates ? ` — ${e.dates}` : ""}`;
}

function bodyFor(e: Enquiry): string {
  return [
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
  ].filter((l): l is string => typeof l === "string").join("\n");
}

/** The experience's title in the visitor's language, for the acknowledgement. */
function titleFor(e: Enquiry): string | undefined {
  if (!e.experience || !isLang(e.lang)) return undefined;
  return catalogFor(e.lang).experiences.find((x) => x.slug === e.experience)?.title;
}

/** Both messages in one batch call. Resend rejects the whole batch if the
 *  domain is not verified, which the caller treats as "try the fallback". */
async function sendViaResend(key: string, to: string, e: Enquiry): Promise<void> {
  const ack = acknowledgement(e, titleFor(e));
  const safeName = e.name.replace(/[<>"\r\n]/g, "");
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      {
        from: `KAMEHAME JAPAN Site <${FROM}>`,
        to: [to],
        reply_to: `${safeName} <${e.email}>`,
        subject: subjectFor(e),
        text: bodyFor(e),
        tags: [{ name: "kind", value: e.kind }],
      },
      {
        from: `KAMEHAME JAPAN <${REPLY}>`,
        to: [e.email],
        reply_to: REPLY,
        subject: ack.subject,
        text: ack.text,
        tags: [{ name: "kind", value: "ack" }],
      },
    ]),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

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
  const subject = subjectFor(e);
  const lines = bodyFor(e).split("\n");
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
  const resendKey = cf?.env.RESEND_API_KEY;

  if (!cf || !to || (!resendKey && !cf.env.EMAIL)) {
    // Not configured yet. Say so plainly rather than pretending; the page
    // then shows the address so the visitor can still reach us.
    console.error("contact: CONTACT_TO secret, or both RESEND_API_KEY and the send_email binding, missing");
    return Response.json({ ok: false, error: "unconfigured", fallback }, { status: 503 });
  }

  if (resendKey) {
    try {
      await sendViaResend(resendKey, to, enquiry);
      return Response.json({ ok: true });
    } catch (err) {
      console.error("contact: resend failed, trying send_email", err);
    }
  }
  if (cf.env.EMAIL) {
    try {
      await cf.env.EMAIL.send(new cf.EmailMessage(FROM, to, raw(enquiry, to)));
      return Response.json({ ok: true });
    } catch (err) {
      console.error("contact: send_email failed", err);
    }
  }
  return Response.json({ ok: false, error: "send_failed", fallback }, { status: 502 });
}
