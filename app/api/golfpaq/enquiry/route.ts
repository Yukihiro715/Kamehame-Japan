import { handleGolfpaqEnquiry } from "@/lib/golfpaq-enquiry";

/** Shared-bus golf tour enquiries (lib/golfpaq-enquiry.ts): priced on the
 *  server from the fresh feed, kept in the ledger, acknowledged by mail,
 *  handed to the travel partner. No payment and no seat is taken here. */
export async function POST(request: Request) {
  try {
    const { env } = await import("cloudflare:workers");
    return await handleGolfpaqEnquiry(request, env);
  } catch (err) {
    console.error("golfpaq enquiry", err instanceof Error ? err.message : err);
    return Response.json({ ok: false, error: "unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
