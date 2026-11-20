-- Customer display names are private operational data, never catalog content.
CREATE TABLE business_booking_context (
 reservation_id TEXT PRIMARY KEY REFERENCES reservations(id),
 customer_name TEXT NOT NULL,
 options_json TEXT NOT NULL DEFAULT '{}'
);
