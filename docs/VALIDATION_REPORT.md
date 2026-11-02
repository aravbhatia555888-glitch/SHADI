# Validation Report (superseded)

This file was a stale copy that reported "100% — PRODUCTION READY" while the
validator only checked that files existed and that `.env` *mentioned* the
required variable names (placeholder values passed).

That validator now detects placeholder credentials and no longer claims
production readiness. The authoritative, regenerated report lives at the repo
root:

- [`../VALIDATION_REPORT.md`](../VALIDATION_REPORT.md)

Regenerate it any time with:

```bash
node scripts/validate-codebase.js
```

The automated checks are static only. Deployment still requires real Supabase
credentials, deployed Edge Functions, payment/AI/Sentry configuration, an EAS
build, and end-to-end verification on device.
