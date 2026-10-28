import { PortalShell } from "@/components/portal/shell";
import { OpsMembers } from "@/components/portal/ops/members";
export default function Page() { return <PortalShell kind="ops" title="運営メンバー"><OpsMembers /></PortalShell>; }
