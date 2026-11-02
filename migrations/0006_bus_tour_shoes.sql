-- Rental shoes on shared-bus enquiries: ¥2,200 per golfer, added to the
-- customer's total like rental clubs (owner's price, 2026-11-02).
ALTER TABLE bus_tour_enquiries ADD COLUMN shoe_renters INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bus_tour_enquiries ADD COLUMN shoes_yen INTEGER NOT NULL DEFAULT 0;
