-- Hotel referral programme: partners, referral links, attribution, reservations,
-- payments and the commission ledger (docs/HOTEL_REFERRAL_STAGE1.md, section 5).
-- Money is integer JPY. Times are ISO-8601 UTC text; JST calendar dates are
-- stored separately where a Japanese business day decides something.
-- Applied by `wrangler d1 migrations apply` (deploy workflow) and, in tests, by
-- tests/helpers/sqlite-db.mjs against node:sqlite, so keep to plain SQLite.

CREATE TABLE partner_legal_entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  registration_status TEXT NOT NULL DEFAULT 'unverified' CHECK (registration_status IN ('registered','unregistered','unverified')),
  registration_number TEXT,
  registration_verified_at TEXT,
  registration_verified_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE hotels (
  id TEXT PRIMARY KEY,
  legal_entity_id TEXT NOT NULL REFERENCES partner_legal_entities(id),
  public_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','terminated')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- The settlement/payout unit. One hotel per profile by default; several hotels
-- of the same legal entity may share one. Bank details are stored encrypted by
-- the application (stage 3) and shown masked.
CREATE TABLE settlement_profiles (
  id TEXT PRIMARY KEY,
  legal_entity_id TEXT NOT NULL REFERENCES partner_legal_entities(id),
  name TEXT NOT NULL,
  payee_name TEXT,
  payee_address TEXT,
  bank_details_enc TEXT,
  bank_details_masked TEXT,
  min_payout_jpy INTEGER NOT NULL DEFAULT 3000,
  fee_borne_by TEXT NOT NULL DEFAULT 'hotel' CHECK (fee_borne_by IN ('hotel','kamehame')),
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE settlement_profile_hotels (
  profile_id TEXT NOT NULL REFERENCES settlement_profiles(id),
  hotel_id TEXT NOT NULL REFERENCES hotels(id),
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  PRIMARY KEY (profile_id, hotel_id, valid_from)
);
CREATE INDEX settlement_profile_hotels_hotel ON settlement_profile_hotels(hotel_id, valid_from);

-- Public referral links. `hotel_id` is null for a chain-wide link, which then
-- needs `chain_profile_id` before any commission can be settled.
CREATE TABLE referral_links (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  hotel_id TEXT REFERENCES hotels(id),
  chain_profile_id TEXT REFERENCES settlement_profiles(id),
  experience_slug TEXT,
  medium TEXT NOT NULL DEFAULT 'other' CHECK (medium IN ('brochure','room_tv','front','web','other')),
  kind TEXT NOT NULL DEFAULT 'qr' CHECK (kind IN ('qr','url')),
  target_path TEXT NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','retired')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX referral_links_hotel ON referral_links(hotel_id);

-- One row per arrival through a referral link ("QR経由アクセス数"). Bots,
-- link previews and operator tests are kept but excluded from counts.
CREATE TABLE referral_events (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES referral_links(id),
  hotel_id TEXT,
  session_id TEXT,
  at TEXT NOT NULL,
  ua_class TEXT NOT NULL DEFAULT 'human' CHECK (ua_class IN ('human','bot','preview','test')),
  excluded INTEGER NOT NULL DEFAULT 0,
  lang TEXT
);
CREATE INDEX referral_events_link_at ON referral_events(link_id, at);
CREATE INDEX referral_events_hotel_at ON referral_events(hotel_id, at);

-- What the `kh_ref` cookie points at. The id is 128 random bits; the server
-- checks existence and expiry on every use, so the cookie carries no claim.
CREATE TABLE referral_sessions (
  id TEXT PRIMARY KEY,
  hotel_id TEXT,
  link_id TEXT NOT NULL REFERENCES referral_links(id),
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX referral_sessions_expires ON referral_sessions(expires_at);

-- Commission terms per experience. A new row per change (valid_from, version);
-- a reservation keeps the row it was created under. No row = not referable /
-- rate pending; the application never assumes a default rate.
CREATE TABLE experience_referral_policies (
  id TEXT PRIMARY KEY,
  experience_slug TEXT NOT NULL,
  rate_bp INTEGER NOT NULL CHECK (rate_bp >= 0 AND rate_bp <= 10000),
  tax_rate_bp INTEGER NOT NULL DEFAULT 1000,
  price_basis TEXT NOT NULL DEFAULT 'tax_inclusive' CHECK (price_basis IN ('tax_inclusive','tax_exclusive')),
  unit_price_excl_tax_jpy INTEGER,
  reference_avg_jpy INTEGER,
  reference_note TEXT,
  referral_enabled INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX experience_referral_policies_slug ON experience_referral_policies(experience_slug, valid_from);

-- Every reservation the site creates, whichever path it came through. The
-- Sheets ledger keeps the customer-facing operations; this row is what the
-- commission ledger hangs off. `request_id` makes creation idempotent.
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  external_ref TEXT UNIQUE,
  flow TEXT NOT NULL CHECK (flow IN ('contact','experience','golf')),
  experience_slug TEXT NOT NULL,
  experience_date TEXT,
  guests INTEGER,
  lang TEXT,
  status TEXT NOT NULL DEFAULT 'provisional' CHECK (status IN ('provisional','arranging','confirmed','completed','cancelled','no_show')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid','partially_refunded','refunded','disputed')),
  amount_status TEXT NOT NULL DEFAULT 'known' CHECK (amount_status IN ('known','pending')),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX reservations_slug_date ON reservations(experience_slug, experience_date);
CREATE INDEX reservations_payment_intent ON reservations(stripe_payment_intent);

-- Itemised amounts. Commission is computed from commissionable lines only;
-- on-site charges, add-ons and pass-through arrangement costs never count.
CREATE TABLE reservation_lines (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  position INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('base','addon','arrangement','onsite')),
  description TEXT NOT NULL,
  commissionable INTEGER NOT NULL DEFAULT 0,
  tax_rate_bp INTEGER NOT NULL DEFAULT 1000,
  quantity INTEGER NOT NULL DEFAULT 1,
  gross_jpy INTEGER NOT NULL DEFAULT 0,
  discount_jpy INTEGER NOT NULL DEFAULT 0,
  refunded_gross_jpy INTEGER NOT NULL DEFAULT 0,
  net_jpy INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'site' CHECK (source IN ('site','stripe','manual')),
  UNIQUE (reservation_id, position)
);

-- The attribution, fixed when the reservation is created and never changed
-- by later visits. Corrections are explicit, reasoned, and keep the previous
-- hotel in `previous_hotel_id`.
CREATE TABLE reservation_referrals (
  reservation_id TEXT PRIMARY KEY REFERENCES reservations(id),
  hotel_id TEXT REFERENCES hotels(id),
  link_id TEXT REFERENCES referral_links(id),
  session_id TEXT,
  medium TEXT,
  basis TEXT NOT NULL CHECK (basis IN ('cookie','manual')),
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
CREATE INDEX reservation_referrals_hotel ON reservation_referrals(hotel_id);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT REFERENCES reservations(id),
  stripe_event_id TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  client_reference_id TEXT,
  amount_total_jpy INTEGER NOT NULL,
  amount_subtotal_jpy INTEGER,
  amount_discount_jpy INTEGER NOT NULL DEFAULT 0,
  amount_tax_jpy INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL,
  livemode INTEGER NOT NULL DEFAULT 1,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX payments_reservation ON payments(reservation_id);
CREATE INDEX payments_intent ON payments(stripe_payment_intent);

CREATE TABLE refunds (
  id TEXT PRIMARY KEY,
  reservation_id TEXT REFERENCES reservations(id),
  stripe_event_id TEXT NOT NULL UNIQUE,
  stripe_charge_id TEXT,
  stripe_payment_intent TEXT,
  amount_refunded_total_jpy INTEGER NOT NULL,
  amount_delta_jpy INTEGER NOT NULL,
  allocation_status TEXT NOT NULL DEFAULT 'pending' CHECK (allocation_status IN ('pending','allocated','void')),
  allocated_by TEXT,
  allocated_at TEXT,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX refunds_reservation ON refunds(reservation_id);

CREATE TABLE disputes (
  id TEXT PRIMARY KEY,
  reservation_id TEXT REFERENCES reservations(id),
  stripe_dispute_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT NOT NULL,
  amount_jpy INTEGER NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  updated_at TEXT NOT NULL
);

-- The record that the experience took place. Entered by operations until a
-- trusted source exists; a date passing never creates one.
CREATE TABLE attendances (
  reservation_id TEXT PRIMARY KEY REFERENCES reservations(id),
  performed_at TEXT NOT NULL,
  performed_on_jst TEXT NOT NULL,
  confirmed_by TEXT NOT NULL,
  confirmed_at TEXT NOT NULL,
  note TEXT,
  revoked_at TEXT,
  revoked_reason TEXT
);

-- The commission ledger. One current row per reservation; `base_net_jpy` and
-- `commission_net_jpy` are recomputed from the lines until the entry is
-- confirmed, after which changes go through commission_adjustments.
CREATE TABLE commission_entries (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL UNIQUE REFERENCES reservations(id),
  hotel_id TEXT REFERENCES hotels(id),
  settlement_profile_id TEXT REFERENCES settlement_profiles(id),
  settlement_profile_version INTEGER,
  rate_bp INTEGER,
  base_net_jpy INTEGER NOT NULL DEFAULT 0,
  commission_net_jpy INTEGER NOT NULL DEFAULT 0,
  tax_rate_bp INTEGER NOT NULL DEFAULT 1000,
  performed_on_jst TEXT,
  status TEXT NOT NULL CHECK (status IN ('estimated','pending','confirmed','voided','adjusted')),
  hold_reason TEXT,
  confirmed_at TEXT,
  confirmed_by TEXT,
  statement_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX commission_entries_hotel_status ON commission_entries(hotel_id, status);
CREATE INDEX commission_entries_performed ON commission_entries(performed_on_jst);

CREATE TABLE commission_adjustments (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES commission_entries(id),
  delta_net_jpy INTEGER NOT NULL,
  reason TEXT NOT NULL,
  refund_id TEXT REFERENCES refunds(id),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  statement_id TEXT
);
CREATE INDEX commission_adjustments_entry ON commission_adjustments(entry_id);

-- Provider events we have seen (webhooks, ledger syncs): the deduplication
-- key for everything that may be re-sent.
CREATE TABLE integration_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TEXT,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed','ignored','error')),
  note TEXT,
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  before_json TEXT,
  after_json TEXT
);
CREATE INDEX audit_logs_target ON audit_logs(target_type, target_id, at);
