import { Bath, CircleCheck, CircleX, Footprints, LandPlot, Receipt, Shirt, Utensils, type LucideIcon } from "lucide-react";
import type { GolfInclusionId, VariantPageCopy } from "@/lib/catalog";
import { isArrangement } from "@/lib/golf-prices";

type Copy = VariantPageCopy["inclusions"];

type IconProps = { size?: number };
const svgProps = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

/** A golf club with a ball on the tee, drawn in Lucide's stroke style (Lucide has no golf club). */
function GolfClub({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M17 3 9.5 14.5" /><path d="M9.5 14.5c-1.3 2.3-4.3 3.2-5.8 1.8-1.2-1.2-.3-3 1.6-3.6" /><path d="M5.3 12.7c1.5-.5 3.1 0 4.2 1.8" />
      <circle cx="18" cy="18" r="2" /><path d="M16.5 21.5h3" />
    </svg>
  );
}

/** A minivan seen from the side: one-box body, sliding-door window line, two wheels. */
function Minivan({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M3 16v-4l2.6-4.2A2 2 0 0 1 7.3 7H19a2 2 0 0 1 2 2v7" /><path d="M3 12h18" /><path d="M12 7v5" /><path d="M6 7.5V12" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M9 17h6" />
    </svg>
  );
}

/** A steering wheel: the private driver. */
function Driver({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" />
      <path d="M3 12h6.5" /><path d="M14.5 12H21" /><path d="M12 14.5V21" />
    </svg>
  );
}

/** Two lockers side by side, with vents and handles. */
function Locker({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <rect x="3.5" y="3" width="7.5" height="18" rx="1" /><rect x="13" y="3" width="7.5" height="18" rx="1" />
      <path d="M6 7h2.5" /><path d="M6 10h2.5" /><path d="M15.5 7H18" /><path d="M15.5 10H18" />
      <path d="M9 14.5v2" /><path d="M18.5 14.5v2" />
    </svg>
  );
}

/** A person with a speech bubble: the English-speaking assistant. */
function Assistant({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="9" cy="8" r="3.5" /><path d="M3 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M15.5 3H21v4.5h-3.2L15.5 9.5z" />
    </svg>
  );
}

/** A golf cart: canopy on posts, open body, two wheels. */
function GolfCart({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M5 6h12" /><path d="M6.5 6v5.5" /><path d="M15.5 6v5" />
      <path d="M3 17v-4.5a1 1 0 0 1 1-1h10.5l2.5 3H20a1 1 0 0 1 1 1V17" /><path d="M9 11.5V9.5h3.5v2" />
      <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /><path d="M9 18h6" />
    </svg>
  );
}

/** Which icon each item shows and whether the package covers it: structure, the same in every language. */
const ITEMS: Record<GolfInclusionId, { Icon: LucideIcon | ((p: IconProps) => React.ReactElement); included: boolean }> = {
  round: { Icon: LandPlot, included: true },
  clubs: { Icon: GolfClub, included: true },
  shoes: { Icon: Footprints, included: true },
  transfer: { Icon: Minivan, included: true },
  driver: { Icon: Driver, included: true },
  assistant: { Icon: Assistant, included: true },
  cart: { Icon: GolfCart, included: true },
  locker: { Icon: Locker, included: true },
  bath: { Icon: Bath, included: true },
  lunch: { Icon: Utensils, included: true },
  taxes: { Icon: Receipt, included: true },
  wear: { Icon: Shirt, included: false },
};

/** The booking service (GOLF_MODE "arrangement"): we arrange the tee time, the rentals, the cart and
 *  the clubhouse side with the club; transfers, a driver, an assistant, lunch and wear are not part of it. */
const ARRANGED: Record<GolfInclusionId, boolean> = { round: true, clubs: true, shoes: true, transfer: false, driver: false, assistant: false, cart: true, locker: true, bath: true, lunch: false, taxes: true, wear: false };

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
          const { Icon } = ITEMS[it.id];
          const included = isArrangement() ? ARRANGED[it.id] : ITEMS[it.id].included;
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
