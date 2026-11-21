# Deploy V58.13

1. Back up the current Cloudflare Worker and D1 database.
2. Deploy the Worker and frontend from this package using the existing Cloudflare deployment workflow. Existing D1 bindings and secrets are retained; no new secret is required.
3. In Seller and each Studio, edit payout details: select bank payout, enter the official 6-digit VietQR BIN, account number and exact account-holder name, then save.
4. Verify `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (Admin bot), `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` and OxMail SMTP secrets are already configured. Studio-specific Telegram notifications require the Studio's existing bot link.
5. Submit a small test withdrawal in a controlled account. Confirm the QR encodes the net payout amount and the `RUT TS` reference, then scan it in a banking app and verify the beneficiary before any transfer.
6. Test Admin `approve`, then manually transfer the funds, then use `paid`. Verify email and Telegram notifications. Test `reject` and confirm the reserved balance is returned exactly once.

Do not mark a request paid merely because it has been approved or because a QR was generated.
