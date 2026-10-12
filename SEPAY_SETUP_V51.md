# TeoStudio — SePay/VietQR setup (V51)

## Scope and safety

- Keeps the existing single receiving bank account and existing D1 data. No database reset/drop.
- This webhook flow currently confirms **paid files sold from tenant Share pages** (`tenant_payment_orders`). It does NOT by itself implement paid tenant rental checkout or paid purchases from the main public file catalog; those need their own order types/UI and must not be advertised as active yet.
- Does not change the user's SePay account, API key, or live configuration. Do not paste credentials into source code or chat.
- Webhook processing validates API-key auth, incoming transfer direction, receiving account when supplied, payment code, order pending/expiry, and minimum amount. It de-duplicates transaction IDs and returns `{"success":true}` for accepted/ignored events as expected by SePay.

## Cloudflare Worker variables

In the **existing production Worker**: Settings → Variables and Secrets. Preserve existing values if already configured.

- `SEPAY_API_KEY` — Secret. Exact same key as configured in the SePay webhook's API Key authentication.
- `SEPAY_BANK_CODE` — Text, VietQR bank code/identifier.
- `SEPAY_ACCOUNT_NUMBER` — Text, existing receiving bank account number.
- `SEPAY_ACCOUNT_NAME` — Text, optional display name.

Never expose `SEPAY_API_KEY` in HTML/JS or commit it to GitHub.

## Create the webhook in SePay

Dashboard → Integrations/Tích hợp → Webhooks → Add webhook:

1. Name: `TeoStudio AutoPay`.
2. URL: `https://teostudio.top/api/webhook/sepay` (use this only if this hostname is routed to the Worker that contains this code; otherwise use the public HTTPS URL of the actual Worker).
3. Event: incoming money only (`In_only` / Có tiền vào).
4. Account: choose the same bank account configured in `SEPAY_ACCOUNT_NUMBER`.
5. Content type: JSON.
6. Authentication: API Key. Paste the same key into SePay and the Cloudflare Secret. SePay sends `Authorization: Apikey <key>`.
7. Enable retries and failure alerts if available. Save.

The transfer content must contain the exact generated order code, e.g. `TEOABC1234567890` (prefix `TEO` plus 10 alphanumeric characters). The order's VietQR already includes this code. Do not manually change the code.

## Safe test procedure

1. Back up/export current Worker source and keep existing D1 binding.
2. Test on a separate/staging Worker and separate sandbox webhook first, if the SePay account offers sandbox data for the same endpoint.
3. Deploy the Worker code; do not run schema reset commands. Its migration uses `CREATE TABLE IF NOT EXISTS` / additive columns.
4. Create a low-priced test file on a tenant Share page, then create an order from the buyer-facing page. Confirm QR amount and transfer description/code.
5. Use SePay's Test mode to deliver a webhook with the exact pending order code and exact amount. Inspect SePay delivery log and Cloudflare Worker logs. A generic “Send test” payload without a real pending order code should be ignored; this is expected.
6. Verify the order becomes paid once and the tenant sale ledger gets one credit. Replay the same transaction ID; it must not credit twice.
7. Test wrong API key, outgoing transaction, wrong account, no code, wrong code, amount too low, expired order and duplicate webhook. None should unlock a file.
8. Only after sandbox tests pass, configure a low-value real transfer to validate Live. Sandbox events are isolated and do not prove a real bank transfer works.

## SePay response semantics

SePay considers a webhook delivery successful when the endpoint returns HTTP 200/201 and JSON `{"success":true}`. This handler follows that response shape for valid and safely ignored events; authentication, malformed payload, underpayment, and retryable ledger failures return non-2xx.

## Important limitation

This V51 SePay-only patch hardens the existing tenant-file-sale webhook. It does not yet add public tenant signup, paid tenant-rental orders/renewals, main catalog paid-file checkout, referral commission accounting, or wallet checkout deductions. Those must be implemented as distinct order types with idempotent ledger writes before relying on those business flows.
