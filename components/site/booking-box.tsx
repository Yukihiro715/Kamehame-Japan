import { CalendarDays, ShieldCheck } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

// Reserved mount for the Bókun booking widget. Once the Bókun account and
// product IDs are confirmed, the widget script replaces the contents of
// #bokun-widget-mount (see CLAUDE_HANDOFF.md — widget spec pending).
export function BookingBox({ price, unit, experienceSlug, lang = "en", fine }: { price: string; unit: string; experienceSlug: string; lang?: Lang; fine?: string }) {
  const T = t(lang);
  return (
    <div className="booking-box" id="booking">
      <p className="booking-price">{T.from} <b>{price}</b> <span>{unit} · {T.bookingUnitNote}</span></p>
      <div id="bokun-widget-mount" data-experience={experienceSlug} className="bokun-mount">
        <CalendarDays size={18} />
        <p><b>{T.bookingSoonTitle}</b><br />{T.bookingSoonBody}</p>
      </div>
      <button type="button" className="booking-cta" disabled aria-disabled="true">{T.bookNow}</button>
      <p className="booking-fine"><ShieldCheck size={13} /> {fine ?? T.bookingFine}</p>
    </div>
  );
}

export function MobileBookingBar({ price, lang = "en" }: { price: string; lang?: Lang }) {
  const T = t(lang);
  return (
    <a className="booking-bar" href="#booking">
      <span>{T.from} <b>{price}</b></span>
      <span className="booking-bar-cta">{T.bookNow}</span>
    </a>
  );
}
