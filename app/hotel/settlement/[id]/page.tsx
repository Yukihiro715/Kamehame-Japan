import { PortalShell } from "@/components/portal/shell";
import { HotelStatementDetail } from "@/components/portal/hotel/statement-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="hotel" title="お支払い通知書"><HotelStatementDetail id={id} /></PortalShell>;
}
