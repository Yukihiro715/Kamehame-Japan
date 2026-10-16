import { authorized, parseSendRequest, sendQueuedMail, type MailQueueEnv } from "@/lib/mail-queue";

/** Called only by the ledger's Apps Script queue (shared secret MAIL_QUEUE_TOKEN)
 *  with one approved mail. Unconfigured → 503; wrong token → 401; the same
 *  idempotency key never sends twice within Resend's 24-hour window. */
export async function POST(request: Request): Promise<Response> {
  let env: MailQueueEnv;
  try { env = (await import("cloudflare:workers")).env as MailQueueEnv; } catch { return Response.json({ ok: false, error: "unconfigured" }, { status: 503 }); }
  return handleSend(request, env);
}

export async function handleSend(request: Request, env: MailQueueEnv, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (!env.MAIL_QUEUE_TOKEN || !env.RESEND_API_KEY) return Response.json({ ok: false, error: "unconfigured" }, { status: 503 });
  if (!await authorized(request.headers, env.MAIL_QUEUE_TOKEN)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "bad_json" }, { status: 400 }); }
  const parsed = parseSendRequest(body);
  if (!parsed.ok) return Response.json({ ok: false, error: `invalid:${parsed.error}` }, { status: 400 });
  try {
    const result = await sendQueuedMail(env.RESEND_API_KEY, parsed.req, fetchImpl);
    if (!result.ok) { console.error("mail: send failed", result.error); return Response.json({ ok: false, error: "send_failed", detail: result.error }, { status: 502 }); }
    return Response.json({ ok: true, id: result.id, messageId: result.messageId ?? null });
  } catch (err) {
    console.error("mail: send errored", err);
    return Response.json({ ok: false, error: "send_errored" }, { status: 502 });
  }
}
