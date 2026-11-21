# TeoStudio SePay/VietQR setup (V45)

This build adds per-tenant, per-file pricing and a SePay webhook flow. It does not reset D1; pricing columns are additive and existing files default to free.

## Required Cloudflare Worker secrets/vars

Set these in Worker > Settings > Variables and Secrets:

- `SEPAY_API_KEY` (Secret): API Key configured for the SePay webhook. Never put it in frontend code.
- `SEPAY_BANK_CODE` (Text): bank code supported by VietQR image endpoint, e.g. bank short code from VietQR.
- `SEPAY_ACCOUNT_NUMBER` (Text): receiving bank account number.
- `SEPAY_ACCOUNT_NAME` (Text, optional): account holder name.

The configured bank account receives all payments in this first iteration. This does not automatically split payments or transfer proceeds to individual tenants.

## SePay webhook

Create an **incoming transactions only** webhook in SePay:

- URL: `https://teostudio.top/api/webhook/sepay`
- Authentication: **API Key**
- API Key: same value as Worker secret `SEPAY_API_KEY`
- Content type: JSON

Do not select “no authentication” in production. SePay sends `Authorization: Apikey <key>`.

## Flow

1. Tenant edits a file in Tenant Admin and sets a price (VND) + checks “Bật bán file trả phí”. Existing files stay free by default.
2. Public file detail creates an order, shows a VietQR image and unique transfer content (`TEO...`).
3. SePay webhook must report an incoming transaction whose description/content contains the order code and whose amount is at least the order amount.
4. Worker stores the transaction ID uniquely and marks the order paid idempotently. The page polls order status and only then receives the download URL.
5. Pending orders expire after 20 minutes.

## Important limitations

- Test the webhook with SePay's test-send feature, then a small real transfer before public launch.
- Payment status is not trusted from the browser; only the authenticated webhook can mark an order paid.
- This first version uses one receiving bank account for the site. Tenant revenue splitting, refunds, tax/accounting, and merchant settlement are not included.
- Use Cloudflare WAF/rate limiting alongside Worker checks.
