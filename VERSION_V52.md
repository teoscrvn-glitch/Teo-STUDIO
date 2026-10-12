# TeoStudio V52 — Security hardening + rental checkout foundations

## Included in this source package
- Additive D1 migrations for rental checkout, paid tenant file orders, referral ledger references and view de-duplication. No DROP TABLE, rebuild or database reset is performed by migration code. Existing scheduled expiry cleanup still removes tenant content after the configured six-day grace window; manual admin archive preserves finance/files.
- SePay webhook handles both tenant rental/renewal orders and paid files on tenant Share pages; idempotency checks use SePay transaction id and wallet ledger unique references.
- Rental checkout UI creates a 50,000 VND / 30-day pending order, QR and exact `TEO…` payment content. Account activation and links are returned only after a matching paid webhook. Renewal adds time to the later of now or the existing expiry.
- Paid tenant sales dashboard: paid orders, gross sales, day list and view-based conversion. Tenant referral ID is retained for renter checkout and file purchases; successful eligible conversions receive 10% wallet commission.
- Tenant file modes: free direct, unlock/bypass link, paid only, and both (bypass plus buy). Paid original URL is not exposed before the paid status response.
- Rental promotion section on main page, referral link UI in Tenant Admin, separate Free/Paid filtering in master Admin, withdrawal IDs/history and support link.
- Same-origin protections for browser write APIs, restrictive CORS, CSP/HSTS and output security headers, input size/URI checks, HTTP(S)-only navigation URL validation (including legacy rows on read), restricted social-preview redirect hosts and capped external response bodies, memory-conscious per-isolate rate limits/temporary abuse blocking, fail-closed server-verified Turnstile hostname validation for payment order creation, and 15-minute hashed view-dedup for tenant content statistics.
- Tenant product form dynamically distinguishes direct free link, bypass link, paid-only original link, and “free bypass or buy” with a separate paid original URL. It validates URL schemes and requires distinct links for the combined mode.
- Manual master deletion of a tenant is a soft archive: locks and signs out the account, preserving finance/file history for audit. The existing scheduled expiry cleanup still removes expired tenant content after the six-day grace window; this is separate from manual archiving.

## Production configuration still required
In Worker Settings → Variables and Secrets preserve existing values and add/check only what is missing:
- `SEPAY_API_KEY` (Secret): must match SePay webhook API Key.
- `SEPAY_BANK_CODE` (Variable): official VietQR bank identifier for the existing receiving account.
- `SEPAY_ACCOUNT_NUMBER` (Secret or Variable; recommend Secret): existing receiving account number.
- Optional `SEPAY_ACCOUNT_NAME` for QR display.
- `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET` must be a matching Turnstile widget pair if Turnstile is enabled.

## Not yet fully implemented / do not advertise as working
- Free tenant self-signup with two external link-bypass steps and a 4-day cumulative extension is intentionally not activated without the exact provider and a server-verifiable callback/API. Do not grant free days based only on a browser redirect; users can forge it.
- Master catalog file checkout is not wired into its own payment-order flow in this patch; paid checkout is for tenant Share File products and the paid rental/renewal flow.
- Full payment tests against the live SePay account, live bank receipt, correct Worker domain route, TURNSTILE validation, and tenant end-to-end fulfillment remain production verification steps.
- The package was built from the V51 source archive available in this chat, not from a freshly checked-out snapshot of the current GitHub main branch. Do not treat it as an automatic merge with current production. Compare changed files and preserve later production changes before replacing files.

## Test before live money
1. Back up repository and export D1. Do not execute schema reset/ DROP SQL.
2. Keep the existing D1 binding and all Worker secrets.
3. Verify `/api/health` shows `version: v52-security-rental`; `/api/rental/config` should report `paymentsEnabled: true` and no missing vars. Do not paste secret values into any screenshot/chat.
4. Try SePay webhook “Gửi thử” only after confirming `Authorization: Apikey …` uses the same exact secret; a generic fake event with no pending order code may safely be ignored, but must not unlock anything.
5. Test paid rental and tenant file purchase with a small real transaction only after all routes/configs are verified. Confirm order changes to `paid`, active tenant/download link is returned, and repeating the same transaction does not double-credit.
6. Test withdrawal reserve, approval, paid mark and reject/refund with a test account and audit each ledger row before opening widely.
