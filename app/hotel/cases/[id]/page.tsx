import { PortalShell } from "@/components/portal/shell";
import { HotelCaseDetail } from "@/components/portal/hotel/case-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="hotel" title="案件"><HotelCaseDetail id={id} /></PortalShell>;
}
