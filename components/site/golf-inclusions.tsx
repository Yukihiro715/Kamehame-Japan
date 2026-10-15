import { Bath, CarFront, CircleCheck, CircleX, Footprints, LandPlot, Languages, LockKeyhole, Receipt, Shirt, UserRound, Utensils, type LucideIcon } from "lucide-react";
import type { GolfInclusionId, VariantPageCopy } from "@/lib/catalog";

type Copy = VariantPageCopy["inclusions"];

/** Two golf clubs, crossed — Lucide has no golf club, so this one is drawn in the same stroke style. */
function GolfClubs({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3l12 15" /><path d="M17 18c1.5 1.4 3.5 1.6 4.5.5L19 15" />
      <path d="M19 3L7 18" /><path d="M7 18c-1.5 1.4-3.5 1.6-4.5.5L5 15" />
    </svg>
  );
}

/** A golf cart, in the same stroke style. */
function GolfCart({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 17V11a2 2 0 0 1 2-2h8l3 5h3v3" /><path d="M6 9V5h10" /><path d="M14 5v4" />
      <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
    </svg>
  );
}

/** Which icon each item shows and whether the package covers it: structure, the same in every language. */
const ITEMS: Record<GolfInclusionId, { Icon: LucideIcon | ((p: { size?: number }) => React.ReactElement); included: boolean }> = {
  round: { Icon: LandPlot, included: true },
  clubs: { Icon: GolfClubs, included: true },
  shoes: { Icon: Footprints, included: true },
  transfer: { Icon: CarFront, included: true },
  driver: { Icon: UserRound, included: true },
  assistant: { Icon: Languages, included: true },
  cart: { Icon: GolfCart, included: true },
  locker: { Icon: LockKeyhole, included: true },
  bath: { Icon: Bath, included: true },
  lunch: { Icon: Utensils, included: true },
  taxes: { Icon: Receipt, included: true },
  wear: { Icon: Shirt, included: false },
};

/** "What's Included in Your Golf Day": the twelve items as icon cards, four across
 *  on wide screens and two on phones, each with a green check or a red cross. The
 *  one list of inclusions on the page; the text lists are not rendered beside it. */
export function GolfInclusions({ copy }: { copy: Copy }) {
  return (
    <section className="xp-section gi" id="included" aria-labelledby="gi-heading">
      <h2 id="gi-heading">{copy.heading}</h2>
      <p className="gi-sub">{copy.sub}</p>
      <ul className="gi-grid">
        {copy.items.map((it) => {
          const { Icon, included } = ITEMS[it.id];
          return (
            <li key={it.id} className={`gi-card${included ? "" : " gi-no"}`}>
              <span className="gi-icon" aria-hidden="true"><Icon size={22} /></span>
              <b className="gi-label">{it.label}</b>
              {it.note && <small className="gi-note">{it.note}</small>}
              <span className="gi-status">
                {included ? <CircleCheck size={15} aria-hidden="true" /> : <CircleX size={15} aria-hidden="true" />}
                {included ? copy.includedLabel : copy.notIncludedLabel}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="gi-foot">{copy.footnote}</p>
      <p className="gi-fine">{copy.courseNote} {copy.alsoNot}</p>
    </section>
  );
}
