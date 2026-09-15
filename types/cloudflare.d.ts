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
    DB?: unknown;
  };
}

declare module "cloudflare:email" {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string);
  }
}
