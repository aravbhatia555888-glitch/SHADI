-- Vendor Subscription Cancellation RPC
-- Securely cancels an active subscription and resets the vendor tier to free.

CREATE OR REPLACE FUNCTION cancel_vendor_subscription(subscription_id_input UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub vendor_subscriptions%ROWTYPE;
BEGIN
  -- Retrieve and lock the target subscription
  SELECT * INTO v_sub
  FROM vendor_subscriptions
  WHERE id = subscription_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription not found');
  END IF;

  -- Authorization check: caller must own the subscription
  IF v_sub.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to cancel this subscription' USING ERRCODE = '42501';
  END IF;

  IF v_sub.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'already_cancelled', true);
  END IF;

  -- Mark subscription as cancelled
  UPDATE vendor_subscriptions
  SET status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE id = v_sub.id;

  -- Downgrade vendor tier to free listing
  UPDATE vendors
  SET subscription_tier = 'free',
      updated_at = NOW()
  WHERE id = v_sub.vendor_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION cancel_vendor_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_vendor_subscription(UUID) TO authenticated, service_role;
