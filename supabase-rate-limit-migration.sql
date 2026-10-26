-- Persistent Rate Limiting — Replaces in-memory Maps that reset on cold starts
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,          -- e.g. 'create-order:user_id' or 'ai-proxy:user_id'
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(key, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No user policies — only service_role (Edge Functions) accesses this table

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window ON rate_limits(key, window_start);

-- Atomic check-and-increment: returns true if under limit, false if exceeded
-- Uses INSERT ... ON CONFLICT to avoid race conditions between concurrent requests
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
  -- Calculate the start of the current window (truncated to window_seconds)
  v_window_start := date_trunc('second', NOW()) - (
    EXTRACT(EPOCH FROM NOW())::INTEGER % p_window_seconds
  ) * INTERVAL '1 second';

  -- Try to insert a new counter row for this window
  INSERT INTO rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;
