import { PortalShell } from "@/components/portal/shell";
import { OpsReservationDetail } from "@/components/portal/ops/reservation-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="ops" title="予約の詳細"><OpsReservationDetail id={id} /></PortalShell>;
}
