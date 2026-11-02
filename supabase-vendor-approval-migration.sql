-- ============================================================
-- ShaadiBazaar Vendor Approval Gate
-- Self-registered vendors start hidden (is_available = false) AND unapproved.
-- An operator approves a listing by setting is_approved = true; the app then
-- shows it as "live". Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Grandfather listings that are already public so existing data keeps showing.
-- This runs before the guard below is replaced, so the old function (which does
-- not know the column) lets it through.
UPDATE vendors SET is_approved = true WHERE is_available = true;

-- Extend the guard:
--  * clients cannot approve themselves,
--  * an unapproved vendor cannot publish (flip is_available to true),
--  * operators (service_role / supabase_admin / postgres in the SQL editor) may.
CREATE OR REPLACE FUNCTION protect_vendor_sensitive_columns()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'supabase_admin', 'postgres') THEN
    IF TG_OP = 'INSERT' THEN
      IF (NEW.subscription_tier IS NOT NULL AND NEW.subscription_tier != 'free')
         OR NEW.verified = true
         OR NEW.featured = true
         OR NEW.is_approved = true
         OR (NEW.rating IS NOT NULL AND NEW.rating != 0)
         OR (NEW.review_count IS NOT NULL AND NEW.review_count != 0)
         OR (NEW.completed_bookings IS NOT NULL AND NEW.completed_bookings != 0) THEN
        RAISE EXCEPTION 'Cannot set server-only vendor columns on insert';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
         OR NEW.verified IS DISTINCT FROM OLD.verified
         OR NEW.featured IS DISTINCT FROM OLD.featured
         OR NEW.is_approved IS DISTINCT FROM OLD.is_approved
         OR NEW.rating IS DISTINCT FROM OLD.rating
         OR NEW.review_count IS DISTINCT FROM OLD.review_count
         OR NEW.completed_bookings IS DISTINCT FROM OLD.completed_bookings
         OR (OLD.is_approved = false AND NEW.is_available = true) THEN
        RAISE EXCEPTION 'Cannot modify server-only vendor columns';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To approve a listing (run in the Supabase SQL editor, which runs as postgres):
--   UPDATE vendors
--   SET is_approved = true, is_available = true
--   WHERE id = '<vendor-id>';
