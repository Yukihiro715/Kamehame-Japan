import { OpsHotelDetail } from "@/components/portal/ops/hotel-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><OpsHotelDetail id={id} /></>;
}
