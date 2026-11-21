# Deploy TeoStudio V56.63

## 1. Before deploy
1. Export/backup the production D1 database `teo-studio` in Cloudflare.
2. Keep the current Worker deployment available for rollback.
3. Do not run `DROP TABLE`, database reset, or re-import old ledger data.

## 2. Deploy source
- Publish the Worker with `cloudflare/worker.js` and the `frontend/` Assets directory, using `cloudflare/wrangler.toml`.
- From a supported desktop/CI environment at the project root, the command is:

```bash
npx wrangler deploy --config cloudflare/wrangler.toml
```

- This project binds the existing D1 database `teo-studio`. Do not create a replacement database or change the configured database ID.
- Wrangler's dependency `workerd` does not support every Android/Termux environment. If deploy fails on Android, deploy from Windows/macOS/Linux or the Cloudflare dashboard/build pipeline instead; do not modify the D1 binding to work around the platform issue.

## 3. Telegram configuration
The existing bot token must be stored as a Cloudflare **Worker Secret** named exactly `TELEGRAM_BOT_TOKEN`. Do not paste the token into source code, this ZIP, chat, or `wrangler.toml`.

Also configure:
- `TELEGRAM_WEBHOOK_SECRET` — Worker Secret. Generate a random high-entropy value of at least 32 characters using only letters, numbers, underscore or hyphen, then save it under this exact name.
- `TELEGRAM_BOT_USERNAME` — Worker Variable (not a Secret), bot username without the leading `@`.
- Keep the existing `TELEGRAM_CHAT_ID` value if the main Admin bot notifications are still needed.

After deployment, a tenant admin can open **Kết nối thông báo → Kết nối bot Telegram**. The Worker registers its webhook with Telegram when it creates a pairing code. The tenant opens the generated bot link, presses **Start**, and sends `link_<40-character-code>` if Telegram does not pass the code automatically. Pairing expires after 10 minutes and is one-use. Then use **Test thông báo**.

Each Studio links its own private Telegram chat to the same bot. The bot must be started in a private chat; group chats are ignored by the webhook.

## 4. First-run schema
The Worker runs the additive schema checks through `ensureV55Schema()` when the new features are first used. There is no manual reset/import step. Existing wallet balances and old ledger rows are not rewritten.

After deploy, sign in as Admin, open the Admin dashboard and wait for the analytics/monetization panels to load. Then sign in to one test Tenant and open its dashboard to initialize tenant statistics and Telegram UI.

## 5. Safe rollout
1. Confirm the runtime panel reports Telegram token, webhook secret and bot username configured.
2. Link one test Studio and send a test message.
3. Submit a support report from a tenant Share page and confirm it appears in that tenant's monthly statistics and its Telegram chat.
4. Enable Seller on one low-risk paid file. Test one no-Seller sale (95/5) and one Seller-attributed sale (90/5/5).
5. Wait through the seven-day maturation window or test in a staging D1 copy before enabling Seller payouts.
6. Test Seller withdrawal reserve, Admin approve, reject/refund and mark-paid behavior. Keep `seller_payouts` disabled in production until this passes.
7. Add ad providers and import provider reports as pending. Confirm that pending reports do not change a wallet. Enable Ads for one test tenant and confirm one report; verify 80/20 ledger entries and duplicate report rejection.
8. Roll out to other tenants only after checking D1 ledger entries and Worker logs.

## 6. Discount note
V56.60 does not contain a coupon/discount workflow for wallet purchases. V56.63 allocates using the server-validated amount charged and stored on the purchase. If a discount feature is introduced later, it must calculate the final discounted amount on the server before the split; never accept a client-provided amount.

## 7. Verification boundary
This ZIP has static JavaScript syntax checks and local SQLite simulation checks documented in `TEST_REPORT_V56.63.md`. It has not been deployed to Cloudflare from this environment and no production D1 data has been inspected or changed. Complete the live tests above before enabling payouts or Ads.
