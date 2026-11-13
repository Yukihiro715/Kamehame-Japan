-- Partner-owned sales material only. Never changes booking prices or commission snapshots.
CREATE TABLE partner_brochure_brands (
  hotel_id TEXT PRIMARY KEY REFERENCES hotels(id),
  company_name TEXT NOT NULL,
  logo_data_url TEXT,
  accent_color TEXT NOT NULL DEFAULT '#b74908',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL REFERENCES users(id)
);
CREATE TABLE partner_brochure_prices (
  hotel_id TEXT NOT NULL REFERENCES hotels(id),
  experience_slug TEXT NOT NULL,
  price_jpy INTEGER CHECK(price_jpy IS NULL OR price_jpy BETWEEN 1 AND 100000000),
  price_unit TEXT NOT NULL CHECK(price_unit IN ('person','group')),
  price_note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL REFERENCES users(id),
  PRIMARY KEY(hotel_id, experience_slug)
);
