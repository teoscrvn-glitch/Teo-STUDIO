# Deploy V56.28 from mobile

1. Upload the complete contents of this ZIP to the same GitHub repository and deployment branch used by Cloudflare Worker `teo-studio`. Keep existing secret values in Cloudflare; never put keys in GitHub.
2. Wait for Cloudflare deployment to complete.
3. Open `https://teostudio.top/api/health` and verify `version` is `v56.28-detail-clean-url-routing-fix`.
4. From the home page, open a product card normally. Expected: the detail card appears with thumbnail, title, description, share actions, and the original free/paid actions.
5. Also test the same share link using a crawler preview (Zalo/Telegram) and then test the buy flow without completing a real payment.
6. If it still fails, collect only request URL, HTTP status and non-secret error text for `/detail` and `/api/products/<id>`; never share cookies, admin keys, API keys or tokens.

## Checks
The patch fixes a `.html`/clean-URL mismatch and moves normal detail-shell delivery before the shared schema initialization. It leaves the payment and anti-bypass validations unchanged. Static checks do not substitute for live Production verification.
