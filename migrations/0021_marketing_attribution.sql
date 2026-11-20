-- Marketing evidence is separate from commission/referral ownership.
-- NULL means unrecorded, never organic or no-ad. Existing rows stay unchanged.
ALTER TABLE reservations ADD COLUMN marketing_attribution_json TEXT;
ALTER TABLE bus_tour_enquiries ADD COLUMN marketing_attribution_json TEXT;
