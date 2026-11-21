# TeoStudio V59.1 — Unified Account & Studio Membership

## Included
- Adds Studio-scoped membership plans and membership records using the existing `buyer_accounts` identity and wallet.
- Adds `/api/account/memberships` and `/api/account/memberships/purchase`; purchases require a verified email, use wallet balance, enforce a request key and extend an active membership rather than resetting its expiry.
- Adds tenant-scoped plan management and member list to Tenant Admin.
- Adds membership plan cards on each Studio Share page and a membership tab in the common TeoStudio account.
- Adds `member_only` flag to tenant products. A Studio must have an enabled plan before a product can be marked members-only.
- Locks member-only product purchases and redacts original/download URLs at the public product API unless the buyer has an active membership.
- Fixes the linked Note path so a member-only file's Note cannot reveal its final destination to a non-member.
- Passes the common buyer session token to the tenant download page so legitimate members are not falsely locked out.
- Adds Messenger task target recognition alongside existing task providers.
- Reorganizes Seller into four focused views: catalog/links, link performance, payout and ledger history.
- Each persistent Seller referral link now exposes copy, QR and per-link metrics (unique visits, referred accounts, paid orders and commission); the link is reconstructed from the existing persistent referral code, preserving attribution.

## Database migration
The Worker creates the two membership tables and indexes in the existing additive `ensureV55Schema` migration path and adds `tenant_products.member_only` when absent. No old account or tenant rows are deleted or rewritten.

Deploy the Worker first so the additive schema migration runs, then deploy the frontend static assets. Keep the current D1 database and secrets. Take a D1 backup before production rollout. Do not point a staging deployment at production payment secrets.

## Unified account behavior and legacy compatibility
New account capabilities use the same `buyer_accounts` / buyer session identity. Buyer wallet, purchases, Seller entry, AI entry, comments, Studio ownership and membership entitlements remain capabilities of that identity, not separately created buyer accounts. Legacy tenant-specific credentials are intentionally retained for compatibility with older Studio installations; verified-email / owner identity links are used where available. A legacy Studio account with a different unverified email is not automatically merged; recover or verify that account before migration to avoid account takeover.

## QR behavior and privacy
The QR image is requested from the public goQR.me QRServer endpoint only when the Seller opens the QR dialog. The QR contains only the public Seller referral URL, never the account session token, password or private payout data. The external QR provider receives the public referral URL to render the image; deployments that require fully self-hosted QR generation should vendor a local QR library and remove this optional external image call. See the provider API contract: https://goqr.me/api/doc/create-qr-code/.

## Payment behavior
Membership checkout currently debits the existing TeoStudio buyer wallet. It does not introduce a new external card/bank provider for membership checkout. The ledger debit uses a unique membership reference and the purchase request key is unique per buyer.

## Limits / not claimed as complete
- Social platform Follow/Join completion is not verified by YouTube, TikTok, Zalo, Messenger, Discord or Telegram APIs. The task flow can require ordered clicks and time on destination; platform-grade verification needs authorized APIs and appropriate scopes.
- Third-party ad network delivery remains dependent on the provider account, SDK, and ad slot credentials; this release does not invent or embed a fake ad provider.
- Full redesign of every Master Admin and Tenant Admin screen and comprehensive new QR/original-vs-bypass purchase UX remain follow-up work. Seller navigation is now separated into focused in-page views, not independent server-rendered URLs.
- Telegram live delivery, actual D1 production migration, card/payment callbacks, live commission reconciliation, browser/device-specific UI and real platform task verification have not been performed in this local build.

## Local validation
Run `sh scripts/check-build.sh`. V59.1 adds a membership-specific test suite with SQLite simulation for wallet debit, insufficient balance, request-key idempotency and tenant isolation. Static/local test success is not equivalent to production smoke testing.
