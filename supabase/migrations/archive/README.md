# Archived migrations

These files are **not** part of the apply order and **must not be run**.

## `supabase-production-hardening-and-fixes.sql`

Archived on review because it is stale and conflicts with the current schema:

- It defines `write_audit` to insert into a table named **`audit_logs`**, but the
  schema (see `supabase-audit-log-migration.sql`) creates **`audit_log`**. Applying
  it fails with `relation "audit_logs" does not exist`.
- It redefines `finalize_subscription_payment` and `expire_vendor_subscriptions`,
  which are authoritatively owned by `supabase-payment-integrity.sql` and
  `supabase-subscription-expiry.sql`. Applying it after those files errors or
  silently regresses them.

The work it attempted is covered by the active migrations. It is kept here only
for history; delete it once you have confirmed none of your environments ever
applied it.
