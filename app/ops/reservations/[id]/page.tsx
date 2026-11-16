import { OpsReservationDetail } from "@/components/portal/ops/reservation-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><OpsReservationDetail id={id} /></>;
}
