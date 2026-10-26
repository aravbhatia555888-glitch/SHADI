-- ============================================================
-- ShaadiBazaar Payment Integrity
-- Run AFTER supabase-booking-price-hardening.sql,
-- supabase-rate-limit-migration.sql and supabase-audit-log-migration.sql.
-- Fixes: H7 (credits not restored on renewal), M5 (payment resurrects a
--        cancelled booking), M6 (concurrent activation race),
--        interval='year' ignored, M7 (rate_limits grows unbounded),
--        L1 (audit_log had zero writers).
-- Idempotent: safe to re-run.
-- ============================================================

-- ── L1: audit helper. Best-effort by design — an audit failure must
-- never break a business transaction. Called from SECURITY DEFINER
-- functions below; not exposed to clients.
CREATE OR REPLACE FUNCTION write_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old JSONB DEFAULT NULL,
  p_new JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  BEGIN
    INSERT INTO audit_log (action, entity_type, entity_id, old_value, new_value)
    VALUES (p_action, p_entity_type, p_entity_id, p_old, p_new);
  EXCEPTION WHEN OTHERS THEN
    -- Swallow: audit is advisory (see supabase-audit-log-migration.sql).
    NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION write_audit(TEXT, TEXT, UUID, JSONB, JSONB) FROM PUBLIC;

