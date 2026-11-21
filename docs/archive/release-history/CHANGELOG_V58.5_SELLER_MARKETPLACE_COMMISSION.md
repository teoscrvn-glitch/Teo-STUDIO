# TeoStudio V58.5 — Seller Marketplace & Per-file Commission

Base: V58.4 Card Merchant Ads Agent

## Seller catalog
- Seller Center now aggregates all visible paid/both products that the master Admin or an eligible Studio owner has explicitly enabled for Seller.
- The catalog includes main TeoStudio products and tenant Studio products, with product/Studio search.
- Added sort modes: newest first, highest commission percentage, and highest estimated commission value per sale.
- Each listing displays the configured percentage and estimated VND commission using the current product price.

## Per-product commission controls
- Master Admin can set `seller_commission_pct` for main catalog products.
- Tenant owners can set `seller_commission_pct` for their own products.
- Range is 0–50%, step 0.5%; default is 5% for existing and new products.
- The Worker clamps the value to 0–50% and reads it from the authoritative product row at purchase time; client-supplied commission is never trusted.
- Existing platform fee remains 5% of sale amount. Seller commission is deducted from the file owner's share, and the owner receives the remainder. Example at a 12% Seller rate: buyer pays 100,000đ; platform fee 5,000đ; Seller gets 12,000đ; owner gets 83,000đ.
- The actual commission VND amount is stored on the purchase and seller ledger; refunds continue to reverse the recorded commission amount, not a later-edited rate.
- Existing 7-day Seller settlement delay, attribution expiry, self-referral prevention, idempotent ledger and payout controls are retained.

## Compatibility
- Additive D1 column migrations only: `products.seller_commission_pct`, `tenant_products.seller_commission_pct`.
- Legacy products receive a 5% default; existing sales and wallet ledger rows are not rewritten.
- No new Cloudflare secrets or bindings are required.
