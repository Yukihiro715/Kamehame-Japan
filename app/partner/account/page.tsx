import { PortalShell } from "@/components/portal/shell";
import { PartnerAccount } from "@/components/portal/hotel/account";
export default function Page() {
  return (
    <PortalShell kind="hotel" titleKey="nav.account">
      <PartnerAccount />
    </PortalShell>
  );
}
