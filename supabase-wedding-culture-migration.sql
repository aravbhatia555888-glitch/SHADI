-- ============================================================
-- ShaadiBazaar Wedding Culture
-- Persists the tradition chosen during onboarding so AI features and the
-- checklist can reuse it after a reload.
-- Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE wedding_details ADD COLUMN IF NOT EXISTS culture TEXT;
