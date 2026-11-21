# Deploy TeoStudio V60.1

## Before deployment
1. Export/backup the current Cloudflare D1 database.
2. Keep the existing D1 database ID, R2 bindings, Durable Objects/rate limits, Worker variables and secrets unchanged.
3. Deploy the Worker and Static Assets together from this package. Keep the existing `wrangler.toml` bindings and `keep_vars = true` setting.
4. Do not reset D1 and do not delete old tenant or buyer records. The `qr_image` column is ensured additively by the Worker schema initializer.

## Required smoke tests
1. Open `https://teostudio.top/share?tenant=<your-slug>` and verify tenant Share loads without the `Cannot set properties of null (setting 'href')` error.
2. Open bare `/share` without a tenant and verify it falls back to `/2` rather than rendering an unscoped tenant page.
3. In Tenant Admin → Ví & rút tiền:
   - Select Bank or Wallet.
   - Enter the receiving account/phone and holder name.
   - Upload the QR image from the bank/wallet app and save.
   - Reload; confirm the QR preview remains.
   - Submit a test withdrawal only in staging.
4. In Master Admin → Withdrawals, confirm the request displays the QR snapshot uploaded by that Studio. Do not mark a production request paid during testing.
5. Open `/rankings.html`; verify up to 100 rows, full display names, avatars and masked email. Sign in and verify the “Thứ hạng của bạn” row for the Studio owner, Seller and wallet top-up categories where activity exists.
6. Open the utility bubble on Admin, Tenant Admin, `/2`, tenant Share, Note, Seller and Account. Verify links, music/click controls and custom Studio buttons.
7. Open the utility bubble while the AI bubble is visible; AI should move only enough to sit above the panel and return when the panel closes.
8. Open a public Note and the Note editor; check the updated paper/forest visual theme and task flow.
9. On Android Chrome, long-press a product card/thumbnail and confirm the TeoStudio custom interaction does not show the browser's native image download menu. Test regular text selection in form fields still works.

## Rollback
- If any tenant Share route fails, payout QR cannot be saved/displayed, or a leaderboard query returns an error, roll Worker and Assets back to the previously deployed version.
- Do not restore an old D1 snapshot unless data corruption is confirmed; rolling back code is preferred because V60.1 does not require deleting existing data.

## Limits
Local tests do not prove the production D1 bindings, file-size limits, live withdrawal flow, email/Telegram delivery or real Android browser behavior. Validate those in staging before enabling production withdrawals.
