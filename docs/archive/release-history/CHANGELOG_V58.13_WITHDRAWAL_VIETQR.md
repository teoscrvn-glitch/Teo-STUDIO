# V58.13 — Seller / Studio VietQR withdrawals

- Seller and Studio payout profiles now require a bank account and a 6-digit VietQR BIN; wallet payout is disabled for cash withdrawals.
- Each withdrawal snapshot is used to build a VietQR image URL with the exact net payout amount and a unique `RUT TS <request>` transfer note.
- Master Admin withdrawal queues display the QR for Seller and Studio requests.
- New Seller requests notify the Admin email and Admin Telegram bot; Telegram receives the QR image when VietQR can be generated.
- New Studio requests notify the Admin email and Admin Telegram bot with the QR image; Studio status changes notify the linked Studio Telegram chat and email.
- Seller status changes notify the Seller's in-app notification and verified account email; Admin Telegram receives the status event.
- `approve` remains separate from `paid`. The successful-payment email is only sent on the `paid` action, which is still a manual Admin confirmation after an actual bank transfer.

## Important setup

The `bank_name` field in payout profiles now stores the official 6-digit VietQR BIN (not the bank's display name). Existing Seller/Studio payout profiles containing a bank name must be edited and saved with the corresponding BIN before a QR can be generated. The image itself is rendered by img.vietqr.io; the Worker does not store QR image bytes.

## Limitations

- This version does not add Seller-specific Telegram pairing. Seller notifications currently go to the Admin Telegram bot and the Seller's verified email/in-app inbox. Studio Telegram uses the existing linked Studio bot connection.
- Telegram Admin QR delivery uses `sendPhoto` with the VietQR image URL; delivery depends on Telegram and the VietQR image endpoint being reachable.
- Bank transfer execution is manual. A QR code is not proof of payment; Admin must only use `paid` after checking the real bank transaction.
- No production Cloudflare/D1, email SMTP, Telegram bot or live VietQR transaction was exercised in local tests.
