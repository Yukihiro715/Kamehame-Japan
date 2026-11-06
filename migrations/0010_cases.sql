-- Partner platform, step 3 (docs/PARTNER_PLATFORM_STAGE1.md 4.5): the booking
-- relay. A partner registers a case for a customer; operations quote it; the
-- customer pays from a shared page; the reservation carries the attribution
-- from the case itself (basis 'case'), never from a cookie.

CREATE TABLE partner_cases (
  id TEXT PRIMARY KEY,
  public_ref TEXT NOT NULL UNIQUE,            -- KC-YYMMDD-NN, never shown to the customer
  legal_entity_id TEXT NOT NULL REFERENCES partner_legal_entities(id),
  site_id TEXT NOT NULL REFERENCES hotels(id),
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  assignee_user_id TEXT REFERENCES users(id),  -- the partner's contact for the case
  partner_ref TEXT,                            -- the partner's own reference, optional
  kind TEXT NOT NULL CHECK (kind IN ('experience','free')),
  experience_slug TEXT,
  preferred_date TEXT,
  alt_dates_json TEXT,
  time_pref TEXT,
  guests INTEGER,
  lang TEXT,
  requirements TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_country TEXT,
  extra_json TEXT,                             -- product-specific fields (golf: area, transfer, rentals, ...)
  status TEXT NOT NULL CHECK (status IN ('received','checking','proposed','awaiting_customer','awaiting_payment','paid','confirmed','performed','cancelled','unavailable')),
  status_reason TEXT,
  reservation_id TEXT REFERENCES reservations(id),
  assigned_ops TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX partner_cases_site ON partner_cases(site_id, status);
CREATE INDEX partner_cases_creator ON partner_cases(created_by_user_id);
CREATE INDEX partner_cases_reservation ON partner_cases(reservation_id);

-- One row per quote version. Only one version is 'shared' at a time; a new
-- share supersedes the previous one and expires its Checkout session.
CREATE TABLE case_quotes (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES partner_cases(id),
  version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','shared','paid','superseded','expired','void')),
  title TEXT NOT NULL,
  lines_json TEXT NOT NULL,                    -- [{kind, description, quantity, grossJpy, taxRateBp, commissionable}]
  total_jpy INTEGER NOT NULL DEFAULT 0,        -- what the customer pays online (onsite lines excluded)
  onsite_jpy INTEGER NOT NULL DEFAULT 0,
  includes TEXT,
  excludes TEXT,
  onsite_note TEXT,
  cancel_terms TEXT,
  confirmation_note TEXT,
  valid_until TEXT,                            -- JST date, inclusive
  payment_mode TEXT NOT NULL DEFAULT 'stripe' CHECK (payment_mode IN ('stripe','external','none')),
  share_token TEXT UNIQUE,
  stripe_session_id TEXT,
  stripe_session_created_at TEXT,
  checkout_url TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  shared_at TEXT,
  paid_at TEXT,
  superseded_at TEXT,
  expired_at TEXT,
  UNIQUE (case_id, version)
);
CREATE INDEX case_quotes_case ON case_quotes(case_id, version);
CREATE INDEX case_quotes_session ON case_quotes(stripe_session_id);

CREATE TABLE case_messages (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES partner_cases(id),
  visibility TEXT NOT NULL CHECK (visibility IN ('internal','partner','customer')),
  author_kind TEXT NOT NULL CHECK (author_kind IN ('ops','partner','system')),
  author_email TEXT,
  body TEXT NOT NULL,
  attachment_key TEXT,                         -- MEDIA bucket, cases/<case id>/...
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX case_messages_case ON case_messages(case_id, created_at);

-- The referral gains the 'case' basis and the case it came from. SQLite
-- cannot widen a CHECK, so the table is rebuilt; nothing references it.
CREATE TABLE reservation_referrals_v2 (
  reservation_id TEXT PRIMARY KEY REFERENCES reservations(id),
  hotel_id TEXT REFERENCES hotels(id),
  link_id TEXT REFERENCES referral_links(id),
  session_id TEXT,
  medium TEXT,
  basis TEXT NOT NULL CHECK (basis IN ('cookie','manual','case')),
  case_id TEXT REFERENCES partner_cases(id),
  fixed_at TEXT NOT NULL,
  policy_id TEXT REFERENCES experience_referral_policies(id),
  policy_version INTEGER,
  rate_bp INTEGER,
  status TEXT NOT NULL CHECK (status IN ('attributed','rate_missing','payee_missing','corrected','removed')),
  previous_hotel_id TEXT,
  correction_reason TEXT,
  corrected_by TEXT,
  corrected_at TEXT
);
INSERT INTO reservation_referrals_v2 (reservation_id, hotel_id, link_id, session_id, medium, basis, case_id, fixed_at, policy_id, policy_version, rate_bp, status, previous_hotel_id, correction_reason, corrected_by, corrected_at)
  SELECT reservation_id, hotel_id, link_id, session_id, medium, basis, NULL, fixed_at, policy_id, policy_version, rate_bp, status, previous_hotel_id, correction_reason, corrected_by, corrected_at FROM reservation_referrals;
DROP TABLE reservation_referrals;
ALTER TABLE reservation_referrals_v2 RENAME TO reservation_referrals;
CREATE INDEX reservation_referrals_hotel ON reservation_referrals(hotel_id);
CREATE INDEX reservation_referrals_case ON reservation_referrals(case_id);
