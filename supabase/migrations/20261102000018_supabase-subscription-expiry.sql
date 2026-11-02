-- ============================================================
-- ShaadiBazaar Subscription Expiry (H5)
-- Paid subscriptions previously never lapsed server-side: an expired
-- vendor kept their premium tier/featured placement forever. This adds
-- an idempotent expiry pass plus a daily pg_cron schedule (skipped with
-- a NOTICE when pg_cron is unavailable — then schedule externally).
-- Idempotent: safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION expire_vendor_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id, vendor_id, plan
    FROM vendor_subscriptions
    WHERE status = 'active'
      AND plan <> 'free'
      AND current_period_end < NOW()
    FOR UPDATE
  LOOP
    UPDATE vendor_subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = r.id;

    UPDATE vendors
    SET subscription_tier = 'free',
        updated_at = NOW()
    WHERE id = r.vendor_id
      AND subscription_tier = r.plan;

    PERFORM write_audit(
      'subscription.expired',
      'vendor_subscriptions',
      r.id,
      jsonb_build_object('plan', r.plan, 'status', 'active'),
      jsonb_build_object('status', 'expired')
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION expire_vendor_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION expire_vendor_subscriptions() TO service_role;

-- Schedule daily at 03:00 UTC when pg_cron is available.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.unschedule('sb-expire-subscriptions')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sb-expire-subscriptions');
  PERFORM cron.schedule(
    'sb-expire-subscriptions',
    '0 3 * * *',
    'SELECT expire_vendor_subscriptions();'
  );
  RAISE NOTICE 'pg_cron scheduled: expire_vendor_subscriptions daily at 03:00 UTC';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unavailable (%). Schedule expire_vendor_subscriptions() externally (e.g. Supabase cron-integrations or an external cron hitting an Edge Function).', SQLERRM;
END
$$;
