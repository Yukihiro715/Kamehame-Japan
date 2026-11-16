import { OpsStatementDetail } from "@/components/portal/ops/statement-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><OpsStatementDetail id={id} /></>;
}
