import { PortalShell } from "@/components/portal/shell";
import { HotelGuide } from "@/components/portal/hotel/guide";
export default function Page() { return <PortalShell kind="hotel" titleKey="guide.title"><HotelGuide /></PortalShell>; }
