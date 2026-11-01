# TeoStudio V56.63 — Seller, Ads, Telegram Studio & Monthly Analytics

## Added
- Tenant Telegram pairing now returns a one-time 40-character code, a `link_<code>` command and the bot deep link. The tenant page displays the code, copy action, expiry countdown and polls link status until it is connected.
- The same Telegram bot can serve multiple Studios: each connected tenant stores its own private chat ID. Tenant paid-file purchases and tenant-scoped user reports are sent to the correct Studio chat. Support reports are also stored with `tenant_id` and appear in that Studio's selected-month statistics.
- Main Admin analytics and Tenant analytics can select a month. View counts, product ranking, paid-file views, referrers and monthly sales details are scoped to the selected calendar month. Tenant selector retains 24 months of history.
- Seller Center at `/seller.html`, seller referral links per eligible product, 30-day server-side attribution, seller-specific ledger, 5% pending commission and a seven-day availability delay.
- Per-file Seller switches for main products and tenant products.
- Admin monetization panel: global flags, tenant-level rollout flags, ad-provider registry, manual provider-report import, pending report reconciliation and Seller withdrawal review.
- Seller payout uses a separate seller ledger and typed withdrawal records. Admin can approve, reject (with one compensating ledger credit) and mark an approved payout as paid.
- Admin can refund a paid wallet purchase. The system writes compensating entries for buyer, owner, platform and Seller ledgers rather than deleting financial history.

## Allocation rules
- Without Seller: file owner 95%, platform 5%.
- With Seller: file owner 90%, Seller 5%, platform 5%.
- All splits are calculated from the server-side amount charged and stored on the order in integer VND.
- Ads report: Studio/site owner 80%, TeoStudio 20%; no income ledger entry is created until Admin confirms a pending provider report.

## Default rollout state
- `seller_program`: enabled globally; a tenant override can disable/enable it.
- `seller_payouts`: disabled globally.
- `ads_monetization`: disabled globally.
- Seller payouts and Ads therefore remain non-withdrawable/non-crediting until Admin explicitly enables the relevant feature and completes reconciliation checks.

## Compatibility
- New D1 tables and columns are additive. No existing wallet row, balance, purchase, SePay event or tenant withdrawal is deleted or rewritten by this release.
- Existing SePay webhook handler was left intact. New wallet purchases continue using their own idempotency key and ledger references.
