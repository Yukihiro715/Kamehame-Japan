-- Separate child table keeps old nine-column brand inserts compatible during rollout.
CREATE TABLE partner_brochure_contacts (
  hotel_id TEXT PRIMARY KEY REFERENCES partner_brochure_brands(hotel_id) ON DELETE CASCADE,
  options_json TEXT NOT NULL CHECK(json_valid(options_json))
);
