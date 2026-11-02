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
| 15 | `supabase-user-cascade-migration.sql` | ON DELETE CASCADE for user-owned tables (needs the payment/booking tables from files 1–4) |
| 16 | `supabase-booking-contacts.sql` | Adds contact_name / contact_phone / contact_email to vendor_bookings |
| 17 | `supabase-security-hardening.sql` | Drops self-granted subscription and admin policies, chat RLS, authoritative booking-price trigger (after setup, chat, subscriptions, booking-price-hardening) |
| 18 | `supabase-subscription-expiry.sql` | `expire_vendor_subscriptions()` + daily pg_cron schedule (needs vendor_subscriptions + audit_log) |
| 19 | `supabase-account-deletion-retention.sql` | Retains financial ledger rows by switching payment FKs to ON DELETE SET NULL |
| 20 | `supabase-payment-integrity.sql` | `write_audit()`, `finalize_booking_payment` / `finalize_subscription_payment` v2, rate-limit pruning (after booking-price-hardening, rate-limit, audit-log) |
| 21 | `supabase-free-tier-replies.sql` | Atomic `reply_to_inquiry` + free-tier credits (after subscription-payments and payment-integrity) |
| 22 | `supabase-vendor-subscription-cancel.sql` | `cancel_vendor_subscription()` RPC |
| 23 | `supabase-sample-data.sql` | Demo vendors only — **never run in production** |
| 24 | `supabase-wedding-culture-migration.sql` | Adds `culture` to wedding_details (set during onboarding) |
| 25 | `supabase-user-roles-migration.sql` | Adds `role` (couple / vendor / explorer) to profiles |
| 26 | `supabase-vendor-approval-migration.sql` | Adds `is_approved` and blocks unapproved vendors from publishing |

## Notes

- Each file is idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
- Run them once in order on a fresh Supabase project.
- On existing projects, apply only the new migrations you haven't run yet.
- **Never** skip order — later files depend on tables created by earlier files (e.g., file 2 adds `subscription_tier` to `vendors`, which file 1's trigger references).
- Rows 15–24 are additive to files 1–14; where a dependency is noted, verify it against your project before applying.
- 🗄️ **`supabase-production-hardening-and-fixes.sql` has been archived** to `archive/` — it was stale and conflicted with files 18 and 20 (it wrote to a non-existent `audit_logs` table and redefined functions those files own). It must not be applied. See `archive/README.md`.
