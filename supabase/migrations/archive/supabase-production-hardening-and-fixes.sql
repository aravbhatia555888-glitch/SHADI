-- ============================================================================
-- !!! ARCHIVED — DO NOT APPLY !!!
-- ----------------------------------------------------------------------------
-- Superseded. It writes to a non-existent `audit_logs` table (the schema uses
-- `audit_log`) and redefines `finalize_subscription_payment` and
-- `expire_vendor_subscriptions`, which are owned by supabase-payment-integrity.sql
-- and supabase-subscription-expiry.sql. See ../archive/README.md.
-- ============================================================================

-- ============================================================================
-- ShaadiBazaar Production Readiness & Hardening Fixes (Phase 2)
-- ============================================================================
-- Fixes:
-- 1. CRIT-03: Double-booking TOCTOU via calendar day index on Asia/Kolkata date
-- 2. HIGH-02: Prevent inquiry trigger short-circuit on restricted customer fields
-- 3. HIGH-03: Add WITH CHECK (auth.uid() = user_id) to vendors update RLS policy
-- 4. HIGH-05 & HIGH-06: Subscription tier, verified badge, and featured placement synchronization
-- 5. HIGH-08: Cross-tenant foreign key protection for budget expenses
-- 6. MED-02: Financial audit log user attribution via auth.uid()
-- 7. MED-03: Push token UPDATE policy for on-conflict upserts
-- 8. MED-06: Vendor rating and review count synchronization trigger
-- ============================================================================

-- ── 1. Double-booking calendar day constraint (CRIT-03) ──────────────────────
-- Cast TIMESTAMPTZ to Asia/Kolkata calendar date to prevent cross-timezone double bookings
DROP INDEX IF EXISTS uq_vendor_bookings_active_date;
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_bookings_active_date
  ON vendor_bookings (vendor_id, ((event_date AT TIME ZONE 'Asia/Kolkata')::date))
  WHERE status IN ('pending', 'confirmed');

-- ── 2. Vendor inquiry update validation trigger (HIGH-02) ───────────────────
CREATE OR REPLACE FUNCTION restrict_vendor_inquiry_update()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'supabase_admin') THEN
    -- Check restricted fields independently to eliminate short-circuit bugs
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

-- ── 3. Vendor profile update WITH CHECK (HIGH-03) ───────────────────────────
DROP POLICY IF EXISTS "Users can update own vendors" ON vendors;
CREATE POLICY "Users can update own vendors" ON vendors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Push token UPDATE policy (MED-03) ────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own push tokens" ON user_push_tokens;
CREATE POLICY "Users can update own push tokens" ON user_push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. Budget expense cross-tenant isolation (HIGH-08) ──────────────────────
DROP POLICY IF EXISTS "Users can manage own expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON budget_expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON budget_expenses;

