-- Kept separate so the previous deployment can still write the original price table.
CREATE TABLE partner_brochure_options (
  hotel_id TEXT NOT NULL,
  experience_slug TEXT NOT NULL,
  price_mode TEXT NOT NULL CHECK(price_mode IN ('fixed','inquiry','unset')),
  price_note_en TEXT NOT NULL DEFAULT '',
  PRIMARY KEY(hotel_id,experience_slug),
  FOREIGN KEY(hotel_id,experience_slug) REFERENCES partner_brochure_prices(hotel_id,experience_slug) ON DELETE CASCADE
);
