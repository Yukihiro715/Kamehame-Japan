-- Shared-bus golf tour enquiries (GOLFPAQ catalogue, docs/GOLFPAQ_BUS_TOURS.md).
-- The customer sees one total; the partner's price and the amount added per
-- person live here and in staff/partner mail only.
CREATE TABLE bus_tour_enquiries (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL UNIQUE,
  tour_id TEXT NOT NULL,
  tour_date TEXT NOT NULL,
  course TEXT NOT NULL,
  pickup TEXT NOT NULL,
  departure_area TEXT,
  departure_time TEXT,
  people INTEGER NOT NULL,
  renters INTEGER NOT NULL DEFAULT 0,
  source_yen INTEGER NOT NULL,
  fee_yen INTEGER NOT NULL,
  per_person_yen INTEGER NOT NULL,
  tours_yen INTEGER NOT NULL,
  rentals_yen INTEGER NOT NULL,
  total_yen INTEGER NOT NULL,
  seats_shown INTEGER,
  snapshot_updated_at TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  note TEXT,
  lang TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','handed_over','guidance_sent','purchased','confirmed','cancelled','unavailable')),
  customer_mail TEXT,
  staff_mail TEXT,
  partner_mail TEXT,
  internal_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX bus_tour_enquiries_status ON bus_tour_enquiries(status, created_at);
CREATE INDEX bus_tour_enquiries_date ON bus_tour_enquiries(tour_date);
