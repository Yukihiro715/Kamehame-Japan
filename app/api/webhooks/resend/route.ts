import { receiveWebhook } from "@/lib/payment-webhooks";
export async function POST(request: Request) {
  try { const { env } = await import("cloudflare:workers"); return receiveWebhook("resend", request, env); }
  catch { return Response.json({ ok: false }, { status: 503 }); }
}
