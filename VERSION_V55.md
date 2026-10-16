# TeoStudio V55 — Unified Account, Wallet, Builder, Analytics & AI

## Scope
This source package is an additive update based on the supplied V54 package. It has **not** been deployed to `teostudio.top` and is not a verified export of the live GitHub main branch. Compare/merge with the current repo before production rollout.

## Main additions

1. **Unified buyer account**
   - Email + password account, email verification, login/logout and email-code password reset.
   - Display name/avatar, purchase history, wallet history and linked studios.
   - Existing old tenant accounts are kept in D1; a buyer can see a legacy studio when its stored email matches their verified account email.
   - New studio Free/VIP creation is linked to the existing buyer account. New VIP studio checkout uses the existing SePay rental webhook.

2. **Wallet / marketplace checkout**
   - Buyer can create VietQR top-up orders; a wallet credit is recorded only after authenticated SePay webhook matches a pending top-up payment code and sufficient transfer amount.
   - Purchases require a signed-in buyer, Turnstile, accepted terms + second confirmation, current server-side price, and a stable idempotency key.
   - Tenant-store sale split: 95% seller ledger, 5% platform ledger. Main-store purchases credit platform ledger 100%.
   - A duplicate purchase request key does not debit the buyer again. Ledger rows use unique reference indexes for idempotency.
   - Seller withdrawal still follows the existing tenant withdrawal process and human approval; this package does not initiate bank transfers automatically.
   - Top-up money is received into the configured existing bank account; the D1 wallet is an internal balance, not a separate bank account.

3. **Anti-bypass hardening**
   - Public product/share APIs suppress original links for paid products.
   - Legacy public direct-QR product order creation is disabled; old order status endpoints do not return original download links.
   - Authenticated account purchases return the original URL only after server-side wallet debit/purchase creation.
   - Turnstile validation is server-side and fails closed if not configured or if hostname is not `teostudio.top` / `www.teostudio.top`.
   - Existing request throttles and security headers remain. These are defense-in-depth, **not** a guarantee against all abuse or distributed DDoS. Add Cloudflare WAF/Rate Limiting rules at the edge.

4. **Analytics**
   - Admin-only `GET /api/admin/analytics?month=YYYY-MM`, defaults to current Vietnam month.
   - Reads purchases, commissions, seller-net values, top-ups, per-day amounts/views, seller rankings and recent wallet purchases from D1.
   - Existing historical direct-payment orders are included in aggregate/daily totals where applicable. Historical records cannot be retroactively assigned to new buyer accounts and historical legacy tenant sales are represented as gross seller proceeds with no new 5% fee retroactively applied.

5. **Website builder**
   - Block/template editor supports hero, text, button, image, video, product-grid, notice, footer and divider blocks; hide/show, clone, delete, reorder with up/down buttons, basic style editing and responsive preview.
   - Persisted in D1 table `tenant_site_layouts`; public Share renderer reads the saved layout.
   - Backend validates allowed block types, colors, style ranges and URLs. Builder saves require a paid/VIP plan. This is a block editor, not a free-form HTML/JavaScript editor; ordering currently uses up/down controls rather than free drag-and-drop.

6. **AI helper + report issues**
   - Bottom-right AI bubble. Without AI provider credentials it gives safe fallback help; it can call an OpenAI-compatible HTTPS endpoint when `AI_API_URL`, `AI_API_KEY` and `AI_MODEL` are configured as Worker runtime values/secrets.
   - AI is advisory only and cannot be used by this endpoint to mutate account balances, purchases or passwords.
   - Support report endpoint stores reports in D1. If Telegram bot secrets are configured it sends a report notification to the specified chat.

7. **Public sales ticker**
   - Shows recent new-account marketplace purchases on tenant Share, with customer display name and masked email plus product/amount. It deliberately does **not** expose full buyer email publicly.

## Additive D1 migration

The Worker creates new V55 tables/indexes and adds `studio_name`, `owner_user_id` and `request_key` only if absent. Do not reset or replace the D1 database. Take a D1 backup first.

## Runtime settings

Keep existing runtime variables/secrets and the D1 binding `DB` connected to the existing `teo-studio` database. Existing SePay webhook remains `/api/webhook/sepay`.

Required existing settings for account/payment features:
- `ADMIN_KEY` (Secret)
- `SEPAY_API_KEY` (Secret)
- `SEPAY_BANK_CODE` (Variable)
- `SEPAY_ACCOUNT_NUMBER` (Variable; keep the currently configured receiving account)
- `TURNSTILE_SITE_KEY` (Variable)
- `TURNSTILE_SECRET` (Secret)
- `OXMAIL_SMTP_PASS` (Secret; and the existing SMTP host/user/from variables if customized)

Optional integrations:
- `AI_API_URL` (Variable, HTTPS only and trusted provider endpoint)
- `AI_API_KEY` (Secret)
- `AI_MODEL` (Variable)
- `TELEGRAM_BOT_TOKEN` (Secret)
- `TELEGRAM_CHAT_ID` (Variable or Secret)

Never paste secret values into frontend JavaScript, the repository or a public issue. Do not rotate the production SePay key during this deployment.

## Important limitations

- Not deployed or end-to-end verified against live SePay, OxMail, Turnstile, a real production D1, or Telegram in this package build.
- Existing direct-paid file orders remain legacy records. They do not magically become wallet purchase history for a new buyer account.
- Public new purchases use the wallet. Old direct QR purchase creation endpoints now return `410 WALLET_PURCHASE_REQUIRED`; do not deploy during an in-progress older checkout. Let pending payments settle or expire first.
- Verify local business/legal requirements with the payment provider before enabling real-money wallet top-ups/payouts at scale. Internal balance is not automatically a licensed e-wallet service.
- Back up the D1 database and deploy from a clean branch after comparing the current production repository.
