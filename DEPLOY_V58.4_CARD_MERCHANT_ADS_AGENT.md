# Deploy TeoStudio V58.4

## 0. Important

This ZIP is built from the V58.3 source and has passed local syntax/regression checks. It has **not** been deployed to Production. Do not test with a valuable card or make a real Merchant withdrawal until the first small transaction has been reconciled manually.

The Token visible in the previously shared account screenshot should be regenerated/revoked at TheCaoSieuToc before using it in Production. After rotating it, update the Cloudflare Secret `THECAOSIEUTOC_TOKEN` directly in the Dashboard. Do not paste secret values into chat or commit them to files.

## 1. Back up the current environment

1. In Cloudflare, confirm the Worker is `teo-studio` and the environment is **Production**.
2. Back up the current D1 database `teo-studio` before deploying. From a machine with Wrangler authenticated, run from this directory:

   ```sh
   cd cloudflare
   npx wrangler d1 export teo-studio --remote --output=../backup-teo-studio-before-v58.4.sql
   ```

3. Keep a copy of the current V58.3 ZIP and current Worker version for rollback.
4. Do not delete/recreate existing Secrets, Variables, D1, R2, assets or Rate Limiter bindings.

## 2. Required Cloudflare Secrets

The Worker reads these server-side secrets:

- `THECAOSIEUTOC_PARTNER_ID` — partner ID for card exchange.
- `THECAOSIEUTOC_PARTNER_KEY` — partner signing key for charging/check/callback verification.
- `THECAOSIEUTOC_TOKEN` — Merchant balance and VND withdrawal API token.

Existing TeoStudio secrets must remain untouched, including `ADMIN_KEY`, `SEPAY_API_KEY`, `BUMX_API_KEY`, `LINK4M_API_KEY`, `AI_API_KEY`, Telegram/email/Turnstile secrets, `CARD_DATA_ENCRYPTION_KEY`, and `NOTE_FLOW_SECRET` if configured.

`CARD_DATA_ENCRYPTION_KEY` is used to encrypt card/serial values temporarily for provider status checks when a callback is missed. Keep the existing key unchanged; do not rotate it without a data migration plan.

The three TheCaoSieuToc values must be Cloudflare **Secrets**, not plain text Variables. Never place them in `wrangler.toml`, frontend JavaScript or D1.

## 3. Environment preservation

`cloudflare/wrangler.toml` contains:

- `keep_vars = true` to preserve Variables set in the Cloudflare Dashboard when deploying with Wrangler.
- The existing Worker name, assets binding, D1 binding `DB`, and four existing rate-limit bindings.
- Existing public non-secret configuration values and cron triggers.

Deploy using the file in this package. Do not replace `wrangler.toml` with a minimal file and do not remove any existing binding. Secrets stay in the Dashboard and are not exported into this ZIP.

## 4. Deploy

Using Wrangler from the package root:

```sh
cd cloudflare
npx wrangler deploy
```

If using Cloudflare's connected Git repository, verify the build root/config points to `cloudflare/wrangler.toml` and the uploaded asset directory is `../frontend` as defined in that file.

After deploy, open `https://teostudio.top/api/health` and confirm the version is `v58.4-card-merchant-ads-agent`. The health response exposes configuration booleans only; it must never expose secret values.

## 5. First-time card-rate synchronization

1. Sign in to `/admin` as Admin.
2. Open **Bảng phí thẻ**.
3. Press **Đồng bộ bảng phí API** once. This seeds the D1 cache from TheCaoSieuToc `getfee` API.
4. Confirm carriers, denominations, provider fees and `syncedAt` appear.
5. Worker then refreshes the fee table hourly. If a provider fetch fails or contains no supported rows, the old table is retained.
6. The top-up screen shows carrier/denomination choices from the synchronized data. The estimated net amount is informational only.
7. Wallet credit occurs only after provider status `1`, after verifying request/card identity and using the exact `amount` in the provider result. Do not manually credit a wallet because a browser page says success.

The provider callback configured in Merchant should be:

`https://teostudio.top/api/webhook/card-provider`

Method: POST. The Worker validates `callback_sign = md5(partner_key + code + serial)` and matches the callback to the stored request. If callback delivery is missed, the buyer status route uses provider `check` when encrypted card data is available.

Use a single low-value card for the first live test. A real top-up is a real charge, not a sandbox test.

## 6. Merchant Center and VND withdrawals

1. Open Admin → **Ví Merchant / Rút VND**.
2. Confirm the Merchant token status is configured and the provider balance can be fetched.
3. The balance shown is TheCaoSieuToc's Merchant balance, not TeoStudio buyer wallet balance, Seller wallet or Tenant wallet.
4. Enter the exact bank code supported by TheCaoSieuToc (the provider docs use `VCB` as an example), account number, account name and amount.
5. Confirm the request. A successful API response means an order was created; it does **not** mean the bank transfer is complete.
6. Press **Kiểm tra** to query `/api/withdraw/status`. Status mapping: 0 pending, 3 processing, 1 completed, 2 failed.
7. Only one submitting/unknown/pending/processing withdrawal can exist at a time. If a request times out, use **Đối soát**: attach the `order_code` found in the provider Merchant history, or close the request only after confirming there is no corresponding provider order. Do not close an ambiguous request based on a guess.

## 7. Ads and AI Agent

- Admin → **Vị trí quảng cáo** stores selected provider and placements (Share, Note, Task, Download). This release does not render ads or calculate ad revenue; an approved provider SDK/API and callback/reconciliation flow are still required.
- AI Agent is a read-only beta for account/tenant data and allowlisted navigation. It cannot alter balances, perform purchases, change permissions or submit Merchant withdrawals.

## 8. Note and Key Vault

V58.3 Note Designer, product-linked Note, Note task flow and Key Vault are retained. No destructive migration is required for those features in this release.

## 9. Rollback

If the live health check or first functional test fails:

1. Stop card submissions and Merchant withdrawals from the website.
2. Re-deploy the saved V58.3 Worker/frontend package using its matching `wrangler.toml` while keeping the current Secrets and Dashboard Variables.
3. Do not restore an old D1 backup unless there is actual database corruption; the V58.4 migrations are additive. Restoring a backup can erase transactions created after the backup.
4. Reconcile any card or Merchant request that was in-flight during rollback using the provider's transaction history before enabling the feature again.
