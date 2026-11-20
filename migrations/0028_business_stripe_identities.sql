-- Exact provider-verified charge/payment -> PaymentIntent relationships.
-- A NULL intent records a verified legacy charge without a PaymentIntent.
CREATE TABLE business_stripe_identities (
  source_id TEXT PRIMARY KEY,
  payment_intent TEXT,
  verified_at TEXT NOT NULL
);
CREATE INDEX business_stripe_identities_intent ON business_stripe_identities(payment_intent);
