import { PortalShell } from "@/components/portal/shell";
import { OpsCaseDetail } from "@/components/portal/ops/case-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="ops" title="取り次ぎ案件"><OpsCaseDetail id={id} /></PortalShell>;
}
