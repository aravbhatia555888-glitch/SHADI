-- ============================================================
-- ShaadiBazaar Security Hardening
-- Run AFTER supabase-setup.sql, chat, subscriptions and
-- booking-price-hardening migrations.
-- Fixes: C1 (admin-by-JWT-metadata escalation), C2 (self-granted paid
--        subscriptions), H1 (double booking), H2 (price-string
--        mispricing), M1 (inquiry field whitelist), M2 (chat read/
--        delete impossible), M3 (sender_type spoofing).
-- Idempotent: safe to re-run.
-- ============================================================

-- ── C1: the "admin" policy trusted auth.users.raw_user_meta_data, which
-- any user can edit via supabase.auth.updateUser({ data: { role } }).
-- There is no admin role anywhere in this codebase — drop the policy.
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON vendor_subscriptions;

-- ── C2: clients could INSERT their own active 'elite' subscription with
-- amount = 0, bypassing Razorpay entirely. Entitlements are granted ONLY
-- by finalize_subscription_payment (service_role bypasses RLS).
DROP POLICY IF EXISTS "Vendors can insert own subscriptions" ON vendor_subscriptions;

-- ── M3: chat message INSERT policies must pin sender_type to the
-- caller's side (customers were able to post messages rendered as the
-- vendor's).
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    sender_type = 'user' AND
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendors can send messages" ON chat_messages;
CREATE POLICY "Vendors can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    sender_type = 'vendor' AND
    EXISTS (
      SELECT 1 FROM chat_conversations
      JOIN vendors ON vendors.id = chat_conversations.vendor_id
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND vendors.user_id = auth.uid()
    )
  );

-- ── M2 (a): participants need UPDATE support so read receipts persist;
-- previously there was NO UPDATE policy on chat_messages at all.
DROP POLICY IF EXISTS "Conversation members can update messages" ON chat_messages;
CREATE POLICY "Conversation members can update messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      LEFT JOIN vendors v ON v.id = c.vendor_id
      WHERE c.id = chat_messages.conversation_id
        AND (c.user_id = auth.uid() OR v.user_id = auth.uid())
    )
  );

-- ── M2 (b): trigger — participants may only flip `read`, never content.
CREATE OR REPLACE FUNCTION restrict_chat_message_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'supabase_admin') THEN
    IF NEW.content IS DISTINCT FROM OLD.content
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.sender_type IS DISTINCT FROM OLD.sender_type
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
       OR NEW.message_type IS DISTINCT FROM OLD.message_type THEN
      RAISE EXCEPTION 'Chat messages are immutable; only the read flag may change';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_chat_message_update ON chat_messages;
CREATE TRIGGER trg_restrict_chat_message_update
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION restrict_chat_message_update();

-- ── M2 (c): deleting a conversation was impossible — neither table had a
-- DELETE policy. The FK already cascades messages, so one policy here
-- suffices. PRODUCT DEFAULT: the customer (conversation owner) deletes
-- the whole thread; the vendor side keeps their history.
DROP POLICY IF EXISTS "Users can delete own conversations" ON chat_conversations;
CREATE POLICY "Users can delete own conversations" ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- ── H2: booking prices were parsed out of free-form display strings
-- ("₹50k" silently became ₹50.00). The parser now FAILS CLOSED: only
-- plain numbers with optional ₹/Rs prefix and thousands separators are
-- accepted. Vendors entering "50k"/"1.5 lakh" get an explicit error
-- instead of a mispriced charge.
CREATE OR REPLACE FUNCTION set_authoritative_booking_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  package JSONB;
  raw_price TEXT;
  parsed_price NUMERIC(10,2);
BEGIN
  IF NEW.package_id IS NULL OR btrim(NEW.package_id) = '' THEN
    RAISE EXCEPTION 'A valid package is required';
  END IF;

  SELECT value INTO package
  FROM vendors v,
       LATERAL jsonb_array_elements(to_jsonb(v.packages)) AS value
  WHERE v.id = NEW.vendor_id
    AND value->>'id' = NEW.package_id
  LIMIT 1;

  IF package IS NULL THEN
    RAISE EXCEPTION 'Selected package does not exist for this vendor';
  END IF;

  raw_price := COALESCE(package->>'price', '');

  -- Fail closed: canonical formats only — "25000", "₹2,50,000", "Rs. 25000".
  IF raw_price !~ '^[[:space:]]*(₹|[Rr][Ss]\.?)?[[:space:]]*[0-9][0-9,]*(\.[0-9]{1,2})?[[:space:]]*$' THEN
    RAISE EXCEPTION 'Package price must be a plain number (e.g. 25000 or ₹2,50,000); abbreviations like 50k are not allowed';
  END IF;

  parsed_price := regexp_replace(raw_price, '[^0-9.]', '', 'g')::NUMERIC(10,2);
  IF parsed_price <= 0 OR parsed_price > 10000000 THEN
    RAISE EXCEPTION 'Selected package price is outside allowed bounds';
  END IF;

  NEW.total_amount := parsed_price;
  NEW.advance_amount := round(parsed_price * 0.25, 2);
  RETURN NEW;
END;
$$;

-- ── H1: one active booking per vendor per date, enforced by the DB.
-- The app-level availability check was dead code AND RLS-blind; this
-- partial unique index is the real guard. It fails loudly if historical
-- duplicates exist — resolve them first:
--   SELECT vendor_id, event_date, count(*) FROM vendor_bookings
--   WHERE status IN ('pending','confirmed')
--   GROUP BY 1,2 HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_bookings_active_date
  ON vendor_bookings (vendor_id, ((event_date AT TIME ZONE 'Asia/Kolkata')::date))
  WHERE status IN ('pending', 'confirmed');

-- ── M1: ensure customer inquiry fields cannot be modified by vendor reply updates
CREATE OR REPLACE FUNCTION restrict_vendor_inquiry_update()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'supabase_admin') THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.user_name IS DISTINCT FROM OLD.user_name
       OR NEW.user_email IS DISTINCT FROM OLD.user_email
       OR NEW.user_phone IS DISTINCT FROM OLD.user_phone
       OR NEW.subject IS DISTINCT FROM OLD.subject
       OR NEW.message IS DISTINCT FROM OLD.message
       OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id
       OR NEW.event_date IS DISTINCT FROM OLD.event_date
       OR NEW.event_type IS DISTINCT FROM OLD.event_type
       OR NEW.budget IS DISTINCT FROM OLD.budget THEN
      RAISE EXCEPTION 'Vendors can only update reply fields on inquiries';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

