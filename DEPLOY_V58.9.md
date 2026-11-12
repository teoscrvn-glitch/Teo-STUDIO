# Deploy V58.9 — Seller Attribution, Download Flow & Card Top-up Reporting

## Release contents

- Base source: V58.8 Stability & Experience.
- Build: `v58.9-seller-attribution-task-hardening`.
- Additive D1 change: `buyer_seller_referrals`, first-touch Seller attribution keyed by buyer account + scope + Studio.
- Frontend: pre-download landing, tenant Note task wait/return UX, Seller Center navigation/catalog presentation, Admin card top-up reporting.
- Worker notices: purchase wallet before/after and idempotent successful card top-up notification.

## Before deploying

1. Back up the production D1 database `teo-studio` and keep the current Worker deployment available for rollback.
2. Verify the Worker still targets the existing D1 binding `DB` and Assets binding `ASSETS`.
3. Keep `keep_vars = true` in `cloudflare/wrangler.toml`.
4. Do not remove/recreate or overwrite production Variables, Secrets, D1 bindings, rate-limit namespaces, or cron triggers. This release does not introduce a new mandatory Secret.
5. Existing Telegram credentials and chat routing must remain configured for Telegram notices to be delivered.

## Deploy

1. Extract this ZIP without changing the folder structure.
2. Run the local checks from the project root:
   ```bash
   bash scripts/check-build.sh
   ```
3. Open a terminal in `cloudflare/` and use the same Wrangler command and account/environment already used for the production Worker. For a project without a named environment, the usual command is:
   ```bash
   npx wrangler deploy
   ```
   Do not create a new environment or change the Worker name.
4. Review Wrangler's diff/output. Confirm that the existing Worker, D1 database, Assets, rate-limit bindings and dashboard variables are preserved.
5. Check `https://teostudio.top/api/health`; expect `v58.9-seller-attribution-task-hardening` after a successful deployment.

## Post-deploy smoke tests (staging first)

1. Open `/download.html?id=<visible-product-id>` and a tenant equivalent. Confirm the image, title and description render; the detail panel opens; the 10-second preparation indicator completes; and the offered original/bypass/purchase choices match that product's actual sale mode.
2. Test a tenant Note with two or more steps on a real mobile browser. Open a task in a new tab, remain there for at least 10 seconds, return, and verify that the next step only unlocks after the server wait and client return condition. Test popup-blocked behavior as well.
3. Confirm the UI does **not** claim to have verified YouTube likes, TikTok likes, follows, or group membership. This flow can verify redirect issuance, step order and elapsed time only.
4. Sign in from a Seller referral URL, then revisit another paid Seller-enabled product in the same scope/Studio. Confirm first-touch attribution remains on the buyer account and a valid purchase credits the correct Seller once. Verify a different Studio is isolated.
5. Confirm Seller Center hamburger navigation works on narrow and wide screens; catalog cards show safe product images/descriptions; create-link still returns the same reusable URL for the same Seller/product.
6. Make a small test purchase in staging. Check Telegram shows account, file, balance before and after. Repeat the same provider callback in staging and confirm it does not double-credit or send a second card top-up notification.
7. In Admin, choose a month containing successful card top-ups. Compare the displayed card count, face value, provider amount and credited amount against D1/ledger records. The table intentionally omits card PINs and serials.
8. Confirm ordinary wallet top-ups remain separate from card top-ups and neither is included as sales revenue.

## Data migration

The new `buyer_seller_referrals` table is created idempotently by `ensureV55Schema`. The migration is additive; it does not rebuild product, purchase, wallet, Seller or tenant tables. It is triggered when the Worker executes the relevant V55 schema initialization path. Verify the table exists in staging after exercising the account/Seller routes before rolling out to production.

## Rollback

- Re-deploy the previous V58.8 Worker and matching frontend together.
- Do not drop `buyer_seller_referrals` or any D1 objects. Leaving the additive table in place is safe for rollback.
- Preserve all current Secrets, Variables, bindings, rate limits and scheduled triggers.

## Not included / limitations

- No ad network SDK or trusted conversion callback has been added. Do not credit ad revenue based on clicks or timers.
- The tab-away rule is a client-side UX condition; it is not authoritative proof that a user performed a like, subscribe, follow or group-join action. A modified client can bypass it.
- The existing tenant product Key Vault / random pool / fixed-key flow from earlier versions is retained; this patch does not add an external key-provider purchase API or connect key issuance to a membership entitlement. Full tenant-specific memberships, members-only downloads/version update workflows, and the three public leaderboards are not implemented in this patch.
- Full redesign of master Admin and tenant Admin, broad performance profiling, production payment verification and real-device UI testing remain separate work.
- Local checks do not prove production D1 migration, provider webhook, Telegram delivery, payment, or mobile browser behavior. Test on staging before production.
