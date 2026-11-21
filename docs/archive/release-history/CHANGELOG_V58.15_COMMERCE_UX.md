# TeoStudio V58.15 — Seller Commerce Analytics & Studio UX

Release date: 2026-11-13
Base archive: `TeoStudio-V58.14-Share-Seller-UX.zip`

## Implemented in this package

- Fixed Seller Center return navigation: the brand and return links now go to the public home (`/`). The tenant-only Share page is no longer used as a global return destination without a tenant slug.
- Added a Seller per-link performance panel. It reports the product/Studio label, daily-deduplicated referral-link visits, buyer accounts bound to the referral, paid orders, referred sales value and recorded Seller commission.
- Added the additive D1 table `seller_referral_visits` and its indexes. Visitor identifiers are HMAC-SHA-256 hashes using `SELLER_VISIT_HASH_KEY`, falling back to the existing login/admin/Turnstile secrets. Raw IP addresses are not written to this analytics table.
- Added a public community leaderboard for Studio owners, Sellers and wallet top-ups, with day/week/month periods. Buyer and Seller display names are partially masked. The figures are derived from paid purchase rows and successful wallet-ledger credits.
- Added leaderboard navigation to public Share, the home drawer, Seller Center and the tenant Admin tab rail.
- Clarified the Studio content workflow: “File tải xuống” and “Note / nhiệm vụ mở khóa” are presented as two distinct creation flows. The file form still owns the product thumbnail, description, original/bypass links, sale mode and key vault; the Note editor owns task sequencing and the final destination.
- Added lightweight, responsive Seller performance styling in a separate cache-versioned stylesheet. No heavyweight chart or 3D library was introduced.
- Bumped the release identity to `v58.15-commerce-ux` and cache-busted the shared frontend config.

## Existing functionality retained

- Seller catalog entries continue to show the product thumbnail, details, price and commission rate. Seller links are persistent and reuse the existing referral code for that account/file.
- Existing first-touch referral attribution remains account-bound per main/tenant scope and is carried across later purchases in that scope. Commission is still calculated only for eligible paid purchases; self-referrals and disabled products remain ineligible.
- Existing 10-second pre-download wait, key-pool/fixed-key flows, sequential Note tasks, 10-second per-task minimum, server-signed task progress, outbound/return guard and 5-second completion handoff were preserved.
- Existing master-admin card top-up reporting and Telegram purchase/card-top-up notifications were retained; purchase messages already contain account/file and before/after balance details where applicable.
- Homepage redesign was intentionally left untouched, as requested.

## Important scope limits — not represented as complete

- **Studio-specific membership/VIP system is not implemented in this release.** There is no complete tenant-isolated membership plan, purchase, entitlement, renewal/expiry, member-only catalog gate or member download-center UI yet. Do not enable a public “membership” offer based on this package.
- No external advertising provider was selected or configured in this package. Existing ad-placement configuration is not proof that an ad provider will deliver impressions.
- Note task completion confirms the signed sequential flow, external navigation and minimum wait. It does **not** independently verify a real YouTube follow, TikTok follow, Zalo group join or Telegram membership unless a supported provider API is connected.
- Per-link visit analytics begin collecting after this Worker version is deployed. They are daily-deduplicated estimates based on a keyed browser/network signature, not a count of every raw HTTP request; historical visits are not backfilled.
- Live Cloudflare Worker/D1, production secrets, SePay, card provider, Telegram delivery and phone browser rendering were not exercised by local tests. Deploy to a staging Worker and verify the D1 migration and account flows before production rollout.

## Validation

`sh scripts/check-build.sh` passes all 33 local test groups, including the newly added SQLite execution test for Seller performance and all three leaderboard SQL queries. The four newly added reporting SQL queries (Seller performance and the three leaderboard categories) were also executed against a representative SQLite schema and sample records. These checks do not substitute for production D1 or end-to-end browser testing.
