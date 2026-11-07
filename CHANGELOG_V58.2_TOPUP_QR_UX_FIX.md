# TeoStudio V58.2 — Wallet top-up QR UX fix

## Root cause addressed
The bank top-up form had a required guardian-consent checkbox. When it was left unchecked, the browser blocked the submit event before the JavaScript handler ran, so the user saw no useful explanation. The page also did not provide clear inline feedback when Turnstile had not issued a token or when the API rejected creation.

## Changes
- Replaced silent native blocking for the bank top-up guardian checkbox with explicit inline validation; server-side `guardianConsent === true` enforcement remains unchanged.
- Added an accessible live status message beside the create-QR button.
- Added clear states for Turnstile verified, expired, and error callbacks.
- Added explicit client-side check for missing Turnstile token before API submission.
- Replaced generic alert with readable inline messages, including a safe payment-configuration error.
- Bumped the topup page `account.js` cache-busting query to `v58.2` to prevent stale JavaScript from being used.
- Bumped Worker build version to `v58.2-topup-qr-ux-fix`.

## Security preserved
- Worker still requires an authenticated, email-verified buyer.
- Worker still requires `guardianConsent === true`.
- Worker still verifies Turnstile server-side with Cloudflare Siteverify and validates hostname.
- Worker still validates amount and payment configuration before creating the D1 pending order.
- Wallet credit still occurs only after the authenticated SePay webhook confirms the matching pending order and amount.

## Scope
This patch improves validation feedback and cache invalidation. It does not bypass Turnstile, does not weaken age-related consent checks, and does not change SePay webhook/payment verification. Production credentials and live payment behavior must be verified after deployment.
