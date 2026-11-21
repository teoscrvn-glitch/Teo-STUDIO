# Deploy TeoStudio V58.5 — Seller Marketplace & Commission

## What's changed
1. `/seller.html` aggregates eligible products from the main catalog and tenant Studios.
2. Seller Center has search and sort by newest, highest percentage, or highest expected commission amount.
3. Main Admin and Tenant Admin can enable Seller and set a product-specific commission percentage (0–50%, default 5%).
4. Worker computes commission from the stored product setting. Client values are not accepted for money calculations.

## Accounting model
- Buyer pays the product's listed price.
- Platform fee remains 5% of the sale amount.
- Seller gets the configured percentage of the sale amount.
- File owner gets the remainder: `amount - platformFee - sellerCommission`.
- Example: 100,000đ sale, 12% Seller rate → platform 5,000đ, Seller 12,000đ, owner 83,000đ.
- Seller commission remains pending for 7 days before becoming available, preserving the existing refund/chargeback window.
- Setting changes affect new purchases only. Previously recorded purchase/ledger amounts remain unchanged.

## Deploy steps
1. Keep a backup of the current V58.4 ZIP and current Cloudflare Worker/D1 configuration.
2. Upload/deploy the V58.5 package using the same Worker name and existing `wrangler.toml`/assets configuration.
3. Keep `keep_vars = true`; do not delete or recreate existing Cloudflare Variables, Secrets, D1 database bindings, Rate Limit bindings, or other bindings.
4. The Worker applies additive D1 migrations for the two commission columns. No manual destructive migration is required.
5. Open Master Admin → File / Code. Edit a test paid file, enable Seller and set a test rate (e.g. 10%). Save and confirm the value persists after reload.
6. Open a test Tenant Admin → File / Code. Set a different rate on a paid file and confirm it persists after reload.
7. Open `/seller.html` using a verified Seller account. Confirm both enabled products appear and test the three sort modes and search.
8. Generate a Seller link for each scope and perform a low-value controlled wallet purchase in a staging/test environment. Verify the split, 7-day pending ledger, and duplicate-request protection.
9. Only after the checks pass should you enable the feature for more products/Studios.

## Safety notes
- Do not test by purchasing your own Seller link; self-referrals are rejected.
- A commission rate of 0% intentionally means the file can be listed but generates no Seller commission. Turn Seller off instead if you do not want the product listed in the Seller catalog.
- The 50% cap leaves room for the 5% platform fee and a positive owner share. The Worker clamps invalid values even if a request bypasses browser validation.
- No new Secrets are needed for this feature.
- This ZIP has not been deployed to your Cloudflare Production environment. Production D1 migration and a real transaction must still be checked after deployment.

## Rollback
- Restore the V58.4 Worker/assets backup if needed.
- Do not drop the new commission columns during rollback; V58.4 ignores unknown additive columns and existing rows remain intact.
- Keep the D1 database and all existing Secrets/Bindings. Do not reset the database.
