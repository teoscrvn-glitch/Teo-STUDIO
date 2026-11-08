# V58.4 Test Report

Date: 2026-11-08

## Automated local checks

Command:

```sh
sh scripts/check-build.sh
```

Result: **25/25 build stages passed**.

The stages include Worker and frontend JavaScript syntax, existing security guardrails, account/session isolation, Seller security, card callback signatures, provider fee normalization, wallet ledger/bypass simulations, legal/privacy migrations, V57.8/V57.9/V57.10/V57.13 regression tests, V58.1 Note/Studio/Key Vault checks, and V58.4 integration checks.

V58.4 integration checks: **27 checks passed**, including:
- Provider `getfee` sync and hourly schedule.
- Exact provider `amount` wallet settlement and idempotent ledger ID.
- Dynamic denominations and provider status `check`.
- Admin-only Merchant overview and VND withdrawal routes.
- Merchant Token remains server-side.
- Single-open withdrawal invariant and manual reconciliation path.
- Admin ad-placement configuration endpoints and UI.
- Read-only Agent endpoint and UI.
- Removal of manual member-rate input and 1,000 VND truncation.
- Cloudflare `keep_vars = true`, existing D1/rate-limit bindings, and preserved V58.3 Note/Key Vault modules.

SQLite smoke test confirms the partial unique index permits only one submitting/unknown/pending/processing Merchant withdrawal at a time and permits another after the earlier request reaches a terminal status.

## Not tested

- No request was sent to the live TheCaoSieuToc Merchant account from this build process.
- No real card was charged and no real bank withdrawal was created.
- No live Cloudflare Production Worker or Production D1 was modified.
- No mobile-device browser acceptance test was performed after deployment.
- Ad SDK delivery/revenue callbacks are not implemented.
- AI Agent is read-only beta, not unrestricted autonomous browser automation.

Passing local tests does not establish that provider credentials are valid, that the Merchant account has withdrawal permission, or that Production callback delivery is working. Follow the deployment and small-transaction steps in `DEPLOY_V58.4_CARD_MERCHANT_ADS_AGENT.md`.
