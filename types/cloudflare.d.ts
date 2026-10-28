// Ambient types for the Cloudflare Worker modules this app touches.
//
// The generated wrangler.json declares the bindings at build time (see
// vite.config.ts); this file only tells TypeScript what they look like.
// Kept minimal on purpose — add to it as more bindings are used.

declare module "cloudflare:workers" {
  export const env: {
    /** send_email binding — present in production, absent in local dev unless
     *  wrangler's local email emulation is running. */
    EMAIL?: { send(message: unknown): Promise<void> };
    /** Where contact-form submissions are delivered. A Worker *secret*, not a
     *  var: secrets survive `wrangler deploy`, dashboard vars do not. */
    CONTACT_TO?: string;
    /** Second recipient of the team notification (a var in vite.config.ts). */
    ARCHIVE_TO?: string;
    /** Apps Script web app that appends each enquiry to the booking ledger (var or secret). */
    LEDGER_WEBHOOK_URL?: string;
    /** Resend API key. When present, enquiries go out through Resend (which
     *  can also write to the visitor); otherwise through the send_email binding. */
    RESEND_API_KEY?: string;
    /** Slack Incoming Webhook for new-enquiry alerts (optional). */
    SLACK_WEBHOOK_URL?: string;
    /** Stripe restricted key (Checkout Sessions: read) for the booked page. */
    STRIPE_READ_KEY?: string;
    /** Restricted live key: Checkout Sessions write, Prices read. */
    STRIPE_CHECKOUT_KEY?: string;
    /** Opt-in after the Apps Script readiness probe passes. */
    EXPERIENCE_CHECKOUT_ENABLED?: string;
    GOLF_AUTOMATION_URL?: string;
    GOLF_AUTOMATION_TOKEN?: string;
    RESEND_WEBHOOK_SECRET?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    /** Additional KAMEHAME endpoint secret; preserves the existing Stripe secret. */
    STRIPE_EXPERIENCE_WEBHOOK_SECRET?: string;
    /** D1 binding: the commission ledger (lib/referral, migrations/). Present once the deploy workflow has created the database. */
    DB?: unknown;
    /** "staging" on the verification Worker (worker/index.ts gate). */
    KH_ENV?: string;
    STAGING_BASIC_AUTH?: string;
    /** Portal (lib/portal): the first operator's e-mail, and the staging mail allowlist. */
    PORTAL_BOOTSTRAP_ADMIN?: string;
    NOTIFY_ALLOWLIST?: string;
    /** KV namespace the readiness cron publishes to (vite.config.ts); absent until the deploy workflow has created it. */
    READY_STATE?: { get(key: string, type: "json"): Promise<unknown>; put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> };
    /** Workers AI binding (translation for the team's notification). */
    AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
  };
}

declare module "cloudflare:email" {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string);
  }
}