CREATE POLICY "Users can view own expenses" ON budget_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON budget_expenses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      budget_item_id IS NULL OR EXISTS (
        SELECT 1 FROM budget_items b WHERE b.id = budget_item_id AND b.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own expenses" ON budget_expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      budget_item_id IS NULL OR EXISTS (
        SELECT 1 FROM budget_items b WHERE b.id = budget_item_id AND b.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own expenses" ON budget_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ── 6. Audit log user attribution (MED-02) ──────────────────────────────────
CREATE OR REPLACE FUNCTION write_audit(
  p_action TEXT,
  p_entity TEXT,
  p_entity_id TEXT,
  p_old_state JSONB DEFAULT NULL,
  p_new_state JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_user_id UUID;
BEGIN
  -- Attribute to the authenticated user executing the action, if available
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  INSERT INTO audit_logs (action, entity, entity_id, user_id, old_state, new_state)
  VALUES (p_action, p_entity, p_entity_id, v_user_id, p_old_state, p_new_state)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── 7. Vendor Review rollup trigger (MED-06) ─────────────────────────────────
CREATE OR REPLACE FUNCTION sync_vendor_rating_and_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id UUID;
  v_count INTEGER;
  v_avg NUMERIC(3,2);
BEGIN
  v_vendor_id := COALESCE(NEW.vendor_id, OLD.vendor_id);
  IF v_vendor_id IS NOT NULL THEN
    SELECT COUNT(*), COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
    INTO v_count, v_avg
    FROM vendor_reviews
    WHERE vendor_id = v_vendor_id;

    UPDATE vendors
    SET review_count = v_count,
        rating = v_avg,
        updated_at = NOW()
    WHERE id = v_vendor_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_vendor_reviews ON vendor_reviews;
CREATE TRIGGER trg_sync_vendor_reviews
  AFTER INSERT OR UPDATE OR DELETE ON vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_vendor_rating_and_reviews();

-- ── 8. Subscription badge grant & revocation sync (HIGH-05, HIGH-06) ────────
CREATE OR REPLACE FUNCTION finalize_subscription_payment(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_signature TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment RECORD;
  v_existing RECORD;
  credits INT;
  v_period INTERVAL := INTERVAL '30 days';
  v_verified BOOLEAN := false;
  v_featured BOOLEAN := false;
BEGIN
  -- Advisory lock on order_id
  PERFORM pg_advisory_xact_lock(hashtext(p_order_id));

  SELECT * INTO payment
  FROM subscription_payments
  WHERE razorpay_order_id = p_order_id
  FOR UPDATE;

  IF payment IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Payment record not found');
  END IF;

  IF payment.user_id != p_user_id THEN
    RETURN jsonb_build_object('found', true, 'error', 'Payment does not belong to user');
  END IF;

  IF payment.status = 'paid' OR payment.status = 'verified' THEN
    RETURN jsonb_build_object('found', true, 'idempotent', true);
  END IF;

  UPDATE subscription_payments
  SET status = 'paid',
      razorpay_payment_id = p_payment_id,
      razorpay_signature = p_signature,
      updated_at = NOW()
  WHERE id = payment.id;

  SELECT * INTO v_existing
  FROM vendor_subscriptions
  WHERE vendor_id = payment.vendor_id AND plan = payment.plan
  FOR UPDATE;

  credits := CASE payment.plan
    WHEN 'basic' THEN 25
    WHEN 'premium' THEN 75
    WHEN 'elite' THEN 200
    ELSE 10
  END;

  IF payment.metadata->>'interval' = 'year' THEN
    v_period := INTERVAL '365 days';
  END IF;

  -- Determine badges granted by tier:
  -- Basic: Verified badge
  -- Premium / Elite: Verified badge + Featured directory placement
  IF payment.plan IN ('basic', 'premium', 'elite') THEN
    v_verified := true;
  END IF;
  IF payment.plan IN ('premium', 'elite') THEN
    v_featured := true;
  END IF;

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

  UPDATE vendors
  SET subscription_tier = payment.plan,
      verified = CASE WHEN v_verified THEN true ELSE verified END,
      featured = CASE WHEN v_featured THEN true ELSE featured END,
      featured_expires_at = CASE WHEN v_featured THEN NOW() + v_period ELSE featured_expires_at END,
      updated_at = NOW()
  WHERE id = payment.vendor_id;

  PERFORM write_audit(
    'subscription.activated',
    'vendor_subscriptions',
    payment.vendor_id::TEXT,
    NULL,
    jsonb_build_object('plan', payment.plan, 'order_id', p_order_id, 'payment_id', p_payment_id)
  );

  RETURN jsonb_build_object('found', true, 'idempotent', false);
END;
$$;

CREATE OR REPLACE FUNCTION expire_vendor_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT vs.id, vs.vendor_id, vs.plan
    FROM vendor_subscriptions vs
    WHERE vs.status = 'active'
      AND vs.current_period_end < NOW()
    FOR UPDATE
  LOOP
    UPDATE vendor_subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = r.id;

    UPDATE vendors
    SET subscription_tier = 'free',
        verified = false,
        featured = false,
        featured_expires_at = NULL,
        updated_at = NOW()
    WHERE id = r.vendor_id
      AND subscription_tier = r.plan;

    PERFORM write_audit(
      'subscription.expired',
      'vendor_subscriptions',
      r.id::TEXT,
      jsonb_build_object('plan', r.plan, 'status', 'active'),
      jsonb_build_object('status', 'expired')
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
