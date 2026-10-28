import { PortalShell } from "@/components/portal/shell";
import { OpsAudit } from "@/components/portal/ops/misc";
export default function Page() { return <PortalShell kind="ops" title="操作履歴"><OpsAudit /></PortalShell>; }
