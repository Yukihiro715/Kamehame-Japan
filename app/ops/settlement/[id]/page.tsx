import { PortalShell } from "@/components/portal/shell";
import { OpsStatementDetail } from "@/components/portal/ops/statement-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="ops" title="支払通知書"><OpsStatementDetail id={id} /></PortalShell>;
}
