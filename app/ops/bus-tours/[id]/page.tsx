import { PortalShell } from "@/components/portal/shell";
import { OpsBusTourDetail } from "@/components/portal/ops/bus-tour-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortalShell kind="ops" title="乗合ゴルフ問い合わせの詳細"><OpsBusTourDetail id={id} /></PortalShell>;
}
