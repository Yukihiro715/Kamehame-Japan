import { PortalShell } from "@/components/portal/shell";
import { HotelCaseDetail } from "@/components/portal/hotel/case-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="hotel" titleKey="cases.title"><HotelCaseDetail id={id} /></PortalShell>;
}
