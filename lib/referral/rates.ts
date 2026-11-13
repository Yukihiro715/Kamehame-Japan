import type { SqlDb } from "./db";

export interface RateSetting { id: string; legal_entity_id: string | null; rate_bp: number | null; valid_from: string; created_at: string; created_by: string }

/** NULL rate means inherit, including returning the common rate to legacy experience terms. */
export async function effectiveRate(db: SqlDb, hotelId: string | null, now = Date.now(), profileId: string | null = null): Promise<RateSetting | null> {
  const rows = await db.all<RateSetting>(`SELECT * FROM partner_commission_rates
    WHERE valid_from <= ? AND (legal_entity_id IS NULL OR legal_entity_id = COALESCE((SELECT legal_entity_id FROM hotels WHERE id = ?), (SELECT legal_entity_id FROM settlement_profiles WHERE id = ?)))
    ORDER BY valid_from DESC`, [new Date(now).toISOString(), hotelId, profileId]);
  const partner = rows.find(r => r.legal_entity_id !== null);
  if (partner?.rate_bp !== null && partner?.rate_bp !== undefined) return partner;
  const common = rows.find(r => r.legal_entity_id === null);
  return common?.rate_bp !== null && common?.rate_bp !== undefined ? common : null;
}
