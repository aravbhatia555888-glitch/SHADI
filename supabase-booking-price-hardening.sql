-- Derive booking prices from the vendor-owned package catalog.
-- This prevents customers from choosing their own payable amount.

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

  raw_price := regexp_replace(COALESCE(package->>'price', ''), '[^0-9.]', '', 'g');
  IF raw_price = '' THEN
    RAISE EXCEPTION 'Selected package has no valid price';
  END IF;

  parsed_price := raw_price::NUMERIC(10,2);
  IF parsed_price <= 0 OR parsed_price > 10000000 THEN
    RAISE EXCEPTION 'Selected package price is outside allowed bounds';
  END IF;

  NEW.total_amount := parsed_price;
  NEW.advance_amount := round(parsed_price * 0.25, 2);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION set_authoritative_booking_price() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_set_authoritative_booking_price ON vendor_bookings;
CREATE TRIGGER trg_set_authoritative_booking_price
  BEFORE INSERT OR UPDATE OF vendor_id, package_id, total_amount, advance_amount
  ON vendor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_authoritative_booking_price();

ALTER TABLE vendor_bookings
  DROP CONSTRAINT IF EXISTS vendor_bookings_total_amount_positive;
ALTER TABLE vendor_bookings
  ADD CONSTRAINT vendor_bookings_total_amount_positive
  CHECK (total_amount > 0 AND total_amount <= 10000000) NOT VALID;

ALTER TABLE vendor_bookings
  DROP CONSTRAINT IF EXISTS vendor_bookings_advance_amount_valid;
ALTER TABLE vendor_bookings
  ADD CONSTRAINT vendor_bookings_advance_amount_valid
  CHECK (advance_amount > 0 AND advance_amount <= total_amount) NOT VALID;

ALTER TABLE vendor_bookings VALIDATE CONSTRAINT vendor_bookings_total_amount_positive;
ALTER TABLE vendor_bookings VALIDATE CONSTRAINT vendor_bookings_advance_amount_valid;

-- Finalize a booking payment and booking state in one transaction. The row
-- lock makes duplicate Razorpay callbacks idempotent.
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

  RETURN jsonb_build_object('found', true, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION finalize_booking_payment(TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_booking_payment(TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

-- Activate a subscription atomically and idempotently under concurrent callbacks.
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
  credits INTEGER;
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

  credits := CASE payment.plan
    WHEN 'basic' THEN 20
    WHEN 'premium' THEN 100
    WHEN 'elite' THEN -1
    ELSE 5
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
    payment.currency, 'month', credits, credits, NOW(), NOW() + INTERVAL '30 days',
    NULL, NOW()
  )
  ON CONFLICT (vendor_id, plan) DO UPDATE SET
    status = 'active', amount = EXCLUDED.amount, currency = EXCLUDED.currency,
    inquiry_credits = EXCLUDED.inquiry_credits, lead_credits = EXCLUDED.lead_credits,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end, cancelled_at = NULL,
    updated_at = NOW();

  UPDATE vendors SET subscription_tier = payment.plan WHERE id = payment.vendor_id;

  RETURN jsonb_build_object('found', true, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION finalize_subscription_payment(TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_subscription_payment(TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

-- Cancel a user booking safely via RPC without exposing UPDATE RLS to clients
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

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION cancel_user_booking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_user_booking(UUID) TO authenticated, service_role;


