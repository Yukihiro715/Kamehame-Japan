import { PortalShell } from "@/components/portal/shell";
import { OpsSettlement } from "@/components/portal/ops/settlement";
export default function Page() { return <PortalShell kind="ops" title="精算（四半期締め・支払通知書）"><OpsSettlement /></PortalShell>; }
