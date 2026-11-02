-- Audit Log — Tracks sensitive state changes for breach detection
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,         -- e.g. 'subscription.activated', 'booking.confirmed', 'vendor.tier_changed'
  entity_type TEXT NOT NULL,    -- e.g. 'vendor_subscriptions', 'vendor_bookings', 'vendors'
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only service_role (Edge Functions) can write audit logs
-- No INSERT/SELECT/UPDATE/DELETE policies for regular users — service_role bypasses RLS

-- Indexes for querying audit trails
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
