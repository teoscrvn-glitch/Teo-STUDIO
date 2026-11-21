# TeoStudio SePay/VietQR — V46

This build continues the V45 tenant per-file payment flow and makes SePay webhook field parsing more tolerant. It does not reset D1 or change existing file data.

## Scope of this build
- Paid files on tenant Share File pages: set price per file in Tenant Admin.
- Create an order with a unique `TEO...` transfer description and VietQR.
- Only the authenticated SePay webhook can mark an order paid.
- The backend verifies order code, incoming direction (when supplied), amount, pending status and expiry; transaction IDs are unique to prevent duplicate processing.
- The buyer page polls order status and exposes the download link only after paid status.

This build does **not yet** automate rental-plan purchases/renewals for the main website or paid tenant rental plans. That is a separate payment product flow and should not be advertised as enabled.

## Configure Cloudflare Worker
In Worker > Settings > Variables and Secrets:
- `SEPAY_API_KEY` — Secret, same key configured in SePay webhook authentication.
- `SEPAY_BANK_CODE` — Text, VietQR bank code.
- `SEPAY_ACCOUNT_NUMBER` — Text, receiving account number.
- `SEPAY_ACCOUNT_NAME` — Text (optional).

All incoming payments go to this one configured receiving account. No automatic revenue splitting to tenants.

## SePay webhook
- URL: `https://teostudio.top/api/webhook/sepay`
- Direction: incoming transactions
- Authentication: API Key
- Header expected by Worker: `Authorization: Apikey <SEPAY_API_KEY>`
- Payload should include a transaction ID, amount, and transfer content containing the exact generated `TEO...` order code.

## Safe test sequence
1. Deploy to a staging Worker first if available.
2. Set the four Worker variables/secrets.
3. Create a low-price test file and place a test order.
4. Use SePay test webhook with matching order code and amount; verify order changes to paid once only.
5. Send the same transaction ID again; it must not grant another payment.
6. Try wrong amount, outgoing transaction, wrong code, expired order and missing auth; none may unlock the file.
7. Make a small real transfer before public launch.

Never put the API key in frontend HTML/JS. Keep Cloudflare WAF/rate limiting enabled. Do not reset or delete the production D1 database.
