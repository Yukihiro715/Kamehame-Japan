// Looks up a Stripe Checkout Session after a payment link redirects the guest
// to /{lang}/booked/?session_id=… so the confirmation page can show what was
// paid and report the real amount as the "booking confirmed" conversion.
//
// Uses the STRIPE_READ_KEY Worker secret: a *restricted* key with read access
// to Checkout Sessions only. It cannot charge, refund or change anything.
// Without the key the page still confirms the payment, just without the amount.

async function readKey(): Promise<string | undefined> {
  try {
    const { env } = await import("cloudflare:workers");
    return env.STRIPE_READ_KEY;
  } catch {
    return undefined;
  }
}

const noStore = { "cache-control": "no-store" };

/** How long after the checkout started the payer's email is still returned. */
const EMAIL_WINDOW_S = 2 * 60 * 60;

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const id = params.get("session_id") ?? "";
  // The page asks for the email only when the guest clicked Accept.
  const wantsEmail = params.get("email") === "1";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400, headers: noStore });
  }
  const key = await readKey();
  if (!key) return Response.json({ ok: false, error: "unconfigured" }, { status: 503, headers: noStore });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!res.ok) return Response.json({ ok: false, error: "not_found" }, { status: 404, headers: noStore });
    const s = (await res.json()) as {
      payment_status?: string; amount_total?: number | null; currency?: string | null;
      customer_details?: { email?: string | null } | null; created?: number;
    };
    // The session id is the only thing a caller shows, so the payer's email
    // is returned only while the guest is plausibly still coming back from
    // paying — not to whoever holds an old id later.
    const fresh = typeof s.created === "number" && Date.now() / 1000 - s.created < EMAIL_WINDOW_S;
    // JPY is a zero-decimal currency: amount_total is already in yen.
    return Response.json({
      ok: true,
      paid: s.payment_status === "paid",
      amount: typeof s.amount_total === "number" ? s.amount_total : undefined,
      currency: s.currency ? s.currency.toUpperCase() : undefined,
      // Only for the guest's own enhanced-conversion match on this page.
      email: wantsEmail && fresh ? s.customer_details?.email ?? undefined : undefined,
    }, { headers: noStore });
  } catch (err) {
    console.error("booking: stripe lookup failed", err);
    return Response.json({ ok: false, error: "lookup_failed" }, { status: 502, headers: noStore });
  }
}
