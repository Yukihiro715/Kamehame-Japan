import { OpsBusTourDetail } from "@/components/portal/ops/bus-tour-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><OpsBusTourDetail id={id} /></>;
}
