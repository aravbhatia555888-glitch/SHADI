-- Vendor Inquiry Dashboard RPCs
-- Run this in your Supabase SQL Editor
--
-- PROBLEM: vendor_inquiries RLS only lets the inquiry CREATOR (customer)
-- SELECT rows (`auth.uid() = user_id`). Vendor owners therefore cannot load
-- their dashboard stats or inquiry list — every query returns zero rows,
-- even though the UI is built around this feature.
--
-- We deliberately do NOT add a direct vendor SELECT policy, because that
-- would expose customer PII (email, phone, name) stored on the row.
-- Instead these SECURITY DEFINER RPCs verify vendor ownership and return
-- only the fields the dashboard needs.

-- Stats: total / new / replied counts for a vendor's inquiries
CREATE OR REPLACE FUNCTION get_vendor_inquiry_stats(vendor_id_input UUID)
RETURNS TABLE (total BIGINT, new BIGINT, replied BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id_input
      AND vendors.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE status = 'new')::BIGINT AS new,
    COUNT(*) FILTER (WHERE status = 'replied')::BIGINT AS replied
  FROM vendor_inquiries
  WHERE vendor_id = vendor_id_input;
END;
$$;

REVOKE ALL ON FUNCTION get_vendor_inquiry_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_vendor_inquiry_stats(UUID) TO authenticated;

-- Recent inquiries (non-PII fields only) for a vendor's dashboard
CREATE OR REPLACE FUNCTION get_vendor_inquiries_dashboard(vendor_id_input UUID)
RETURNS TABLE (
  id UUID,
  user_name TEXT,
  subject TEXT,
  message TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id_input
      AND vendors.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT i.id, i.user_name, i.subject, i.message, i.status, i.created_at
  FROM vendor_inquiries i
  WHERE i.vendor_id = vendor_id_input
  ORDER BY i.created_at DESC
  LIMIT 10;
END;
$$;

REVOKE ALL ON FUNCTION get_vendor_inquiries_dashboard(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_vendor_inquiries_dashboard(UUID) TO authenticated;
