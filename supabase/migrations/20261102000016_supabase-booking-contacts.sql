-- ============================================================
-- ShaadiBazaar Booking Contact Columns (M4)
-- The booking screen collects name/phone/email but vendor_bookings had
-- no columns for them — the data was silently discarded and vendors had
-- no way to reach the customer. Adds optional contact fields.
-- Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE vendor_bookings ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE vendor_bookings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE vendor_bookings ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- No RLS changes needed: vendor_bookings rows are only readable by the
-- booking owner (and service role). Vendors never read booking rows
-- directly (no vendor SELECT policy), so customer contact details stay
-- private — same PII stance as vendor_inquiries.
