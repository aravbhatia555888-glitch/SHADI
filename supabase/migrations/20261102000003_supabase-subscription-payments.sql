-- Subscription Payments — Tracks subscription payment attempts
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'elite')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'verified', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription payments
DROP POLICY IF EXISTS "Users can view own subscription payments" ON subscription_payments;
CREATE POLICY "Users can view own subscription payments" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all (edge functions use service role key)
-- No explicit policy needed — service role bypasses RLS

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_payments_order ON subscription_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_vendor ON subscription_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_user ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(status);

-- Add inquiry response tracking to vendor_subscriptions
ALTER TABLE vendor_subscriptions
  ADD COLUMN IF NOT EXISTS inquiry_responses_used INTEGER DEFAULT 0;

-- RPC function to increment inquiry_responses_used atomically with credit limit enforcement
CREATE OR REPLACE FUNCTION increment_inquiry_responses(vendor_id_input UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub vendor_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_sub
  FROM vendor_subscriptions
  WHERE vendor_id = vendor_id_input
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active subscription found for vendor' USING ERRCODE = 'P0002';
  END IF;

  -- Check inquiry response credit cap (-1 represents unlimited responses)
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

