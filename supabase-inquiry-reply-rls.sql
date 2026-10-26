-- Vendor Reply to Inquiries RLS Migration
-- Run this in your Supabase SQL Editor

-- Re-create base policy: inquiry creators can manage their own inquiries
DROP POLICY IF EXISTS "Users can manage own inquiries" ON vendor_inquiries;
CREATE POLICY "Users can manage own inquiries" ON vendor_inquiries
  FOR ALL USING (auth.uid() = user_id);

-- Vendor reply policy: vendor owners can only UPDATE reply fields on inquiries for their vendors
-- This is intentionally narrow — vendors must NOT be able to SELECT/INSERT/DELETE inquiries
-- (which would expose user PII like email and phone), only respond to them.
DROP POLICY IF EXISTS "Vendors can reply to inquiries" ON vendor_inquiries;
CREATE POLICY "Vendors can reply to inquiries" ON vendor_inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_inquiries.vendor_id
      AND vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_inquiries.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Trigger to restrict vendor updates to reply fields only
CREATE OR REPLACE FUNCTION restrict_vendor_inquiry_update()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'supabase_admin') THEN
    -- Vendors may only change vendor_response, response_date, and status
    IF NEW.vendor_response IS DISTINCT FROM OLD.vendor_response
       OR NEW.response_date IS DISTINCT FROM OLD.response_date
       OR NEW.status IS DISTINCT FROM OLD.status THEN
      -- Allow: these are reply fields
      NULL;
    ELSIF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.user_name IS DISTINCT FROM OLD.user_name
       OR NEW.user_email IS DISTINCT FROM OLD.user_email
       OR NEW.user_phone IS DISTINCT FROM OLD.user_phone
       OR NEW.subject IS DISTINCT FROM OLD.subject
       OR NEW.message IS DISTINCT FROM OLD.message
       OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id THEN
      RAISE EXCEPTION 'Vendors can only update reply fields on inquiries';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_restrict_vendor_inquiry_update ON vendor_inquiries;
CREATE TRIGGER trg_restrict_vendor_inquiry_update
  BEFORE UPDATE ON vendor_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION restrict_vendor_inquiry_update();