-- ── finalize_booking_payment v2
--  * M5: refuses to confirm a CANCELLED booking (previously paying the
--    remaining amount resurrected it). Clients surface a "contact
--    support for refund" path; refunds remain a manual ops process
--    (PRODUCT DEFAULT — flagged in the Phase 2 report).
--  * L1: writes an audit entry.
CREATE OR REPLACE FUNCTION finalize_booking_payment(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_signature TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  tx payment_transactions%ROWTYPE;
  booking_status TEXT;
  next_payment_status TEXT;
BEGIN
  SELECT * INTO tx
  FROM payment_transactions
  WHERE razorpay_order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  IF tx.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Payment does not belong to caller' USING ERRCODE = '42501';
  END IF;
  IF tx.status = 'paid' THEN
    RETURN jsonb_build_object('found', true, 'idempotent', true);
  END IF;

  SELECT status INTO booking_status
  FROM vendor_bookings WHERE id = tx.booking_id;

  IF booking_status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking was cancelled; payment cannot be applied. Refund required.'
      USING ERRCODE = 'P0001', DETAIL = 'BOOKING_CANCELLED';
  END IF;

  next_payment_status := CASE 
    WHEN tx.payment_type = 'advance' THEN 'partial'
    WHEN tx.payment_type IN ('remaining', 'full') THEN 'paid'
    ELSE 'paid'
  END;

  UPDATE payment_transactions
  SET status = 'paid',
      razorpay_payment_id = p_payment_id,
      razorpay_signature = p_signature,
      updated_at = NOW()
  WHERE id = tx.id;

  UPDATE vendor_bookings
  SET payment_status = next_payment_status,
      status = 'confirmed',
      updated_at = NOW()
  WHERE id = tx.booking_id;

  PERFORM write_audit(
    'booking.payment_finalized',
    'payment_transactions',
    tx.id,
    jsonb_build_object('status', 'created'),
    jsonb_build_object('status', 'paid', 'booking_payment_status', next_payment_status, 'payment_id', p_payment_id)
  );

  RETURN jsonb_build_object('found', true, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION finalize_booking_payment(TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_booking_payment(TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

-- ── finalize_subscription_payment v2
--  * M6: takes a per-vendor advisory lock and RE-READS the payment row
--    after acquiring it, so two concurrent callbacks for the same vendor
--    serialize instead of colliding on idx_vendor_active_subscription
--    after money was captured.
--  * interval honored: metadata.interval='year' → 365 days (was a
--    hardcoded 30 for all plans).
--  * H7: inquiry_responses_used reset to 0 on (re)activation — paying
--    again actually restores quota.
--  * L1: audit entry.
CREATE OR REPLACE FUNCTION finalize_subscription_payment(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_signature TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  payment subscription_payments%ROWTYPE;
  fresh subscription_payments%ROWTYPE;
  credits INTEGER;
  v_period INTERVAL;
BEGIN
  SELECT * INTO payment
  FROM subscription_payments
  WHERE razorpay_order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  IF payment.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Payment does not belong to caller' USING ERRCODE = '42501';
  END IF;
  IF payment.status IN ('verified', 'paid') THEN
    RETURN jsonb_build_object('found', true, 'idempotent', true);
  END IF;

  -- Serialize per vendor: a second concurrent callback waits here, then
  -- re-reads committed state (READ COMMITTED) before acting.
  PERFORM pg_advisory_xact_lock(hashtextextended('sb-vendor:' || payment.vendor_id::text, 0));

  SELECT * INTO fresh
  FROM subscription_payments
  WHERE id = payment.id
  FOR UPDATE;

  IF fresh.status IN ('verified', 'paid') THEN
    RETURN jsonb_build_object('found', true, 'idempotent', true);
  END IF;
  payment := fresh;

  credits := CASE payment.plan
    WHEN 'basic' THEN 20
    WHEN 'premium' THEN 100
    WHEN 'elite' THEN -1
    ELSE 5
  END;

  v_period := CASE
    WHEN COALESCE(payment.metadata->>'interval', 'month') = 'year' THEN INTERVAL '365 days'
    ELSE INTERVAL '30 days'
  END;

  UPDATE subscription_payments
  SET status = 'verified',
      razorpay_payment_id = p_payment_id,
      razorpay_signature = p_signature,
      updated_at = NOW()
  WHERE id = payment.id;

  UPDATE vendor_subscriptions
  SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE vendor_id = payment.vendor_id AND status = 'active';

  INSERT INTO vendor_subscriptions (
    vendor_id, user_id, plan, status, amount, currency, interval,
    inquiry_credits, lead_credits, current_period_start, current_period_end,
    cancelled_at, updated_at
  ) VALUES (
    payment.vendor_id, payment.user_id, payment.plan, 'active', payment.amount,
    payment.currency, COALESCE(payment.metadata->>'interval', 'month'), credits, credits,
    NOW(), NOW() + v_period,
    NULL, NOW()
  )
  ON CONFLICT (vendor_id, plan) DO UPDATE SET
    status = 'active', amount = EXCLUDED.amount, currency = EXCLUDED.currency,
    interval = EXCLUDED.interval,
    inquiry_credits = EXCLUDED.inquiry_credits, lead_credits = EXCLUDED.lead_credits,
    inquiry_responses_used = 0,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end, cancelled_at = NULL,
    updated_at = NOW();

  UPDATE vendors SET subscription_tier = payment.plan WHERE id = payment.vendor_id;

  PERFORM write_audit(
    'subscription.activated',
    'vendor_subscriptions',
    payment.vendor_id,
    NULL,
    jsonb_build_object('plan', payment.plan, 'order_id', p_order_id, 'payment_id', p_payment_id)
  );

  RETURN jsonb_build_object('found', true, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION finalize_subscription_payment(TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_subscription_payment(TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

-- ── cancel_user_booking: unchanged behavior (customers may cancel;
-- refunds are a manual ops process per PRODUCT DEFAULT — flagged in the
-- report), now with an audit trail (L1).
CREATE OR REPLACE FUNCTION cancel_user_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking vendor_bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking
  FROM vendor_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to cancel this booking' USING ERRCODE = '42501';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'already_cancelled', true);
  END IF;

  UPDATE vendor_bookings
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = v_booking.id;

  PERFORM write_audit(
    'booking.cancelled',
    'vendor_bookings',
    v_booking.id,
    jsonb_build_object('status', v_booking.status, 'payment_status', v_booking.payment_status),
    jsonb_build_object('status', 'cancelled')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION cancel_user_booking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_user_booking(UUID) TO authenticated, service_role;

-- ── cancel_vendor_subscription: audit trail (L1).
CREATE OR REPLACE FUNCTION cancel_vendor_subscription(subscription_id_input UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub vendor_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_sub
  FROM vendor_subscriptions
  WHERE id = subscription_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription not found');
  END IF;

  IF v_sub.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to cancel this subscription' USING ERRCODE = '42501';
  END IF;

  IF v_sub.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'already_cancelled', true);
  END IF;

  UPDATE vendor_subscriptions
  SET status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE id = v_sub.id;

  UPDATE vendors
  SET subscription_tier = 'free',
      updated_at = NOW()
  WHERE id = v_sub.vendor_id;

  PERFORM write_audit(
    'subscription.cancelled',
    'vendor_subscriptions',
    v_sub.id,
    jsonb_build_object('plan', v_sub.plan, 'status', 'active'),
    jsonb_build_object('status', 'cancelled')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION cancel_vendor_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_vendor_subscription(UUID) TO authenticated, service_role;

-- ── M7: prune stale windows for the key just touched. Keeps rate_limits
-- bounded without needing a separate cleanup job.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window_start := date_trunc('second', NOW()) - (
    EXTRACT(EPOCH FROM NOW())::INTEGER % p_window_seconds
  ) * INTERVAL '1 second';

  INSERT INTO rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Opportunistic cleanup: drop this key's windows older than 5x window.
  DELETE FROM rate_limits
  WHERE key = p_key
    AND window_start < v_window_start - make_interval(secs => p_window_seconds * 5);

  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;


