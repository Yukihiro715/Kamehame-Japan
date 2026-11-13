import { PortalShell } from "@/components/portal/shell";
import { HotelReservations } from "@/components/portal/hotel/reservations";
export default function Page() { return <PortalShell kind="hotel" titleKey="nav.reservations"><HotelReservations /></PortalShell>; }
