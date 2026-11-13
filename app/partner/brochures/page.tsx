import { PortalShell } from "@/components/portal/shell";
import { HotelBrochures } from "@/components/portal/hotel/brochures";
export default function Page() { return <PortalShell kind="hotel" titleKey="nav.brochures"><HotelBrochures/></PortalShell>; }
