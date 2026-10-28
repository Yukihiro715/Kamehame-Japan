import { PortalShell } from "@/components/portal/shell";
import { OpsExport } from "@/components/portal/ops/misc";
export default function Page() { return <PortalShell kind="ops" title="CSV出力"><OpsExport /></PortalShell>; }
