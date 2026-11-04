// One photo or video from the review form, straight into the MEDIA bucket
// (lib/review-media.ts). Without the bucket the form keeps working with
// photos by email only.
import { handleReviewUpload, isBucket } from "@/lib/review-media";

export async function POST(request: Request): Promise<Response> {
  let bucket = null;
  try { const { env } = await import("cloudflare:workers"); bucket = isBucket(env.MEDIA) ? env.MEDIA : null; } catch { bucket = null; }
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ ok: false, error: "origin" }, { status: 403 });
  return handleReviewUpload(request, bucket);
}
