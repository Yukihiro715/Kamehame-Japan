/** UI visibility only. The portal API remains the authority for every request. */
export interface PartnerSite {
  id: string;
  features?: { refer: boolean; cases: boolean; settlement: boolean; members: boolean };
}
export function partnerAccess(site: PartnerSite | null, memberships: { role: string; scopeType: string; scopeId: string | null }[] = []) {
  return {
    refer: site?.features?.refer === true,
    settlement: site?.features?.settlement === true,
    cases: site?.features?.cases === true && memberships.some((m) => m.scopeType === "hotel" && m.scopeId === site.id && ["partner_agent", "partner_manager"].includes(m.role)),
  };
}
