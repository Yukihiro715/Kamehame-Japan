import { PortalShell } from "@/components/portal/shell";
import { HotelStatementDetail } from "@/components/portal/hotel/statement-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="hotel" titleKey="statement.title"><HotelStatementDetail id={id} /></PortalShell>;
}
