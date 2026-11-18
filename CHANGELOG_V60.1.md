# TeoStudio V60.1 — Tenant Share, Payout QR, Rankings & UI Reliability

## Fixes and improvements

### Tenant Share crash
- Removed stale assignments to the removed `supportBox` and `groupBox` elements from `tenant-share.js`.
- Tenant Share brand and home anchors now use optional element access and preserve `?tenant=<slug>`.
- Missing tenant slug falls back to the resource catalogue (`/2`) instead of attempting to render an unscoped tenant page.
- Bumped the Share script cache key to `tenant-share.js?v=60.1`.

### Studio payout QR
- Removed the tenant payout requirement for a 6-digit VietQR BIN.
- Studio owners now upload the actual receiving QR image from their bank or wallet app.
- The browser compresses the image before sending it; the Worker validates image type and requires a stored QR before accepting a withdrawal.
- The withdrawal stores a snapshot of the payout profile, including the QR image, so Admin sees the exact receiving QR associated with that request.
- Master Admin withdrawal list renders the uploaded QR image. Historical requests without a saved QR are clearly labeled as legacy requests.

### Rankings
- Public leaderboards now return up to 100 entries for Studio owners, Sellers and wallet top-ups.
- Seller and buyer rows show display name, avatar and masked email. Email is not exposed in full.
- Authenticated users receive their own rank and amount for Seller commissions and wallet top-ups.
- Studio owners also receive their best-owned-Studio rank, using `owner_user_id` or verified-email ownership only.

### Shared utility bubble and AI positioning
- Common utility bubble is loaded on Admin, Tenant Admin, main Share/catalogue, tenant Share, Note, Seller, Account, Ranking and tenant detail pages.
- Admin contact, community group and custom links are grouped in the bubble; the Admin editors retain up to 12 custom links.
- AI bubble position is calculated from the expanded panel's top edge, keeping it just above the panel instead of moving it far up the page.

### Note, touch and theme polish
- Public Note and tenant Note editor use the shared Note visual refresh.
- Card/image context menus and drag actions are suppressed on the relevant interactive artwork to reduce Android long-press download menus.
- Tap highlight is disabled and TeoStudio press feedback is used instead.
- Cache keys for changed config, admin and shared UI scripts/styles are synchronized to V60.1.

## Validation scope
- `scripts/check-build.sh`: legacy project regression checks plus V60.1-specific checks.
- Node syntax checks for Worker and frontend JavaScript.
- Static route, asset, cache-key and DOM reference checks.
- SQLite simulations for reporting/ranking, membership and owned-Studio rank logic.
- ZIP integrity check.

Live Cloudflare D1 writes, production withdrawal processing, cross-device visual testing, real Telegram delivery and external provider callbacks are not verified by local tests.
