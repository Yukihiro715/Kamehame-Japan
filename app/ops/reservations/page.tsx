import { PortalShell } from "@/components/portal/shell";
import { OpsReservations } from "@/components/portal/ops/reservations";
export default function Page() { return <PortalShell kind="ops" title="予約"><OpsReservations /></PortalShell>; }
