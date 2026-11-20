-- Public reference prices stay separate from negotiated booking costs.
ALTER TABLE golf_courses ADD COLUMN pricing_json TEXT;
