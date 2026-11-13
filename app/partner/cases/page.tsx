import { PortalShell } from "@/components/portal/shell";
import { HotelCases } from "@/components/portal/hotel/cases";
export default function Page() { return <PortalShell kind="hotel" titleKey="cases.title"><HotelCases /></PortalShell>; }
