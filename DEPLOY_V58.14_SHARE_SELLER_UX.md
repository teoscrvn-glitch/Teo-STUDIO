# Deploy V58.14

1. Back up the current Cloudflare Worker and D1 database.
2. Replace the source with this release; retain existing secrets and D1 bindings.
3. Deploy the Worker and static assets using the existing project's normal deployment command.
4. Smoke test `/share` (should redirect to `/`), `/share?tenant=<valid-slug>` (should open the tenant), `/seller.html` (drawer, catalog thumbnails, payout and ledger links), and `/tenant-admin.html?tenant=<slug>`.
5. Confirm old saved Seller referral links and tenant share URLs continue to open correctly.

No new secrets, bindings, or D1 migrations are introduced by V58.14.
