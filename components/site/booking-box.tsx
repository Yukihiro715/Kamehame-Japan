import { CalendarDays, ShieldCheck } from "lucide-react";
import type { BookingType } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";

// Reserved mount for the Bókun booking widget. Once the Bókun account and
// product IDs are confirmed, the widget script replaces the contents of
// #bokun-widget-mount (see CLAUDE_HANDOFF.md — widget spec pending).
// data-booking-type tells the widget which Bókun flow to render: an instant
// calendar, or a request form held until the venue confirms the date.
export function BookingBox({
  price, unit, experienceSlug, lang = "en", fine, bookingType = "instant",
}: {
  price: string; unit: string; experienceSlug: string; lang?: Lang; fine?: string; bookingType?: BookingType;
}) {
  const T = t(lang);
  const onRequest = bookingType === "request";

  return (
    <div className="booking-box" id="booking">
      <p className="booking-price">
        {T.from} <b>{price}</b> <span>{unit} · {T.bookingUnitNote}</span>
        {onRequest && <em className="request-badge">{T.requestBadge}</em>}
      </p>

      <div
        id="bokun-widget-mount"
        data-experience={experienceSlug}
        data-booking-type={bookingType}
        className="bokun-mount"
      >
        <CalendarDays size={18} />
        <p><b>{T.bookingSoonTitle}</b><br />{T.bookingSoonBody}</p>
      </div>

      <button type="button" className="booking-cta" disabled aria-disabled="true">
        {onRequest ? T.requestBook : T.bookNow}
      </button>

      {onRequest && (
        <div className="request-steps">
          <b>{T.requestStepsTitle}</b>
          <ol>
            {T.requestSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}

      <p className="booking-fine">
        <ShieldCheck size={13} /> {onRequest ? T.bookingFineRequest : (fine ?? T.bookingFine)}
      </p>
    </div>
  );
}

export function MobileBookingBar({
  price, lang = "en", bookingType = "instant",
}: { price: string; lang?: Lang; bookingType?: BookingType }) {
  const T = t(lang);
  return (
    <a className="booking-bar" href="#booking">
      <span>{T.from} <b>{price}</b></span>
      <span className="booking-bar-cta">{bookingType === "request" ? T.requestBook : T.bookNow}</span>
    </a>
  );
}
