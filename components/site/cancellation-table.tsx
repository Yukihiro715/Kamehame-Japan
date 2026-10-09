import type { Experience } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";

/** Stepped cancellation fees as a table, with the venue's own wording under
 *  it; falls back to the plain paragraph when the product has no tiers. */
export function CancellationTable({ exp, text, lang }: { exp: Pick<Experience, "cancellationTiers">; text: string; lang: Lang }) {
  const D = t(lang).detail;
  const tiers = exp.cancellationTiers;
  if (!tiers || tiers.length === 0) return <p className="xp-cancel">{text}</p>;
  return (
    <div className="xp-cancel-table">
      <table>
        <thead><tr><th>{D.cancelWhen}</th><th>{D.cancelFee}</th></tr></thead>
        <tbody>
          {tiers.map((tier, i, all) => {
            const prev = i > 0 ? all[i - 1].until - 1 : undefined;
            const when = prev === undefined ? D.cancelFreeUntil(tier.until) : tier.until > 0 ? D.cancelBetween(prev, tier.until) : D.cancelFromDays(prev);
            const fee = tier.rate <= 0 ? D.cancelRateFree : tier.rate >= 100 ? D.cancelRateFull : D.cancelRatePct(tier.rate);
            return <tr key={tier.until} className={tier.rate <= 0 ? "free" : tier.rate >= 100 ? "full" : ""}><td>{when}</td><td>{fee}</td></tr>;
          })}
        </tbody>
      </table>
      <p className="xp-cancel-note">{text}</p>
    </div>
  );
}
