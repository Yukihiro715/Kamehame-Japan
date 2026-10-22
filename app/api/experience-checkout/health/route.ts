import { diagnoseExperienceCheckout } from "@/lib/experience-checkout-diagnostics";

export async function GET(request: Request) {
  try {
    const { env } = await import("cloudflare:workers");
    return await diagnoseExperienceCheckout(request, env);
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
