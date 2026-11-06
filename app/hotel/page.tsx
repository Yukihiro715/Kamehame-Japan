import { PortalShell } from "@/components/portal/shell";
import { HotelDashboard } from "@/components/portal/hotel/dashboard";
export default function Page() { return <PortalShell kind="hotel" titleKey="nav.dashboard"><HotelDashboard /></PortalShell>; }
