# V51 — SePay webhook hardening

- Hardened the existing SePay webhook for tenant Share file sales.
- SePay response body now uses `{ "success": true }` for successful/ignored events.
- Checks incoming transfer direction, exact pending order code, amount, expiry, configured receiving account when supplied, and API Key authentication.
- Prevents duplicate transaction IDs; wallet ledger credit failure is surfaced as retryable and attempts to release the order reservation when no ledger credit exists.
- Added `SEPAY_SETUP_V51.md` with Cloudflare + SePay setup and sandbox test steps.
- Does not reset D1 or change SePay credentials/account settings.
- Does not implement rental-plan payments, main catalog checkout, signup, referral commissions, or wallet checkout deductions. Do not treat those as live features in this build.
