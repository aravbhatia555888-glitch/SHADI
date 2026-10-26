-- AI Usage Logs — Tracks AI API usage per user per day
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage (for credits display)
DROP POLICY IF EXISTS "Users can view own AI usage" ON ai_usage_logs;
CREATE POLICY "Users can view own AI usage" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- NO INSERT policy for users: ai_usage_logs are only written by Edge Functions (service_role)
-- This prevents clients from manipulating their own usage count.

-- Indexes for quota queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_logs(feature);
