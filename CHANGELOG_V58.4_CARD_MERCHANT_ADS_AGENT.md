# TeoStudio V58.4 — Card Gateway, Merchant Center, Ads Configuration & Agent

Release date: 2026-11-08
Base: V58.3 Product Notes & Key Vault

## Card exchange
- TheCaoSieuToc fee table is fetched from `GET /chargingws/v2/getfee?partner_id=...`.
- Admin can manually synchronize the provider table; Worker also synchronizes hourly.
- The old manual member-rate editor is removed from the Admin card-fee page.
- Carrier and denomination options are derived from provider fee data.
- Customer wallet credit uses the exact provider-confirmed `amount` (Merchant net) with an idempotent ledger reference. No forced rounding down to 1,000 VND.
- If a callback is missed, the buyer's status request can call the provider `check` API when encrypted card data is available.
- Old fee data is preserved if the provider refresh fails.

## Merchant Center
- Admin-only Merchant balance overview using `THECAOSIEUTOC_TOKEN`.
- Admin-only VND withdrawal request and provider status lookup.
- Withdrawal status distinguishes submitting, unknown, pending, processing, completed, failed and rejected.
- A database partial unique index prevents multiple unresolved Merchant withdrawal requests at once.
- Ambiguous requests can be reconciled by attaching a provider `order_code`, or closed only after Admin confirms the provider did not create the order.
- The account number is not stored; only the last four digits and masked account name are persisted.
- Provider acceptance is not represented as completed bank transfer.

## Ads configuration
- Admin can choose a configured provider and toggle Share, Note, Task and Download placements.
- This is configuration only. Provider SDK rendering, impression/click callbacks and revenue payout reconciliation are not included in this release.

## AI Agent
- Adds a read-only Agent endpoint for wallet, orders, Studio list, products and authorized tenant overview, plus allowlisted navigation.
- It does not autonomously mutate content, wallet balances, permissions or financial state. Mutating actions require separate authenticated workflows and explicit Admin/user confirmation.
- This is a controlled Agent beta, not unrestricted autonomous browser control.

## Preserved
- V58.3 Note Designer, product-linked Notes, secure Note flow and Key Vault are retained.
- Existing SePay, BumX, Link4M, Telegram, email, D1 and rate-limit bindings are retained.
- Existing Cloudflare Dashboard Variables are preserved during Wrangler deploy with `keep_vars = true`; Secret values remain in Cloudflare and are not written into this repository.

## Not included / not verified
- No Production deployment was performed.
- No live card charge, Merchant withdrawal or bank receipt was tested.
- Follow/join verification for third-party social platforms remains unavailable without their supported verification APIs.
