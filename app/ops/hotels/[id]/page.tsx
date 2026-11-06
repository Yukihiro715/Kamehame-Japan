import { PortalShell } from "@/components/portal/shell";
import { OpsHotelDetail } from "@/components/portal/ops/hotel-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="ops" title="拠点の詳細"><OpsHotelDetail id={id} /></PortalShell>;
}
