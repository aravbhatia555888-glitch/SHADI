-- ============================================================
-- ShaadiBazaar Free-Tier Replies + Atomic Inquiry Reply RPC
-- Run AFTER supabase-subscription-payments.sql and
-- supabase-payment-integrity.sql (write_audit).
--
-- Fixes: H3 (free-plan vendors could never reply despite advertised
--        "5 responses/month"), H6 (credit burned even when the reply
--        write failed — increment and reply are now ONE atomic RPC).
-- Idempotent: safe to re-run.
-- ============================================================

-- increment_inquiry_responses v2
--  * H3: when the vendor has no active subscription row, a FREE
--    subscription row (5 credits/month) is bootstrapped automatically —
--    matching the advertised Free plan. Monthly rollover resets the used
--    counter for free plans when the period lapses.
--    PRODUCT DEFAULT: free allowance = 5 replies/month, matching
--    SUBSCRIPTION_PLANS copy in stores/subscription-store.ts.
CREATE OR REPLACE FUNCTION increment_inquiry_responses(vendor_id_input UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub vendor_subscriptions%ROWTYPE;
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM vendors WHERE id = vendor_id_input;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Vendor not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_sub
  FROM vendor_subscriptions
  WHERE vendor_id = vendor_id_input
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Bootstrap the advertised Free tier (5/month).
    INSERT INTO vendor_subscriptions (
      vendor_id, user_id, plan, status, amount, currency, interval,
      inquiry_credits, lead_credits, current_period_start, current_period_end
    ) VALUES (
      vendor_id_input, v_owner, 'free', 'active', 0, 'INR', 'month',
      5, 5, NOW(), NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (vendor_id, plan) DO UPDATE SET
      status = 'active',
      cancelled_at = NULL,
      inquiry_credits = 5,
      lead_credits = 5,
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '30 days',
      updated_at = NOW();

    SELECT * INTO v_sub
    FROM vendor_subscriptions
    WHERE vendor_id = vendor_id_input AND status = 'active'
    FOR UPDATE;
  END IF;

  -- Monthly rollover for the free tier (paid plans renew via payment).
  IF v_sub.plan = 'free' AND v_sub.current_period_end < NOW() THEN
    UPDATE vendor_subscriptions
    SET inquiry_responses_used = 0,
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE id = v_sub.id;
    v_sub.inquiry_responses_used := 0;
  END IF;

  -- Cap check (-1 represents unlimited responses).
  IF v_sub.inquiry_credits <> -1 AND COALESCE(v_sub.inquiry_responses_used, 0) >= v_sub.inquiry_credits THEN
    RAISE EXCEPTION 'Inquiry response limit reached (%/month). Upgrade plan to respond.', v_sub.inquiry_credits
      USING ERRCODE = '22003';
  END IF;

  UPDATE vendor_subscriptions
  SET inquiry_responses_used = COALESCE(inquiry_responses_used, 0) + 1,
      updated_at = NOW()
  WHERE id = v_sub.id;
END;
$$;

REVOKE ALL ON FUNCTION increment_inquiry_responses(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_inquiry_responses(UUID) TO authenticated, service_role;

-- reply_to_inquiry: ONE atomic operation (authorization + credit spend +
-- reply write). Replaces the client's two-step "RPC then UPDATE" which
-- could burn a credit and lose the reply (H6).
CREATE OR REPLACE FUNCTION reply_to_inquiry(
  p_inquiry_id UUID,
  p_response TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inquiry vendor_inquiries%ROWTYPE;
  v_is_vendor_owner BOOLEAN;
  v_is_inquiry_owner BOOLEAN;
BEGIN
  IF p_response IS NULL OR btrim(p_response) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reply cannot be empty');
  END IF;

  SELECT * INTO v_inquiry
  FROM vendor_inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inquiry not found');
  END IF;

  v_is_inquiry_owner := v_inquiry.user_id = auth.uid();
  SELECT EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = v_inquiry.vendor_id
      AND vendors.user_id = auth.uid()
  ) INTO v_is_vendor_owner;

  IF NOT v_is_inquiry_owner AND NOT v_is_vendor_owner THEN
    RAISE EXCEPTION 'Not authorized to reply to this inquiry' USING ERRCODE = '42501';
  END IF;

  -- Credit gating applies only to the VENDOR side (parity with previous
  -- client behavior; inquiry owners answering their own thread are free).
  IF v_is_vendor_owner THEN
    PERFORM increment_inquiry_responses(v_inquiry.vendor_id);
  END IF;

  UPDATE vendor_inquiries
  SET vendor_response = p_response,
      response_date = NOW(),
      status = 'replied',
      updated_at = NOW()
  WHERE id = v_inquiry.id;

  PERFORM write_audit(
    'inquiry.replied',
    'vendor_inquiries',
    v_inquiry.id,
    jsonb_build_object('status', v_inquiry.status),
    jsonb_build_object('status', 'replied', 'by', CASE WHEN v_is_vendor_owner THEN 'vendor' ELSE 'customer' END)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION reply_to_inquiry(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reply_to_inquiry(UUID, TEXT) TO authenticated, service_role;
