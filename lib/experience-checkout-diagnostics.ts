import { checkoutConfigurationChecks, experienceLedger, type ExperienceCheckoutEnv } from "@/lib/experience-checkout";
import { EXPERIENCE_POLICY_VERSION } from "@/lib/provisional-booking";

const headers = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };
const encoder = new TextEncoder();

/** Authenticate with the existing automation credential; never return its value. */
async function authorized(request: Request, secret?: string) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || !authorization.startsWith("Bearer ") || authorization.length > 4096) return false;
  const supplied = authorization.slice(7);
  if (!supplied) return false;
  const algorithm = { name: "HMAC", hash: "SHA-256" };
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), algorithm, false, ["verify"]);
  const candidate = await crypto.subtle.importKey("raw", encoder.encode(supplied), algorithm, false, ["sign"]);
  const message = encoder.encode("kamehame:experience-checkout-health:v1");
  const signature = await crypto.subtle.sign("HMAC", candidate, message);
  return crypto.subtle.verify("HMAC", key, signature, message);
}

/** Operator-only, read-only diagnostics. No session, reservation or mail is created. */
export async function diagnoseExperienceCheckout(request: Request, env: ExperienceCheckoutEnv) {
  if (!await authorized(request, env.GOLF_AUTOMATION_TOKEN)) {
    return Response.json({ ok: false }, { status: 403, headers });
  }
  const checks = checkoutConfigurationChecks(env);
  const configured = Object.values(checks).every(Boolean);
  let ledger = { reachable: false, current_version: false, ready: false };
  if (checks.ledger_url && checks.ledger_token) {
    try {
      const health = await experienceLedger(env, "experience_health");
      ledger = { reachable: true, current_version: health.version === EXPERIENCE_POLICY_VERSION, ready: health.ready === true };
    } catch { /* Do not expose upstream bodies, errors, URLs or credentials. */ }
  }
  return Response.json({ ok: true, ready: configured && ledger.current_version && ledger.ready, checks, ledger }, { headers });
}
