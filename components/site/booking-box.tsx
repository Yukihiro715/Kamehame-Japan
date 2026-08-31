import { CalendarDays, ShieldCheck } from "lucide-react";

// Reserved mount for the Bókun booking widget. Once the Bókun account and
// product IDs are confirmed, the widget script replaces the contents of
// #bokun-widget-mount (see CLAUDE_HANDOFF.md — widget spec pending).
export function BookingBox({ price, unit, experienceSlug }: { price: string; unit: string; experienceSlug: string }) {
  return (
    <div className="booking-box" id="booking">
      <p className="booking-price">from <b>{price}</b> <span>{unit} · pay in JPY (USD/EUR shown at checkout)</span></p>
      <div id="bokun-widget-mount" data-experience={experienceSlug} className="bokun-mount">
        <CalendarDays size={18} />
        <p><b>Online booking opens soon.</b><br />Date and guest selection (Bókun) will appear here.</p>
      </div>
      <button type="button" className="booking-cta" disabled aria-disabled="true">Book now</button>
      <p className="booking-fine"><ShieldCheck size={13} /> Instant confirmation · Pay in yen · Free cancellation (7 days)</p>
    </div>
  );
}

export function MobileBookingBar({ price }: { price: string }) {
  return (
    <a className="booking-bar" href="#booking">
      <span>from <b>{price}</b></span>
      <span className="booking-bar-cta">Book now</span>
    </a>
  );
}
