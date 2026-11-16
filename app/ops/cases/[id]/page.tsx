import { OpsCaseDetail } from "@/components/portal/ops/case-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><OpsCaseDetail id={id} /></>;
}
