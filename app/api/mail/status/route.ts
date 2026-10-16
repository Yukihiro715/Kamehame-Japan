import { authorized, mailStatus, type MailQueueEnv } from "@/lib/mail-queue";

/** The provider's last event for one sent mail (`?id=<resend id>`), for the
 *  queue's reconciliation. Same shared secret as the send endpoint. */
export async function GET(request: Request): Promise<Response> {
  let env: MailQueueEnv;
  try { env = (await import("cloudflare:workers")).env as MailQueueEnv; } catch { return Response.json({ ok: false, error: "unconfigured" }, { status: 503 }); }
  return handleStatus(request, env);
}

export async function handleStatus(request: Request, env: MailQueueEnv, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (!env.MAIL_QUEUE_TOKEN || !env.RESEND_API_KEY) return Response.json({ ok: false, error: "unconfigured" }, { status: 503 });
  if (!await authorized(request.headers, env.MAIL_QUEUE_TOKEN)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  try {
    const result = await mailStatus(env.RESEND_API_KEY, id, fetchImpl);
    if (!result.ok) return Response.json({ ok: false, error: result.status === 404 ? "not_found" : "lookup_failed" }, { status: result.status });
    return Response.json({ ok: true, id, lastEvent: result.lastEvent, messageId: result.messageId ?? null, createdAt: result.createdAt ?? null });
  } catch { return Response.json({ ok: false, error: "lookup_errored" }, { status: 502 }); }
}
