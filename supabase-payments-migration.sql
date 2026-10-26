-- Payments Migration for ShaadiBazaar
-- Run this in your Supabase SQL Editor

-- Create payment_transactions table to track all payment attempts
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES vendor_bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  
  -- Razorpay fields
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Payment status tracking
  status TEXT CHECK (status IN (
    'created', 'attempted', 'paid', 'failed', 'refunded', 'partially_refunded'
  )) DEFAULT 'created',
  
  payment_type TEXT CHECK (payment_type IN ('full', 'advance', 'remaining')) DEFAULT 'full',
  advance_percentage DECIMAL(5,2),
  
  -- Receipt / invoice reference
  receipt TEXT,
  
  -- Metadata for debugging
  error_message TEXT,
  error_code TEXT,
  payment_method TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure existing databases have updated payment_type check constraint
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_payment_type_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_payment_type_check CHECK (payment_type IN ('full', 'advance', 'remaining'));

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own payments" ON payment_transactions;
CREATE POLICY "Users can view own payments" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- NO INSERT policy for users: payment_transactions are only written by Edge Functions (service_role, bypasses RLS)
-- This prevents client-side fabrication of payment records (S4)

-- RLS: Vendors can view transactions for their vendors
DROP POLICY IF EXISTS "Vendors can view their transactions" ON payment_transactions;
CREATE POLICY "Vendors can view their transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = payment_transactions.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order ON payment_transactions(razorpay_order_id);

-- Idempotency: prevent duplicate payment records from retries
ALTER TABLE payment_transactions ADD CONSTRAINT uq_payment_transactions_order_id UNIQUE (razorpay_order_id);