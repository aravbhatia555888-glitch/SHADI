# Database Migrations

The SQL files live at the **repo root**. Apply them in this exact order via the Supabase SQL Editor.

## Apply Order

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase-setup.sql` | Core tables, RLS policies, triggers, indexes, sample data |
| 2 | `supabase-vendor-subscriptions.sql` | Subscription plans, vendor_subscriptions table, active subscription index |
| 3 | `supabase-subscription-payments.sql` | Subscription payment tracking, inquiry response RPC |
| 4 | `supabase-payments-migration.sql` | Booking payment_transactions table, idempotency constraint |
| 5 | `supabase-inquiry-reply-rls.sql` | Vendor reply RLS + trigger restricting to reply fields only |
| 6 | `supabase-favorite-articles-migration.sql` | Article favorites (authenticated-only) |
| 7 | `supabase-push-migration.sql` | Push notification tokens |
| 8 | `supabase-ai-usage-migration.sql` | AI usage tracking for quota enforcement |
| 9 | `supabase-audit-log-migration.sql` | Audit trail for sensitive state changes |
| 10 | `supabase-rate-limit-migration.sql` | Rate limiting for AI/sensitive endpoints |
| 11 | `supabase-storage-migration.sql` | Storage buckets + image upload policies |
| 12 | `supabase-chat-migration.sql` | Chat conversations and messages |
| 13 | `supabase-booking-price-hardening.sql` | Server-authoritative booking package prices and advance amounts |
| 14 | `supabase-vendor-inquiry-dashboard.sql` | Security-definer RPCs so vendor owners can load inquiry stats/recent inquiries (RLS blocks direct SELECTs for vendors) |

## Notes

- Each file is idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
- Run them once in order on a fresh Supabase project.
- On existing projects, apply only the new migrations you haven't run yet.
- **Never** skip order — later files depend on tables created by earlier files (e.g., file 2 adds `subscription_tier` to `vendors`, which file 1's trigger references).
