import { handleSupplierSubmission, type SupplierEnv } from "@/lib/supplier-enquiry";

export async function POST(request: Request): Promise<Response> {
  let env: SupplierEnv = {};
  try { env = (await import("cloudflare:workers")).env as SupplierEnv; } catch { /* Local previews have no delivery credentials. */ }
  return handleSupplierSubmission(request, env);
}
