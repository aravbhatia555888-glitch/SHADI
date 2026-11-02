-- ============================================================
-- ShaadiBazaar User Roles
-- Lets the app distinguish couples, vendors and explorers. Without this the
-- product assumes every signed-in user is a couple planning a wedding.
-- Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'couple';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('couple', 'vendor', 'explorer'));

-- Vendor self-registration reuses the existing "Users can insert own vendors"
-- RLS policy. New listings are inserted with is_available = false so they stay
-- hidden from public queries until reviewed (approval is still a manual/ops
-- step — there is no admin approval UI yet).
