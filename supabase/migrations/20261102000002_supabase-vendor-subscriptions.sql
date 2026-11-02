-- Vendor Subscriptions — Monetization Layer
-- Run this in your Supabase SQL Editor

-- Create vendor_subscriptions table
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  plan TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'premium', 'elite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  
  -- Pricing
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  interval TEXT CHECK (interval IN ('month', 'year')) DEFAULT 'month',
  
  -- Razorpay subscription reference
  razorpay_subscription_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  
  -- Feature flags (derived from plan but can be overridden)
  featured_until TIMESTAMPTZ,
  verified_until TIMESTAMPTZ,
  lead_credits INTEGER DEFAULT 0,
  inquiry_credits INTEGER DEFAULT 0,
  
  -- Dates
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vendor_id, plan)
);

-- Create a unique index on vendor_id for the active subscription lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_active_subscription 
  ON vendor_subscriptions(vendor_id) 
  WHERE status = 'active';

-- Note: subscription_tier and featured_expires_at columns are now in supabase-setup.sql (file 1)
-- They must exist before this file's trigger references them.

-- Enable RLS
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: Vendors can view own subscriptions
DROP POLICY IF EXISTS "Vendors can view own subscriptions" ON vendor_subscriptions;
CREATE POLICY "Vendors can view own subscriptions" ON vendor_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: Vendors can insert own subscriptions
DROP POLICY IF EXISTS "Vendors can insert own subscriptions" ON vendor_subscriptions;
CREATE POLICY "Vendors can insert own subscriptions" ON vendor_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: Admins can manage all (via a separate admin role check)
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON vendor_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON vendor_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_status ON vendor_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_period_end ON vendor_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_vendors_featured_expires ON vendors(featured_expires_at) WHERE featured_expires_at IS NOT NULL;

-- Plan definitions (reference data, not a table — enforced in code)
--
-- free:     ₹0/mo    → Basic listing, no featured, 5 lead credits/mo
-- basic:    ₹500/mo  → Verified badge, 20 lead credits/mo, inquiry notifications
-- premium:  ₹2,000/mo → Featured placement, 100 lead credits/mo, analytics
-- elite:    ₹5,000/mo → Top of category, unlimited leads, dedicated support, custom profile