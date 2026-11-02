-- Article Favorites Migration
-- Run this in your Supabase SQL Editor

-- Create favorite_articles table (mirrors favorite_vendors pattern)
CREATE TABLE IF NOT EXISTS favorite_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  article_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE favorite_articles ENABLE ROW LEVEL SECURITY;

-- RLS: Users can manage their own article favorites
DROP POLICY IF EXISTS "Users can manage own article favorites" ON favorite_articles;
CREATE POLICY "Users can manage own article favorites" ON favorite_articles
  FOR ALL USING (auth.uid() = user_id);

-- NOTE: Guest favorites are NOT stored in this table.
-- USING(true) was removed because it allowed any unauthenticated caller to
-- SELECT/UPDATE/DELETE all users' favorites (S8 — mass PII/data leak).
-- Guest favorites should use localStorage on the client.