# Deploy V58.15 — Commerce UX

## Before deploying

- Back up the Cloudflare D1 database and keep the existing Worker variables, secrets, rate-limit bindings and D1 binding intact.
- The new `seller_referral_visits` table and indexes are created additively by the Worker schema initializer. No destructive migration or existing wallet/purchase rewrite is included.
- For stronger separation of the daily visit signatures, optionally add the Cloudflare Worker secret `SELLER_VISIT_HASH_KEY`. If it is not set, the Worker uses `LOGIN_RATE_HASH_KEY`, `ADMIN_KEY` or `TURNSTILE_SECRET` as the HMAC key. Do not add secret values to `wrangler.toml` or the repository.

## Deploy

Use the existing deployment workflow for the `cloudflare/wrangler.toml` Worker. Do not create a new Worker or D1 database for this package. If deploying manually from the project root:

```sh
cd cloudflare
npx wrangler deploy
```

## Smoke-test after deployment

1. Open `/api/health` and confirm `version` is `v58.15-commerce-ux` and D1 is configured.
2. Open `/seller.html`, log in, create one Seller link for a paid, Seller-enabled file, and visit that link from a separate browser profile. Confirm the per-link visit count increments after attribution is accepted.
3. Make a low-value test purchase in a staging tenant/account and confirm the paid order and commission appear in Seller performance, wallet ledger and the appropriate tenant/master-admin records.
4. Open `/rankings.html` and test the day/week/month controls for Studio owners, Seller commission and successful wallet top-ups.
5. Open a tenant Admin page and confirm the ranking tab link and the separate File / Note task creation areas render on a narrow mobile viewport.
6. Verify the existing Telegram purchase and card-top-up notifications in a staging chat before enabling production transactions.

## Rollback

If the new UI/API fails, roll back the Worker/frontend release together to the previous V58.14 package. The analytics table is additive and can be left unused. Do not drop the table or reset wallet/referral tables during rollback.

## Not part of this deploy

Tenant-specific VIP membership plans and access gates are not implemented by V58.15. A selected external ad provider is also not configured. See `CHANGELOG_V58.15_COMMERCE_UX.md` for the feature boundary and test limitations.
