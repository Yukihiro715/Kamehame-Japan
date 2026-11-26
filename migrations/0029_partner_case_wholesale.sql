-- Preserve existing quotes and their original terms.
ALTER TABLE partner_cases ADD COLUMN agency_pays INTEGER NOT NULL DEFAULT 0 CHECK (agency_pays IN (0,1));
ALTER TABLE partner_cases ADD COLUMN customer_group TEXT;
