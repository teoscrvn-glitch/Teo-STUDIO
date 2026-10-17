# TeoStudio V57.1 — Release Scope & Limitations

This package is a consolidated release candidate based on the most recent V56.4 code snapshot available in this work session. It is not deployed to the owner's Cloudflare account and has not been tested against the live D1, SMTP, AI provider, Turnstile, Telegram, or SePay.

## Included in this source package

- Cloudflare Worker/API and existing D1 binding configuration.
- Shared buyer account, email verification/reset flows, wallet, top-up and purchase ledger code.
- Studio rental/account handling, block-based builder, stats, reporting, moderation, blocklist and anti-bypass layers present in the consolidated source.
- AI chat integration with safe fallback when no provider is configured.
- Runtime health/config diagnostics and optional AI/email/Telegram connectivity tests.
- Buyer opt-in public sales feed with masked email and a compatibility endpoint that follows the same consent rule.
- Static local-reference checks and wallet-ledger smoke test.

## Not verified from this environment

- Successful Wrangler `--dry-run` or deploy. An earlier `npx wrangler` run timed out while attempting to obtain Wrangler; no successful Cloudflare dry-run was observed.
- Live Production Runtime variables, live D1 schema/data migration, account registration/email delivery, live Turnstile validation, AI model call, Telegram delivery, SePay webhook reconciliation, real top-up/purchase/refund/withdrawal.
- Full penetration test, DDoS resistance, or legal assessment of the internal wallet/payment model.

## Safe deployment requirements

1. Back up D1 and record the current production Worker/Assets version for rollback.
2. Keep the existing database ID, D1 binding `DB`, secrets, and old data. Do not drop/reset the database.
3. Overlay this package at repository root so `cloudflare/`, `frontend/`, and `scripts/` are direct children.
4. Run `./scripts/check-build.sh` and `python3 scripts/test-wallet-ledger.py` before committing.
5. Run Wrangler dry-run. Do not push or deploy if syntax/config checks fail.
6. After deploy, test `/api/health` and the live acceptance checklist in `TEST_REPORT_V57_1.md`.

The live acceptance checklist is required before calling this release production-stable.
