-- Per-golfer details on shared-bus enquiries: name, rental clubs and handedness,
-- shoe rental and size (JSON array; `renters` stays the count of club rentals).
ALTER TABLE bus_tour_enquiries ADD COLUMN golfers_json TEXT;
