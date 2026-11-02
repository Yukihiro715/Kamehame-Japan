/** Server-only: the shared-bus page switch read from the Worker's bindings.
 *  Kept apart from lib/golfpaq.ts, which client components also import. */
import { golfpaqVisible } from "./golfpaq";
export async function golfpaqEnabled(): Promise<boolean> {
  try { const { env } = await import("cloudflare:workers"); return golfpaqVisible(env as { KH_ENV?: string; GOLFPAQ_LIVE?: string }); } catch { return false; }
}
