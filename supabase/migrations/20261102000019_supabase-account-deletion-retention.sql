-- ============================================================
-- ShaadiBazaar Account-Deletion Retention (M8 / part of C4)
-- Financial ledgers are ANONYMIZED, not destroyed, when an account is
-- deleted. PRODUCT DEFAULT (flagged in report): payment_transactions and
-- subscription_payments survive with user_id / booking_id / vendor_id
-- nulled by FK actions — Razorpay and Indian bookkeeping rules expect the
-- merchant to retain transaction records, while DPDP erasure is served by
-- detaching all personal identifiers.
-- Idempotent: safe to re-run.
-- ============================================================

-- payment_transactions.user_id: CASCADE → SET NULL (retain ledger row)
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_user_id_fkey;
ALTER TABLE payment_transactions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE payment_transactions
  ADD CONSTRAINT payment_transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- payment_transactions.booking_id: CASCADE → SET NULL (retain ledger row
-- when a booking is deleted, including vendor-side cascades)
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_booking_id_fkey;
ALTER TABLE payment_transactions
  ADD CONSTRAINT payment_transactions_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES vendor_bookings(id) ON DELETE SET NULL;

-- subscription_payments.user_id: CASCADE → SET NULL
ALTER TABLE subscription_payments DROP CONSTRAINT IF EXISTS subscription_payments_user_id_fkey;
ALTER TABLE subscription_payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE subscription_payments
  ADD CONSTRAINT subscription_payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- subscription_payments.vendor_id: CASCADE → SET NULL (retain ledger when
-- a vendor listing is removed during account deletion)
ALTER TABLE subscription_payments DROP CONSTRAINT IF EXISTS subscription_payments_vendor_id_fkey;
ALTER TABLE subscription_payments ALTER COLUMN vendor_id DROP NOT NULL;
ALTER TABLE subscription_payments
  ADD CONSTRAINT subscription_payments_vendor_id_fkey
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
