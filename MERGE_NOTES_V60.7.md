# Merge notes

Claude V60.5a was treated as a patch source. Its HTML files were not copied wholesale because they downgrade cache query strings from 60.6 to 60.5 and revert the Tenant Admin patch parameter from 608 to 606. Its `performance-guard.js` was not copied because it removes the explicit Admin exclusion and performs repeated selector scans. Its `account.js` purchase-flow changes were not copied because V60.6 already contains the safer dedicated-login redirect and stale-session cleanup.

The safe changes adopted were the account modal stylesheet and idempotent `modalize()` mutation fix. `detail-widgets.css` additionally hardens injected account/assistant widgets on detail pages without changing behavior.
